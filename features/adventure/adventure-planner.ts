import type { DemoPin } from "@/config/demo";
import type { RoutingProvider } from "@/lib/routing/types";
import { RoutingError } from "@/lib/routing/errors";
import type { AdventureMode, AdventurePlan, AdventureSettings, DestinationCandidate } from "@/types/adventure";
import { GENRES, shuffleGenres, type Genre } from "./genre";
import { prepareAdventure } from "./route-planner";
import type { Rng } from "./seeded-rng";
import { parseAdventureSettings } from "./validation";

/** 公開APIへの負荷を抑えるため、1回の検索で試すジャンルの上限。 */
export const MAX_GENRE_ATTEMPTS = 3;

/** 別のジャンルを試せば解決しうる失敗。通信・認証などの障害は再試行せずに返す。 */
const RETRYABLE = new Set(["NO_PLACES", "NO_ROUTE", "NO_DURATION_MATCH", "UNVERIFIED_DESTINATION"]);

export type PlanDeps = {
  findCandidates: (settings: AdventureSettings) => Promise<DestinationCandidate[]>;
  provider: RoutingProvider;
  /** 乱数。テスト・デモでは seed 付きのものを差し込む。 */
  rng?: Rng;
  /** デモ用の固定。ジャンル・目的地を決め打ちにする。 */
  pin?: DemoPin | null;
  maxGenreAttempts?: number;
};

/**
 * 時間・出発地から冒険を1件用意する。ジャンルは利用者に選ばせず、ここで内部的に決める。
 * 先にジャンルを均等に選び、そのジャンルの候補から目的地を選ぶ（候補数の多いジャンルに偏らない）。
 */
export async function planAdventure(
  settings: AdventureSettings,
  mode: AdventureMode,
  { findCandidates, provider, rng = Math.random, pin = null, maxGenreAttempts = MAX_GENRE_ATTEMPTS }: PlanDeps,
): Promise<AdventurePlan> {
  const valid = parseAdventureSettings(settings);
  if (!valid) throw new RoutingError("INVALID_INPUT", 400);
  const genres: Genre[] = pin?.genre ? [pin.genre] : shuffleGenres(rng, GENRES).slice(0, maxGenreAttempts);
  let lastError: unknown = new RoutingError("NO_PLACES", 404);
  for (const genre of genres) {
    const genreSettings = { ...valid, category: genre };
    try {
      let candidates = await findCandidates(genreSettings);
      if (pin?.destinationId) candidates = candidates.filter((c) => c.id === pin.destinationId);
      return await prepareAdventure(genreSettings, mode, candidates, provider, rng);
    } catch (error) {
      if (!(error instanceof RoutingError) || !RETRYABLE.has(error.code)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}
