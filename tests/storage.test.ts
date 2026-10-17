import { describe, expect, it } from "vitest";
import {
  PLAN_STORAGE_KEY,
  SETUP_STORAGE_KEY,
  parseStoredPlan,
  parseStoredSetup,
  readRaw,
  savePlan,
  saveSetup,
} from "@/features/adventure/storage";
import type { AdventurePlan } from "@/types/adventure";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  };
}

const throwing: Storage = {
  ...memoryStorage(),
  getItem: () => {
    throw new Error("denied");
  },
  setItem: () => {
    throw new Error("denied");
  },
};

const plan: AdventurePlan = {
  adventureId: "adv-1",
  settings: {
    vehicleType: "car",
    durationMinutes: 60,
    category: "random",
    origin: { lat: 35, lng: 135.75 },
  },
  origin: {
    id: "demo-origin-a",
    label: "デモ",
    location: { lat: 35, lng: 135.75 },
  },
  destinationId: "spot-004",
  estimatedDurationMinutes: 60,
  status: "ready",
  mode: "demo",
};

describe("storage", () => {
  it("条件を保存して読み戻せる", () => {
    const s = memoryStorage();
    const selection = {
      vehicleType: "motorcycle",
      durationMinutes: 90,
      category: "scenery",
    } as const;
    expect(saveSetup(selection, s)).toBe(true);
    expect(parseStoredSetup(readRaw(SETUP_STORAGE_KEY, s))).toEqual({
      status: "ok",
      value: selection,
    });
  });

  it("キーにバージョンが付いている", () => {
    expect(SETUP_STORAGE_KEY).toMatch(/:v1$/);
    expect(PLAN_STORAGE_KEY).toMatch(/:v1$/);
  });

  it("条件を保存すると古い決定結果を破棄する", () => {
    const s = memoryStorage();
    expect(savePlan(plan, s)).toBe(true);
    saveSetup(
      { vehicleType: "car", durationMinutes: 30, category: "nature" },
      s,
    );
    expect(parseStoredPlan(readRaw(PLAN_STORAGE_KEY, s)).status).toBe(
      "missing",
    );
  });

  it("保存データがない・不正・壊れている場合を区別する", () => {
    const s = memoryStorage();
    expect(parseStoredSetup(readRaw(SETUP_STORAGE_KEY, s)).status).toBe(
      "missing",
    );
    s.setItem(SETUP_STORAGE_KEY, "{broken");
    expect(parseStoredSetup(readRaw(SETUP_STORAGE_KEY, s)).status).toBe(
      "invalid",
    );
    s.setItem(SETUP_STORAGE_KEY, JSON.stringify({ vehicleType: "car" }));
    expect(parseStoredSetup(readRaw(SETUP_STORAGE_KEY, s)).status).toBe(
      "invalid",
    );
  });

  it("不正なAdventurePlanは保存しない・読み込まない", () => {
    const s = memoryStorage();
    expect(savePlan({ ...plan, status: "error" }, s)).toBe(false);
    expect(savePlan({ ...plan, destinationId: "" }, s)).toBe(false);
    expect(s.getItem(PLAN_STORAGE_KEY)).toBeNull();
    s.setItem(PLAN_STORAGE_KEY, JSON.stringify({ ...plan, mode: "live" }));
    expect(parseStoredPlan(readRaw(PLAN_STORAGE_KEY, s)).status).toBe(
      "invalid",
    );
  });

  it("sessionStorageが使えない場合を扱える", () => {
    expect(parseStoredSetup(readRaw(SETUP_STORAGE_KEY, throwing)).status).toBe(
      "unavailable",
    );
    expect(parseStoredSetup(readRaw(SETUP_STORAGE_KEY, null)).status).toBe(
      "unavailable",
    );
    expect(
      saveSetup(
        { vehicleType: "car", durationMinutes: 30, category: "nature" },
        throwing,
      ),
    ).toBe(false);
  });
});
