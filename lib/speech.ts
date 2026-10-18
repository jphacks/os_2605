import { NAVIGATION_CONFIG } from "@/config/navigation";
import type { Maneuver } from "@/types/adventure";
import type { NavigationGuidance } from "@/lib/navigation/engine";

export type SpeakOptions = {
  /** 読み上げ中の音声を止めてから読む。既定はtrue。 */
  interrupt?: boolean;
  /** 読み上げに失敗したとき（自動再生の制限・音声の不在など）。中断・キャンセルでは呼ばない。 */
  onError?: (reason: string) => void;
};
export type SpeechBackend = { isSupported(): boolean; speak(text: string, options?: SpeakOptions): void; cancel(): void };

/** cancel() の直後に speak() すると、Chrome で最初の発話が捨てられることがあるため少し待つ。 */
const AFTER_CANCEL_DELAY_MS = 60;
/** 発話オブジェクトは終了までブラウザが保持しないことがあり、参照を失うと発話が途切れるため保持しておく。 */
const live = new Set<SpeechSynthesisUtterance>();

export function createBrowserBackend(): SpeechBackend {
  const supported = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  return {
    isSupported: supported,
    speak(text, { interrupt = true, onError } = {}) {
      if (!supported()) return;
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP"; utterance.rate = 1;
      const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith("ja"));
      if (voice) utterance.voice = voice;
      live.add(utterance);
      utterance.onend = () => { live.delete(utterance); };
      utterance.onerror = (event) => {
        live.delete(utterance);
        const reason = (event as { error?: string }).error ?? "unknown";
        if (reason !== "interrupted" && reason !== "canceled") onError?.(reason);
      };
      // 画面操作の中で呼ばれた最初の発話はその場で、途中の中断が必要なときだけ待ってから読む。
      if (interrupt && (synth.speaking || synth.pending)) {
        synth.cancel();
        setTimeout(() => synth.speak(utterance), AFTER_CANCEL_DELAY_MS);
      } else {
        synth.speak(utterance);
      }
    },
    cancel() {
      if (!supported()) return;
      const synth = window.speechSynthesis;
      if (synth.speaking || synth.pending) synth.cancel();
    },
  };
}

export type Announcement = { id: string; text: string; phase: "start" | "early" | "near" };

/** 読み上げる向き。「100メートル直進です」「140メートル先、右折です」の形にする。ARRIVE は読み上げない。 */
const directions: Partial<Record<Maneuver, string>> = {
  TURN_RIGHT: "右折です", TURN_LEFT: "左折です", SLIGHT_RIGHT: "やや右方向です", SLIGHT_LEFT: "やや左方向です",
  UTURN: "安全な場所でUターンしてください", STRAIGHT: "直進です",
  // 分岐・ロータリーなど向きを一つに決められない案内。最初の案内が無音にならないよう、汎用の文言で知らせる。
  OTHER: "進路に注意してください",
};
/** 画面の距離表示と同じ丸め（10m単位、1km以上はキロ）。 */
export function spokenDistance(meters: number) {
  if (meters < 1_000) return `${Math.max(10, Math.round(meters / 10) * 10)}メートル`;
  return `${(meters / 1_000).toFixed(1).replace(/\.0$/, "")}キロ`;
}
const clamp = (value: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, value));
/**
 * 読み上げる距離。経路の想定速度に合わせ、速い道ほど手前から、遅い道ほど近くで知らせる（曲がり角の約20秒前と約6秒前）。
 * 速度が分からないときは固定の300m・80m。
 */
export function voiceThresholds(speedMetersPerSecond?: number) {
  if (!speedMetersPerSecond || !Number.isFinite(speedMetersPerSecond) || speedMetersPerSecond <= 0) {
    return { early: NAVIGATION_CONFIG.voiceEarlyMeters, near: NAVIGATION_CONFIG.voiceNearMeters };
  }
  return {
    early: Math.round(clamp(speedMetersPerSecond * NAVIGATION_CONFIG.voiceEarlyLeadSeconds, NAVIGATION_CONFIG.voiceEarlyRangeMeters)),
    near: Math.round(clamp(speedMetersPerSecond * NAVIGATION_CONFIG.voiceNearLeadSeconds, NAVIGATION_CONFIG.voiceNearRangeMeters)),
  };
}
/**
 * 次の案内地点が画面に表示された時点（start）と、手前の読み上げ（early、near。距離は経路の想定速度で変わる）を返す。
 * 現在の距離で既に当てはまる段階だけを返すため、150m先で表示された案内は start と early が該当する。
 * 末尾ほど緊急度が高い。ARRIVE は読み上げない。
 */
export function createAnnouncements(routeId: string, guidance: NavigationGuidance): Announcement[] {
  if (guidance.status !== "navigating") return [];
  const maneuver = guidance.step.maneuver, direction = directions[maneuver], distance = guidance.distanceToStepMeters;
  if (!direction) return [];
  const id = (phase: Announcement["phase"]) => `${routeId}:${guidance.step.id}:${phase}`;
  const ahead = maneuver === "STRAIGHT" ? `${spokenDistance(distance)}${direction}` : `${spokenDistance(distance)}先、${direction}`;
  const list: Announcement[] = [{ id: id("start"), text: ahead, phase: "start" }];
  const { early, near } = voiceThresholds(guidance.approachSpeedMetersPerSecond);
  if (distance <= early) list.push({ id: id("early"), text: ahead, phase: "early" });
  if (distance <= near) list.push({ id: id("near"), text: maneuver === "STRAIGHT" ? ahead : `まもなく、${direction}`, phase: "near" });
  return list;
}

/** 発話に失敗した案内を、次の更新で読み直す回数の上限。 */
const MAX_RETRIES = 3;
export const OPENING_PHRASE = "案内を開始します";

export class SpeechService {
  private enabled = false;
  private announced = new Set<string>();
  private failures = new Map<string, number>();
  constructor(private readonly backend: SpeechBackend = createBrowserBackend()) {}
  isSupported() { return this.backend.isSupported(); }
  isEnabled() { return this.enabled; }
  setEnabled(enabled: boolean) { this.enabled = enabled && this.isSupported(); if (!this.enabled) this.cancel(); return this.enabled; }
  /**
   * 最初の発話を、画面操作（「出発」のタップ）の中で行う。iPhoneのSafariなどは、操作の中で一度発話しないと、
   * その後のGPS更新のタイミングでの発話が無音になるため。
   */
  prime(text = OPENING_PHRASE) {
    if (!this.enabled) return false;
    this.backend.speak(text, { interrupt: false });
    return true;
  }
  announce(value: Announcement | null) {
    if (!this.enabled || !value || this.announced.has(value.id)) return false;
    this.announced.add(value.id);
    // 表示時の案内は読み上げ中の音声を切らずに続け、手前の予告だけが割り込む。
    this.backend.speak(value.text.replace(/<[^>]*>/g, ""), { interrupt: value.phase !== "start", onError: () => this.retry(value.id) });
    return true;
  }
  /** 発話に失敗した案内は読み上げ済みにせず、次の更新で（上限まで）読み直す。 */
  private retry(id: string) {
    const count = (this.failures.get(id) ?? 0) + 1;
    this.failures.set(id, count);
    if (count <= MAX_RETRIES) this.announced.delete(id);
  }
  /**
   * 案内が切り替わるたびに1回だけ読み上げる。当てはまる段階のうち未読があれば、最も緊急度の高い文言を読み、
   * 当てはまる段階をすべて読み上げ済みにする（表示と同時に start と early を二重に話さない）。
   */
  announceGuidance(routeId: string, guidance: NavigationGuidance) {
    const due = createAnnouncements(routeId, guidance);
    if (!this.enabled || !due.length || due.every((item) => this.announced.has(item.id))) return false;
    const latest = due[due.length - 1];
    due.slice(0, -1).forEach((item) => this.announced.add(item.id));
    return this.announce(latest);
  }
  /** 音声をONにした直後など、今の案内をもう一度読む（操作の中で呼ぶと自動再生の制限も解ける）。 */
  replay(routeId: string, guidance: NavigationGuidance) {
    for (const item of createAnnouncements(routeId, guidance)) { this.announced.delete(item.id); this.failures.delete(item.id); }
    return this.announceGuidance(routeId, guidance);
  }
  cancel() { this.backend.cancel(); }
  /** 画面の切り替えなど。読み上げを止めて読み上げ済みを忘れる。ON/OFFは変えない。 */
  reset() { this.cancel(); this.announced.clear(); this.failures.clear(); }
  dispose() { this.reset(); this.enabled = false; }
}
