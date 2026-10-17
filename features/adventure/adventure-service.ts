import spotsJson from "@/data/spots.json";
import { findDemoOrigin, isModeSupported } from "@/config/origins";
import type { AdventureMode } from "@/types/adventure";
import type {
  AdventureApiErrorCode,
  AdventureApiResponse,
} from "./api-types";
import { selectDestination } from "./destination-selector";
import type { Rng } from "./seeded-rng";
import { parseSetupSelection } from "./validation";

export type CreateAdventureDeps = {
  candidates?: readonly unknown[];
  rng?: Rng;
  generateId?: () => string;
};

function failure(errorCode: AdventureApiErrorCode): AdventureApiResponse {
  return { success: false, status: "error", errorCode };
}

/** リクエストを検証し、目的地を1件決めて画面用レスポンスを返す。 */
export function createAdventure(
  body: unknown,
  {
    candidates = spotsJson,
    rng,
    generateId = () => crypto.randomUUID(),
  }: CreateAdventureDeps = {},
): AdventureApiResponse {
  if (typeof body !== "object" || body === null) {
    return failure("INVALID_REQUEST");
  }
  const input = body as Record<string, unknown>;
  const selection = parseSetupSelection(input);
  const mode = input.mode as AdventureMode;
  if (!selection || (mode !== "demo" && mode !== "live")) {
    return failure("INVALID_REQUEST");
  }
  if (!isModeSupported(mode)) return failure("UNSUPPORTED_MODE");
  const origin =
    typeof input.originId === "string" ? findDemoOrigin(input.originId) : null;
  if (!origin) return failure("UNKNOWN_ORIGIN");

  const result = selectDestination(
    { ...selection, origin: origin.location },
    candidates,
    { originId: origin.id, rng },
  );
  if (!result.ok) return failure(result.errorCode);

  return {
    success: true,
    status: "ready",
    adventureId: generateId(),
    destinationId: result.destination.id,
    estimatedDurationMinutes: result.estimatedDurationMinutes,
  };
}

export function httpStatusFor(response: AdventureApiResponse): number {
  switch (response.errorCode) {
    case undefined:
      return 200;
    case "INVALID_REQUEST":
    case "INVALID_SETTINGS":
    case "UNKNOWN_ORIGIN":
      return 400;
    case "UNSUPPORTED_MODE":
      return 501;
    case "DATA_EMPTY":
    case "DATA_INVALID":
    case "INTERNAL_ERROR":
      return 500;
    default:
      return 422;
  }
}
