"use client";

import { useEffect } from "react";
import { startTableSync, type StoreBinding, type SyncStatus } from "@/lib/cloud/engine";
import { classesTable, reportsTable, wordSetsTable } from "@/lib/cloud/tables";
import { getAccountService } from "@/lib/accounts/service";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { useCloudStatus } from "@/store/cloudStatusStore";
import { useManualRosterStore } from "@/store/manualRosterStore";
import { useReportStore } from "@/store/reportStore";
import { setStorageScope } from "@/store/scopedStorage";
import { SCOPED_STORES } from "@/store/scopedStores";
import { useSessionReady, useSessionStore } from "@/store/sessionStore";
import { useWordSetStore } from "@/store/wordSetStore";

const syncKey = (uid: string) => `llce:cloud-sync@${uid}`;

function loadSyncTimes(uid: string): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(syncKey(uid)) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function binding<S, T>(
  store: {
    getState(): S;
    setState(p: Partial<S>): void;
    subscribe(l: (s: S, p: S) => void): () => void;
  },
  field: keyof S,
): StoreBinding<T> {
  return {
    get: () => store.getState()[field] as T[],
    set: (items) => store.setState({ [field]: items } as unknown as Partial<S>),
    subscribe: (listener) =>
      store.subscribe((s, p) => {
        if (s[field] !== p[field]) listener(s[field] as T[], p[field] as T[]);
      }),
  };
}

const RANK: SyncStatus[] = ["error", "loading", "saving", "saved", "idle"];

/**
 * Keeps a signed-in cloud account's classes, word sets and reports in Supabase.
 * Does nothing for demo (Clever/Google/ClassLink) or browser-only sessions.
 */
export function CloudSync() {
  const ready = useSessionReady();
  const uid = useSessionStore((s) => (s.session?.cloud ? s.session.teacherId : null));

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let stops: (() => Promise<void>)[] = [];
    const setStatus = useCloudStatus.getState().set;

    void (async () => {
      if (!uid || !supabaseConfigured) {
        await setStorageScope(null, SCOPED_STORES);
        setStatus("idle");
        return;
      }
      // The app session must match a live Supabase session (it may have expired).
      const account = await getAccountService()
        .current()
        .catch(() => null);
      if (cancelled) return;
      if (!account || account.id !== uid) {
        useSessionStore.getState().signOut();
        return;
      }
      await setStorageScope(uid, SCOPED_STORES);
      for (const s of SCOPED_STORES) await s.rehydrate();
      if (cancelled) return;

      const db = await getSupabase();
      const times = loadSyncTimes(uid);
      const statuses: Record<string, SyncStatus> = {};
      const report = (name: string) => (status: SyncStatus) => {
        statuses[name] = status;
        setStatus(RANK.find((r) => Object.values(statuses).includes(r)) ?? "idle");
      };
      const onSynced = (name: string) => (at: number) => {
        times[name] = at;
        localStorage.setItem(syncKey(uid), JSON.stringify(times));
      };
      const jobs = [
        { name: "word_sets", table: wordSetsTable, store: binding(useWordSetStore, "wordSets") },
        { name: "classes", table: classesTable, store: binding(useManualRosterStore, "classes") },
        { name: "round_results", table: reportsTable, store: binding(useReportStore, "results") },
      ] as const;
      try {
        for (const job of jobs) {
          const stop = await startTableSync(db, uid, job.table as never, job.store as never, {
            lastSyncedAt: times[job.name] ?? 0,
            onSynced: onSynced(job.name),
            onStatus: report(job.name),
          });
          if (cancelled) {
            await stop();
            return;
          }
          stops.push(stop);
        }
        // A brand-new account starts with the sample word sets (saved to the account).
        if (useWordSetStore.getState().wordSets.length === 0)
          useWordSetStore.getState().seedSamples();
      } catch {
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      const toStop = stops;
      stops = [];
      void Promise.all(toStop.map((s) => s()));
    };
  }, [ready, uid]);

  return null;
}
