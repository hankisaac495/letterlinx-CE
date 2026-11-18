import type { Metadata } from "next";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { AuthCallback } from "@/components/auth/AuthCallback";

export const metadata: Metadata = { title: "Account · LetterLinx Classroom Edition" };

export default function Page() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col px-4">
        <AuthCallback />
      </main>
    </>
  );
}
