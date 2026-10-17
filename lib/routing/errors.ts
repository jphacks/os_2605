export const ROUTING_MESSAGES = {
  PLACES_TIMEOUT: "場所の検索サーバーが混雑しています。少し待って再試行するか、時間を変えてください。",
  PLACES_CONFIG: "場所の検索サービスの接続先設定を確認してください。",
  NO_PLACES: "周辺に条件に合う場所が見つかりません。時間を変えて、もう一度お試しください。",
  INVALID_INPUT: "出発地点・車両・モードなどの入力を確認してください。",
  UNKNOWN_DESTINATION: "登録された目的地が見つかりません。もう一度お試しください。",
  UNSUPPORTED_VEHICLE: "この乗り物の実道路経路には対応していません。",
  UNVERIFIED_DESTINATION: "条件に合う利用可能な目的地を確認できませんでした。時間を変えてください。",
  API_KEY_MISSING: "経路サービスが未設定です。管理者にお問い合わせください。",
  NO_ROUTE: "この出発地点と目的地に対応する経路がありません。時間を変えてください。",
  AUTH_ERROR: "経路サービスの認証に失敗しました。",
  RATE_LIMITED: "経路サービスの利用上限です。時間をおいて再試行してください。",
  TIMEOUT: "経路取得がタイムアウトしました。再試行してください。",
  NETWORK_ERROR: "経路サービスに接続できませんでした。再試行してください。",
  MISSING_INSTRUCTIONS: "安全に案内するための情報が不足しています。",
  INVALID_ROUTE: "経路データを確認できませんでした。",
  NO_DURATION_MATCH: "確認した候補に指定時間±15分の経路がありません。時間を変えて、もう一度お試しください。",
  INTERNAL_ERROR: "経路の準備に失敗しました。再試行してください。",
} as const;
export type RoutingErrorCode = keyof typeof ROUTING_MESSAGES;
export class RoutingError extends Error {
  constructor(public code: RoutingErrorCode, public status = 422) {
    super(ROUTING_MESSAGES[code]);
  }
}
export function routingErrorResponse(error: unknown): Response {
  const safe = error instanceof RoutingError ? error : new RoutingError("INTERNAL_ERROR", 500);
  return Response.json({ error: { code: safe.code, message: safe.message } }, {
    status: safe.status, headers: { "Cache-Control": "no-store" },
  });
}
