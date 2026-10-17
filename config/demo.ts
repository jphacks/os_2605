import type { Coordinates } from "@/types/adventure";
import { isGenre, type Genre } from "@/features/adventure/genre";
import { createSeededRng, type Rng } from "@/features/adventure/seeded-rng";
import { isCoordinates } from "@/features/adventure/validation";

/**
 * 発表で結果を再現するための固定設定。いずれも環境変数で有効にし、未設定なら通常動作。
 * サーバー: DEMO_PIN_GENRE / DEMO_PIN_DESTINATION_ID / DEMO_SEED
 * クライアント: NEXT_PUBLIC_DEMO_ORIGIN（"緯度,経度"。設定するとGPSを使わず固定の出発地を使う）
 */
export type DemoPin = { genre?: Genre; destinationId?: string };

export function readDemoPin(env: Record<string, string | undefined> = process.env): DemoPin | null {
  const genre = env.DEMO_PIN_GENRE?.trim();
  const destinationId = env.DEMO_PIN_DESTINATION_ID?.trim();
  const pin: DemoPin = {};
  if (genre && isGenre(genre)) pin.genre = genre;
  if (destinationId) pin.destinationId = destinationId;
  return pin.genre || pin.destinationId ? pin : null;
}

export function readDemoRng(env: Record<string, string | undefined> = process.env): Rng | undefined {
  const seed = env.DEMO_SEED?.trim();
  return seed ? createSeededRng(seed) : undefined;
}

export function parseDemoOrigin(value: string | undefined): Coordinates | null {
  if (!value) return null;
  const [lat, lng] = value.split(",").map((part) => Number(part.trim()));
  const origin = { lat, lng };
  return isCoordinates(origin) ? origin : null;
}

/** ブラウザ側。NEXT_PUBLIC_ はビルド時に埋め込まれるため、直接参照する。 */
export const DEMO_ORIGIN: Coordinates | null = parseDemoOrigin(process.env.NEXT_PUBLIC_DEMO_ORIGIN);
