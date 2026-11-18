"use client";

import { useEffect, useState } from "react";
import { getRosterProvider, type Section, type Student } from "@/lib/roster";

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

/** A teacher's sections. Change `version` to refetch (e.g. after Sync roster). */
export function useSections(teacherId: string | null, version = 0) {
  return useAsync<Section[]>(teacherId ? `${teacherId}:${version}` : null, () =>
    getRosterProvider().getSections(teacherId!),
  );
}

export function useStudents(sectionId: string | null) {
  return useAsync<Student[]>(sectionId, () => getRosterProvider().getStudents(sectionId!));
}
