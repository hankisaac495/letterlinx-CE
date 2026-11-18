import type { Metadata } from "next";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { ResetPassword } from "@/components/auth/PasswordReset";

export const metadata: Metadata = { title: "Account · LetterLinx Classroom Edition" };

export default function Page() {
  return (
    <>
      <PrototypeBanner />
      <main className="flex flex-1 flex-col px-4">
        <ResetPassword />
      </main>
    </>
  );
}
