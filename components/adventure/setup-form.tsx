"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { DEMO_ORIGINS } from "@/config/origins";
import { useAdventurePlan } from "./plan-context";
import type { AdventureMode, Coordinates, Category, DurationMinutes, VehicleType } from "@/types/adventure";
import {
  vehicleOptions,
  durationOptions,
  categoryOptions,
} from "@/features/adventure/setup-options";
import { ChoiceGroup } from "./choice-group";
import { RoutePreview } from "./route-preview";
const OsmMap = dynamic(() => import("./osm-map"), {
  ssr: false,
  loading: () => <p role="status">地図を読み込んでいます…</p>,
});
export function SetupForm() {
  const [preview, setPreview] = useState(true);
  const [mode, setMode] = useState<AdventureMode>("live");
  const [vehicle, setVehicle] = useState<VehicleType | null>(null);
  const [duration, setDuration] = useState<DurationMinutes | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const { plan, setPlan } = useAdventurePlan();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function prepare() {
    if (pending) return;
    if (!vehicle || !duration || !category) {
      setError(`${[!vehicle && "乗り物", !duration && "所要時間", !category && "ジャンル"].filter(Boolean).join("・")}を選んでください。`);
      return;
    }
    if (mode === "live" && vehicle === "motorcycle") {
      setError("バイクの実経路は未対応です。「架空データのデモ」に切り替えると推薦経路を確認できます。");
      return;
    }
    setPlan(null); setError(""); setPending(true);
    try {
      let origin: Coordinates = DEMO_ORIGINS[0].location;
      if (mode === "live") {
        if (!navigator.geolocation) { setError("現在地の取得に対応したブラウザを使用してください。"); return; }
        try {
          origin = await new Promise<Coordinates>((resolve, reject) => navigator.geolocation.getCurrentPosition(
            position => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }), reject,
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }));
        } catch { setError("現在地を取得できませんでした。位置情報の許可とHTTPS接続を確認して再試行してください。"); return; }
      }
      const response = await fetch("/api/adventures", { method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, settings: { vehicleType: vehicle, durationMinutes: duration, category, origin } }) });
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
      <ChoiceGroup legend="推薦に使う情報" name="mode" value={mode}
        options={[{ value: "live" as const, label: "実際の地図情報" }, { value: "demo" as const, label: "架空データのデモ" }]}
        onChange={value => { setMode(value); change(); }} disabled={pending} />
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
        {!plan?.route && <><button type="button" aria-expanded={preview} onClick={() => setPreview(v => !v)} className="mb-3 min-h-12 rounded-xl border px-4">{preview ? "地図を閉じる" : "OpenStreetMapを表示"}</button>
        {preview && <><p className="text-sm">中心は固定地点です。経路の準備後は、出発地点と推薦経路を表示します。</p><OsmMap origin={DEMO_ORIGINS[0].location} /></>}</>}
        {mode === "live" && <p className="text-sm"><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> · <a href="https://www.openstreetmap.org/fixthemap">地図の修正</a> · 経路: OSRM / FOSSGIS</p>}
        <p className="text-sm leading-7">{mode === "live" ? "滋賀の実在スポットJSONとOSRMの道路所要時間から推薦します。現在地と目的地をOSRMに送信します。APIキーは不要です。自動車のみ対応。座標は施設付近の目安で、営業時間・駐車場入口・立入条件は未確認です。対応スポットが少ないため、地域・ジャンル・時間によって候補がない場合があります。" : "架空データのデモ用模式図です。実走行には使えません。"}</p>
        {mode === "live" && vehicle === "motorcycle" && <p role="alert" className="text-sm text-red-800">バイクの実経路は未対応です。自動車またはデモを選んでください。</p>}
        <p id="setup-status" role="status" className="text-sm leading-7">
          {pending ? "経路を取得しています…" : plan?.route ? "✅ ルートの準備ができました！ 行き先は、まだ秘密です。" : "条件を選び、経路を準備してください。"}
        </p>
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        {plan?.route && <p className="text-sm">推定{Math.round(plan.route.durationSeconds / 60)}分・{(plan.route.distanceMeters / 1000).toFixed(1)}km（{plan.mode === "live" ? "OpenStreetMap / OSRM・渋滞非反映" : "デモ仮定値"}）</p>}
        {mode === "live" && vehicle === "motorcycle" && <button type="button" disabled={pending} onClick={() => { setMode("demo"); change(); }} className="my-3 min-h-12 rounded-xl border px-4">デモに切り替えて経路を試す</button>}
        <button type="submit" disabled={pending} aria-describedby="setup-status"
          className="mt-4 min-h-12 w-full rounded-xl bg-[#344b33] px-5 py-4 font-bold text-white disabled:opacity-50">
          {pending ? "取得中…" : "目的地と経路を準備"}
        </button>
        {plan?.route && <RoutePreview key={plan.adventureId} route={plan.route} />}
        {plan?.route && <button type="button" onClick={() => router.push("/adventure")}
          className="mt-3 min-h-12 w-full rounded-xl border px-5 py-4 font-bold">冒険開始</button>}
      </div>
    </form>
  );
}
