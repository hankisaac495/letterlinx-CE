"use client";

import { MotionConfig } from "framer-motion";
import { Suspense, useEffect } from "react";
import { sfx } from "@/lib/audio/sfx";
import { CloudSync } from "./CloudSync";
import { LocaleSync } from "./LocaleSync";
import { SiteFooter } from "./SiteFooter";

/**
 * App-wide client setup: respect prefers-reduced-motion in every animation,
 * keep <html lang> in sync, and unlock audio on the first interaction.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unlock = () => sfx.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <LocaleSync />
      <CloudSync />
      {children}
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
    </MotionConfig>
  );
}
