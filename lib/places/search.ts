import type { AdventureSettings, Category, DestinationCandidate } from "@/types/adventure";
import { isCoordinates, isDestinationCandidate, parseAdventureSettings } from "@/features/adventure/validation";
import { RoutingError } from "@/lib/routing/errors";
import { record } from "@/lib/routing/validation";
import roadsideStations from "@/data/roadside-stations.json";
const filters: Record<Exclude<Category, "random">, string[]> = {
 nature: ['[leisure=park][tourism]', '[leisure=nature_reserve]', '[natural=waterfall]', '[tourism=viewpoint]', '[natural=peak]'],
 cafe: ['[amenity=cafe]'],
 history: ['[historic~"^(castle|ruins|monument|archaeological_site)$"]', '[amenity=place_of_worship][tourism]'],
 hot_spring: ['[amenity=public_bath]["bath:type"=hot_spring]', '[leisure=hot_spring]'],
 roadside_station: ['[highway=rest_area][name~"道の駅"]'],
};
const searchTerms: Record<Exclude<Category, "random">, string> = {
 nature: "公園", cafe: "カフェ", history: "史跡", hot_spring: "温泉", roadside_station: "道の駅",
};
let nominatimQueue: Promise<void> = Promise.resolve();
let lastNominatimRequest = 0;
async function reserveNominatimSlot() {
 const slot = nominatimQueue.then(async () => {
  const delay = Math.max(0, lastNominatimRequest + 1_000 - Date.now());
  if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  lastNominatimRequest = Date.now();
 });
 nominatimQueue = slot.catch(() => {});
 await slot;
}
function searchBox(settings: AdventureSettings) {
 const radius = Math.min(60_000, Math.max(10_000, settings.durationMinutes * 500));
 const latitudeDelta = radius / 111_320;
 const longitudeDelta = radius / (111_320 * Math.max(0.2, Math.cos(settings.origin.lat * Math.PI / 180)));
 return {
  south: settings.origin.lat - latitudeDelta, west: settings.origin.lng - longitudeDelta,
  north: settings.origin.lat + latitudeDelta, east: settings.origin.lng + longitudeDelta,
 };
}
function nominatimCategory(settings: AdventureSettings): Exclude<Category, "random"> {
 if (settings.category !== "random") return settings.category;
 const categories = Object.keys(searchTerms) as Exclude<Category, "random">[];
 const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % categories.length;
 return categories[randomIndex];
}
async function searchNominatim(settings: AdventureSettings, request: typeof fetch) {
 const category = nominatimCategory(settings), box = searchBox(settings);
 const endpoint = process.env.OSM_NOMINATIM_URL ?? "https://nominatim.openstreetmap.org/search";
 let url: URL;
 try {
  url = new URL(endpoint);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error();
 } catch { throw new RoutingError("PLACES_CONFIG", 503); }
 url.search = new URLSearchParams({ format: "jsonv2", q: searchTerms[category], viewbox: `${box.west},${box.north},${box.east},${box.south}`,
  bounded: "1", limit: "20", addressdetails: "0", extratags: "1", "accept-language": "ja" }).toString();
 if (request === fetch) await reserveNominatimSlot();
 let response: Response;
 try {
  response = await request(url, { cache: "no-store", signal: AbortSignal.timeout(8_000),
   headers: { "User-Agent": "MysteryDestinationNavi/0.1 (+https://github.com/jphacks/os_2605)" } });
 } catch { return []; }
 if (!response.ok) return [];
 let payload: unknown;
 try { payload = await response.json(); } catch { return []; }
 if (!Array.isArray(payload)) return [];
 const results: DestinationCandidate[] = [];
 for (const item of payload) {
  if (!item || typeof item !== "object") continue;
  const place = item as Record<string, unknown>;
  const lat = Number(place.lat), lng = Number(place.lon), osmId = Number(place.osm_id);
  const osmType = String(place.osm_type ?? "").toLowerCase();
  const name = typeof place.name === "string" && place.name.trim() ? place.name.trim() :
   typeof place.display_name === "string" ? place.display_name.split(",")[0].trim() : "";
  if (!name || !Number.isSafeInteger(osmId) || !["node", "way", "relation"].includes(osmType) || !isCoordinates({ lat, lng })) continue;
  const extra = place.extratags && typeof place.extratags === "object" ? place.extratags as Record<string, unknown> : {};
  const hours = typeof extra.opening_hours === "string" ? extra.opening_hours : "";
  results.push({ id: `osm:${osmType}:${osmId}`, name, location: { lat, lng }, category,
   description: typeof place.display_name === "string" ? place.display_name : "OpenStreetMapに登録されている実在地点です。",
   imageUrl: "", source: "openstreetmap", sourceUrl: `https://www.openstreetmap.org/${osmType}/${osmId}`,
   supportedVehicles: ["car", "motorcycle"], isActive: true, accessVerified: false,
   openingInfo: hours === "24/7" ? { type: "always_open", note: hours } : hours ? { type: "hours", note: hours } : { type: "unknown" }, demoDurations: {} });
 }
 return results;
}
/** OSMでは取れない道の駅は、手作業で用意したJSONから探索範囲内のものを返す。 */
export function manualCandidates(settings: AdventureSettings): DestinationCandidate[] {
 if (settings.category !== "roadside_station") return [];
 const box = searchBox(settings);
 return (roadsideStations as unknown[]).filter(isDestinationCandidate).filter(c => c.isActive && c.category === "roadside_station" &&
  c.location.lat >= box.south && c.location.lat <= box.north && c.location.lng >= box.west && c.location.lng <= box.east);
}
export async function searchDestinations(settings: AdventureSettings, request: typeof fetch = fetch): Promise<DestinationCandidate[]> {
 if (!parseAdventureSettings(settings)) throw new RoutingError("INVALID_INPUT", 400);
 const manual = manualCandidates(settings);
 const found = await searchOsm(settings, request).catch(error => { if (manual.length) return []; throw error; });
 return [...manual, ...found.filter(c => !manual.some(m => m.id === c.id))];
}
async function searchOsm(settings: AdventureSettings, request: typeof fetch): Promise<DestinationCandidate[]> {
 const nominatimResults = await searchNominatim(settings, request);
 if (nominatimResults.length) return nominatimResults;
 const categories = settings.category === "random" ? Object.keys(filters) as Exclude<Category, "random">[] : [settings.category];
 // A bounded box is substantially cheaper for public Overpass instances than a
 // large multi-filter radius search. Actual travel time is still verified by OSRM.
 const bounds = searchBox(settings);
 const box = [bounds.south, bounds.west, bounds.north, bounds.east]
  .map(value => value.toFixed(5)).join(",");
 const query = `[out:json][timeout:12];(${categories.flatMap(c => filters[c].map(f => `nwr${f}[name](${box});`)).join("")});out center tags 60;`;
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
   response = await request(endpoint, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
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
  const category = tags.amenity === "cafe" ? "cafe" : tags.tourism === "viewpoint" || tags.natural === "peak" || ["park", "nature_reserve"].includes(String(tags.leisure)) || tags.natural === "waterfall" ? "nature" :
   tags.highway === "rest_area" ? "roadside_station" : tags.leisure === "hot_spring" || tags["bath:type"] === "hot_spring" ? "hot_spring" : "history";
  if (settings.category !== "random" && settings.category !== category) continue;
  const openingHours = typeof tags.opening_hours === "string" ? tags.opening_hours.trim() : "";
  const openingInfo = openingHours === "24/7" ? { type: "always_open" as const, note: openingHours } :
   openingHours ? { type: "hours" as const, note: openingHours } : { type: "unknown" as const };
  candidates.push({ id, name: tags.name, location, category,
   description: "OpenStreetMapに登録されている実在地点です。現地の営業時間・駐車場・立入条件を確認してください。",
   imageUrl: "", source: "openstreetmap", sourceUrl: `https://www.openstreetmap.org/${String(p.type)}/${p.id}`,
   supportedVehicles: ["car", "motorcycle"], isActive: true, accessVerified: false, openingInfo, demoDurations: {} });
 }
 if (!candidates.length) throw new RoutingError("NO_PLACES", 404);
 return candidates;
}
