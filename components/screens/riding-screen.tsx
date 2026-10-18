"use client";
import { maneuverLabel } from "@/features/adventure/ride-view";
import type { ReactNode } from "react";
import type { Maneuver } from "@/types/adventure";
import { ScreenFrame } from "./screen-frame";
import { RidingContours } from "./contours/riding";

const AMBER = "#F5A524";

/**
 * 曲がり角の矢印。右折は design-ref/05_riding.html の図形そのもの。
 * 他の向きはモックにないため、同じ図形を反転・回転して作っている。
 */
function TurnArrow({ maneuver }: { maneuver: Maneuver | null }) {
  const right = (
    <g transform="translate(50 140)">
      <path d="M50 330 V170 Q50 100 120 100 H210" fill="none" stroke={AMBER} strokeWidth="44" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M200 40 L290 100 L200 160 Z" fill={AMBER} stroke={AMBER} strokeWidth="14" strokeLinejoin="round" />
    </g>
  );
  switch (maneuver) {
    case "TURN_RIGHT":
      return right;
    case "TURN_LEFT":
      return <g transform="translate(390 0) scale(-1 1)">{right}</g>;
    case "UTURN":
      return (
        <g transform="translate(50 140)">
          <path d="M50 330 V170 Q50 100 120 100 Q190 100 190 170 V250" fill="none" stroke={AMBER} strokeWidth="44" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M130 240 L190 320 L250 240 Z" fill={AMBER} stroke={AMBER} strokeWidth="14" strokeLinejoin="round" />
        </g>
      );
    default: {
      const tilt = maneuver === "SLIGHT_RIGHT" ? 35 : maneuver === "SLIGHT_LEFT" ? -35 : 0;
      return (
        <g transform={`rotate(${tilt} 195 470)`}>
          <g transform="translate(50 140)">
            <path d="M145 330 V120" fill="none" stroke={AMBER} strokeWidth="44" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M85 130 L145 50 L205 130 Z" fill={AMBER} stroke={AMBER} strokeWidth="14" strokeLinejoin="round" />
          </g>
        </g>
      );
    }
  }
}

const circle = { width: "64px", height: "64px", borderRadius: "50%", display: "grid", placeItems: "center" } as const;
const control = { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#fff", fontWeight: "700", fontSize: "12px" } as const;

function Control({ label, onClick, disabled, pressed, children }: { label: string; onClick?: () => void; disabled?: boolean; pressed?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={pressed} style={{ ...control, opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
      <div style={{ ...circle, border: `1.5px solid ${pressed ? AMBER : "rgba(255,255,255,.3)"}` }}>{children}</div>
      {label}
    </button>
  );
}

const icon = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", style: { color: "#fff" } } as const;

export type RidingView = {
  /** 残り時間（分）。位置が取れていない間は null。 */
  remainingMinutes: number | null;
  /** 0〜1。 */
  progress: number;
  maneuver: Maneuver | null;
  distance: { value: string; unit: string };
  /** 位置情報が使えないなどの案内。通常は null。 */
  notice: string | null;
};

/** design-ref/screens/05_riding.html。残り時間と次の曲がり角だけを表示し、目的地は出さない。 */
export function RidingScreen({ view, voiceOn, onVoice, onStop, onMap }: { view: RidingView; voiceOn: boolean; onVoice: () => void; onStop: () => void; onMap: () => void }) {
  return (
    <ScreenFrame background="var(--deep)" label="走行中" live>
      <svg className="abs" width="390" height="844" style={{ left: "0", top: "0" }}>
        <RidingContours />
        <TurnArrow maneuver={view.maneuver} />
      </svg>
      <div className="abs" style={{ left: "24px", right: "24px", top: "62px", height: "6px", borderRadius: "3px", background: "rgba(255,255,255,.14)" }}>
        <div style={{ width: `${Math.round(Math.min(1, Math.max(0, view.progress)) * 100)}%`, height: "100%", borderRadius: "3px", background: "#F5A524" }} />
      </div>
      <div className="abs" style={{ left: "24px", top: "84px", display: "flex", alignItems: "baseline", gap: "8px", color: "#fff", fontWeight: "700", fontSize: "16px" }}>
        残り
        <span style={{ fontWeight: "900", fontSize: "40px", lineHeight: "1", color: "#fff" }}>{view.remainingMinutes ?? "--"}</span>
        <span style={{ fontWeight: "900", fontSize: "18px" }}>分</span>
      </div>
      {view.notice && (
        <p role="alert" className="abs" style={{ left: "24px", right: "24px", top: "146px", color: "var(--dawn)", fontWeight: "700", fontSize: "14px", lineHeight: "1.5" }}>
          {view.notice}
        </p>
      )}
      <div className="abs" style={{ left: "0", right: "0", top: "536px", textAlign: "center", color: "#fff", fontWeight: "900", fontSize: "44px", lineHeight: "1.4", letterSpacing: "-.02em" }}>
        {view.distance.value}
        <span style={{ fontSize: "28px", marginLeft: "6px", color: "#F5A524" }}>{view.distance.unit}</span>
        <span style={{ fontSize: "24px", marginLeft: "4px", color: "#fff" }}>{maneuverLabel(view.maneuver)}</span>
      </div>
      <div className="abs" style={{ left: "24px", right: "24px", bottom: "50px", display: "flex", justifyContent: "space-between", padding: "0 18px" }}>
        <Control label="音声" onClick={onVoice} pressed={voiceOn}>
          <svg {...icon}>
            <path d="M4 9.5 H8 L13 5.5 V18.5 L8 14.5 H4 Z" />
            <path d="M16.5 9 Q18.5 12 16.5 15" />
            <path d="M19 6.5 Q22.5 12 19 17.5" />
          </svg>
        </Control>
        {/* 3段階の確認後、取得済み経路のマップを表示する。 */}
        <Control label="行き先" onClick={onMap}>
          <svg {...icon}>
            <path d="M2 12 Q12 3 22 12 Q12 21 2 12 Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Control>
        <Control label="中断" onClick={onStop}>
          <svg {...icon}>
            <rect x="6" y="6" width="12" height="12" rx="2.5" />
          </svg>
        </Control>
      </div>
    </ScreenFrame>
  );
}
