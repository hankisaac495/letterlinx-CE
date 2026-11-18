import { MESSAGES, type MessageKey } from "./messages";

export type Locale = "en" | "es";
export const LOCALES: Locale[] = ["en", "es"];
export type Params = Record<string, string | number>;

/** Looks up a message and fills {placeholders}. Unknown placeholders are left as-is. */
export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  const entry = MESSAGES[key];
  const text = locale === "es" ? entry[1] : entry[0];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in params ? String(params[name]) : m,
  );
}

export type Translate = (key: MessageKey, params?: Params) => string;
