import test from "node:test";
import assert from "node:assert/strict";
import {
  loadSetupDraft,
  parseSetupDraft,
  saveSetupDraft,
  SETUP_STORAGE_KEY,
} from "../features/adventure/setup-storage.ts";

const valid = {
  vehicleType: "motorcycle",
  durationMinutes: 90,
  category: "scenery",
};
function memoryStorage(initial: string | null = null) {
  const values = new Map<string, string>();
  if (initial !== null) values.set(SETUP_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test("all 48 supported combinations are accepted", () => {
  for (const vehicleType of ["motorcycle", "car"])
    for (const durationMinutes of [30, 60, 90, 120])
      for (const category of [
        "scenery",
        "nature",
        "history",
        "hot_spring",
        "roadside_station",
        "random",
      ]) {
        const value = { vehicleType, durationMinutes, category };
        assert.deepEqual(parseSetupDraft(value), value);
      }
});

test("rejects incomplete, wrong-type and unknown values before any write", () => {
  const invalid = [
    null,
    [],
    "text",
    {},
    { ...valid, vehicleType: null },
    { ...valid, vehicleType: "bike" },
    { ...valid, durationMinutes: "90" },
    { ...valid, durationMinutes: 45 },
    { ...valid, durationMinutes: NaN },
    { ...valid, durationMinutes: Infinity },
    { ...valid, category: "beach" },
    { ...valid, category: ["scenery"] },
  ];
  for (const value of invalid) {
    assert.equal(parseSetupDraft(value), null);
    let accessed = false;
    assert.equal(
      saveSetupDraft(value, () => {
        accessed = true;
        return memoryStorage();
      }),
      "invalid",
    );
    assert.equal(accessed, false);
  }
});

test("writes only the three fields and restores persisted choices after remount", () => {
  const storage = memoryStorage();
  assert.equal(
    saveSetupDraft(
      { ...valid, origin: { lat: 1, lng: 2 }, extra: "ignored" },
      () => storage,
    ),
    "saved",
  );
  assert.deepEqual(JSON.parse(storage.getItem(SETUP_STORAGE_KEY)!), valid);
  assert.deepEqual(
    loadSetupDraft(() => storage),
    { status: "restored", draft: valid },
  );
  const changed = {
    vehicleType: "car",
    durationMinutes: 120,
    category: "random",
  };
  assert.equal(
    saveSetupDraft(changed, () => storage),
    "saved",
  );
  assert.deepEqual(
    loadSetupDraft(() => storage),
    { status: "restored", draft: changed },
  );
});

test("missing and corrupt storage are safely distinguished", () => {
  assert.deepEqual(
    loadSetupDraft(() => memoryStorage()),
    { status: "empty" },
  );
  for (const raw of [
    "{",
    "",
    "null",
    "[]",
    "{}",
    JSON.stringify({ ...valid, durationMinutes: 999 }),
  ]) {
    assert.deepEqual(
      loadSetupDraft(() => memoryStorage(raw)),
      { status: "invalid" },
    );
  }
});

test("blocked storage getters, read errors and quota failures never escape", () => {
  const denied = () => {
    throw new Error("SecurityError");
  };
  assert.deepEqual(loadSetupDraft(denied), { status: "unavailable" });
  assert.equal(saveSetupDraft(valid, denied), "unavailable");
  assert.deepEqual(
    loadSetupDraft(() => ({ getItem: denied, setItem() {} })),
    { status: "unavailable" },
  );
  const storage = memoryStorage(JSON.stringify(valid));
  assert.equal(
    saveSetupDraft({ ...valid, durationMinutes: 30 }, () => ({
      ...storage,
      setItem: denied,
    })),
    "unavailable",
  );
  assert.deepEqual(
    loadSetupDraft(() => storage),
    { status: "restored", draft: valid },
  );
});

test("SSR without window does not crash", () => {
  assert.equal(typeof window, "undefined");
  assert.deepEqual(loadSetupDraft(), { status: "unavailable" });
  assert.equal(saveSetupDraft(valid), "unavailable");
});
