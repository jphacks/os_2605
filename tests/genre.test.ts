import { describe, expect, it } from "vitest";
import { GENRES, pickGenre, shuffleGenres } from "@/features/adventure/genre";
import { createSeededRng } from "@/features/adventure/seeded-rng";

describe("genre", () => {
  it("ジャンルは道の駅・自然・カフェ・歴史・温泉の5つ（絶景・チャレンジを含まない）", () => {
    expect([...GENRES].sort()).toEqual([
      "cafe",
      "history",
      "hot_spring",
      "nature",
      "roadside_station",
    ]);
  });

  it("注入した乱数でジャンルを選ぶ", () => {
    expect(pickGenre(() => 0)).toBe(GENRES[0]);
    expect(pickGenre(() => 0.999)).toBe(GENRES[GENRES.length - 1]);
    expect(pickGenre(() => 1)).toBe(GENRES[GENRES.length - 1]);
  });

  it("同じseedなら同じ順序になり、全ジャンルを1回ずつ含む", () => {
    const a = shuffleGenres(createSeededRng("demo"));
    expect(shuffleGenres(createSeededRng("demo"))).toEqual(a);
    expect([...a].sort()).toEqual([...GENRES].sort());
  });

  it("ジャンルは均等に選ばれる（候補数に依存しない）", () => {
    const rng = createSeededRng(2026);
    const n = 10_000;
    const counts: Record<string, number> = Object.fromEntries(
      GENRES.map((g) => [g, 0]),
    );
    for (let i = 0; i < n; i += 1) counts[pickGenre(rng)] += 1;
    const first: Record<string, number> = Object.fromEntries(
      GENRES.map((g) => [g, 0]),
    );
    for (let i = 0; i < n; i += 1) first[shuffleGenres(rng)[0]] += 1;
    for (const g of GENRES) {
      expect(Math.abs(counts[g] / n - 1 / GENRES.length)).toBeLessThan(0.02);
      expect(Math.abs(first[g] / n - 1 / GENRES.length)).toBeLessThan(0.02);
    }
  });
});
