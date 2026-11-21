import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/components/AppProviders";
import { ACCESS_PRECHECK_SCRIPT } from "@/lib/access";
import "./globals.css";

// Nunito, self-hosted from @fontsource-variable/nunito so builds never fetch fonts.
// The Latin subset covers English and Spanish (Ñ, accents).
const nunito = localFont({
  src: "../../node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2",
  weight: "200 1000",
  style: "normal",
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "LetterLinx Classroom Edition",
  description:
    "A classroom word-search race: teachers hide vocabulary words on a letter board and students race to find them. Prototype with simulated rostering.",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACCESS_PRECHECK_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
