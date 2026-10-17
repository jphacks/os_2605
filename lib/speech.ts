import { NAVIGATION_CONFIG } from "@/config/navigation";
import type { Maneuver } from "@/types/adventure";
import type { NavigationGuidance } from "@/lib/navigation/engine";

export type SpeechBackend = { isSupported(): boolean; speak(text: string): void; cancel(): void };
function browserBackend(): SpeechBackend {
  return {
    isSupported: () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    speak(text) {
      if (!this.isSupported()) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP"; utterance.rate = 1;
      const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("ja"));
      if (voice) utterance.voice = voice;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
    },
    cancel() { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); },
  };
}
export type Announcement = { id: string; text: string; phase: "start" | "early" | "near" };

/** 読み上げる向き。「100メートル直進です」「140メートル先、右折です」の形にする。 */
const directions: Partial<Record<Maneuver, string>> = {
  TURN_RIGHT: "右折です", TURN_LEFT: "左折です", SLIGHT_RIGHT: "やや右方向です", SLIGHT_LEFT: "やや左方向です",
  UTURN: "安全な場所でUターンしてください", STRAIGHT: "直進です",
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
 * 末尾ほど緊急度が高い。ARRIVE と OTHER は読み上げない。
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
export class SpeechService {
  private enabled = false;
  private announced = new Set<string>();
  constructor(private readonly backend: SpeechBackend = browserBackend()) {}
  isSupported() { return this.backend.isSupported(); }
  isEnabled() { return this.enabled; }
  setEnabled(enabled: boolean) { this.enabled = enabled && this.isSupported(); if (!this.enabled) this.cancel(); return this.enabled; }
  announce(value: Announcement | null) {
    if (!this.enabled || !value || this.announced.has(value.id)) return false;
    this.announced.add(value.id); this.backend.speak(value.text.replace(/<[^>]*>/g, "")); return true;
  }
  /**
   * 案内が切り替わるたびに1回だけ読み上げる。当てはまる段階のうち未読があれば、最も緊急度の高い文言を読み、
   * 当てはまる段階をすべて読み上げ済みにする（表示と同時に start と early を二重に話さない）。
   */
  announceGuidance(routeId: string, guidance: NavigationGuidance) {
    const due = createAnnouncements(routeId, guidance);
    if (!this.enabled || !due.length || due.every((item) => this.announced.has(item.id))) return false;
    const latest = due[due.length - 1];
    const stale = due.slice(0, -1);
    stale.forEach((item) => this.announced.add(item.id));
    return this.announce(latest);
  }
  cancel() { this.backend.cancel(); }
  /** 画面の切り替えなど。読み上げを止めて読み上げ済みを忘れる。ON/OFFは変えない。 */
  reset() { this.cancel(); this.announced.clear(); }
  dispose() { this.reset(); this.enabled = false; }
}
