import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { CompareTray } from "@/components/compare-tray";
import { MHLW_SOURCE } from "@/lib/mhlw";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Japan Employer Insight",
    template: "%s | Japan Employer Insight",
  },
  description:
    "Compare Japanese employers on the workplace data they are legally required to disclose.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/15">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              Japan Employer Insight
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">
                Search
              </Link>
              <Link href="/compare" className="hover:underline">
                Compare
              </Link>
              <Link href="/rank" className="hover:underline">
                Rank
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>

        <footer className="border-t border-black/10 dark:border-white/15">
          <div className="mx-auto max-w-4xl space-y-2 px-4 py-6 text-xs text-black/60 dark:text-white/60">
            <p>
              Powered by{" "}
              <a
                href="https://edinetdb.jp"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                EDINET DB
              </a>
              . Source data: annual securities reports (有価証券報告書) filed on
              the FSA&apos;s EDINET system.
            </p>
            <p>
              Also uses{" "}
              <a
                href={MHLW_SOURCE.url}
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {MHLW_SOURCE.name}
              </a>{" "}
              (as of {MHLW_SOURCE.asOf}), processed by Japan Employer Insight.
            </p>
            <p>
              Figures are extracted automatically and may contain errors. Check
              the original filing before relying on any number. This site is not
              investment advice.
            </p>
          </div>
        </footer>

        <Suspense>
          <CompareTray />
        </Suspense>
      </body>
    </html>
  );
}
