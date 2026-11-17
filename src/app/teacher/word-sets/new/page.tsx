import type { Metadata } from "next";
import { WordSetEditor } from "@/components/teacher/WordSetEditor";

export const metadata: Metadata = { title: "New word set · LetterLinx Classroom Edition" };

export default function NewWordSetPage() {
  return <WordSetEditor />;
}
