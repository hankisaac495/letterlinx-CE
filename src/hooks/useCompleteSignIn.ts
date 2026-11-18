"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Account } from "@/lib/accounts";
import { setStorageScope } from "@/store/scopedStorage";
import { SCOPED_STORES } from "@/store/scopedStores";
import { useSessionStore } from "@/store/sessionStore";

/** Records an email-account sign-in in the app session and opens the dashboard. */
export function useCompleteSignIn() {
  const router = useRouter();
  const signIn = useSessionStore((s) => s.signIn);
  return useCallback(
    async (account: Account, cloud: boolean) => {
      // Switch to this account's own storage before any page loads its data.
      if (cloud) await setStorageScope(account.id, SCOPED_STORES);
      signIn(
        account.id,
        "email",
        {
          firstName: account.firstName,
          lastName: account.lastName,
          title: account.title,
          email: account.email,
        },
        cloud,
      );
      router.push("/teacher");
    },
    [router, signIn],
  );
}

export const authRedirect = (path: "/auth/callback" | "/auth/reset") =>
  typeof window === "undefined" ? undefined : `${window.location.origin}${path}`;
