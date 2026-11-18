import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectorRoom } from "@/components/projector/ProjectorRoom";

export const metadata: Metadata = { title: "Projector · LetterLinx Classroom Edition" };

export default function ProjectorPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-white">
      <Suspense fallback={<p className="p-8 text-xl text-white/60">Loading…</p>}>
        <ProjectorRoom />
      </Suspense>
    </div>
  );
}
