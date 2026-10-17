import type { AdventureSetupDraft } from "../../types/adventure";
import {
  vehicleOptions,
  durationOptions,
  categoryOptions,
} from "./setup-options.ts";

export const SETUP_STORAGE_KEY = "mystery-navi:adventure-setup:v1";

/** Never trust storage or form values solely because their TypeScript type matches. */
export function parseSetupDraft(value: unknown): AdventureSetupDraft | null {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  const data = value as Record<string, unknown>;
  if (
    !vehicleOptions.some((option) => option.value === data.vehicleType) ||
    !durationOptions.some((option) => option.value === data.durationMinutes) ||
    !categoryOptions.some((option) => option.value === data.category)
  )
    return null;
  // Only these three fields are persisted; origin belongs to a later feature.
  return {
    vehicleType: data.vehicleType as AdventureSetupDraft["vehicleType"],
    durationMinutes:
      data.durationMinutes as AdventureSetupDraft["durationMinutes"],
    category: data.category as AdventureSetupDraft["category"],
  };
}

type StorageAccess = () => Pick<Storage, "getItem" | "setItem">;
const browserStorage: StorageAccess = () => window.sessionStorage;
export type SetupLoadResult =
  | { status: "restored"; draft: AdventureSetupDraft }
  | { status: "empty" | "invalid" | "unavailable" };

export function loadSetupDraft(
  access: StorageAccess = browserStorage,
): SetupLoadResult {
  let raw: string | null;
  try {
    // Accessing window/sessionStorage itself can throw (SSR or browser policy).
    raw = access().getItem(SETUP_STORAGE_KEY);
  } catch {
    return { status: "unavailable" };
  }
  if (raw === null) return { status: "empty" };
  try {
    const draft = parseSetupDraft(JSON.parse(raw));
    return draft ? { status: "restored", draft } : { status: "invalid" };
  } catch {
    return { status: "invalid" };
  }
}

export function saveSetupDraft(
  value: unknown,
  access: StorageAccess = browserStorage,
): "saved" | "invalid" | "unavailable" {
  const draft = parseSetupDraft(value);
  if (!draft) return "invalid";
  try {
    access().setItem(SETUP_STORAGE_KEY, JSON.stringify(draft));
    return "saved";
  } catch {
    return "unavailable";
  }
}
