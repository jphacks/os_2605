import { parseAdventureSettings } from "@/features/adventure/validation";
import { planAdventure } from "@/features/adventure/adventure-planner";
import { toPublicPlan } from "@/features/adventure/public-plan";
import { readDemoPin, readDemoRng } from "@/config/demo";
import { FIXED_VEHICLE } from "@/config/vehicle";
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
    // 乗り物は固定、ジャンルは利用者の指定を使わずサーバーで決める。
    const plan = await planAdventure({ ...valid, vehicleType: FIXED_VEHICLE, category: "random" }, "live", {
      findCandidates: searchDestinations, provider: new OsrmRoutingProvider(),
      pin: readDemoPin(), rng: readDemoRng(),
    });
    return Response.json({ plan: toPublicPlan(plan) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return routingErrorResponse(error); }
}
