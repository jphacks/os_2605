import type { Category, DurationMinutes, VehicleType } from "@/types/adventure";
export const vehicleOptions = [
  { value: "motorcycle", label: "バイク" },
  { value: "car", label: "自動車" },
] satisfies { value: VehicleType; label: string }[];
export const durationOptions = [30, 60, 90, 120].map((value) => ({
  value: value as DurationMinutes,
  label: `${value}分`,
}));
export const categoryOptions = [
  { value: "scenery", label: "絶景" },
  { value: "nature", label: "自然" },
  { value: "history", label: "歴史" },
  { value: "hot_spring", label: "温泉" },
  { value: "roadside_station", label: "道の駅" },
  { value: "random", label: "完全ランダム" },
] satisfies { value: Category; label: string }[];
