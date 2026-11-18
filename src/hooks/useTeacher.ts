"use client";

import { useMemo } from "react";
import { getLocalAccountService } from "@/lib/accounts/service";
import {
  demoRosterFor,
  ManualRosterProvider,
  type RosterProvider,
  type Teacher,
} from "@/lib/roster";
import { useManualRosterStore } from "@/store/manualRosterStore";
import {
  isRosteringSystem,
  useSessionReady,
  useSessionStore,
  type TeacherSession,
} from "@/store/sessionStore";

/** Resolves the signed-in teacher from their roster source or local account. */
export function resolveTeacher(session: TeacherSession): Teacher | null {
  if (isRosteringSystem(session.provider)) {
    return (
      demoRosterFor(session.provider)
        .listDemoTeachers()
        .find((t) => t.id === session.teacherId) ?? null
    );
  }
  const profile = session.profile ?? getLocalAccountService().get(session.teacherId);
  return profile
    ? {
        id: session.teacherId,
        district: "",
        school: "",
        name: { first: profile.firstName, last: profile.lastName },
        title: profile.title,
      }
    : null;
}

/** The roster source for a session: the simulated rostering system, or typed-in classes. */
export function rosterFor(session: TeacherSession, teacher: Teacher): RosterProvider {
  return isRosteringSystem(session.provider)
    ? demoRosterFor(session.provider)
    : new ManualRosterProvider(teacher, () => useManualRosterStore.getState().classes);
}

export function useTeacher(): {
  ready: boolean;
  session: TeacherSession | null;
  teacher: Teacher | null;
  roster: RosterProvider | null;
} {
  const ready = useSessionReady();
  const session = useSessionStore((s) => s.session);
  return useMemo(() => {
    const teacher = ready && session ? resolveTeacher(session) : null;
    return {
      ready,
      session,
      teacher,
      roster: session && teacher ? rosterFor(session, teacher) : null,
    };
  }, [ready, session]);
}
