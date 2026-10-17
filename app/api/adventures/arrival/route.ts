import { checkArrival } from "@/features/adventure/arrival";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const result = checkArrival(body);
  if (!result.ok) return Response.json({ error: { code: result.error } }, { status: result.error === "INVALID_TOKEN" ? 403 : 400, headers });
  return Response.json(result, { headers });
}
