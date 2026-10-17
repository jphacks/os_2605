import {
  createAdventure,
  httpStatusFor,
} from "@/features/adventure/adventure-service";
import type { AdventureApiResponse } from "@/features/adventure/api-types";

function respond(body: AdventureApiResponse) {
  return Response.json(body, { status: httpStatusFor(body) });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({
      success: false,
      status: "error",
      errorCode: "INVALID_REQUEST",
    });
  }
  try {
    return respond(createAdventure(body));
  } catch {
    return respond({
      success: false,
      status: "error",
      errorCode: "INTERNAL_ERROR",
    });
  }
}
