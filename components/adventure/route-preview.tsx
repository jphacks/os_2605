"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Route } from "@/types/adventure";

const OsmMap = dynamic(() => import("./osm-map"), {
  ssr: false,
  loading: () => <p role="status">地図を読み込んでいます…</p>,
});

export function RoutePreview({ route }: { route: Route }) {
  const [visible, setVisible] = useState(true);
  if (route.mapCompatibility !== "openstreetmap" && route.geometryKind !== "schematic") return null;
  const points = route.geometry;
  const minLat = Math.min(...points.map(p => p.lat));
  const minLng = Math.min(...points.map(p => p.lng));
  const latRange = Math.max(...points.map(p => p.lat)) - minLat || 1;
  const lngRange = Math.max(...points.map(p => p.lng)) - minLng || 1;
  const project = (p: (typeof points)[number]) => `${24 + (p.lng - minLng) / lngRange * 272},${176 - (p.lat - minLat) / latRange * 152}`;
  return <div className="my-4">
    <p className="mb-2 text-sm">{visible ? "出発地点と推薦経路を表示しています。青が出発地点、橙が目的地です。" : "推薦経路を開くと、出発地点と目的地の位置を確認できます。"}</p>
    <button type="button" aria-expanded={visible} onClick={() => setVisible(v => !v)} className="min-h-12 rounded-xl border px-4">
      {visible ? "推薦経路を閉じる" : "推薦経路を確認"}
    </button>
    {visible && (route.geometryKind === "schematic" ? <figure className="my-4">
      <svg viewBox="0 0 320 200" role="img" aria-label="デモの推薦経路模式図。青が出発地点、橙が目的地" className="w-full rounded-xl border bg-white">
        <polyline points={points.map(project).join(" ")} fill="none" stroke="#344b33" strokeWidth="4" />
        <circle cx={project(points[0]).split(",")[0]} cy={project(points[0]).split(",")[1]} r="6" fill="#1d4ed8" />
        <circle cx={project(points[points.length - 1]).split(",")[0]} cy={project(points[points.length - 1]).split(",")[1]} r="6" fill="#b45309" />
      </svg>
      <figcaption className="mt-2 text-sm">青：出発地点／橙：目的地。架空データの模式図です。実道路の経路ではなく、実走行には使えません。</figcaption>
    </figure> : <OsmMap origin={route.origin} route={route} />)}
  </div>;
}
