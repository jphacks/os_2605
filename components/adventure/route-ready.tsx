"use client";
import { useAdventurePlan } from "./plan-context";
import { ActionLink } from "@/components/ui/action-link";
export function RouteReady() {
  const { plan, setPlan } = useAdventurePlan();
  return <section className="max-w-2xl rounded-3xl border border-[#cbd4ba] bg-white p-6">
    {plan?.route ? <>
      <h2 className="text-xl font-bold">ルートの準備ができました！</h2>
      <p className="my-4">行き先は、まだ秘密です。</p>
      <p>推定{Math.round(plan.route.durationSeconds / 60)}分・{(plan.route.distanceMeters / 1000).toFixed(1)}km</p>
      <p className="my-4 text-sm">{plan.mode === "demo" ? "デモ用模式図の仮定値です。実道路の経路ではなく、実走行には使えません。" : "経路情報の提供元: Google Maps"}</p>
      <p className="my-4 text-sm">経路情報を保持しています。矢印ナビ・地図表示・音声案内・到着判定は未実装です。</p>
      <button type="button" onClick={() => setPlan(null)} className="my-4 min-h-12 rounded-xl border px-4">準備した経路を破棄</button>
    </> : <p className="mb-6">準備済みの経路はありません。再読み込みすると準備した経路は破棄されます。</p>}
    <ActionLink href="/setup">条件入力へ戻る</ActionLink>
  </section>;
}
