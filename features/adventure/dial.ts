import { DURATION_MAX, DURATION_MIN, DURATION_STEP } from "./setup-options";

/** 02 時間ダイヤルの幾何。1周=120分、真上=0分、時計回り。 */
export const DIAL = { cx: 195, cy: 372, trackRadius: 128, labelRadius: 178, tickInner: 142, minorOuter: 149, majorOuter: 154, ticks: 24, fullTurnMinutes: 120 } as const;

/** 真上を0°、時計回りを正とした角度（0以上360未満）。dx は右、dy は下が正。 */
export function angleFromOffset(dx: number, dy: number): number {
  const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

export function angleOfMinutes(minutes: number): number {
  return (minutes / DIAL.fullTurnMinutes) * 360;
}

/** ダイヤル上の点（座標は小数1桁に丸める）。 */
export function pointOnDial(minutes: number, radius: number) {
  const theta = (angleOfMinutes(minutes) * Math.PI) / 180;
  return { x: DIAL.cx + radius * Math.sin(theta), y: DIAL.cy - radius * Math.cos(theta) };
}

export function clampMinutes(value: number): number {
  const stepped = Math.round(value / DURATION_STEP) * DURATION_STEP;
  return Math.min(DURATION_MAX, Math.max(DURATION_MIN, stepped));
}

/**
 * ダイヤル上の角度を0〜120分（1分刻み）へ変換する。
 * ドラッグ中は上端をまたいで反対側へ飛ばないよう、直前の値に応じて0か120へ寄せる。
 * previous が null（タップ直後）のときはタップした角度を使用する。
 */
export function dialMinutes(angle: number, previous: number | null): number {
  const raw = (angle / 360) * DIAL.fullTurnMinutes;
  const snapped = Math.round(raw / DURATION_STEP) * DURATION_STEP;
  if (snapped < DURATION_MIN) return previous !== null && previous >= 75 ? DURATION_MAX : DURATION_MIN;
  if (previous !== null && previous <= 45 && snapped >= 90) return DURATION_MIN;
  if (previous !== null && previous >= 105 && snapped <= 45) return DURATION_MAX;
  return clampMinutes(snapped);
}
