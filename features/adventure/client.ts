import { DEMO_ORIGIN } from "@/config/demo";
import { FIXED_VEHICLE } from "@/config/vehicle";
import { getCurrentLocation } from "@/lib/navigation/current-location";
import type { ArrivalState } from "@/lib/navigation/engine";
import type { LocationSample, PublicAdventurePlan } from "@/types/adventure";
import type { RevealedDestination } from "./arrival";

export type SearchResult =
  | { ok: true; plan: PublicAdventurePlan }
  | { ok: false; message: string };

const NETWORK_MESSAGE = "通信できませんでした。もう一度お試しください。";
const FAILED_MESSAGE = "目的地を決められませんでした。もう一度お試しください。";

function isPublicPlan(value: unknown): value is PublicAdventurePlan {
  const plan = value as Partial<PublicAdventurePlan> | null;
  return (
    !!plan &&
    typeof plan.adventureId === "string" &&
    typeof plan.sealedDestination === "string" &&
    typeof plan.estimatedDurationMinutes === "number" &&
    !!plan.route &&
    Array.isArray(plan.route.steps) &&
    Array.isArray(plan.route.geometry)
  );
}

/** 時間だけを送り、ジャンルと目的地はサーバーが決める。出発地は固定のデモ地点があればそれを使う。 */
export async function searchAdventure(
  minutes: number,
  request: typeof fetch = fetch,
  locate: () => Promise<{ lat: number; lng: number }> = getCurrentLocation,
): Promise<SearchResult> {
  let origin = DEMO_ORIGIN;
  if (!origin) {
    try {
      origin = await locate();
    } catch {
      return {
        ok: false,
        message:
          "現在地を取得できませんでした。位置情報の許可とHTTPS接続を確認してください。",
      };
    }
  }
  try {
    const response = await request("/api/adventures", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "live",
        settings: {
          vehicleType: FIXED_VEHICLE,
          durationMinutes: minutes,
          category: "random",
          origin,
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        ok: false,
        message:
          typeof data?.error?.message === "string"
            ? data.error.message
            : FAILED_MESSAGE,
      };
    }
    return isPublicPlan(data?.plan)
      ? { ok: true, plan: data.plan }
      : { ok: false, message: FAILED_MESSAGE };
  } catch {
    return { ok: false, message: NETWORK_MESSAGE };
  }
}

export type ArrivalCheck =
  | { ok: true; state: ArrivalState; destination?: RevealedDestination }
  | { ok: false; invalidToken: boolean };

/** 到着の確認。目的地の座標は持たず、位置をサーバーへ送って判定してもらう。 */
export async function checkArrivalRemote(
  sealed: string,
  sample: LocationSample,
  state: ArrivalState | undefined,
  request: typeof fetch = fetch,
  now = Date.now(),
): Promise<ArrivalCheck> {
  try {
    const response = await request("/api/adventures/arrival", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sealed, sample, state, now }),
    });
    if (!response.ok) return { ok: false, invalidToken: response.status === 403 };
    const data = await response.json();
    return data?.ok === true && data.state
      ? { ok: true, state: data.state, destination: data.destination }
      : { ok: false, invalidToken: false };
  } catch {
    return { ok: false, invalidToken: false };
  }
}
