export const MAP_CONFIRMATIONS = [
  "マップを表示しますか？",
  "本当によろしいですね？",
  "いつも通りの旅に逆戻りしますよ？？",
] as const;
export type MapConfirmationStep = 0 | 1 | 2 | "map";
export function advanceMapConfirmation(step: MapConfirmationStep): MapConfirmationStep {
  return step === 0 ? 1 : step === 1 ? 2 : "map";
}
