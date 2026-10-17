"use client";
import { useEffect, useRef, useState } from "react";
import * as maplibre from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { PublicAdventurePlan } from "@/types/adventure";

export default function RouteMap({ route }: { route: PublicAdventurePlan["route"] }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!container.current) return;
    let map: maplibre.Map | undefined;
    let observer: ResizeObserver | undefined;
    let disposed = false;
    const fail = () => { if (!disposed) setError(true); };
    const timer = setTimeout(fail, 20000);
    try {
      const points = route.geometry;
      if (points.length < 2 || route.geometryKind !== "road") throw new Error("No road geometry");
      maplibre.setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);
      map = new maplibre.Map({ container: container.current, style: "https://tiles.openfreemap.org/styles/liberty", center: [points[0].lng, points[0].lat], zoom: 10 });
      const instance = map;
      instance.addControl(new maplibre.NavigationControl(), "top-right");
      instance.on("error", fail);
      instance.on("load", () => {
        instance.addSource("adventure-route", { type: "geojson", data: {
          type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: points.map(p => [p.lng, p.lat]) },
        } });
        instance.addLayer({ id: "adventure-route", type: "line", source: "adventure-route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#344b33", "line-width": 6 } });
        for (const [point, color, label] of [[points[0], "#b45309", "出発地点"], [points[points.length - 1], "#dc2626", "経路の終点（目的地付近）"]] as const) {
          const marker = new maplibre.Marker({ color }).setLngLat([point.lng, point.lat]).addTo(instance);
          marker.getElement().setAttribute("aria-label", label);
          marker.getElement().setAttribute("title", label);
        }
        const bounds = new maplibre.LngLatBounds();
        points.forEach(p => bounds.extend([p.lng, p.lat]));
        instance.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 });
        clearTimeout(timer);
        setLoaded(true);
      });
      observer = new ResizeObserver(() => instance.resize());
      observer.observe(container.current);
    } catch { queueMicrotask(fail); }
    return () => { disposed = true; clearTimeout(timer); observer?.disconnect(); map?.remove(); };
  }, [route, attempt]);
  return <>
    <div ref={container} role="region" aria-label="取得済みの道路経路マップ" style={{ height: "min(55dvh, 520px)", minHeight: 240, width: "100%", border: "1px solid #344b33", borderRadius: 16, overflow: "hidden" }} />
    {!loaded && !error && <p role="status">地図を読み込んでいます…</p>}
    {error && <div role="alert"><p>地図の一部または全体を読み込めません。通信環境とWebGL対応を確認してください。</p><button type="button" onClick={() => { setError(false); setLoaded(false); setAttempt(n => n + 1); }} className="min-h-12 underline">地図を再読み込み</button></div>}
    <p className="mt-2 text-sm">橙：出発地点 ／ 赤：経路の終点（目的地付近）</p>
  </>;
}
