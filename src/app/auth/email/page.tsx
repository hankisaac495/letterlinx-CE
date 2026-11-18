import type { Metadata } from "next";
import { Suspense } from "react";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { EmailAuth } from "@/components/auth/EmailAuth";

export const metadata: Metadata = { title: "Sign in with email · LetterLinx Classroom Edition" };

export default function EmailAuthPage() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<p className="p-6 text-slate-500">…</p>}>
          <EmailAuth />
        </Suspense>
      </main>
    </>
  );
}
