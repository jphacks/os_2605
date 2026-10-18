import { describe, expect, it } from "vitest";
import spotsJson from "@/data/spots.json";
import { DEFAULT_DEMO_ORIGIN_ID } from "@/config/origins";
import { selectDestination } from "@/features/adventure/destination-selector";
import { createSeededRng } from "@/features/adventure/seeded-rng";
import { isDestinationCandidate } from "@/features/adventure/validation";
import type {
  AdventureSettings,
  DestinationCandidate,
} from "@/types/adventure";

const originId = DEFAULT_DEMO_ORIGIN_ID;
const origin = { lat: 35.0, lng: 135.75 };

function settings(
  overrides: Partial<AdventureSettings> = {},
): AdventureSettings {
  return {
    vehicleType: "motorcycle",
    durationMinutes: 90,
    category: "nature",
    origin,
    ...overrides,
  };
}

function spot(
  id: string,
  overrides: Partial<DestinationCandidate> = {},
): DestinationCandidate {
  return {
    id,
    name: `検証用${id}`,
    category: "nature",
    location: { lat: 35, lng: 135 },
    description: "テスト用",
    imageUrl: "/images/placeholder.svg",
    supportedVehicles: ["car", "motorcycle"],
    isActive: true,
    openingInfo: { type: "always_open" },
    accessVerified: true,
    demoDurations: { [originId]: 90 },
    ...overrides,
  };
}

function errorOf(result: ReturnType<typeof selectDestination>) {
  return result.ok ? null : result.errorCode;
}

describe("selectDestination", () => {
  it("ジャンルで絞り込む", () => {
    const candidates = [spot("a"), spot("b", { category: "history" })];
    const result = selectDestination(settings(), candidates, { originId });
    expect(result.ok && result.destination.id).toBe("a");
    expect(
      errorOf(
        selectDestination(settings({ category: "cafe" }), candidates, {
          originId,
        }),
      ),
    ).toBe("NO_CATEGORY_MATCH");
  });

  it("randomではジャンルで絞り込まない", () => {
    const candidates = [spot("a"), spot("b", { category: "history" })];
    const seen = new Set<string>();
    const rng = createSeededRng(1);
    for (let i = 0; i < 50; i += 1) {
      const r = selectDestination(settings({ category: "random" }), candidates, {
        originId,
        rng,
      });
      if (r.ok) seen.add(r.destination.id);
    }
    expect(seen).toEqual(new Set(["a", "b"]));
  });

  it("乗り物で絞り込む", () => {
    const candidates = [spot("a", { supportedVehicles: ["car"] })];
    expect(
      errorOf(selectDestination(settings(), candidates, { originId })),
    ).toBe("NO_VEHICLE_MATCH");
    const car = selectDestination(settings({ vehicleType: "car" }), candidates, {
      originId,
    });
    expect(car.ok).toBe(true);
  });

  it.each([
    [74, "NO_DURATION_MATCH"],
    [75, null],
    [90, null],
    [105, null],
    [106, "NO_DURATION_MATCH"],
  ])("90分指定で推定%i分は %s", (minutes, expected) => {
    const result = selectDestination(
      settings(),
      [spot("a", { demoDurations: { [originId]: minutes } })],
      { originId },
    );
    expect(errorOf(result)).toBe(expected);
  });

  it("出発地点の所要時間がない候補は除外する", () => {
    const result = selectDestination(
      settings(),
      [spot("a", { demoDurations: { other: 90 } })],
      { originId },
    );
    expect(errorOf(result)).toBe("NO_DURATION_MATCH");
  });

  it("候補が0件のとき範囲外から選ばずエラーにする", () => {
    expect(errorOf(selectDestination(settings(), [], { originId }))).toBe(
      "DATA_EMPTY",
    );
    const far = spot("far", { demoDurations: { [originId]: 200 } });
    expect(errorOf(selectDestination(settings(), [far], { originId }))).toBe(
      "NO_DURATION_MATCH",
    );
  });

  it("無効・未検証・営業時間不明の候補は選ばない", () => {
    expect(
      errorOf(
        selectDestination(settings(), [spot("a", { isActive: false })], {
          originId,
        }),
      ),
    ).toBe("NO_ACTIVE_SPOTS");
    expect(
      errorOf(
        selectDestination(settings(), [spot("a", { accessVerified: false })], {
          originId,
        }),
      ),
    ).toBe("NO_VERIFIED_ACCESS");
    expect(
      errorOf(
        selectDestination(
          settings(),
          [spot("a", { openingInfo: { type: "unknown" } })],
          { originId },
        ),
      ),
    ).toBe("NO_VERIFIED_ACCESS");
  });

  it("候補が1件ならそれを返す", () => {
    const result = selectDestination(settings(), [spot("only")], { originId });
    expect(result).toMatchObject({
      ok: true,
      candidateCount: 1,
      estimatedDurationMinutes: 90,
    });
    expect(result.ok && result.destination.id).toBe("only");
  });

  it("候補が複数なら注入した乱数で選ぶ", () => {
    const candidates = [spot("a"), spot("b"), spot("c")];
    const pick = (value: number) => {
      const r = selectDestination(settings(), candidates, {
        originId,
        rng: () => value,
      });
      return r.ok ? r.destination.id : null;
    };
    expect(pick(0)).toBe("a");
    expect(pick(0.5)).toBe("b");
    expect(pick(0.999)).toBe("c");
    expect(pick(1)).toBe("c");
  });

  it("同じseedで同じ目的地を選ぶ", () => {
    const candidates = Array.from({ length: 10 }, (_, i) => spot(`s${i}`));
    const run = (seed: string) => {
      const rng = createSeededRng(seed);
      return Array.from({ length: 5 }, () => {
        const r = selectDestination(settings(), candidates, { originId, rng });
        return r.ok ? r.destination.id : null;
      });
    };
    expect(run("demo")).toEqual(run("demo"));
    expect(run("demo")).not.toEqual(run("another-seed"));
  });

  it("不正な設定値を拒否する", () => {
    const bad = [
      settings({ durationMinutes: 121 as never }),
      settings({ vehicleType: "bicycle" as never }),
      settings({ category: "sea" as never }),
      settings({ origin: { lat: 91, lng: 0 } }),
      settings({ origin: { lat: Number.NaN, lng: 0 } }),
      null as never,
    ];
    for (const s of bad) {
      expect(errorOf(selectDestination(s, [spot("a")], { originId }))).toBe(
        "INVALID_SETTINGS",
      );
    }
  });

  it("破損した目的地データを検出する", () => {
    const broken = { ...spot("a"), location: { lat: "x", lng: 0 } };
    expect(
      errorOf(selectDestination(settings(), [spot("b"), broken], { originId })),
    ).toBe("DATA_INVALID");
  });
});

describe("data/spots.json", () => {
  const spots: unknown[] = spotsJson;

  it("全件が有効な形式で、10〜30件に収まる", () => {
    expect(spots.length).toBeGreaterThanOrEqual(10);
    expect(spots.length).toBeLessThanOrEqual(30);
    expect(spots.every(isDestinationCandidate)).toBe(true);
  });

  it("登録データで想定どおりに選択・除外できる", () => {
    const run = (s: AdventureSettings) =>
      selectDestination(s, spots, { originId, rng: createSeededRng(7) });
    const ok = run(settings());
    expect(ok.ok && ok.candidateCount).toBe(3);
    expect(ok.ok && ok.destination.id).toMatch(/^spot-00[123]$/);
    expect(
      errorOf(run(settings({ category: "cafe", durationMinutes: 30 }))),
    ).toBe(
      "NO_DURATION_MATCH",
    );
    const single = run(settings({ vehicleType: "car", durationMinutes: 60 }));
    expect(single.ok && single.candidateCount).toBe(1);
  });
});
