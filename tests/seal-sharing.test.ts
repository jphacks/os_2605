import { afterEach, expect, it, vi } from "vitest";
import spots from "@/data/spots.json";
import { isDestinationCandidate } from "@/features/adventure/validation";
const destination = (spots as unknown[]).filter(isDestinationCandidate)[0];
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it("鍵未設定でもAPIモジュールの再読み込み後に目的地を復号できる", async () => {
  vi.stubEnv("ADVENTURE_SEAL_SECRET", "");
  const { sealDestination } = await import("@/lib/seal");
  const sealed = sealDestination(destination);
  vi.resetModules();
  const { POST } = await import("@/app/api/adventures/reveal/route");
  const response = await POST(new Request("http://localhost/api/adventures/reveal", { method: "POST", body: JSON.stringify({ sealed, confirmed: true }) }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ name: destination.name });
});
it("設定済み鍵はモジュールを読み直しても同じ目的地を復号する", async () => {
  vi.stubEnv("ADVENTURE_SEAL_SECRET", "test-only-shared-secret");
  const { sealDestination } = await import("@/lib/seal");
  const token = sealDestination(destination);
  vi.resetModules();
  const { unsealDestination } = await import("@/lib/seal");
  expect(unsealDestination(token)?.reveal.name).toBe(destination.name);
  vi.stubEnv("ADVENTURE_SEAL_SECRET", "different-test-secret");
  expect(unsealDestination(token)).toBeNull();
});
