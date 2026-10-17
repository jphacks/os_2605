"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { advanceMapConfirmation, MAP_CONFIRMATIONS, type MapConfirmationStep } from "@/features/adventure/map-confirmation";
import type { PublicAdventurePlan } from "@/types/adventure";
const RouteMap = dynamic(() => import("./route-map"), { ssr: false, loading: () => <p role="status">地図を準備しています…</p> });
export function RouteMapDialog({ route, onClose }: { route: PublicAdventurePlan["route"]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<MapConfirmationStep>(0);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => { title.current?.focus(); }, [step]);
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="route-map-title" style={{ position: "fixed", inset: 0, margin: "auto", width: "min(900px, calc(100vw - 24px))", maxHeight: "90dvh", overflowY: "auto", padding: 20, borderRadius: 20, color: "#193e35", background: "#fff", border: "1px solid #344b33" }}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 ref={title} tabIndex={-1} id="route-map-title" className="text-2xl font-bold">{step === "map" ? "ROUTE MAP" : MAP_CONFIRMATIONS[step]}</h2>
      {step === "map" && <span className="rounded-full bg-[#e7ecd9] px-4 py-2">目的地：？？？</span>}
    </div>
    {step === "map" ? <RouteMap route={route} /> : <>
      <p className="mb-5 leading-7">安全な場所に停車して操作してください。地図には実際の経路と終点が表示され、地名や経路から行き先が分かる可能性があります。</p>
      <button type="button" onClick={() => setStep(advanceMapConfirmation(step))} className="mr-3 min-h-12 rounded-xl bg-[#234e3e] px-6 py-3 font-bold text-white">{step === 2 ? "はい、マップを表示" : "はい"}</button>
    </>}
    <button type="button" onClick={onClose} className="mt-4 min-h-12 rounded-xl border px-6 py-3 font-bold">{step === "map" ? "ナビに戻る" : "キャンセル"}</button>
  </dialog>;
}
