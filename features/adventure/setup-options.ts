import type { Category, DurationMinutes, VehicleType } from "@/types/adventure";

/** 入力値の検証に使う定義。乗り物・ジャンルは画面では選ばせない。 */
export const vehicleOptions = [
  { value: "motorcycle", label: "バイク" },
  { value: "car", label: "自動車" },
] satisfies { value: VehicleType; label: string }[];

/** 時間ダイヤル（1周=120分）の範囲と刻み。 */
export const DURATION_MIN = 30;
export const DURATION_MAX = 120;
export const DURATION_STEP = 15;

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
