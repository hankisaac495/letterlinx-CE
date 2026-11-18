"use client";

import { LoginButtons } from "@/components/auth/LoginButtons";
import { card } from "@/components/ui/styles";
import { useTeacher } from "@/hooks/useTeacher";
import { useT } from "@/lib/i18n";

/** Teacher pages need a (simulated) sign-in. */
export function TeacherGuard({ children }: { children: React.ReactNode }) {
  const t = useT();
  const { ready, teacher } = useTeacher();
  if (!ready) return <p className="p-6 text-slate-500">{t("common.loading")}</p>;
  if (!teacher) {
    return (
      <div
        className={`${card} mx-auto mt-10 flex w-full max-w-md flex-col items-center gap-5 p-8 text-center`}
      >
        <h1 className="text-2xl font-black">{t("guard.title")}</h1>
        <p className="text-slate-600">{t("guard.body")}</p>
        <LoginButtons />
      </div>
    );
  }
  return <>{children}</>;
}
