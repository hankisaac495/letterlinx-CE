import { PrototypeBanner } from "@/components/PrototypeBanner";
import { TeacherHeader } from "@/components/teacher/TeacherHeader";

export default function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  return (
    <>
      <PrototypeBanner />
      <TeacherHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
