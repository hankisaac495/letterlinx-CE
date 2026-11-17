import Link from "next/link";

export function TeacherHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav
        aria-label="Teacher"
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3"
      >
        <Link
          href="/teacher"
          className="flex items-baseline gap-2 rounded-lg focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
        >
          <span className="text-lg font-black tracking-tight">LetterLinx</span>
          <span className="text-sm font-semibold text-blue-700">Classroom</span>
        </Link>
        <div className="flex items-center gap-1 text-sm font-semibold">
          <Link
            href="/teacher"
            className="rounded-lg px-3 py-1.5 hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
          >
            Dashboard
          </Link>
          <Link
            href="/play"
            className="rounded-lg px-3 py-1.5 hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
          >
            Practice
          </Link>
        </div>
      </nav>
    </header>
  );
}
