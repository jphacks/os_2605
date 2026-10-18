import type { Category, DurationMinutes, VehicleType } from "@/types/adventure";

/** 入力値の検証に使う定義。乗り物・ジャンルは画面では選ばせない。 */
export const vehicleOptions = [
  { value: "motorcycle", label: "バイク" },
  { value: "car", label: "自動車" },
] satisfies { value: VehicleType; label: string }[];

/** 時間ダイヤル（1周=120分）の範囲と刻み。 */
export const DURATION_MIN = 0;
export const DURATION_MAX = 120;
/** ダイヤルの0分表示と、検索で使用する最低時間を分離する。 */
export const SEARCH_DURATION_MIN = 10;
export function normalizeSearchMinutes(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > DURATION_MAX) return null;
  return Math.max(SEARCH_DURATION_MIN, value);
}
export function canStartAdventure(value: number): boolean {
  return value > 0 && normalizeSearchMinutes(value) !== null;
}
export const DURATION_STEP = 1;

export const durationOptions = Array.from(
  { length: (DURATION_MAX - DURATION_MIN) / DURATION_STEP + 1 },
  (_, i) => {
    const value = (DURATION_MIN + i * DURATION_STEP) as DurationMinutes;
    return { value, label: `${value}分` };
  },
);

export const categoryOptions = [
  { value: "roadside_station", label: "道の駅" },
  { value: "nature", label: "自然" },
  { value: "cafe", label: "カフェ" },
  { value: "history", label: "歴史" },
  { value: "hot_spring", label: "温泉" },
  { value: "random", label: "おまかせ" },
] satisfies { value: Category; label: string }[];
