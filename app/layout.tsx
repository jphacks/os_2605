import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { PlanProvider } from "@/components/adventure/plan-context";
import { PageTransitionProvider } from "@/components/navigation/page-transition";

const notoSansJp = Noto_Sans_JP({
  weight: ["700", "900"],
  // 日本語の字形は unicode-range で分割配信される。latin だけを先読みしても効果が薄いため無効にする。
  preload: false,
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: { default: "ミステリップ", template: "%s | ミステリップ" },
  description:
    "時間は決める。行き先は決めない。到着するまで行き先が秘密の、小さな冒険。",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={notoSansJp.variable}>
      <body>
        <PageTransitionProvider>
          <PlanProvider>{children}</PlanProvider>
        </PageTransitionProvider>
      </body>
    </html>
  );
}
