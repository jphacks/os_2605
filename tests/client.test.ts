import { describe, expect, it, vi } from "vitest";
import { checkArrivalRemote, searchAdventure } from "@/features/adventure/client";
import { distanceDisplay, toRidingView } from "@/features/adventure/ride-view";
import type { NavigationGuidance } from "@/lib/navigation/engine";
import type { RouteStep } from "@/types/adventure";

const here = { lat: 35, lng: 135.75 };
const plan = {
  adventureId: "a",
  sealedDestination: "sealed",
  estimatedDurationMinutes: 88,
  route: { id: "r", steps: [], geometry: [] },
};
const ok = (body: unknown, status = 200) =>
  vi.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response);

describe("searchAdventure", () => {
  it("時間だけを送り、乗り物は固定・ジャンルは指定しない", async () => {
    const request = ok({ plan });
    const result = await searchAdventure(75, request, async () => here);
    expect(result).toEqual({ ok: true, plan });
    const body = JSON.parse((request.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.settings).toEqual({ vehicleType: "car", durationMinutes: 75, category: "random", origin: here });
  });

  it("位置情報が取れない・通信失敗・サーバーエラーを利用者向けの文言で返す", async () => {
    const noLocation = await searchAdventure(60, ok({ plan }), async () => { throw new Error("denied"); });
    expect(noLocation).toMatchObject({ ok: false, message: expect.stringContaining("現在地") });
    const offline = await searchAdventure(60, vi.fn().mockRejectedValue(new Error("x")), async () => here);
    expect(offline).toMatchObject({ ok: false, message: expect.stringContaining("通信") });
    const failed = await searchAdventure(60, ok({ error: { code: "NO_PLACES", message: "見つかりません" } }, 404), async () => here);
    expect(failed).toEqual({ ok: false, message: "見つかりません" });
    const broken = await searchAdventure(60, ok({ plan: { adventureId: "a" } }), async () => here);
    expect(broken.ok).toBe(false);
  });
});

describe("checkArrivalRemote", () => {
  const sample = { ...here, accuracy: 5, timestamp: 1 };
  it("到着前は公開情報を受け取らない", async () => {
    const state = { status: "outside", consecutiveSamples: 0, lastTimestamp: 1, distanceMeters: 500 };
    expect(await checkArrivalRemote("s", sample, undefined, ok({ ok: true, state }))).toEqual({ ok: true, state, destination: undefined });
  });
  it("封印が無効なら理由を区別する", async () => {
    expect(await checkArrivalRemote("s", sample, undefined, ok({}, 403))).toEqual({ ok: false, invalidToken: true });
    expect(await checkArrivalRemote("s", sample, undefined, vi.fn().mockRejectedValue(new Error("x")))).toEqual({ ok: false, invalidToken: false });
  });
});

describe("ride view", () => {
  const step = { id: "s", maneuver: "TURN_RIGHT" } as RouteStep;
  const guidance = (distance: number): NavigationGuidance => ({
    status: "navigating", step, stepIndex: 1, distanceToStepMeters: distance, remainingDistanceMeters: 5_000,
    remainingDurationSeconds: 3_721, progress: { progressMeters: 0, geometryIndex: 0, stepIndex: 1, regressionCount: 0 },
  });

  it("距離は10m単位、1km以上はkm", () => {
    expect(distanceDisplay(304)).toEqual({ value: "300", unit: "m" });
    expect(distanceDisplay(4)).toEqual({ value: "10", unit: "m" });
    expect(distanceDisplay(1_250)).toEqual({ value: "1.3", unit: "km" });
  });

  it("残り時間と次の曲がり角だけを返す（目的地の情報を持たない）", () => {
    const view = toRidingView(guidance(300), 10_000, null);
    expect(view).toEqual({ remainingMinutes: 63, progress: 0.5, maneuver: "TURN_RIGHT", distance: { value: "300", unit: "m" }, notice: null });
    expect(Object.keys(view).sort()).toEqual(["distance", "maneuver", "notice", "progress", "remainingMinutes"]);
  });

  it("位置が使えない間は空の表示と案内文を返す", () => {
    expect(toRidingView(null, 10_000, "現在地を取得しています…")).toMatchObject({ remainingMinutes: null, maneuver: null, notice: "現在地を取得しています…" });
  });
});
