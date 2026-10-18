"use client";
import Link from "next/link";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { DIAL, angleFromOffset, angleOfMinutes, clampMinutes, dialMinutes, pointOnDial } from "@/features/adventure/dial";
import { canStartAdventure, SEARCH_DURATION_MIN, DURATION_MAX, DURATION_MIN, DURATION_STEP } from "@/features/adventure/setup-options";
import { ScreenFrame } from "./screen-frame";
import { TimeContours } from "./contours/time";

const f = (n: number) => n.toFixed(1);

/** 目盛り。5分ごとに24本、15分ごと（3本に1本）が長く濃い。 */
export function DialTicks() {
  return Array.from({ length: DIAL.ticks }, (_, i) => {
    const minutes = (i * DIAL.fullTurnMinutes) / DIAL.ticks;
    const major = i % 3 === 0;
    const a = pointOnDial(minutes, DIAL.tickInner);
    const b = pointOnDial(minutes, major ? DIAL.majorOuter : DIAL.minorOuter);
    return (
      <line key={i} x1={f(a.x)} y1={f(a.y)} x2={f(b.x)} y2={f(b.y)} stroke={major ? "#16413F" : "#B9C6BC"} strokeWidth={major ? "2.4" : "1.6"} strokeLinecap="round" />
    );
  });
}

/** design-ref/screens/02_time.html。弧・つまみ・中央の数字が minutes に連動する。 */
export function TimeScreen({ minutes, onChange, startHref }: { minutes: number; onChange: (minutes: number) => void; startHref: string }) {
  const dial = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const knob = pointOnDial(minutes, DIAL.trackRadius);
  const top = pointOnDial(0, DIAL.trackRadius);
  const full = minutes >= DIAL.fullTurnMinutes;
  const digits = String(minutes).length;

  function update(event: PointerEvent, previous: number | null) {
    const rect = dial.current?.getBoundingClientRect();
    if (!rect) return;
    // 画面を拡縮していても、ダイヤルの中心（rect の中央）からの向きだけで角度を決める。
    const angle = angleFromOffset(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
    onChange(dialMinutes(angle, previous));
  }
  function onKeyDown(event: KeyboardEvent) {
    const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? DURATION_STEP : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -DURATION_STEP : 0;
    if (event.key === "Home") onChange(DURATION_MIN);
    else if (event.key === "End") onChange(DURATION_MAX);
    else if (step) onChange(clampMinutes(minutes + step));
    else return;
    event.preventDefault();
  }

  return (
    <ScreenFrame background="var(--paper)" label="時間を決める">
      <svg className="abs" width="390" height="844" style={{ left: "0", top: "0" }}>
        <TimeContours />
        <circle cx="195" cy="372" r="132" fill="#fff" stroke="#D5DED6" strokeWidth="1.5" />
        <circle cx="195" cy="372" r="128" fill="none" stroke="#DDE5DE" strokeWidth="14" />
        {full ? (
          <circle cx="195" cy="372" r="128" fill="none" stroke="#F5A524" strokeWidth="14" />
        ) : (
          <path d={`M${f(top.x)} ${f(top.y)} A128 128 0 ${angleOfMinutes(minutes) > 180 ? 1 : 0} 1 ${f(knob.x)} ${f(knob.y)}`} fill="none" stroke="#F5A524" strokeWidth="14" strokeLinecap="round" />
        )}
        <DialTicks />
        {[30, 60, 90, 120].map((m) => {
          const p = pointOnDial(m, DIAL.labelRadius);
          return (
            <text key={m} x={f(p.x)} y={f(p.y + 5)} textAnchor="middle" fontWeight="700" fontSize="14" fill="#16413F">
              {m}
            </text>
          );
        })}
        <circle cx="195" cy="372" r="94" fill="#F6F8F3" />
        <circle cx={f(knob.x)} cy={f(knob.y)} r="22" fill="#F5A524" stroke="#fff" strokeWidth="7" />
        <text x="187" y="394" textAnchor="middle" fontWeight="900" fontSize="78" fill="#0D2B2E">
          {minutes}
        </text>
        <text x={241 + (digits > 2 ? 22.5 : 0)} y="394" fontWeight="900" fontSize="22" fill="#0D2B2E">
          分
        </text>
      </svg>
      <div
        ref={dial}
        role="slider"
        tabIndex={0}
        aria-label="片道の所要時間"
        aria-valuemin={DURATION_MIN}
        aria-valuemax={DURATION_MAX}
        aria-valuenow={minutes}
        aria-valuetext={`${minutes}分`}
        className="abs"
        style={{ left: "35px", top: "212px", width: "320px", height: "320px", borderRadius: "50%", touchAction: "none", cursor: "pointer" }}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          update(event, null);
        }}
        onPointerMove={(event) => dragging.current && update(event, minutes)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      />
      <Link href="/" className="logo" style={{ left: "16px" }} aria-label="トップへ戻る">
        <span style={{ width: "36px", height: "36px", display: "grid", placeItems: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D2B2E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#0D2B2E" }}>
            <path d="M15 5 L8 12 L15 19" />
          </svg>
        </span>
      </Link>
      <p id="time-start-note" className="abs" style={{ left: "24px", right: "24px", top: "636px", textAlign: "center", color: "#16413F", fontSize: "14px" }}>
        {minutes === 0 ? "時間を選んでください" : minutes < SEARCH_DURATION_MIN ? "10分として目的地を検索します" : "片道の目安時間です"}
      </p>
      {canStartAdventure(minutes) ? <Link href={startHref} className="cta dark" aria-describedby="time-start-note">
        出発
        <b>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "currentColor" }}>
            <path d="M5 19 L19 5" />
            <path d="M9 5 H19 V15" />
          </svg>
        </b>
      </Link> : <button type="button" disabled className="cta dark" aria-describedby="time-start-note" style={{ opacity: 0.45, cursor: "not-allowed" }}>出発</button>}
    </ScreenFrame>
  );
}
