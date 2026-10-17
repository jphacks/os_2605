"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_ORIGINS } from "@/config/origins";
import { useAdventurePlan } from "./plan-context";
import type { Category, DurationMinutes, VehicleType } from "@/types/adventure";
import {
  vehicleOptions,
  durationOptions,
  categoryOptions,
} from "@/features/adventure/setup-options";
import { ChoiceGroup } from "./choice-group";
export function SetupForm() {
  const [vehicle, setVehicle] = useState<VehicleType | null>(null);
  const [duration, setDuration] = useState<DurationMinutes | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const { plan, setPlan } = useAdventurePlan();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function prepare() {
    if (!vehicle || !duration || !category || pending) return;
    setPlan(null); setError(""); setPending(true);
    try {
      const response = await fetch("/api/adventures", { method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "demo", settings: { vehicleType: vehicle, durationMinutes: duration, category, origin: DEMO_ORIGINS[0].location } }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error?.message ?? "経路取得に失敗しました。"); return; }
      setPlan(result.plan);
    } catch { setError("通信できませんでした。再試行してください。"); }
    finally { setPending(false); }
  }
  function change() { setPlan(null); setError(""); }
  return (
    <form
      onSubmit={(event) => { event.preventDefault(); void prepare(); }}
      className="max-w-2xl space-y-8"
    >
      <ChoiceGroup
        legend="01　何で出かける？"
        name="vehicle"
        options={vehicleOptions}
        value={vehicle}
        onChange={(value) => { setVehicle(value); change(); }}
        disabled={pending}
      />
      <ChoiceGroup
        legend="02　どのくらい走る？（片道の目安）"
        name="duration"
        options={durationOptions}
        value={duration}
        onChange={(value) => { setDuration(value); change(); }}
        disabled={pending}
      />
      <ChoiceGroup
        legend="03　どんな場所に出会いたい？"
        name="category"
        options={categoryOptions}
        value={category}
        onChange={(value) => { setCategory(value); change(); }}
        disabled={pending}
      />
      <div className="rounded-2xl bg-[#e7ecd9] p-5">
        <p className="text-sm leading-7">デモ用の模式図です。実際の道路経路ではなく、実走行には使えません。バイクの排気量別通行制限は未対応です。</p>
        <p id="setup-status" role="status" className="text-sm leading-7">
          {pending ? "経路を取得しています…" : plan?.route ? "✅ ルートの準備ができました！ 行き先は、まだ秘密です。" : "条件を選び、経路を準備してください。"}
        </p>
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        {plan?.route && <p className="text-sm">推定{Math.round(plan.route.durationSeconds / 60)}分・{(plan.route.distanceMeters / 1000).toFixed(1)}km（デモ仮定値）</p>}
        <button type="submit" disabled={pending || !vehicle || !duration || !category}
          className="mt-4 min-h-12 w-full rounded-xl bg-[#344b33] px-5 py-4 font-bold text-white disabled:opacity-50">
          {pending ? "取得中…" : "目的地と経路を準備"}
        </button>
        {plan?.route && <button type="button" onClick={() => router.push("/adventure")}
          className="mt-3 min-h-12 w-full rounded-xl border px-5 py-4 font-bold">冒険開始（準備した経路を確認）</button>}
      </div>
    </form>
  );
}
