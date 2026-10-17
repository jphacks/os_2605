import { DEMO_ORIGINS } from "@/config/origins";
import type { AdventureMode, AdventurePlan, AdventureSettings, DestinationCandidate, Route } from "@/types/adventure";
import { isDestinationCandidate, parseAdventureSettings } from "./validation";
import { DURATION_TOLERANCE_MINUTES } from "./destination-selector";
import { RoutingError } from "@/lib/routing/errors";
import type { RoutingProvider } from "@/lib/routing/types";
import { validateRoute } from "@/lib/routing/validation";
/** At most five sequential paid calls per selection; no retries or silent fallback. */
export const MAX_ROUTE_CANDIDATES = 5;
export async function prepareAdventure(
  settings: AdventureSettings, mode: AdventureMode, candidates: readonly unknown[], provider: RoutingProvider,
  rng: () => number = Math.random,
): Promise<AdventurePlan> {
  const valid = parseAdventureSettings(settings);
  if (!valid || (mode !== "demo" && mode !== "live")) throw new RoutingError("INVALID_INPUT", 400);
  if (!candidates.every(isDestinationCandidate)) throw new RoutingError("INVALID_ROUTE");
  const eligible = (candidates as DestinationCandidate[]).filter(s => s.isActive &&
    (mode === "live" && (s.source === "openstreetmap" || s.source === "curated") || s.accessVerified && s.openingInfo.type !== "unknown") &&
    s.supportedVehicles.includes(valid.vehicleType) &&
    (valid.category === "random" || s.category === valid.category) &&
    (mode === "demo" || s.source === "openstreetmap" || s.source === "curated" || s.liveRoutingVerified === true));
  if (!eligible.length) throw new RoutingError(mode === "live" ? "UNVERIFIED_DESTINATION" : "NO_ROUTE", 404);
  // Shuffle before limiting so later registered candidates are not permanently excluded.
  const randomIndex = (length: number) => {
    const value = rng();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RoutingError("INVALID_INPUT");
    return Math.floor(value * length);
  };
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  const matches: { destination: DestinationCandidate; route: Route }[] = [];
  let evaluated = 0;
  for (const destination of eligible.slice(0, MAX_ROUTE_CANDIDATES)) {
    try {
      const route = validateRoute(await provider.getRoute({ origin: valid.origin, destination, vehicleType: valid.vehicleType }));
      if (route.mode !== mode || route.origin.lat !== valid.origin.lat || route.origin.lng !== valid.origin.lng || route.destination.lat !== destination.location.lat || route.destination.lng !== destination.location.lng) throw new RoutingError("INVALID_ROUTE");
      evaluated++;
      if (Math.abs(route.durationSeconds - valid.durationMinutes * 60) <= DURATION_TOLERANCE_MINUTES * 60) matches.push({ destination, route });
    } catch (error) {
      if (!(error instanceof RoutingError) || error.code !== "NO_ROUTE") throw error;
    }
  }
  if (!matches.length) throw new RoutingError(evaluated ? "NO_DURATION_MATCH" : "NO_ROUTE");
  const chosen = matches[randomIndex(matches.length)];
  const origin = mode === "demo" ? DEMO_ORIGINS.find(o => o.location.lat === valid.origin.lat && o.location.lng === valid.origin.lng) : undefined;
  return { adventureId: crypto.randomUUID(), settings: valid,
    origin: origin ?? { id: "request-origin", label: "出発地点", location: valid.origin },
    destinationId: chosen.destination.id, destination: chosen.destination, estimatedDurationMinutes: chosen.route.durationSeconds / 60,
    route: chosen.route, status: "ready", mode };
}
