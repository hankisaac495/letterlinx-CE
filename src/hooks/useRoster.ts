"use client";

import { useEffect, useState } from "react";
import type { Section, Student } from "@/lib/roster";
import { useManualRostersReady, useManualRosterStore } from "@/store/manualRosterStore";
import { useTeacher } from "./useTeacher";

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

function useAsync<T>(key: string | null, load: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>({
    key: null,
    data: null,
    error: null,
  });
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    load().then(
      (data) => !cancelled && setState({ key, data, error: null }),
      (e: unknown) =>
        !cancelled &&
        setState({ key, data: null, error: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const fresh = state.key === key;
  return {
    data: fresh ? state.data : null,
    error: fresh ? state.error : null,
    loading: !!key && !fresh,
  };
}

/**
 * The signed-in teacher's sections, from their rostering system or typed-in classes.
 * Change `version` to refetch (e.g. after Sync roster).
 */
export function useSections(version = 0) {
  const { teacher, roster } = useTeacher();
  const manualReady = useManualRostersReady();
  // Typed-in classes refresh whenever the class store changes.
  const manualClasses = useManualRosterStore((s) => s.classes);
  const manualKey = manualReady
    ? manualClasses.map((c) => `${c.id}@${c.updatedAt}`).join(",")
    : "loading";
  return useAsync<Section[]>(
    teacher && roster ? `${teacher.id}:${version}:${manualKey}` : null,
    () => roster!.getSections(teacher!.id),
  );
}

export function useStudents(sectionId: string | null) {
  const { roster } = useTeacher();
  const manualClasses = useManualRosterStore((s) => s.classes);
  const updated = manualClasses.find((c) => c.id === sectionId)?.updatedAt ?? 0;
  return useAsync<Student[]>(roster && sectionId ? `${sectionId}:${updated}` : null, () =>
    roster!.getStudents(sectionId!),
  );
}
