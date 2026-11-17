import type { Metadata } from "next";
import { TeacherDashboard } from "@/components/teacher/TeacherDashboard";

export const metadata: Metadata = { title: "Dashboard · LetterLinx Classroom Edition" };

export default function TeacherPage() {
  return <TeacherDashboard />;
}
