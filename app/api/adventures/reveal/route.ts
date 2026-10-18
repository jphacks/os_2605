import { unsealDestination } from "@/lib/seal";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
/** 明示的な地図確認用。到着状態は変更せず、目的地名だけを返す。 */
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  if (!body || typeof body !== "object" || !("sealed" in body) || !("confirmed" in body) || body.confirmed !== true) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 400, headers });
  }
  const destination = unsealDestination(body.sealed);
  if (!destination) return Response.json({ error: "INVALID_TOKEN" }, { status: 403, headers });
  return Response.json({ name: destination.reveal.name }, { headers });
}
