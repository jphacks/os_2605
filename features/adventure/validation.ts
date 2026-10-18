import type {
  AdventureSettings,
  Category,
  Coordinates,
  DestinationCandidate,
  DurationMinutes,
  VehicleType,
} from "@/types/adventure";
import {
  normalizeSearchMinutes,
  SEARCH_DURATION_MIN,
  categoryOptions,
  durationOptions,
  vehicleOptions,
} from "./setup-options";

const vehicleValues: readonly string[] = vehicleOptions.map((o) => o.value);
const durationValues: readonly number[] = durationOptions.map((o) => o.value);
const categoryValues: readonly string[] = categoryOptions.map((o) => o.value);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isVehicleType(value: unknown): value is VehicleType {
  return typeof value === "string" && vehicleValues.includes(value);
}

export function isDurationMinutes(value: unknown): value is DurationMinutes {
  return typeof value === "number" && value >= SEARCH_DURATION_MIN && durationValues.includes(value);
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && categoryValues.includes(value);
}

export function isCoordinates(value: unknown): value is Coordinates {
  return (
    isRecord(value) &&
    typeof value.lat === "number" &&
    typeof value.lng === "number" &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180
  );
}

/** 条件入力画面で選ぶ3項目。 */
export type SetupSelection = Pick<
  AdventureSettings,
  "vehicleType" | "durationMinutes" | "category"
>;

export function parseSetupSelection(value: unknown): SetupSelection | null {
  const minutes = isRecord(value) ? normalizeSearchMinutes(value.durationMinutes) : null;
  if (
    isRecord(value) &&
    isVehicleType(value.vehicleType) &&
    isDurationMinutes(minutes) &&
    isCategory(value.category)
  ) {
    return {
      vehicleType: value.vehicleType,
      durationMinutes: minutes,
      category: value.category,
    };
  }
  return null;
}

export function parseAdventureSettings(
  value: unknown,
): AdventureSettings | null {
  if (!isRecord(value) || !isCoordinates(value.origin)) return null;
  const selection = parseSetupSelection(value);
  if (!selection) return null;
  return {
    ...selection,
    origin: { lat: value.origin.lat, lng: value.origin.lng },
  };
}

export function isDestinationCandidate(
  value: unknown,
): value is DestinationCandidate {
  if (!isRecord(value)) return false;
  const { openingInfo, demoDurations, supportedVehicles } = value;
  return (
    typeof value.id === "string" &&
    value.id !== "" &&
    typeof value.name === "string" &&
    typeof value.category === "string" &&
    value.category !== "random" &&
    isCategory(value.category) &&
    isCoordinates(value.location) &&
    (value.arrivalLocation === undefined || isCoordinates(value.arrivalLocation)) &&
    typeof value.description === "string" &&
    typeof value.imageUrl === "string" &&
    Array.isArray(supportedVehicles) &&
    supportedVehicles.every(isVehicleType) &&
    typeof value.isActive === "boolean" &&
    isRecord(openingInfo) &&
    (openingInfo.type === "always_open" ||
      openingInfo.type === "hours" ||
      openingInfo.type === "unknown") &&
    typeof value.accessVerified === "boolean" &&
    (value.source === undefined || value.source === "openstreetmap" || value.source === "curated") &&
    (value.sourceUrl === undefined || typeof value.sourceUrl === "string") &&
    (value.liveRoutingVerified === undefined || typeof value.liveRoutingVerified === "boolean") &&
    isRecord(demoDurations) &&
    Object.values(demoDurations).every(
      (minutes) =>
        typeof minutes === "number" && Number.isFinite(minutes) && minutes > 0,
    )
  );
}
