"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { advanceMapConfirmation, MAP_CONFIRMATIONS, type MapConfirmationStep } from "@/features/adventure/map-confirmation";
import type { PublicAdventurePlan } from "@/types/adventure";
const RouteMap = dynamic(() => import("./route-map"), { ssr: false, loading: () => <p role="status">地図を準備しています…</p> });
export function RouteMapDialog({ route, sealedDestination, onClose }: { sealedDestination: string; route: PublicAdventurePlan["route"]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<MapConfirmationStep>(0);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => { title.current?.focus(); }, [step]);
  const [destinationName, setDestinationName] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (step !== "map") return;
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 15000);
    void fetch("/api/adventures/reveal", {
      method: "POST", cache: "no-store", signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sealed: sealedDestination, confirmed: true }),
    }).then(async response => {
      const data = await response.json();
      if (response.status === 403) throw new Error("目的地情報が無効または期限切れです。冒険を中断し、時間設定から目的地を選び直してください。");
      if (!response.ok || typeof data.name !== "string" || !data.name.trim()) throw new Error("目的地名を取得できませんでした。時間をおいて再試行してください。");
      if (active) setDestinationName(data.name);
    }).catch((error: unknown) => { if (active) setNameError(error instanceof Error && error.name !== "AbortError" && error.name !== "TypeError" ? error.message : "通信が失敗またはタイムアウトしました。接続を確認して再試行してください。"); }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [step, sealedDestination, attempt]);
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="route-map-title" style={{ position: "fixed", inset: 0, margin: "auto", width: "min(900px, calc(100vw - 24px))", maxHeight: "90dvh", overflowY: "auto", padding: 20, borderRadius: 20, color: "#193e35", background: "#fff", border: "1px solid #344b33" }}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 ref={title} tabIndex={-1} id="route-map-title" className="text-2xl font-bold">{step === "map" ? "ROUTE MAP" : MAP_CONFIRMATIONS[step]}</h2>
      {step === "map" && <span className="rounded-full bg-[#e7ecd9] px-4 py-2">目的地：{destinationName ?? (nameError ? "取得できませんでした" : "取得中…")}</span>}
    </div>
    {step === "map" ? <>
      {nameError && <p role="alert">{nameError}<button type="button" className="min-h-12 underline" onClick={() => { setNameError(null); setAttempt(n => n + 1); }}>再試行</button></p>}
      <RouteMap route={route} />
    </> : <>
      <p className="mb-5 leading-7">安全な場所に停車して操作してください。地図には目的地名・実際の経路・終点が表示されます。行き先が明かされます。</p>
      <button type="button" onClick={() => setStep(advanceMapConfirmation(step))} className="mr-3 min-h-12 rounded-xl bg-[#234e3e] px-6 py-3 font-bold text-white">{step === 2 ? "はい、マップを表示" : "はい"}</button>
    </>}
    <button type="button" onClick={onClose} className="mt-4 min-h-12 rounded-xl border px-6 py-3 font-bold">{step === "map" ? "ナビに戻る" : "キャンセル"}</button>
  </dialog>;
}
