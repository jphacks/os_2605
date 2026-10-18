import { expect, it } from "vitest";
import { POST } from "@/app/api/adventures/reveal/route";
import { sealDestination } from "@/lib/seal";
import spots from "@/data/spots.json";
import { isDestinationCandidate } from "@/features/adventure/validation";
import { maneuverLabel } from "@/features/adventure/ride-view";
const destination = (spots as unknown[]).filter(isDestinationCandidate)[0];
const request = (body: unknown) => new Request("http://localhost/api/adventures/reveal", { method: "POST", body: JSON.stringify(body) });
it("確認済みの場合は選択済みの目的地名のみを返し、到着扱いにしない", async () => {
  const response = await POST(request({ sealed: sealDestination(destination), confirmed: true }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ name: destination.name });
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});
it("確認のない要求や不正・期限切れの封印では名前を返さない", async () => {
  expect((await POST(request({ sealed: sealDestination(destination) }))).status).toBe(400);
  for (const sealed of ["broken", sealDestination(destination, 0)]) {
    const response = await POST(request({ sealed, confirmed: true }));
    expect(response.status).toBe(403);
    expect(await response.json()).not.toHaveProperty("name");
  }
});
it("距離に続けて右左折・直進などを表示する", () => {
  expect(`90m${maneuverLabel("TURN_RIGHT")}`).toBe("90m先右折");
  expect(maneuverLabel("TURN_LEFT")).toBe("先左折");
  expect(maneuverLabel("STRAIGHT")).toBe("先まで直進");
  expect(maneuverLabel("UTURN")).toBe("先Uターン");
  expect(maneuverLabel(null)).toBe("");
});
