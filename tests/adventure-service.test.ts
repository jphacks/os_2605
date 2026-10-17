import { describe, expect, it } from "vitest";
import {
  createAdventure,
  httpStatusFor,
} from "@/features/adventure/adventure-service";

const valid = {
  vehicleType: "motorcycle",
  durationMinutes: 90,
  category: "scenery",
  originId: "demo-origin-a",
  mode: "demo",
};
const deps = { rng: () => 0, generateId: () => "adv-1" };

describe("createAdventure", () => {
  it("成功時は目的地の名称・座標を含まない画面用レスポンスを返す", () => {
    const response = createAdventure(valid, deps);
    expect(response).toMatchObject({
      success: true,
      status: "ready",
      adventureId: "adv-1",
      estimatedDurationMinutes: 90,
    });
    const json = JSON.stringify(response);
    expect(json).not.toContain("検証用スポット");
    expect(json).not.toMatch(/lat|lng|imageUrl|description/);
  });

  it("同じ乱数なら同じ目的地IDになる", () => {
    expect(createAdventure(valid, deps).destinationId).toBe(
      createAdventure(valid, deps).destinationId,
    );
  });

  it.each([
    [null, "INVALID_REQUEST"],
    [{ ...valid, durationMinutes: 45 }, "INVALID_REQUEST"],
    [{ ...valid, mode: "other" }, "INVALID_REQUEST"],
    [{ ...valid, mode: "live" }, "UNSUPPORTED_MODE"],
    [{ ...valid, originId: "nowhere" }, "UNKNOWN_ORIGIN"],
    [{ ...valid, durationMinutes: 30 }, "NO_DURATION_MATCH"],
  ])("異常系 %j は %s", (body, code) => {
    const response = createAdventure(body, deps);
    expect(response).toMatchObject({
      success: false,
      status: "error",
      errorCode: code,
    });
    expect(response.destinationId).toBeUndefined();
  });

  it("目的地データが空・破損でもエラーを返す", () => {
    expect(createAdventure(valid, { candidates: [] }).errorCode).toBe(
      "DATA_EMPTY",
    );
    expect(createAdventure(valid, { candidates: [{ id: 1 }] }).errorCode).toBe(
      "DATA_INVALID",
    );
  });

  it("エラーコードをHTTPステータスに対応づける", () => {
    expect(httpStatusFor(createAdventure(valid, deps))).toBe(200);
    expect(httpStatusFor(createAdventure(null, deps))).toBe(400);
    expect(httpStatusFor(createAdventure({ ...valid, mode: "live" }))).toBe(501);
    expect(
      httpStatusFor(createAdventure({ ...valid, durationMinutes: 30 })),
    ).toBe(422);
  });
});
