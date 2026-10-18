import { describe, expect, it } from "vitest";
import { adaptOsrmRoute } from "@/lib/routing/osrm-provider";
import type { DestinationCandidate } from "@/types/adventure";

const origin = { lat: 35, lng: 135 };
const destination = { id: "osm:node:1", name: "x", category: "nature", location: { lat: 35.03, lng: 135.03 }, source: "openstreetmap" } as unknown as DestinationCandidate;

function route(types: { type: string; modifier?: string }[]) {
  const n = types.length;
  const coord = (i: number) => [135 + (i * 0.03) / n, 35 + (i * 0.03) / n];
  const steps = types.map((m, i) => ({
    distance: i === n - 1 ? 0 : 1000, duration: i === n - 1 ? 0 : 60,
    maneuver: { type: m.type, modifier: m.modifier },
    geometry: { coordinates: i === n - 1 ? [coord(i)] : [coord(i), coord(i + 1)] },
  }));
  return { code: "Ok", routes: [{ distance: 1000 * (n - 1), duration: 60 * (n - 1), geometry: { coordinates: Array.from({ length: n }, (_, i) => coord(i)) }, legs: [{ steps }] }] };
}

describe("OSRMの案内の種類", () => {
  it("急な左右折・分岐・ランプは向きのある案内にする（最初の案内が無音にならない）", () => {
    const result = adaptOsrmRoute(route([
      { type: "depart" }, { type: "turn", modifier: "sharp right" }, { type: "fork", modifier: "slight left" },
      { type: "on ramp", modifier: "right" }, { type: "roundabout", modifier: "right" }, { type: "arrive" },
    ]), { origin, destination, vehicleType: "car" });
    expect(result.steps.map((s) => s.maneuver)).toEqual(["STRAIGHT", "TURN_RIGHT", "SLIGHT_LEFT", "TURN_RIGHT", "OTHER", "ARRIVE"]);
  });
});
