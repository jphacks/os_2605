import type { NavigationGuidance } from "@/lib/navigation/engine";
import type { RidingView } from "@/components/screens/riding-screen";

/** 走行中画面の距離表示。30m以下は「まもなく」相当として0mにせず10mから。 */
export function distanceDisplay(meters: number): { value: string; unit: string } {
  if (meters < 1_000) return { value: String(Math.max(10, Math.round(meters / 10) * 10)), unit: "m" };
  return { value: (meters / 1_000).toFixed(1), unit: "km" };
}

/** 案内の結果を、走行中画面に出す内容へ変換する。残り時間と次の曲がり角だけを返す。 */
export function toRidingView(guidance: NavigationGuidance | null, totalMeters: number, notice: string | null): RidingView {
  if (!guidance || guidance.status !== "navigating") {
    return { remainingMinutes: guidance ? Math.ceil(guidance.remainingDurationSeconds / 60) : null, progress: guidance && totalMeters > 0 ? 1 - guidance.remainingDistanceMeters / totalMeters : 0, maneuver: null, distance: { value: "--", unit: "" }, notice };
  }
  return {
    remainingMinutes: Math.ceil(guidance.remainingDurationSeconds / 60),
    progress: totalMeters > 0 ? 1 - guidance.remainingDistanceMeters / totalMeters : 0,
    maneuver: guidance.step.maneuver,
    distance: distanceDisplay(guidance.distanceToStepMeters),
    notice,
  };
}

/** 距離に続ける方向案内。未取得時には方向を推測しない。 */
export function maneuverLabel(maneuver: RidingView["maneuver"]): string {
  switch (maneuver) {
    case "TURN_RIGHT": return "先右折";
    case "TURN_LEFT": return "先左折";
    case "SLIGHT_RIGHT": return "先右方向";
    case "SLIGHT_LEFT": return "先左方向";
    case "STRAIGHT": return "先まで直進";
    case "UTURN": return "先Uターン";
    case "ARRIVE": return "先目的地付近";
    case "OTHER": return "先で案内地点";
    default: return "";
  }
}
