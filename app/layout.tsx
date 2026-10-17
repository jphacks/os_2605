import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { PlanProvider } from "@/components/adventure/plan-context";

export const metadata: Metadata = {
  title: { default: "謎の目的地ナビ", template: "%s | 謎の目的地ナビ" },
  description:
    "時間は決める。行き先は決めない。気ままな冒険へ出かけるためのナビ。",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:block focus:p-4"
        >
          本文へ移動
        </a>
        <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-6 sm:px-8">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 text-sm font-bold tracking-wide"
          >
            <span aria-hidden="true" className="text-2xl">
              ↗
            </span>{" "}
            謎の目的地ナビ
          </Link>
          <span className="shrink-0 rounded-full border border-[#b8c5ac] px-3 py-1 text-xs">
            開発中
          </span>
        </header>
        <PlanProvider>
          <main
            id="main"
            className="mx-auto min-h-[70vh] max-w-5xl px-5 pb-12 sm:px-8"
          >
            {children}
          </main>
        </PlanProvider>
        <footer className="mx-auto max-w-5xl border-t border-[#d8dece] px-5 py-6 text-xs leading-6 text-[#546757] sm:px-8">
          JPHACKS 2026 · 謎の目的地ナビ
          <br />
          現在は画面の土台です。実走行用の案内は行いません。
        </footer>
      </body>
    </html>
  );
}
