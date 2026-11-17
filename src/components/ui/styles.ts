/** Shared Tailwind class strings for consistent, keyboard-friendly controls. */
const focus = "focus-visible:outline-none focus-visible:ring-4";

export const btn = {
  primary: `inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-extrabold text-white shadow-sm transition hover:bg-blue-600 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 ${focus} focus-visible:ring-blue-200`,
  secondary: `inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-slate-800 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 active:translate-y-px disabled:cursor-not-allowed disabled:text-slate-400 ${focus} focus-visible:ring-blue-200`,
  ghost: `inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 ${focus} focus-visible:ring-blue-200`,
  danger: `inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 font-extrabold text-white shadow-sm transition hover:bg-rose-600 ${focus} focus-visible:ring-rose-200`,
};

export const input = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 transition focus:border-blue-600 ${focus} focus-visible:ring-blue-100 aria-[invalid=true]:border-rose-500`;

export const select = `rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 ${focus} focus-visible:ring-blue-100`;

export const check = `size-4 accent-blue-700 ${focus} focus-visible:ring-blue-200`;

export const card = "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200";
