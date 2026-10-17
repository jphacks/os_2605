import type { VehicleType } from "@/types/adventure";

/** 乗り物は固定の前提で、画面では選ばせない。OSRMの経路は自動車プロファイル。 */
export const FIXED_VEHICLE: VehicleType = "car";
