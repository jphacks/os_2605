import type { AdventureApiErrorCode } from "./api-types";

export type FlowErrorCode =
  | AdventureApiErrorCode
  | "NETWORK_ERROR"
  | "STORAGE_UNAVAILABLE"
  | "INVALID_RESPONSE";

const noMatch = "条件に合う目的地が見つかりませんでした";

const messages: Record<FlowErrorCode, { title: string; hint: string }> = {
  NO_ACTIVE_SPOTS: { title: noMatch, hint: "時間やジャンルを変えてお試しください。" },
  NO_CATEGORY_MATCH: { title: noMatch, hint: "ジャンルを変えてお試しください。" },
  NO_VEHICLE_MATCH: { title: noMatch, hint: "乗り物かジャンルを変えてお試しください。" },
  NO_DURATION_MATCH: { title: noMatch, hint: "片道の時間かジャンルを変えてお試しください。" },
  NO_VERIFIED_ACCESS: { title: noMatch, hint: "時間やジャンルを変えてお試しください。" },
  INVALID_SETTINGS: { title: "条件が正しくありません", hint: "条件を選び直してください。" },
  INVALID_REQUEST: { title: "条件が正しくありません", hint: "条件を選び直してください。" },
  UNKNOWN_ORIGIN: { title: "出発地点を設定できませんでした", hint: "条件を選び直してください。" },
  UNSUPPORTED_MODE: { title: "この出発方法は未実装です", hint: "現在はデモ用の固定出発地点のみ利用できます。" },
  DATA_EMPTY: { title: "目的地データがありません", hint: "時間をおいて再度お試しください。" },
  DATA_INVALID: { title: "目的地データを読み込めませんでした", hint: "時間をおいて再度お試しください。" },
  INTERNAL_ERROR: { title: "目的地を決められませんでした", hint: "時間をおいて再度お試しください。" },
  NETWORK_ERROR: { title: "通信に失敗しました", hint: "接続を確認して、もう一度お試しください。" },
  INVALID_RESPONSE: { title: "目的地を決められませんでした", hint: "もう一度お試しください。" },
  STORAGE_UNAVAILABLE: {
    title: "このブラウザでは結果を保存できません",
    hint: "プライベートモードやストレージの設定を確認してください。",
  },
};

export function errorMessage(code: FlowErrorCode) {
  return messages[code];
}

/** 条件を変えれば解決しうるエラー。 */
export function isNoMatchError(code: FlowErrorCode): boolean {
  return code.startsWith("NO_");
}

export function isFlowErrorCode(value: unknown): value is FlowErrorCode {
  return typeof value === "string" && Object.hasOwn(messages, value);
}
