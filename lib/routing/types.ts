import type { AdventureMode, Coordinates, DestinationCandidate, Route, VehicleType } from "@/types/adventure";

export type RouteRequest = {
  origin: Coordinates;
  destination: DestinationCandidate;
  vehicleType: VehicleType;
};
export interface RoutingProvider {
  getRoute(input: RouteRequest): Promise<Route>;
}
export type RouteApiRequest = {
  origin: Coordinates;
  destinationId: string;
  vehicleType: VehicleType;
  mode: AdventureMode;
};
