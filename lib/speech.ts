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
export type Announcement = { id: string; text: string; phase: "early" | "near" };
const directions: Partial<Record<Maneuver, string>> = {
  TURN_RIGHT: "右方向です", TURN_LEFT: "左方向です", SLIGHT_RIGHT: "やや右方向です", SLIGHT_LEFT: "やや左方向です",
  UTURN: "安全な場所でUターンしてください", STRAIGHT: "このまま直進してください",
};
export function createAnnouncement(routeId: string, guidance: NavigationGuidance): Announcement | null {
  if (guidance.status !== "navigating") return null;
  const direction = directions[guidance.step.maneuver], distance = guidance.distanceToStepMeters;
  if (!direction || distance > NAVIGATION_CONFIG.voiceEarlyMeters) return null;
  const phase = distance <= NAVIGATION_CONFIG.voiceNearMeters ? "near" : "early";
  const prefix = phase === "near" ? (guidance.step.maneuver === "STRAIGHT" ? "" : "まもなく、") : `${Math.max(10, Math.round(distance / 10) * 10)}メートル先、`;
  return { id: `${routeId}:${guidance.step.id}:${phase}`, text: `${prefix}${direction}`, phase };
}
export class SpeechService {
  private enabled = false;
  private announced = new Set<string>();
  constructor(private readonly backend: SpeechBackend = browserBackend()) {}
  isSupported() { return this.backend.isSupported(); }
  setEnabled(enabled: boolean) { this.enabled = enabled && this.isSupported(); if (!this.enabled) this.cancel(); return this.enabled; }
  announce(value: Announcement | null) {
    if (!this.enabled || !value || this.announced.has(value.id)) return false;
    this.announced.add(value.id); this.backend.speak(value.text.replace(/<[^>]*>/g, "")); return true;
  }
  cancel() { this.backend.cancel(); }
  dispose() { this.cancel(); this.enabled = false; this.announced.clear(); }
}
