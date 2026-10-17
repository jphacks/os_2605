import { parseAdventureSettings } from "@/features/adventure/validation";
import { prepareAdventure } from "@/features/adventure/route-planner";
import { createRoutingProvider, registeredDestinations } from "@/lib/routing/service";
import { RoutingError, routingErrorResponse } from "@/lib/routing/errors";
import realSpots from "@/data/real-spots.json";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch { throw new RoutingError("INVALID_INPUT", 400); }
    if (!body || typeof body !== "object" || !("mode" in body) || !("settings" in body)) throw new RoutingError("INVALID_INPUT", 400);
    const { mode, settings } = body;
    const valid = parseAdventureSettings(settings);
    if (!valid || (mode !== "demo" && mode !== "live")) throw new RoutingError("INVALID_INPUT", 400);
    if (mode === "live" && valid.vehicleType !== "car") throw new RoutingError("UNSUPPORTED_VEHICLE");
    const candidates = mode === "live" ? realSpots : registeredDestinations();
    const plan = await prepareAdventure(valid, mode, candidates, createRoutingProvider(mode));
    return Response.json({ plan }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return routingErrorResponse(error); }
}
