import { expect, it, vi } from "vitest";
import { canStartAdventure, normalizeSearchMinutes } from "@/features/adventure/setup-options";
import { parseAdventureSettings } from "@/features/adventure/validation";
import { searchAdventure } from "@/features/adventure/client";
it("0分は出発不可、1〜120分は出発可能", () => {
  expect(canStartAdventure(0)).toBe(false);
  for (const n of [1, 9, 10, 120]) expect(canStartAdventure(n)).toBe(true);
});
it("0〜10分を10分に補正し、不正値は拒否する", () => {
  for (let n = 0; n <= 10; n++) {
    expect(normalizeSearchMinutes(n)).toBe(10);
    expect(parseAdventureSettings({ vehicleType: "car", durationMinutes: n, category: "random", origin: { lat: 35, lng: 135 } })?.durationMinutes).toBe(10);
  }
  expect(normalizeSearchMinutes(11)).toBe(11);
  expect(normalizeSearchMinutes(120)).toBe(120);
  for (const n of [-1, 121, NaN, Infinity, "5", 1.5]) expect(normalizeSearchMinutes(n)).toBeNull();
});
it("クライアントも10分へ補正してAPIに送信する", async () => {
  for (const minutes of [0, 5, 10]) {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: { message: "test" } }, { status: 422 }));
    await searchAdventure(minutes, request, async () => ({ lat: 35, lng: 135 }));
    expect(JSON.parse(request.mock.calls[0][1]!.body as string).settings.durationMinutes).toBe(10);
  }
});
