import { describe, expect, it, vi } from "vitest";
import { searchDestinations } from "@/lib/places/search";
import { adaptOsrmRoute, OsrmRoutingProvider } from "@/lib/routing/osrm-provider";
import { prepareAdventure } from "@/features/adventure/route-planner";
import type { AdventureSettings } from "@/types/adventure";
const settings: AdventureSettings = { origin: { lat: 35, lng: 135 }, vehicleType: "car", category: "nature", durationMinutes: 30 };
const park = { type: "node", id: 1, lat: 35.01, lon: 135.01, tags: { name: "公園", leisure: "park" } };
const withEmptyNominatim = (payload: unknown) => vi.fn<typeof fetch>(async input =>
 String(input).includes("nominatim") ? Response.json([]) : Response.json(payload));
describe("OSM recommendations", () => {
 it("uses one alternate on a server failure but never evades rate limits", async () => {
  const request = vi.fn<typeof fetch>(async input => String(input).includes("nominatim") || String(input).includes("private.coffee")
   ? new Response(null, {status:502}) : Response.json({elements:[park]}));
  expect(await searchDestinations(settings,request)).toHaveLength(1);
  expect(request).toHaveBeenCalledTimes(3);
  expect(request.mock.calls[2][0]).toBe("https://overpass-api.de/api/interpreter");
  const limited = vi.fn().mockResolvedValue(new Response(null,{status:429}));
  await expect(searchDestinations(settings,limited)).rejects.toMatchObject({code:"RATE_LIMITED"});
  expect(limited).toHaveBeenCalledTimes(2);
 });
 it("reports search timeouts separately from route timeouts", async () => {
  const request = vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError"));
  await expect(searchDestinations(settings,request)).rejects.toMatchObject({code:"PLACES_TIMEOUT"});
  expect(request).toHaveBeenCalledTimes(3);
 });
 it("uses upstream coordinates, excludes private, invalid and duplicate data", async () => {
  const request = withEmptyNominatim({ elements: [park, park, {...park, id: 2, tags: {...park.tags, access: "private"}}, {type:"node",id:3}] });
  const result = await searchDestinations(settings, request);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({id:"osm:node:1", source:"openstreetmap", sourceUrl:"https://www.openstreetmap.org/node/1", location:{lat:35.01,lng:135.01}, accessVerified:false});
  expect(request.mock.calls[1][0]).toBe("https://overpass.private.coffee/api/interpreter");
  const query = new URLSearchParams(request.mock.calls[1][1]?.body as string).get("data") ?? "";
  expect(query).toContain("[leisure=park][tourism]");
  expect(query).not.toContain("around:");
  expect(query).toContain("[timeout:12]");
 });
 it("supports way centers and rejects empty or partial results", async () => {
  const request = withEmptyNominatim({elements:[{...park,type:"way",center:{lat:35.02,lon:135.02}}]});
  expect((await searchDestinations(settings,request))[0].location).toEqual({lat:35.02,lng:135.02});
  for (const payload of [{elements:[]}, {elements:[park],remark:"runtime error"}]) {
   await expect(searchDestinations(settings,withEmptyNominatim(payload))).rejects.toBeDefined();
  }
 });
 it("returns real OSM candidates for motorcycles and maps overload errors", async () => {
  const request=withEmptyNominatim({elements:[park]});
  const motorcycleResults = await searchDestinations({...settings,vehicleType:"motorcycle"},request);
  expect(motorcycleResults[0].supportedVehicles).toContain("motorcycle");
  expect(request).toHaveBeenCalledTimes(2);
  await expect(searchDestinations(settings,vi.fn().mockResolvedValue(new Response(null,{status:429})))).rejects.toMatchObject({code:"RATE_LIMITED"});
 });
 it("converts OSRM lng/lat and selects using actual road duration", async () => {
  const [destination]=await searchDestinations(settings,withEmptyNominatim({elements:[park]}));
  const coords=[[135,35],[135.01,35.01]];
  const payload={code:"Ok",routes:[{distance:2000,duration:1800,geometry:{coordinates:coords},legs:[{steps:[
   {distance:2000,duration:1800,maneuver:{type:"depart"},geometry:{coordinates:coords}},
   {distance:0,duration:0,maneuver:{type:"arrive"},geometry:{coordinates:[coords[1]]}}
  ]}]}]};
  const route=adaptOsrmRoute(payload,{origin:settings.origin,destination,vehicleType:"car"});
  expect(route).toMatchObject({provider:"osrm",mapCompatibility:"openstreetmap",durationSeconds:1800});
  expect(route.geometry[0]).toEqual(settings.origin);
  const plan=await prepareAdventure(settings,"live",[destination],{getRoute:async()=>route},()=>0);
  expect(plan.destinationId).toBe("osm:node:1");
  await expect(prepareAdventure({...settings,durationMinutes:90},"live",[destination],{getRoute:async()=>route},()=>0)).rejects.toMatchObject({code:"NO_DURATION_MATCH"});
  const motorcycleRequest = vi.fn<typeof fetch>().mockResolvedValue(Response.json(payload));
  await expect(new OsrmRoutingProvider(motorcycleRequest).getRoute({origin:settings.origin,destination,vehicleType:"motorcycle"})).resolves.toMatchObject({provider:"osrm",geometryKind:"road"});
  expect(motorcycleRequest.mock.calls[0][0]).toContain("/routed-car/route/v1/driving/");
  expect(()=>adaptOsrmRoute({code:"NoRoute"},{origin:settings.origin,destination,vehicleType:"car"})).toThrow();
 });
 it("uses one bounded Nominatim request and preserves the real OSM identity", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json([{ osm_type:"way", osm_id:479313190, lat:"35.01", lon:"135.01",
   name:"実在公園", display_name:"実在公園, 大阪府, 日本", extratags:{opening_hours:"24/7"} }]));
  const results = await searchDestinations(settings, request);
  expect(results[0]).toMatchObject({ id:"osm:way:479313190", name:"実在公園", category:"nature", openingInfo:{type:"always_open"} });
  expect(request).toHaveBeenCalledOnce();
  const url = new URL(String(request.mock.calls[0][0]));
  expect(url.hostname).toBe("nominatim.openstreetmap.org");
  expect(url.searchParams.get("bounded")).toBe("1");
  expect(url.searchParams.get("q")).toBe("公園");
 });
});
