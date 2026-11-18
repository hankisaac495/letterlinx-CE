import type { Metadata } from "next";
import { Suspense } from "react";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { MockAuthorize } from "@/components/auth/MockAuthorize";

export const metadata: Metadata = { title: "Sign in (simulated) · LetterLinx Classroom Edition" };

export function generateStaticParams() {
  return [{ provider: "clever" }, { provider: "google" }, { provider: "classlink" }];
}

export default function AuthPage() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<p className="p-6 text-slate-500">Loading…</p>}>
          <MockAuthorize />
        </Suspense>
      </main>
    </>
  );
}
