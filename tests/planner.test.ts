import { toPublicPlan } from "@/features/adventure/public-plan";
import { unsealDestination } from "@/lib/seal";
import { describe, expect, it, vi } from "vitest";
import fixtures from "@/data/demoRoutes.json";
import spots from "@/data/spots.json";
import {
  planAdventure,
  MAX_GENRE_ATTEMPTS,
} from "@/features/adventure/adventure-planner";
import { GENRES, shuffleGenres } from "@/features/adventure/genre";
import { createSeededRng } from "@/features/adventure/seeded-rng";
import { isDestinationCandidate } from "@/features/adventure/validation";
import { RoutingError } from "@/lib/routing/errors";
import type {
  AdventureSettings,
  DestinationCandidate,
  Route,
} from "@/types/adventure";

const base = (spots as unknown[]).filter(isDestinationCandidate)[0];
const origin = { lat: 35, lng: 135.75 };
const settings: AdventureSettings = {
  origin,
  vehicleType: "car",
  durationMinutes: 90,
  category: "random",
};
const provider = {
  getRoute: vi.fn(async () => structuredClone(fixtures[0]) as Route),
};
const spot = (
  id: string,
  category: DestinationCandidate["category"],
): DestinationCandidate => ({ ...base, id, category });
const everyGenre = GENRES.map((g) => spot(`spot-${g}`, g));
const byGenre = (all: DestinationCandidate[]) => async (s: AdventureSettings) =>
  all.filter((c) => c.category === s.category);

describe("planAdventure", () => {
  it("ジャンルを先に決めてから、そのジャンルの候補だけで目的地を選ぶ", async () => {
    const expected = shuffleGenres(createSeededRng("a"))[0];
    const plan = await planAdventure(settings, "demo", {
      findCandidates: byGenre(everyGenre),
      provider,
      rng: createSeededRng("a"),
    });
    expect(plan.destination?.category).toBe(expected);
    expect(plan.settings.category).toBe(expected);
  });

  it("候補数の多いジャンルに偏らない", async () => {
    const many = [
      ...everyGenre,
      ...Array.from({ length: 30 }, (_, i) => spot(`nature-${i}`, "nature")),
    ];
    const rng = createSeededRng(7);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 400; i += 1) {
      const plan = await planAdventure(settings, "demo", {
        findCandidates: byGenre(many),
        provider,
        rng,
      });
      const c = plan.destination!.category;
      counts[c] = (counts[c] ?? 0) + 1;
    }
    expect(counts.nature / 400).toBeLessThan(0.3);
    expect(counts.cafe / 400).toBeGreaterThan(0.1);
  });

  it("候補のないジャンルは次のジャンルへ進み、範囲外の目的地は選ばない", async () => {
    const plan = await planAdventure(settings, "demo", {
      findCandidates: byGenre([spot("only-history", "history")]),
      provider,
      rng: createSeededRng(3),
      maxGenreAttempts: 5,
    });
    expect(plan.destination?.id).toBe("only-history");

    const find = vi.fn(async () => []);
    await expect(
      planAdventure(settings, "demo", { findCandidates: find, provider }),
    ).rejects.toMatchObject({ code: "NO_ROUTE" });
    expect(find).toHaveBeenCalledTimes(MAX_GENRE_ATTEMPTS);
  });

  it("通信障害は別ジャンルで再試行せずそのまま返す", async () => {
    const find = vi
      .fn()
      .mockRejectedValue(new RoutingError("RATE_LIMITED", 503));
    await expect(
      planAdventure(settings, "demo", { findCandidates: find, provider }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(find).toHaveBeenCalledTimes(1);
  });

  it("同じseedなら同じ結果になる", async () => {
    const run = () =>
      planAdventure(settings, "demo", {
        findCandidates: byGenre(everyGenre),
        provider,
        rng: createSeededRng("repeat"),
      });
    expect((await run()).destinationId).toBe((await run()).destinationId);
  });

  it("デモ用にジャンルと目的地を固定できる", async () => {
    const find = byGenre([...everyGenre, spot("spot-onsen-b", "hot_spring")]);
    for (let i = 0; i < 10; i += 1) {
      const plan = await planAdventure(settings, "demo", {
        findCandidates: find,
        provider,
        pin: { genre: "hot_spring", destinationId: "spot-onsen-b" },
      });
      expect(plan.destinationId).toBe("spot-onsen-b");
    }
    await expect(
      planAdventure(settings, "demo", {
        findCandidates: find,
        provider,
        pin: { genre: "hot_spring", destinationId: "missing" },
      }),
    ).rejects.toMatchObject({ code: "NO_ROUTE" });
  });

  it("不正な設定は拒否する", async () => {
    await expect(
      planAdventure({ ...settings, durationMinutes: 121 as never }, "demo", {
        findCandidates: byGenre(everyGenre),
        provider,
      }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});

it("選択した目的地と経路を保持し、地図用形状は公開時も変更しない", async () => {
  const plan = await planAdventure(settings, "demo", {
    findCandidates: byGenre(everyGenre), provider, rng: createSeededRng("map-check"),
  });
  expect(plan.destination).toBeDefined();
  expect(plan.destinationId).toBe(plan.destination!.id);
  expect(plan.route!.destination).toEqual(plan.destination!.location);
  const publicPlan = toPublicPlan(plan);
  expect(publicPlan.route.geometry).toEqual(plan.route!.geometry);
  expect(publicPlan.route.id).toBe(plan.route!.id);
  expect(unsealDestination(publicPlan.sealedDestination)?.reveal.name).toBe(plan.destination!.name);
  expect(publicPlan).not.toHaveProperty("destination");
});
