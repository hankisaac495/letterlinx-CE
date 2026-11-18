"use client";

import { useMemo } from "react";
import { getRosterProvider, type Teacher } from "@/lib/roster";
import { useSessionReady, useSessionStore, type TeacherSession } from "@/store/sessionStore";

/** The signed-in demo teacher (resolved synchronously from the local demo roster). */
export function useTeacher(): {
  ready: boolean;
  session: TeacherSession | null;
  teacher: Teacher | null;
} {
  const ready = useSessionReady();
  const session = useSessionStore((s) => s.session);
  const teacher = useMemo(
    () =>
      session
        ? (getRosterProvider()
            .listDemoTeachers()
            .find((t) => t.id === session.teacherId) ?? null)
        : null,
    [session],
  );
  return { ready, session, teacher };
}
