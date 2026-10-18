"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdventure } from "@/components/adventure/plan-context";
import { MessageScreen } from "@/components/screens/message-screen";
import { RouteMapDialog } from "@/components/adventure/route-map-dialog";
import { RidingScreen } from "@/components/screens/riding-screen";
import {
  ARRIVAL_REQUEST_INTERVAL_MS,
  NAVIGATION_CONFIG,
} from "@/config/navigation";
import { checkArrivalRemote } from "@/features/adventure/client";
import { toRidingView } from "@/features/adventure/ride-view";
import {
  NavigationEngine,
  type ArrivalState,
  type NavigationGuidance,
} from "@/lib/navigation/engine";
import { GPSLocationProvider } from "@/lib/navigation/location-provider";
import { getSpeechService } from "@/lib/speech-instance";
import type { LocationSample, PublicAdventurePlan } from "@/types/adventure";

function unusableLocationMessage(sample: LocationSample, now: number) {
  const ageMs = now - sample.timestamp;
  if (!Number.isFinite(sample.accuracy) || sample.accuracy < 0) {
    return "GPSの精度情報を確認できません。安全な場所で位置情報を再取得してください。";
  }
  if (sample.accuracy > NAVIGATION_CONFIG.maxAccuracyMeters) {
    return `GPS精度が約${Math.round(sample.accuracy)}mのため案内を開始できません。安全な場所でお待ちください。`;
  }
  if (ageMs < 0 || ageMs > NAVIGATION_CONFIG.maxLocationAgeMs) {
    return "位置情報が古いため案内に使用できません。新しい位置情報を待っています。";
  }
  return "GPS座標または経路データを案内に使用できません。安全な場所で停車してください。";
}

function Ride({ plan }: { plan: PublicAdventurePlan }) {
  const { setPlan, setRevealed } = useAdventure();
  const router = useRouter();
  const [mapOpen, setMapOpen] = useState(false);
  const [guidance, setGuidance] = useState<NavigationGuidance | null>(null);
  const [notice, setNotice] = useState<string | null>("現在地を取得しています…");
  // 音声案内は初期ON（非対応のブラウザでは自動的にOFF）。04の「出発」のタップで最初の発話をした同じものを使う。
  const [speech] = useState(() => getSpeechService());
  const [voiceOn, setVoiceOn] = useState(() => speech.isEnabled());

  useEffect(() => {
    const engine = new NavigationEngine(plan.route);
    const provider = new GPSLocationProvider();
    let done = false;
    let inFlight = false;
    let lastSent = 0;
    let arrival: ArrivalState | undefined;
    provider.start(
      (sample) => {
        if (done) return;
        const now = Date.now();
        const next = engine.update(sample, now);
        if (!next) {
          setGuidance(null);
          setNotice(unusableLocationMessage(sample, now));
          speech.cancel();
        } else if (next.status === "off-route") {
          setGuidance(next);
          setNotice("経路から外れている可能性があります。案内を停止しました。安全な場所に停車してください。");
          speech.cancel();
        } else {
          setGuidance(next);
          setNotice(null);
          speech.announceGuidance(plan.route.id, next);
        }
        // 目的地の座標は持たないため、到着の確認はサーバーに任せる。
        if (inFlight || now - lastSent < ARRIVAL_REQUEST_INTERVAL_MS) return;
        inFlight = true;
        lastSent = now;
        void checkArrivalRemote(plan.sealedDestination, sample, arrival)
          .then((result) => {
            if (done) return;
            if (!result.ok) {
              if (result.invalidToken) {
                setNotice("到着を確認できません。冒険を中断して、もう一度やり直してください。");
              }
              return;
            }
            arrival = result.state;
            if (result.destination) {
              done = true;
              provider.stop();
              speech.cancel();
              setRevealed(result.destination);
              router.replace("/arrived");
            }
          })
          .finally(() => {
            inFlight = false;
          });
      },
      (error) => {
        setGuidance(null);
        setNotice(`${error.message} 許可とHTTPS接続を確認してください。`);
        speech.cancel();
      },
    );
    return () => {
      done = true;
      provider.stop();
      speech.reset();
    };
  }, [plan, speech, router, setRevealed]);

  function toggleVoice() {
    const enabled = speech.setEnabled(!voiceOn);
    setVoiceOn(enabled);
    // ONにした操作の中で、今の案内をもう一度読む。
    if (enabled && guidance) speech.replay(plan.route.id, guidance);
    if (!enabled && !speech.isSupported()) {
      setNotice("このブラウザでは音声案内を利用できません。画面の案内を確認してください。");
    }
  }
  function stop() {
    speech.reset();
    setPlan(null);
    setRevealed(null);
    router.replace("/");
  }

  return (
    <>
    <RidingScreen
      view={toRidingView(guidance, plan.route.distanceMeters, notice)}
      voiceOn={voiceOn}
      onVoice={toggleVoice}
      onStop={stop}
      onMap={() => setMapOpen(true)}
    />
    {mapOpen && <RouteMapDialog sealedDestination={plan.sealedDestination} route={plan.route} onClose={() => setMapOpen(false)} />}
    </>
  );
}

export function RideFlow() {
  const { plan } = useAdventure();
  if (!plan) {
    return (
      <MessageScreen
        title="冒険がまだ準備されていません"
        primary={{ label: "時間を決める", href: "/setup" }}
      >
        再読み込みすると、準備した冒険は終了します。時間を決め直してください。
      </MessageScreen>
    );
  }
  return <Ride plan={plan} />;
}
