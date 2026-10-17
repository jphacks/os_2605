"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "./navigation";
import { useAdventurePlan } from "./plan-context";
import { ActionLink } from "@/components/ui/action-link";

export function RouteReady() {
  const { plan, setPlan } = useAdventurePlan();
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
  }, []);

  const start = () => {
    if (!plan?.route) return;
    setPlan({ ...plan, status: "navigating" });
    setNavigating(true);
  };
  const stop = () => {
    if (plan) setPlan({ ...plan, status: "cancelled" });
    setNavigating(false);
  };
  const arrive = useCallback(() => {
    if (!plan) return;
    setNavigating(false);
    setPlan({ ...plan, status: "arrived" });
    revealTimer.current = setTimeout(() => {
      setPlan({ ...plan, status: "revealed" });
      router.replace("/arrived");
    }, 500);
  }, [plan, router, setPlan]);

  return <section className="max-w-2xl rounded-3xl border border-[#cbd4ba] bg-white p-6">
    {plan?.route ? <>
      <h2 className="text-xl font-bold">ルートの準備ができました！</h2>
      <p className="my-4">行き先は、到着まで秘密です。</p>
      <p>推定{Math.round(plan.route.durationSeconds / 60)}分・{(plan.route.distanceMeters / 1000).toFixed(1)}km</p>
      <p className="my-4 text-sm"><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> · 経路: OSRM / FOSSGIS · 渋滞非反映</p>
      {plan.status === "arrived" ? <p role="status" className="my-5 rounded-xl bg-[#e7ecd9] p-4 font-bold">到着を確認しました。目的地を公開します…</p>
        : navigating ? <Navigation route={plan.route} arrivalLocation={plan.destination?.arrivalLocation} onArrived={arrive} onStop={stop} />
        : <button type="button" className="my-4 min-h-12 rounded-xl bg-[#344b33] px-5 text-white" onClick={start}>GPSナビを開始</button>}
      <p className="my-4 text-sm leading-6">GPSナビはブラウザを開いている間に利用できます。到着判定は目的地から50m以内・GPS精度50m以内の新しい測位が2回連続した場合に行います。</p>
      {!navigating && plan.status !== "arrived" && <button type="button" onClick={() => setPlan(null)} className="my-4 min-h-12 rounded-xl border px-4">準備した経路を破棄</button>}
    </> : <p className="mb-6">準備済みの経路はありません。再読み込みすると準備した経路は破棄されます。</p>}
    {!navigating && plan?.status !== "arrived" && <ActionLink href="/setup">条件入力へ戻る</ActionLink>}
  </section>;
}
