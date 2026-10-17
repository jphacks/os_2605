"use client";
import { useEffect, useRef, useState } from "react";
import type { Route } from "@/types/adventure";
import { ArrivalDetector, NavigationEngine } from "@/lib/navigation/engine";

export function Navigation({ route, onArrived, onStop }: { route: Route; onArrived: () => void; onStop: () => void }) {
  const [voice, setVoice] = useState(false);
  const voiceRef = useRef(false);
  const [guidance, setGuidance] = useState<ReturnType<NavigationEngine["update"]>>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const engine = new NavigationEngine(route), detector = new ArrivalDetector();
    let spoken = "";
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(position => {
      const sample = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, timestamp: position.timestamp };
      const next = engine.update(sample);
      const arrived = detector.update(sample, route.destination);
      if (!next) { setGuidance(null); setError("GPS精度が不足しています。位置情報の回復を待っています。"); return; }
      setError(""); setGuidance(next);
      if (arrived) { onArrived(); return; }
      if (voiceRef.current && next.distance <= 150 && spoken !== next.step.id && "speechSynthesis" in window) {
        spoken = next.step.id;
        const utterance = new SpeechSynthesisUtterance(`およそ${next.distance}メートル先、${next.step.instruction}`);
        utterance.lang = "ja-JP";
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
      }
    }, () => { setGuidance(null); setError("現在地を取得できません。位置情報の許可を確認してください。"); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    return () => { navigator.geolocation.clearWatch(id); if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, [route, onArrived]);
  const arrows = { STRAIGHT: "↑", TURN_LEFT: "←", TURN_RIGHT: "→", SLIGHT_LEFT: "↖", SLIGHT_RIGHT: "↗", UTURN: "↶", ARRIVE: "◎", OTHER: "◇" };
  return <section className="my-6 space-y-4" aria-live="polite">
    <h2 className="text-xl font-bold">ナビゲーション</h2>
    {guidance ? <><p className="text-7xl" aria-hidden="true">{arrows[guidance.step.maneuver]}</p><p>{guidance.distance}m先：{guidance.step.instruction}</p><p className="text-sm">距離は案内地点までの直線距離です。</p></> : <p>現在地を取得しています…</p>}
    {error && <p role="alert">{error}</p>}
    <button type="button" aria-pressed={voice} onClick={() => { voiceRef.current = !voice; setVoice(!voice); if (voice && "speechSynthesis" in window) window.speechSynthesis.cancel(); }} className="min-h-12 rounded-xl border px-4">音声案内 {voice ? "ON" : "OFF"}</button>
    <p className="text-sm">音声案内はWeb Speech API対応ブラウザで利用できます。</p>
    <button type="button" onClick={onStop} className="min-h-12 rounded-xl border px-4">ナビを終了</button>
  </section>;
}
