import type { AdventureMode, Origin } from "@/types/adventure";

/**
 * 開発用の固定出発地点。実在の住所ではない仮の座標で、GPS取得（mode: "live"）の
 * 実装時に置き換える。個人の住所は登録しない。
 */
export const DEMO_ORIGINS: readonly Origin[] = [
  {
    id: "demo-origin-a",
    label: "デモ出発地点A（開発用の仮地点）",
    location: { lat: 35.0, lng: 135.75 },
  },
];

export const DEFAULT_DEMO_ORIGIN_ID = "demo-origin-a";

export function findDemoOrigin(originId: string): Origin | undefined {
  return DEMO_ORIGINS.find((origin) => origin.id === originId);
}

/** live は将来のGPS連携用。現時点では利用できない。 */
export function isModeSupported(mode: AdventureMode): boolean {
  return mode === "demo";
}
