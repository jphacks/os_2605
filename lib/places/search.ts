import type { AdventureSettings, Category, DestinationCandidate } from "@/types/adventure";
import { isCoordinates, parseAdventureSettings } from "@/features/adventure/validation";
import { RoutingError } from "@/lib/routing/errors";
import { record } from "@/lib/routing/validation";
const filters: Record<Exclude<Category, "random">, string[]> = {
 scenery: ['[tourism=viewpoint]'], nature: ['[leisure=park]', '[natural=waterfall]'],
 history: ['[historic~"^(castle|ruins|monument|archaeological_site)$"]', '[amenity=place_of_worship]'],
 hot_spring: ['[amenity=public_bath]["bath:type"=hot_spring]', '[leisure=hot_spring]'],
 roadside_station: ['[highway=rest_area][name~"道の駅"]'],
};
export async function searchDestinations(settings: AdventureSettings, request: typeof fetch = fetch): Promise<DestinationCandidate[]> {
 if (!parseAdventureSettings(settings)) throw new RoutingError("INVALID_INPUT", 400);
 if (settings.vehicleType !== "car") throw new RoutingError("UNSUPPORTED_VEHICLE");
 const categories = settings.category === "random" ? Object.keys(filters) as Exclude<Category, "random">[] : [settings.category];
 const around = `(around:${Math.min(80000, settings.durationMinutes * 700)},${settings.origin.lat},${settings.origin.lng})`;
 const query = `[out:json][timeout:20];(${categories.flatMap(c => filters[c].map(f => `nwr${f}[name]${around};`)).join("")});out center tags 100;`;
 const endpoints = process.env.OSM_OVERPASS_URL ? [process.env.OSM_OVERPASS_URL] : [
  "https://overpass.private.coffee/api/interpreter", "https://overpass-api.de/api/interpreter",
 ];
 for (const endpoint of endpoints) {
  try {
   const url = new URL(endpoint);
   if (url.protocol !== "https:" || url.username || url.password) throw new Error();
  } catch { throw new RoutingError("PLACES_CONFIG", 503); }
 }
 let response: Response | undefined;
 for (const [index, endpoint] of endpoints.entries()) {
  try {
   response = await request(endpoint, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(25000),
   headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "MysteryDestinationNavi/0.1 (+https://github.com/jphacks/os_2605)" },
   body: new URLSearchParams({ data: query }).toString() });
   if (response.status >= 500 && index < endpoints.length - 1) continue;
   break;
  } catch (error) {
   if (index < endpoints.length - 1) continue;
   throw new RoutingError(error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? "PLACES_TIMEOUT" : "NETWORK_ERROR", 503);
  }
 }
 if (!response) throw new RoutingError("NETWORK_ERROR", 503);
 if ([406, 429].includes(response.status)) throw new RoutingError("RATE_LIMITED", 503);
 if (response.status >= 500) throw new RoutingError("PLACES_TIMEOUT", 503);
 if (!response.ok) throw new RoutingError("NETWORK_ERROR", 503);
 let payload;
 try { payload = record(await response.json()); } catch { throw new RoutingError("INVALID_ROUTE", 502); }
 if (payload.remark || !Array.isArray(payload.elements)) throw new RoutingError("INVALID_ROUTE", 502);
 const candidates: DestinationCandidate[] = [];
 const ids = new Set<string>();
 for (const item of payload.elements) {
  if (!item || typeof item !== "object") continue;
  const p = item as Record<string, unknown>;
  const tags = p.tags as Record<string, unknown> | undefined;
  const point = (p.type === "node" ? p : p.center) as Record<string, unknown> | undefined;
  const location = { lat: point?.lat, lng: point?.lon };
  if (!["node", "way", "relation"].includes(String(p.type)) || typeof p.id !== "number" || !Number.isSafeInteger(p.id) ||
   typeof tags?.name !== "string" || !tags.name.trim() || !isCoordinates(location) ||
   tags.access === "private" || tags.access === "no" || tags.disused === "yes" || tags.abandoned === "yes") continue;
  const id = `osm:${p.type}:${p.id}`;
  if (ids.has(id)) continue;
  ids.add(id);
  const category = tags.tourism === "viewpoint" ? "scenery" : tags.leisure === "park" || tags.natural === "waterfall" ? "nature" :
   tags.highway === "rest_area" ? "roadside_station" : tags.leisure === "hot_spring" || tags["bath:type"] === "hot_spring" ? "hot_spring" : "history";
  if (settings.category !== "random" && settings.category !== category) continue;
  candidates.push({ id, name: tags.name, location, category, description: "OpenStreetMap登録地点。営業時間・駐車場・立入条件は別途確認してください。",
   imageUrl: "", source: "openstreetmap", supportedVehicles: ["car"], isActive: true, accessVerified: false, openingInfo: { type: "unknown" }, demoDurations: {} });
 }
 if (!candidates.length) throw new RoutingError("NO_PLACES", 404);
 return candidates;
}
