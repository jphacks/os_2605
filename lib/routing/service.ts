import spots from "@/data/spots.json";
import { isDestinationCandidate } from "@/features/adventure/validation";
import type { AdventureMode, DestinationCandidate, Route } from "@/types/adventure";
import { DemoRoutingProvider } from "./demo-provider";
import { LiveRoutingProvider } from "./live-provider";
import { RoutingError } from "./errors";
import type { RouteApiRequest, RoutingProvider } from "./types";
import { validateRoute } from "./validation";
export function registeredDestinations(): DestinationCandidate[] {
  const data: unknown[] = spots;
  if (!data.every(isDestinationCandidate)) throw new RoutingError("INVALID_ROUTE", 500);
  return data;
}
export function createRoutingProvider(mode: AdventureMode): RoutingProvider {
  return mode === "demo" ? new DemoRoutingProvider() : new LiveRoutingProvider(process.env.GOOGLE_MAPS_API_KEY);
}
export async function getRegisteredRoute(input: RouteApiRequest): Promise<Route> {
  if (input.mode === "live" && input.vehicleType === "motorcycle") throw new RoutingError("UNSUPPORTED_VEHICLE");
  const destination = registeredDestinations().find(s => s.id === input.destinationId && s.isActive);
  if (!destination) throw new RoutingError("UNKNOWN_DESTINATION", 404);
  if (!destination.supportedVehicles.includes(input.vehicleType)) throw new RoutingError("UNSUPPORTED_VEHICLE");
  if (!destination.accessVerified || destination.openingInfo.type === "unknown") throw new RoutingError("UNVERIFIED_DESTINATION");
  return validateRoute(await createRoutingProvider(input.mode).getRoute({ origin: input.origin, destination, vehicleType: input.vehicleType }));
}
