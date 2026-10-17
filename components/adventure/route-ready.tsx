"use client";
import { useCallback, useState } from "react";
import { Navigation } from "./navigation";
import { useAdventurePlan } from "./plan-context";
import { ActionLink } from "@/components/ui/action-link";
import { RoutePreview } from "./route-preview";
export function RouteReady() {
  const { plan, setPlan } = useAdventurePlan();
  const [navigating, setNavigating] = useState(false);
  const arrive = useCallback(() => { if (plan) { setPlan({ ...plan, status: "arrived" }); setNavigating(false); } }, [plan, setPlan]);
  return <section className="max-w-2xl rounded-3xl border border-[#cbd4ba] bg-white p-6">
    {plan?.route ? <>
      <h2 className="text-xl font-bold">ルートの準備ができました！</h2>
      <p className="my-4">行き先は、まだ秘密です。</p>
      <p>推定{Math.round(plan.route.durationSeconds / 60)}分・{(plan.route.distanceMeters / 1000).toFixed(1)}km</p>
      <p className="my-4 text-sm">{plan.mode === "demo" ? "デモ用模式図の仮定値です。実道路の経路ではなく、実走行には使えません。" : plan.route.provider === "osrm" ? <><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> · 経路: OSRM / FOSSGIS · <a href="https://www.openstreetmap.org/fixthemap">地図の修正</a></> : "経路情報の提供元: Google Maps"}</p>
      {plan.status === "arrived" ? <div role="status" className="my-4"><h2 className="text-xl font-bold">目的地に到着しました！</h2><h3>{plan.destination?.name}</h3><p>{plan.destination?.description}</p>{plan.destination?.sourceUrl && <a href={plan.destination.sourceUrl} className="underline">観光地の公式案内</a>}</div> : navigating ? <Navigation route={plan.route} onArrived={arrive} onStop={() => setNavigating(false)} /> : plan.mode === "live" ? <button type="button" className="my-4 min-h-12 rounded-xl border px-4" onClick={() => setNavigating(true)}>GPSナビを開始</button> : <p>デモのGPSナビは未対応です。</p>}
      <RoutePreview key={plan.adventureId} route={plan.route} />
      <p className="my-4 text-sm">GPSナビはブラウザを開いている間に利用できます。到着判定は目的地付近35m以内・GPS精度50m以内の測位が5秒以上続いた場合に行います。</p>
      <button type="button" onClick={() => setPlan(null)} className="my-4 min-h-12 rounded-xl border px-4">準備した経路を破棄</button>
    </> : <p className="mb-6">準備済みの経路はありません。再読み込みすると準備した経路は破棄されます。</p>}
    <ActionLink href="/setup">条件入力へ戻る</ActionLink>
  </section>;
}
