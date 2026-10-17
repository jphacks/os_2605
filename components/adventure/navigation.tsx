"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinates, LocationSample, NavigationViewMode, Route } from "@/types/adventure";
import { ArrivalDetector, NavigationEngine } from "@/lib/navigation/engine";
import { NAVIGATION_CONFIG } from "@/config/navigation";
import { GPSLocationProvider, type LocationProvider } from "@/lib/navigation/location-provider";
import { createAnnouncement, SpeechService } from "@/lib/speech";
import { RouteMapView } from "./route-map-view";

type Props = { route: Route; arrivalLocation?: Coordinates; onArrived: () => void; onStop: () => void };
const arrows = { STRAIGHT: "↑", TURN_LEFT: "←", TURN_RIGHT: "→", SLIGHT_LEFT: "↖", SLIGHT_RIGHT: "↗", UTURN: "↶", ARRIVE: "◎", OTHER: "◇" };
function distanceLabel(distance: number) {
  if (distance <= 30) return "まもなく";
  if (distance < 1_000) return `${Math.max(10, Math.round(distance / 10) * 10)}m先`;
  return `${(distance / 1_000).toFixed(1)}km先`;
}
function unusableLocationMessage(sample: LocationSample, now: number) {
  const ageMs = now - sample.timestamp;
  if (!Number.isFinite(sample.accuracy) || sample.accuracy < 0) return "GPSの精度情報を確認できません。安全な場所で位置情報を再取得してください。";
  if (sample.accuracy > NAVIGATION_CONFIG.maxAccuracyMeters) return `GPS精度が約${Math.round(sample.accuracy)}mのため案内を開始できません。${NAVIGATION_CONFIG.maxAccuracyMeters}m以内になるまで、安全な場所でお待ちください。`;
  if (ageMs < 0 || ageMs > NAVIGATION_CONFIG.maxLocationAgeMs) return `位置情報が約${Math.max(0, Math.round(ageMs / 1_000))}秒前のため案内に使用できません。新しい位置情報を待っています。`;
  return "GPS座標または経路データを案内に使用できません。安全な場所で地図を確認してください。";
}
export function Navigation({ route, arrivalLocation = route.destination, onArrived, onStop }: Props) {
  const [voice, setVoice] = useState(false);
  const [viewMode, setViewMode] = useState<NavigationViewMode>("adventure");
  const [showMapWarning, setShowMapWarning] = useState(false);
  const [mapAllowed, setMapAllowed] = useState(false);
  const [location, setLocation] = useState<LocationSample | null>(null);
  const [guidance, setGuidance] = useState<ReturnType<NavigationEngine["update"]>>(null);
  const [error, setError] = useState("");
  const providerRef = useRef<LocationProvider | null>(null);
  const [speech] = useState(() => new SpeechService());

  useEffect(() => {
    const engine = new NavigationEngine(route), detector = new ArrivalDetector(), provider = new GPSLocationProvider();
    providerRef.current = provider;
    let completed = false;
    provider.start((sample) => {
      if (completed) return;
      setLocation(sample);
      const now = Date.now(), next = engine.update(sample, now), arrived = detector.update(sample, arrivalLocation, now);
      if (!next) { setGuidance(null); setError(unusableLocationMessage(sample, now)); speech.cancel(); return; }
      if (next.status === "off-route") { setError("経路から外れている可能性があります。案内を停止しました。安全な場所に停車して地図を確認してください。"); speech.cancel(); }
      else { setError(""); speech.announce(createAnnouncement(route.id, next)); }
      setGuidance(next);
      if (arrived) { completed = true; provider.stop(); speech.cancel(); onArrived(); }
    }, (providerError) => { setGuidance(null); setError(`${providerError.message} 許可とHTTPS接続を確認してください。`); speech.cancel(); });
    return () => { completed = true; provider.stop(); providerRef.current = null; speech.dispose(); };
  }, [arrivalLocation, onArrived, route, speech]);

  const stop = useCallback(() => { providerRef.current?.stop(); speech.dispose(); onStop(); }, [onStop, speech]);
  const toggleVoice = () => {
    const enabled = speech.setEnabled(!voice); setVoice(enabled);
    if (!enabled && !speech.isSupported()) setError("このブラウザでは音声案内を利用できません。画面の案内を確認してください。");
  };
  const requestMap = () => { if (mapAllowed) setViewMode("map"); else setShowMapWarning(true); };

  return <section className="my-6 space-y-5" aria-live="polite">
    <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{viewMode === "adventure" ? "ADVENTURE" : "ROUTE MAP"}</h2><span className="rounded-full bg-[#e7ecd9] px-3 py-1 text-xs">目的地：？？？</span></div>
    {viewMode === "adventure" && <>
      {guidance?.status === "navigating" ? <div className="py-4 text-center"><p className="text-8xl leading-none" aria-hidden="true">{arrows[guidance.step.maneuver]}</p><p className="mt-6 text-2xl font-bold">{distanceLabel(guidance.distanceToStepMeters)}、{guidance.step.instruction}</p><p className="mt-4">残り約{Math.ceil(guidance.remainingDurationSeconds / 60)}分</p></div> : <p>{guidance?.status === "off-route" ? "案内を一時停止しています。" : "現在地を取得しています…"}</p>}
      <button type="button" onClick={requestMap} className="min-h-12 rounded-xl border px-4">ルートを確認</button>
    </>}
    {mapAllowed && <div hidden={viewMode !== "map"}><RouteMapView route={route} currentLocation={location ?? undefined} />{guidance && <p>{distanceLabel(guidance.distanceToStepMeters)}、{guidance.step.instruction}</p>}<button type="button" onClick={() => setViewMode("adventure")} className="min-h-12 rounded-xl border px-4">冒険に戻る</button></div>}
    {showMapWarning && <div role="dialog" aria-modal="true" aria-labelledby="route-warning-title" className="rounded-2xl border-2 border-[#b85a24] bg-white p-5"><h3 id="route-warning-title" className="font-bold">ルートを表示しますか？</h3><p className="my-3">ルート全体を表示すると、目的地の位置が分かる可能性があります。安全な場所に停車してから確認してください。</p><div className="flex flex-wrap gap-3"><button type="button" onClick={() => { setMapAllowed(true); setShowMapWarning(false); setViewMode("map"); }} className="min-h-12 rounded-xl bg-[#344b33] px-4 text-white">ルートを表示する</button><button type="button" onClick={() => setShowMapWarning(false)} className="min-h-12 rounded-xl border px-4">冒険を続ける</button></div></div>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{error}</p>}
    <div className="flex flex-wrap gap-3"><button type="button" aria-pressed={voice} onClick={toggleVoice} className="min-h-12 rounded-xl border px-4">{voice ? "🔊 音声ON" : "🔇 音声OFF"}</button><button type="button" onClick={stop} className="min-h-12 rounded-xl border px-4">冒険を中断する</button></div>
    <p className="text-sm">音声はWeb Speech API対応ブラウザで利用できます。バックグラウンド再生は保証されません。</p>
    <p className="text-sm">ナビ案内はGPS精度{NAVIGATION_CONFIG.maxAccuracyMeters}m以内・測位{NAVIGATION_CONFIG.maxLocationAgeMs / 1_000}秒以内で開始します。到着判定は誤判定防止のためGPS精度50m以内で行います。</p>
  </section>;
}
