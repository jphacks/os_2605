import { parseAdventureSettings } from "@/features/adventure/validation";
import { prepareAdventure } from "@/features/adventure/route-planner";
import { searchDestinations } from "@/lib/places/search";
import { OsrmRoutingProvider } from "@/lib/routing/osrm-provider";
import { RoutingError, routingErrorResponse } from "@/lib/routing/errors";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch { throw new RoutingError("INVALID_INPUT", 400); }
    if (!body || typeof body !== "object" || !("mode" in body) || !("settings" in body)) throw new RoutingError("INVALID_INPUT", 400);
    const { mode, settings } = body;
    const valid = parseAdventureSettings(settings);
    if (!valid || mode !== "live") throw new RoutingError("INVALID_INPUT", 400);
    const candidates = await searchDestinations(valid);
    const plan = await prepareAdventure(valid, "live", candidates, new OsrmRoutingProvider());
    return Response.json({ plan }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return routingErrorResponse(error); }
}
