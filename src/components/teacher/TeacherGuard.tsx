"use client";

import { LoginButtons } from "@/components/auth/LoginButtons";
import { card } from "@/components/ui/styles";
import { useTeacher } from "@/hooks/useTeacher";

/** Teacher pages need a (simulated) sign-in. */
export function TeacherGuard({ children }: { children: React.ReactNode }) {
  const { ready, teacher } = useTeacher();
  if (!ready) return <p className="p-6 text-slate-500">Loading…</p>;
  if (!teacher) {
    return (
      <div
        className={`${card} mx-auto mt-10 flex w-full max-w-md flex-col items-center gap-5 p-8 text-center`}
      >
        <h1 className="text-2xl font-black">Sign in to continue</h1>
        <p className="text-slate-600">
          Use a simulated Clever or Google Classroom account to see your classes.
        </p>
        <LoginButtons />
      </div>
    );
  }
  return <>{children}</>;
}
