import { describe, expect, it } from "vitest";
import fixtures from "@/data/demoRoutes.json";
import spots from "@/data/spots.json";
import { POST as adventuresPost } from "@/app/api/adventures/route";
import { POST as arrivalPost } from "@/app/api/adventures/arrival/route";
import { checkArrival } from "@/features/adventure/arrival";
import { toPublicPlan } from "@/features/adventure/public-plan";
import { isDestinationCandidate } from "@/features/adventure/validation";
import { readDemoPin, parseDemoOrigin, readDemoRng } from "@/config/demo";
import { sealDestination, unsealDestination } from "@/lib/seal";
import type { AdventurePlan, Route } from "@/types/adventure";

const destination = (spots as unknown[]).filter(isDestinationCandidate)[0];
const route = structuredClone(fixtures[0]) as Route;
// 実経路（OSRM）と同様に、IDに目的地の情報を含めない。
route.id = "route-1";
route.steps.forEach((step, i) => { step.id = `step-${i}`; });
const plan: AdventurePlan = {
  adventureId: "adv-1",
  route,
  destination,
  destinationId: destination.id,
  settings: {
    origin: route.origin,
    vehicleType: "car",
    durationMinutes: 90,
    category: "nature",
  },
  origin: { id: "o", label: "o", location: route.origin },
  estimatedDurationMinutes: 90,
  status: "ready",
  mode: "live",
};
const at = (location: { lat: number; lng: number }, timestamp: number) => ({
  ...location,
  accuracy: 10,
  timestamp,
});

describe("public plan", () => {
  const publicPlan = toPublicPlan(plan);
  const json = JSON.stringify(publicPlan);

  it("目的地の名称・座標・説明・ジャンルを含まない", () => {
    expect(json).not.toContain(destination.name);
    expect(json).not.toContain(destination.description);
    expect(json).not.toContain(destination.id);
    expect(json).not.toContain('"destination"');
    expect(json).not.toContain('"destinationId"');
    expect(publicPlan.settings.category).toBe("random");
    expect(publicPlan.route.steps.length).toBeGreaterThan(0);
  });

  it("封印は壊れていても期限切れでも開けない", () => {
    const token = sealDestination(destination, 1_000);
    expect(unsealDestination(token, 2_000)?.reveal.name).toBe(destination.name);
    expect(unsealDestination(token, 1_000 + 13 * 60 * 60 * 1000)).toBeNull();
    expect(unsealDestination(token.slice(0, -4) + "AAAA", 2_000)).toBeNull();
    expect(unsealDestination("x")).toBeNull();
  });
});

describe("arrival check", () => {
  const sealed = sealDestination(destination);
  const now = Date.now();

  it("到着前は目的地の情報を返さない", () => {
    const result = checkArrival(
      { sealed, sample: at({ lat: 35, lng: 135.75 }, now), now },
      now,
    );
    expect(result).toMatchObject({ ok: true, state: { status: "outside" } });
    expect(JSON.stringify(result)).not.toContain(destination.name);
  });

  it("連続して到着圏内にいると確定し、そのときだけ公開情報を返す", () => {
    const first = checkArrival(
      { sealed, sample: at(destination.location, now), now },
      now,
    );
    expect(first).toMatchObject({ ok: true, state: { status: "candidate" } });
    if (!first.ok) throw new Error("expected ok");
    expect(first.destination).toBeUndefined();
    const later = now + 2_000;
    const second = checkArrival(
      {
        sealed,
        state: first.state,
        sample: at(destination.location, later),
        now: later,
      },
      later,
    );
    expect(second).toMatchObject({
      ok: true,
      state: { status: "confirmed" },
      destination: { name: destination.name, category: destination.category },
    });
  });

  it("不正な入力・封印を拒否する", async () => {
    expect(checkArrival(null)).toEqual({ ok: false, error: "INVALID_INPUT" });
    expect(
      checkArrival({
        sealed,
        sample: { lat: 200, lng: 0, accuracy: 1, timestamp: 1 },
      }),
    ).toEqual({ ok: false, error: "INVALID_INPUT" });
    expect(
      checkArrival({ sealed: "bad", sample: at(destination.location, now) }),
    ).toEqual({ ok: false, error: "INVALID_TOKEN" });
    const response = await arrivalPost(
      new Request("http://localhost/api/adventures/arrival", {
        method: "POST",
        body: JSON.stringify({
          sealed: "bad",
          sample: at(destination.location, now),
        }),
      }),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("adventures API", () => {
  it("不正な時間を拒否する", async () => {
    const body = {
      mode: "live",
      settings: {
        origin: route.origin,
        vehicleType: "car",
        durationMinutes: 121,
        category: "random",
      },
    };
    const response = await adventuresPost(
      new Request("http://localhost/api/adventures", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    );
    expect(response.status).toBe(400);
  });
});

describe("demo pin config", () => {
  it("環境変数から固定設定を読む", () => {
    expect(readDemoPin({})).toBeNull();
    expect(
      readDemoPin({ DEMO_PIN_GENRE: "cafe", DEMO_PIN_DESTINATION_ID: "x" }),
    ).toEqual({ genre: "cafe", destinationId: "x" });
    expect(readDemoPin({ DEMO_PIN_GENRE: "scenery" })).toBeNull();
    expect(parseDemoOrigin("35.0, 135.75")).toEqual({ lat: 35, lng: 135.75 });
    expect(parseDemoOrigin("x,y")).toBeNull();
    expect(readDemoRng({})).toBeUndefined();
    expect(readDemoRng({ DEMO_SEED: "s" })?.()).toBe(
      readDemoRng({ DEMO_SEED: "s" })?.(),
    );
  });
});
