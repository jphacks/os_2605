import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Coordinates, DestinationCandidate } from "@/types/adventure";

/** Server entry points only. Never import into client components. */
const TTL_MS = 12 * 60 * 60 * 1000;
// 環境変数が未設定の間は、プロセスごとの乱数鍵を使う（再起動・別インスタンスでは開けなくなる）。
const processSecret = randomBytes(32).toString("hex");

function key() {
  return createHash("sha256").update(process.env.ADVENTURE_SEAL_SECRET || processSecret).digest();
}

export type SealedDestination = {
  v: 1;
  expiresAt: number;
  /** 到着判定に使う地点。 */
  arrival: Coordinates;
  /** 到着後にだけ公開する情報。 */
  reveal: {
    name: string;
    category: DestinationCandidate["category"];
    description: string;
    imageUrl: string;
    sourceUrl?: string;
    openingNote?: string;
  };
};

export function sealDestination(destination: DestinationCandidate, now = Date.now()): string {
  const payload: SealedDestination = {
    v: 1,
    expiresAt: now + TTL_MS,
    arrival: destination.arrivalLocation ?? destination.location,
    reveal: {
      name: destination.name,
      category: destination.category,
      description: destination.description,
      imageUrl: destination.imageUrl,
      sourceUrl: destination.sourceUrl,
      openingNote: destination.openingInfo.note,
    },
  };
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function unsealDestination(token: unknown, now = Date.now()): SealedDestination | null {
  if (typeof token !== "string" || token.length < 40 || token.length > 8_000) return null;
  try {
    const data = Buffer.from(token, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    const text = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
    const payload = JSON.parse(text) as SealedDestination;
    return payload.v === 1 && payload.expiresAt > now ? payload : null;
  } catch {
    return null;
  }
}
