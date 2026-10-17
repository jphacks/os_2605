"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAdventurePlan } from "./plan-context";
import type { Coordinates, Category, DurationMinutes, VehicleType } from "@/types/adventure";
import { vehicleOptions, durationOptions, categoryOptions } from "@/features/adventure/setup-options";
import { ChoiceGroup } from "./choice-group";

const OsmMap = dynamic(() => import("./osm-map"), {
  ssr: false,
  loading: () => <p role="status">地図を読み込んでいます…</p>,
});

function getCurrentLocation() {
  return new Promise<Coordinates>((resolve, reject) => navigator.geolocation.getCurrentPosition(
    position => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
    reject,
    { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
  ));
}

export function SetupForm() {
  const [vehicle, setVehicle] = useState<VehicleType | null>(null);
  const [duration, setDuration] = useState<DurationMinutes | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const { plan, setPlan } = useAdventurePlan();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [mapLocation, setMapLocation] = useState<Coordinates | null>(null);
  const [mapLocationStatus, setMapLocationStatus] = useState("現在地を取得しています…");

  useEffect(() => {
    if (!navigator.geolocation) {
      queueMicrotask(() => setMapLocationStatus("現在地を取得できないため、日本全体の地図を表示しています。"));
      return;
    }
    void getCurrentLocation().then((location) => {
      setMapLocation(location);
      setMapLocationStatus("現在地を地図に表示しています。");
    }).catch(() => setMapLocationStatus("位置情報が許可されていないため、日本全体の地図を表示しています。"));
  }, []);

  async function prepare() {
    if (pending) return;
    if (!vehicle || !duration || !category) {
      setError(`${[!vehicle && "乗り物", !duration && "所要時間", !category && "ジャンル"].filter(Boolean).join("・")}を選んでください。`);
      return;
    }
    setPlan(null);
    setError("");
    setPending(true);
    try {
      if (!navigator.geolocation) {
        setError("現在地の取得に対応したブラウザを使用してください。");
        return;
      }
      let origin: Coordinates;
      try {
        origin = await getCurrentLocation();
        setMapLocation(origin);
      } catch {
        setError("現在地を取得できませんでした。位置情報の許可とHTTPS接続を確認して再試行してください。");
        return;
      }
      const response = await fetch("/api/adventures", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "live", settings: { vehicleType: vehicle, durationMinutes: duration, category, origin } }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error?.message ?? "経路取得に失敗しました。");
        return;
      }
      setPlan(result.plan);
    } catch {
      setError("通信できませんでした。再試行してください。");
    } finally {
      setPending(false);
    }
  }

  function change() {
    setPlan(null);
    setError("");
  }

  return <form onSubmit={(event) => { event.preventDefault(); void prepare(); }} className="max-w-2xl space-y-8">
    <ChoiceGroup legend="01　何で出かける？" name="vehicle" options={vehicleOptions} value={vehicle} onChange={(value) => { setVehicle(value); change(); }} disabled={pending} />
    <ChoiceGroup legend="02　どのくらい走る？（片道の目安）" name="duration" options={durationOptions} value={duration} onChange={(value) => { setDuration(value); change(); }} disabled={pending} />
    <ChoiceGroup legend="03　どんな場所に出会いたい？" name="category" options={categoryOptions} value={category} onChange={(value) => { setCategory(value); change(); }} disabled={pending} />
    <section aria-labelledby="setup-map-title" className="rounded-2xl border border-[#cbd4ba] bg-white p-4">
      <h2 id="setup-map-title" className="font-bold">現在地のマップ</h2>
      <p className="mt-2 text-sm">{mapLocationStatus}</p>
      <OsmMap currentLocation={mapLocation ?? undefined} centerOnCurrentLocation />
      <p className="text-sm"><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> · <a href="https://openfreemap.org/">OpenFreeMap</a></p>
    </section>
    <div className="rounded-2xl bg-[#e7ecd9] p-5">
      <p className="text-sm leading-7">現在地周辺の実在地点をOpenStreetMapの地点検索サービスから検索し、OSRMの実道路経路で所要時間を確認します。現在地と候補地点は各公開サービスへ送信されます。渋滞、営業時間、駐車場入口、立入条件は保証されません。</p>
      {vehicle === "motorcycle" && <p className="mt-3 text-sm leading-7 text-[#7a451b]">バイクでも利用できますが、経路はOSRMの自動車プロファイルを使用します。二輪車固有の通行規制、排気量区分、二輪通行禁止は反映されないため、道路標識を優先してください。</p>}
      <p id="setup-status" role="status" className="mt-3 text-sm leading-7">{pending ? "実在地点と道路経路を取得しています…" : plan?.route ? "✅ ルートの準備ができました。行き先は、まだ秘密です。" : "条件を選び、経路を準備してください。"}</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
      {plan?.route && <p className="mt-3 text-sm">推定{Math.round(plan.route.durationSeconds / 60)}分・{(plan.route.distanceMeters / 1000).toFixed(1)}km（OpenStreetMap / OSRM・渋滞非反映）</p>}
      <button type="submit" disabled={pending} aria-describedby="setup-status" className="mt-4 min-h-12 w-full rounded-xl bg-[#344b33] px-5 py-4 font-bold text-white disabled:opacity-50">{pending ? "取得中…" : "目的地と実道路経路を準備"}</button>
      {plan?.route && <button type="button" onClick={() => router.push("/adventure")} className="mt-3 min-h-12 w-full rounded-xl border px-5 py-4 font-bold">冒険開始</button>}
    </div>
  </form>;
}
