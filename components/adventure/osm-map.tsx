"use client";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Coordinates, Route } from "@/types/adventure";
const JAPAN_CENTER = { lat: 36.2, lng: 138.25 };
type Props = { origin?: Coordinates; route?: Route; currentLocation?: Coordinates; centerOnCurrentLocation?: boolean };
function isMapPoint(value: Coordinates | undefined): value is Coordinates {
 return !!value && Number.isFinite(value.lat) && value.lat >= -90 && value.lat <= 90 && Number.isFinite(value.lng) && value.lng >= -180 && value.lng <= 180;
}
export default function OsmMap({ origin, route, currentLocation, centerOnCurrentLocation = false }: Props) {
 const [attempt, setAttempt] = useState(0);
 return <MapCanvas key={attempt} origin={origin} route={route} currentLocation={currentLocation} centerOnCurrentLocation={centerOnCurrentLocation} onRetry={() => setAttempt(value => value + 1)} />;
}
function MapCanvas({ origin, route, currentLocation, centerOnCurrentLocation, onRetry }: Props & { onRetry: () => void }) {
 const container = useRef<HTMLDivElement>(null);
 const mapRef = useRef<maplibregl.Map | null>(null);
 const currentMarker = useRef<maplibregl.Marker | null>(null);
 const initialCurrentLocation = useRef(currentLocation);
 const centeredOnCurrent = useRef(false);
 const [failed, setFailed] = useState(false);
 const [loaded, setLoaded] = useState(false);
 useEffect(() => {
  if (!container.current) return;
  // Keep the MapLibre v6 worker on the same origin. Next.js development chunk
  // hashes can otherwise leave a stale worker URL after Fast Refresh.
  maplibregl.setWorkerUrl("/vendor/maplibre-gl-worker-6.14.0.mjs");
  let map: maplibregl.Map;
  const initialCenter = isMapPoint(origin) ? origin : isMapPoint(initialCurrentLocation.current) ? initialCurrentLocation.current : JAPAN_CENTER;
  try { map = new maplibregl.Map({ container: container.current, style: "https://tiles.openfreemap.org/styles/liberty", center: [initialCenter.lng, initialCenter.lat], zoom: isMapPoint(origin) || isMapPoint(initialCurrentLocation.current) ? 12 : 4 }); mapRef.current = map; }
  catch { queueMicrotask(() => setFailed(true)); return; }
  map.addControl(new maplibregl.NavigationControl());
  map.scrollZoom.disable();
  map.on("error", () => setFailed(true));
  map.on("idle", () => { setLoaded(true); setFailed(false); });
  if (isMapPoint(origin)) new maplibregl.Marker({color:"#1d4ed8"}).setLngLat([origin.lng, origin.lat]).addTo(map);
  if (isMapPoint(initialCurrentLocation.current)) currentMarker.current = new maplibregl.Marker({color:"#dc2626"}).setLngLat([initialCurrentLocation.current.lng, initialCurrentLocation.current.lat]).addTo(map);
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
  return ()=>{observer.disconnect();currentMarker.current?.remove();currentMarker.current=null;mapRef.current=null;map.remove();};
 }, [origin, route]);
 useEffect(() => {
  if (!isMapPoint(currentLocation) || !mapRef.current) return;
  if (!currentMarker.current) currentMarker.current = new maplibregl.Marker({color:"#dc2626"}).setLngLat([currentLocation.lng,currentLocation.lat]).addTo(mapRef.current);
  else currentMarker.current.setLngLat([currentLocation.lng,currentLocation.lat]);
  if (centerOnCurrentLocation && !centeredOnCurrent.current) {
   centeredOnCurrent.current = true;
   mapRef.current.easeTo({ center: [currentLocation.lng, currentLocation.lat], zoom: 13 });
  }
 }, [centerOnCurrentLocation,currentLocation]);
 return <div className="my-4">
  <div ref={container} aria-label="OpenStreetMapの地図" aria-busy={!loaded && !failed} style={{ height: 320, width: "100%" }} className="relative z-0 overflow-hidden rounded-xl border" />
  {!loaded && !failed && <p role="status">地図を読み込んでいます…</p>}
  {failed && <div role="alert"><p>地図を読み込めませんでした。通信状態とWebGL対応を確認してください。</p><button type="button" onClick={onRetry} className="my-2 min-h-12 rounded-xl border px-4">地図を再読み込み</button></div>}
  <p className="text-sm">MapLibre GL JS · <a href="https://openfreemap.org/">OpenFreeMap</a></p>
 </div>;
}
