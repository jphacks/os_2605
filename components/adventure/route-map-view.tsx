"use client";
import dynamic from "next/dynamic";
import type { Coordinates, Route } from "@/types/adventure";
const OsmMap = dynamic(() => import("./osm-map"), { ssr: false, loading: () => <p role="status">地図を読み込んでいます…</p> });
export function RouteMapView({ route, currentLocation }: { route: Route; currentLocation?: Coordinates }) {
  if (!route.geometry.length) return <p role="alert">ルート情報がありません。冒険モードへ戻ってください。</p>;
  if (route.provider !== "osrm" || route.mapCompatibility !== "openstreetmap" || route.geometryKind !== "road") return <p role="alert">OpenStreetMap由来の道路経路ではないため表示できません。</p>;
  return <OsmMap origin={route.origin} route={route} currentLocation={currentLocation} />;
}
