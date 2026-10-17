import { describe, expect, it, vi } from "vitest";
import { searchDestinations } from "@/lib/places/search";
import { adaptOsrmRoute } from "@/lib/routing/osrm-provider";
import { prepareAdventure } from "@/features/adventure/route-planner";
import type { AdventureSettings } from "@/types/adventure";
const settings: AdventureSettings = { origin: { lat: 35, lng: 135 }, vehicleType: "car", category: "nature", durationMinutes: 30 };
const park = { type: "node", id: 1, lat: 35.01, lon: 135.01, tags: { name: "公園", leisure: "park" } };
describe("OSM recommendations", () => {
 it("uses one alternate on a server failure but never evades rate limits", async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response(null, {status:502})).mockResolvedValueOnce(Response.json({elements:[park]}));
  expect(await searchDestinations(settings,request)).toHaveLength(1);
  expect(request).toHaveBeenCalledTimes(2);
  expect(request.mock.calls[1][0]).toBe("https://overpass-api.de/api/interpreter");
  const limited = vi.fn().mockResolvedValue(new Response(null,{status:429}));
  await expect(searchDestinations(settings,limited)).rejects.toMatchObject({code:"RATE_LIMITED"});
  expect(limited).toHaveBeenCalledTimes(1);
 });
 it("reports search timeouts separately from route timeouts", async () => {
  const request = vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError"));
  await expect(searchDestinations(settings,request)).rejects.toMatchObject({code:"PLACES_TIMEOUT"});
  expect(request).toHaveBeenCalledTimes(2);
 });
 it("uses upstream coordinates, excludes private, invalid and duplicate data", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ elements: [park, park, {...park, id: 2, tags: {...park.tags, access: "private"}}, {type:"node",id:3}] }));
  const result = await searchDestinations(settings, request);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({id:"osm:node:1", source:"openstreetmap", location:{lat:35.01,lng:135.01}, accessVerified:false});
  expect(request.mock.calls[0][0]).toBe("https://overpass.private.coffee/api/interpreter");
  expect(new URLSearchParams(request.mock.calls[0][1]?.body as string).get("data")).toContain("[leisure=park]");
 });
 it("supports way centers and rejects empty or partial results", async () => {
  const request = vi.fn().mockResolvedValue(Response.json({elements:[{...park,type:"way",center:{lat:35.02,lon:135.02}}]}));
  expect((await searchDestinations(settings,request))[0].location).toEqual({lat:35.02,lng:135.02});
  for (const payload of [{elements:[]}, {elements:[park],remark:"runtime error"}]) {
   await expect(searchDestinations(settings,vi.fn().mockResolvedValue(Response.json(payload)))).rejects.toBeDefined();
  }
 });
 it("rejects motorcycles without network and maps overload errors", async () => {
  const request=vi.fn();
  await expect(searchDestinations({...settings,vehicleType:"motorcycle"},request)).rejects.toMatchObject({code:"UNSUPPORTED_VEHICLE"});
  expect(request).not.toHaveBeenCalled();
  await expect(searchDestinations(settings,vi.fn().mockResolvedValue(new Response(null,{status:429})))).rejects.toMatchObject({code:"RATE_LIMITED"});
 });
 it("converts OSRM lng/lat and selects using actual road duration", async () => {
  const [destination]=await searchDestinations(settings,vi.fn().mockResolvedValue(Response.json({elements:[park]})));
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
  expect(()=>adaptOsrmRoute({code:"NoRoute"},{origin:settings.origin,destination,vehicleType:"car"})).toThrow();
 });
});
