import type { Category } from "@/types/adventure";
import type { Rng } from "./seeded-rng";

/** 利用者が選ぶのは時間だけ。ジャンルは内部で次の5つから決める。 */
export const GENRES = [
  "roadside_station",
  "nature",
  "cafe",
  "history",
  "hot_spring",
] as const satisfies readonly Exclude<Category, "random">[];

export type Genre = (typeof GENRES)[number];

export const genreLabels: Record<Genre, string> = {
  roadside_station: "道の駅",
  nature: "自然",
  cafe: "カフェ",
  history: "歴史",
  hot_spring: "温泉",
};

export function isGenre(value: unknown): value is Genre {
  return typeof value === "string" && (GENRES as readonly string[]).includes(value);
}

/**
 * ジャンルを均等な確率で並べ替える（Fisher–Yates）。先頭が最初に試すジャンル。
 * 候補数の多いジャンルに偏らないよう、候補を数える前にジャンルを決める。
 */
export function shuffleGenres(rng: Rng, genres: readonly Genre[] = GENRES): Genre[] {
  const result = [...genres];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** ジャンルを1つ、均等に選ぶ。 */
export function pickGenre(rng: Rng, genres: readonly Genre[] = GENRES): Genre {
  return genres[Math.min(genres.length - 1, Math.floor(rng() * genres.length))];
}
