"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { btn, card } from "@/components/ui/styles";
import { getRosterProvider, teacherDisplayName } from "@/lib/roster";
import { PROVIDER_LABEL, useSessionStore, type AuthProvider } from "@/store/sessionStore";
import { ProviderMark } from "./LoginButtons";

const SCOPES = [
  "Your name and school",
  "Your classes (sections) and periods",
  "Student first names and last initials in your classes",
];

/**
 * Simulated OAuth consent + demo account picker. Nothing leaves the browser.
 */
export function MockAuthorize() {
  const { provider: raw } = useParams<{ provider: string }>();
  const provider: AuthProvider = raw === "google" ? "google" : "clever";
  const router = useRouter();
  const signIn = useSessionStore((s) => s.signIn);
  const [step, setStep] = useState<"consent" | "account" | "signingIn">("consent");
  const roster = getRosterProvider();
  const teachers = roster.listDemoTeachers();
  const label = PROVIDER_LABEL[provider];

  const choose = (teacherId: string) => {
    setStep("signingIn");
    window.setTimeout(() => {
      signIn(teacherId, provider);
      router.push("/teacher");
    }, 600);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className={`${card} overflow-hidden`}>
        <div
          className={`flex items-center gap-3 px-6 py-4 ${provider === "clever" ? "bg-[#1464ff] text-white" : "bg-slate-50 text-slate-900"}`}
        >
          <ProviderMark provider={provider} />
          <p className="font-black">{label}</p>
          <span className="ml-auto rounded-full bg-amber-300 px-2 py-0.5 text-xs font-extrabold text-amber-950">
            Simulated
          </span>
        </div>
        <AnimatePresence mode="wait">
          {step === "consent" ? (
            <motion.div
              key="consent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5 p-6"
            >
              <h1 className="text-xl font-black">
                LetterLinx Classroom Edition would like to access your rosters
              </h1>
              <div>
                <p className="text-sm font-bold">
                  This will allow LetterLinx Classroom Edition to see:
                </p>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm text-slate-700">
                  {SCOPES.map((s) => (
                    <li key={s} className="flex gap-2">
                      <span aria-hidden="true" className="text-emerald-600">
                        ✓
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  No student emails or passwords are shared.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Link href="/" className={btn.secondary}>
                  Cancel
                </Link>
                <button
                  type="button"
                  className={btn.primary}
                  onClick={() => setStep("account")}
                  autoFocus
                >
                  Allow
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 p-6"
            >
              <div>
                <h1 className="text-xl font-black">Choose a demo teacher</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {roster.data.school.name} · {roster.data.district.name}
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {teachers.map((t) => {
                  const count = roster.data.sections.filter((s) => s.teacher === t.id).length;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        disabled={step === "signingIn"}
                        onClick={() => choose(t.id)}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none disabled:opacity-50"
                      >
                        <span
                          aria-hidden="true"
                          className="flex size-10 items-center justify-center rounded-full bg-blue-100 font-black text-blue-800"
                        >
                          {t.name.first[0]}
                          {t.name.last[0]}
                        </span>
                        <span className="flex-1">
                          <span className="block font-bold">{teacherDisplayName(t)}</span>
                          <span className="text-sm text-slate-500">
                            {t.name.first} {t.name.last} · {count} classes
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {step === "signingIn" && (
                <p role="status" className="text-center text-sm font-semibold text-slate-600">
                  Signing in…
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">
        This is a demo. No real {label} account is used and no data leaves your browser.
      </p>
    </div>
  );
}
