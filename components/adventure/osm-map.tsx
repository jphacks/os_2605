"use client";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Coordinates, Route } from "@/types/adventure";
export default function OsmMap({ origin, route }: { origin: Coordinates; route?: Route }) {
 const [attempt, setAttempt] = useState(0);
 return <MapCanvas key={attempt} origin={origin} route={route} onRetry={() => setAttempt(value => value + 1)} />;
}
function MapCanvas({ origin, route, onRetry }: { origin: Coordinates; route?: Route; onRetry: () => void }) {
 const container = useRef<HTMLDivElement>(null);
 const [failed, setFailed] = useState(false);
 const [loaded, setLoaded] = useState(false);
 useEffect(() => {
  if (!container.current) return;
  // Bundle the worker as a separate asset; MapLibre's relative default URL
  // does not point to its worker after Next.js bundles the library.
  maplibregl.setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);
  let map: maplibregl.Map;
  try { map = new maplibregl.Map({ container: container.current, style: "https://tiles.openfreemap.org/styles/liberty", center: [origin.lng, origin.lat], zoom: 12 }); }
  catch { queueMicrotask(() => setFailed(true)); return; }
  map.addControl(new maplibregl.NavigationControl());
  map.scrollZoom.disable();
  map.on("error", () => setFailed(true));
  map.on("idle", () => { setLoaded(true); setFailed(false); });
  new maplibregl.Marker({color:"#1d4ed8"}).setLngLat([origin.lng, origin.lat]).addTo(map);
  map.on("load", () => {
   if (route?.provider !== "osrm" || route.geometryKind !== "road") return;
   map.addSource("route", {type:"geojson", data:{type:"Feature",properties:{},geometry:{type:"LineString",coordinates:route.geometry.map(p=>[p.lng,p.lat])}}});
   map.addLayer({id:"route",type:"line",source:"route",paint:{"line-color":"#344b33","line-width":5}});
   new maplibregl.Marker({color:"#b45309"}).setLngLat([route.destination.lng,route.destination.lat]).addTo(map);
   const bounds = new maplibregl.LngLatBounds();
   route.geometry.forEach(p=>bounds.extend([p.lng,p.lat]));
   map.fitBounds(bounds,{padding:32,maxZoom:15});
  });
  const observer = new ResizeObserver(()=>map.resize()); observer.observe(container.current);
  return ()=>{observer.disconnect();map.remove();};
 }, [origin.lat,origin.lng,route]);
 return <div className="my-4">
  <div ref={container} aria-label="OpenStreetMapの地図" aria-busy={!loaded && !failed} style={{ height: 320, width: "100%" }} className="relative z-0 overflow-hidden rounded-xl border" />
  {!loaded && !failed && <p role="status">地図を読み込んでいます…</p>}
  {failed && <div role="alert"><p>地図を読み込めませんでした。通信状態とWebGL対応を確認してください。</p><button type="button" onClick={onRetry} className="my-2 min-h-12 rounded-xl border px-4">地図を再読み込み</button></div>}
  <p className="text-sm">MapLibre GL JS · <a href="https://openfreemap.org/">OpenFreeMap</a></p>
 </div>;
}
