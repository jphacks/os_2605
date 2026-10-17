import type {
  AdventureSettings,
  DestinationCandidate,
  DestinationSelectionResult,
} from "@/types/adventure";
import type { Rng } from "./seeded-rng";
import { isDestinationCandidate, parseAdventureSettings } from "./validation";

/** 指定時間との許容差（分）。境界値を含む。 */
export const DURATION_TOLERANCE_MINUTES = 15;

export type SelectDestinationOptions = {
  /** デモ用推定時間の参照に使う出発地点ID。 */
  originId: string;
  /** 乱数生成関数。テスト・デモでは createSeededRng を注入する。 */
  rng?: Rng;
};

/**
 * 条件に合う目的地を1件選ぶ。範囲外の候補で埋め合わせはしない。
 * candidates は破損データを検出するため、実行時に検証する。
 */
export function selectDestination(
  settings: AdventureSettings,
  candidates: readonly unknown[],
  { originId, rng = Math.random }: SelectDestinationOptions,
): DestinationSelectionResult {
  const validSettings = parseAdventureSettings(settings);
  if (!validSettings || originId === "") {
    return { ok: false, errorCode: "INVALID_SETTINGS" };
  }
  if (candidates.length === 0) return { ok: false, errorCode: "DATA_EMPTY" };
  if (!candidates.every(isDestinationCandidate)) {
    return { ok: false, errorCode: "DATA_INVALID" };
  }

  const { vehicleType, durationMinutes, category } = validSettings;
  const active = candidates.filter((c) => c.isActive);
  if (active.length === 0) return { ok: false, errorCode: "NO_ACTIVE_SPOTS" };

  const byCategory =
    category === "random" ? active : active.filter((c) => c.category === category);
  if (byCategory.length === 0) {
    return { ok: false, errorCode: "NO_CATEGORY_MATCH" };
  }

  const byVehicle = byCategory.filter((c) =>
    c.supportedVehicles.includes(vehicleType),
  );
  if (byVehicle.length === 0) return { ok: false, errorCode: "NO_VEHICLE_MATCH" };

  const byDuration = byVehicle.filter((c) => {
    const minutes = c.demoDurations[originId];
    return (
      minutes !== undefined &&
      Math.abs(minutes - durationMinutes) <= DURATION_TOLERANCE_MINUTES
    );
  });
  if (byDuration.length === 0) {
    return { ok: false, errorCode: "NO_DURATION_MATCH" };
  }

  const eligible = byDuration.filter(isAccessConfirmed);
  if (eligible.length === 0) {
    return { ok: false, errorCode: "NO_VERIFIED_ACCESS" };
  }

  const index = Math.min(
    eligible.length - 1,
    Math.floor(rng() * eligible.length),
  );
  const destination = eligible[index];
  return {
    ok: true,
    destination,
    estimatedDurationMinutes: destination.demoDurations[originId],
    candidateCount: eligible.length,
  };
}

/** 営業時間・立ち入り条件を確認でき、アクセス検証済みであること。 */
function isAccessConfirmed(candidate: DestinationCandidate): boolean {
  return candidate.accessVerified && candidate.openingInfo.type !== "unknown";
}
