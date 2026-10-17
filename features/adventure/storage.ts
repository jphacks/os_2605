import type { AdventurePlan } from "@/types/adventure";
import { findDemoOrigin } from "@/config/origins";
import {
  isCoordinates,
  parseAdventureSettings,
  parseSetupSelection,
  type SetupSelection,
} from "./validation";

/** 保存形式を変えたらバージョン番号を上げる。 */
export const SETUP_STORAGE_KEY = "mystery-navi:setup:v1";
export const PLAN_STORAGE_KEY = "mystery-navi:plan:v1";

/** getItemが例外を投げる環境（無効化・プライベートモード等）を表す。 */
export const STORAGE_UNAVAILABLE = Symbol("storage-unavailable");

export type RawStored = string | null | typeof STORAGE_UNAVAILABLE;

export type StoredValue<T> =
  | { status: "ok"; value: T }
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "unavailable" };

function defaultStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readRaw(
  key: string,
  storage: Storage | null = defaultStorage(),
): RawStored {
  if (!storage) return STORAGE_UNAVAILABLE;
  try {
    return storage.getItem(key);
  } catch {
    return STORAGE_UNAVAILABLE;
  }
}

function parseStored<T>(
  raw: RawStored,
  parse: (value: unknown) => T | null,
): StoredValue<T> {
  if (raw === STORAGE_UNAVAILABLE) return { status: "unavailable" };
  if (raw === null) return { status: "missing" };
  try {
    const value = parse(JSON.parse(raw));
    return value === null ? { status: "invalid" } : { status: "ok", value };
  } catch {
    return { status: "invalid" };
  }
}

export function parseStoredSetup(raw: RawStored): StoredValue<SetupSelection> {
  return parseStored(raw, parseSetupSelection);
}

export function parseStoredPlan(raw: RawStored): StoredValue<AdventurePlan> {
  return parseStored(raw, parseAdventurePlan);
}

/** 保存済みAdventurePlanの検証。画面に出せる状態（ready）のものだけ受け付ける。 */
export function parseAdventurePlan(value: unknown): AdventurePlan | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const settings = parseAdventureSettings(v.settings);
  const origin = v.origin as Record<string, unknown> | null;
  if (
    !settings ||
    typeof v.adventureId !== "string" ||
    v.adventureId === "" ||
    typeof v.destinationId !== "string" ||
    v.destinationId === "" ||
    typeof v.estimatedDurationMinutes !== "number" ||
    !Number.isFinite(v.estimatedDurationMinutes) ||
    v.status !== "ready" ||
    v.mode !== "demo" ||
    typeof origin !== "object" ||
    origin === null ||
    typeof origin.id !== "string" ||
    typeof origin.label !== "string" ||
    !isCoordinates(origin.location) ||
    !findDemoOrigin(origin.id)
  ) {
    return null;
  }
  return {
    adventureId: v.adventureId,
    settings,
    origin: {
      id: origin.id,
      label: origin.label,
      location: { ...origin.location },
    },
    destinationId: v.destinationId,
    estimatedDurationMinutes: v.estimatedDurationMinutes,
    status: "ready",
    mode: "demo",
  };
}

export function writeItem(
  key: string,
  value: unknown,
  storage: Storage | null = defaultStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeItem(
  key: string,
  storage: Storage | null = defaultStorage(),
): void {
  try {
    storage?.removeItem(key);
  } catch {
    // 利用できない環境では何もしない
  }
}

/** 条件を保存する。古い決定結果は条件が変わるため同時に破棄する。 */
export function saveSetup(
  selection: SetupSelection,
  storage: Storage | null = defaultStorage(),
): boolean {
  removeItem(PLAN_STORAGE_KEY, storage);
  return writeItem(SETUP_STORAGE_KEY, selection, storage);
}

export function savePlan(
  plan: AdventurePlan,
  storage: Storage | null = defaultStorage(),
): boolean {
  if (!parseAdventurePlan(plan)) return false;
  return writeItem(PLAN_STORAGE_KEY, plan, storage);
}
