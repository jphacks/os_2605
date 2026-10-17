import { parseRouteRequest } from "@/lib/routing/validation";
import { getRegisteredRoute } from "@/lib/routing/service";
import { RoutingError, routingErrorResponse } from "@/lib/routing/errors";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch { throw new RoutingError("INVALID_INPUT", 400); }
    const route = await getRegisteredRoute(parseRouteRequest(body));
    return Response.json({ ...route, routeId: route.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return routingErrorResponse(error); }
}
