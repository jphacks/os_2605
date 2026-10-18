"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import "./screens.css";

/** 設計の基準サイズ。実機の画面には、縦横比を保ったまま収まるよう拡縮する。 */
export const SCREEN_WIDTH = 390;
export const SCREEN_HEIGHT = 844;
const MAX_SCALE = 1.35;
const MOBILE_MAX_WIDTH = 600;

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
const viewportSize = () => `${window.innerWidth}x${window.innerHeight}`;
const serverSize = () => `${SCREEN_WIDTH}x${SCREEN_HEIGHT}`;

export function fitScale(size: string) {
  const [width, height] = size.split("x").map(Number);
  return Math.min(width / SCREEN_WIDTH, height / SCREEN_HEIGHT, MAX_SCALE);
}

/**
 * スマホの縦画面では端末ごとの縦横比に合わせて画面全体を使う。
 * PC・タブレットではモックの比率を維持し、過度に拡大しない。
 */
export function fitScreen(size: string) {
  const [width, height] = size.split("x").map(Number);
  if (width <= MOBILE_MAX_WIDTH && height >= width) {
    return { scaleX: width / SCREEN_WIDTH, scaleY: height / SCREEN_HEIGHT };
  }
  const scale = fitScale(size);
  return { scaleX: scale, scaleY: scale };
}

export function ScreenFrame({
  background,
  label,
  live = false,
  children,
}: {
  background: string;
  label: string;
  /** 検索中など、状態の変化を読み上げさせたい画面。 */
  live?: boolean;
  children: ReactNode;
}) {
  const { scaleX, scaleY } = fitScreen(useSyncExternalStore(subscribe, viewportSize, serverSize));
  return (
    <main
      aria-label={label}
      aria-live={live ? "polite" : undefined}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: SCREEN_WIDTH * scaleX, height: SCREEN_HEIGHT * scaleY, flex: "none" }}>
        <div className="s" style={{ background, transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </main>
  );
}
