import { detectArrival, INITIAL_ARRIVAL_STATE, type ArrivalState } from "@/lib/navigation/engine";
import { unsealDestination, type SealedDestination } from "@/lib/seal";
import type { LocationSample } from "@/types/adventure";
import { isCoordinates } from "./validation";

export type RevealedDestination = SealedDestination["reveal"];

export type ArrivalResponse =
  | { ok: true; state: ArrivalState; destination?: RevealedDestination }
  | { ok: false; error: "INVALID_INPUT" | "INVALID_TOKEN" };

const statuses = ["outside", "candidate", "confirmed", "unavailable"];

function parseState(value: unknown): ArrivalState | null {
  if (value === undefined || value === null) return INITIAL_ARRIVAL_STATE;
  if (typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const finite = (x: unknown) => typeof x === "number" && Number.isFinite(x);
  if (!statuses.includes(String(v.status)) || !finite(v.consecutiveSamples) ||
    !(v.lastTimestamp === null || finite(v.lastTimestamp)) || !(v.distanceMeters === null || finite(v.distanceMeters))) return null;
  return { status: v.status as ArrivalState["status"], consecutiveSamples: v.consecutiveSamples as number,
    lastTimestamp: v.lastTimestamp as number | null, distanceMeters: v.distanceMeters as number | null };
}

function parseSample(value: unknown): LocationSample | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown> & Partial<LocationSample>;
  const position = { lat: v.lat, lng: v.lng };
  if (!isCoordinates(position) || typeof v.accuracy !== "number" || typeof v.timestamp !== "number") return null;
  return { ...position, accuracy: v.accuracy, timestamp: v.timestamp };
}

/**
 * 到着判定をサーバーで行う。目的地の座標をクライアントへ渡さず、到着が確定したときだけ公開情報を返す。
 * 判定の状態(連続回数など)はクライアントが保持して往復させる。サーバーは状態を持たない。
 */
export function checkArrival(body: unknown, now = Date.now()): ArrivalResponse {
  if (typeof body !== "object" || body === null) return { ok: false, error: "INVALID_INPUT" };
  const input = body as Record<string, unknown>;
  const sample = parseSample(input.sample);
  const state = parseState(input.state);
  if (!sample || !state) return { ok: false, error: "INVALID_INPUT" };
  const sealed = unsealDestination(input.sealed, now);
  if (!sealed) return { ok: false, error: "INVALID_TOKEN" };
  // 端末とサーバーの時計差で測位の鮮度判定が外れないよう、端末の現在時刻を基準にする。
  const clientNow = typeof input.now === "number" && Number.isFinite(input.now) &&
    Math.abs(input.now - now) < 24 * 60 * 60 * 1000 ? input.now : now;
  const next = detectArrival(sample, sealed.arrival, state, clientNow);
  return next.status === "confirmed" ? { ok: true, state: next, destination: sealed.reveal } : { ok: true, state: next };
}

