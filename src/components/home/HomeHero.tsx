"use client";

import Image from "next/image";
import { useT } from "@/lib/i18n";

/** Home-page product shot: the projector results screen with a student phone in front. */
export function HomeHero({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <Image
      src="/home-devices.webp"
      alt={t("home.heroAlt")}
      width={1589}
      height={1125}
      priority
      sizes="(min-width: 768px) 58vw, 100vw"
      className={`h-auto w-full mix-blend-multiply ${className}`}
    />
  );
}
