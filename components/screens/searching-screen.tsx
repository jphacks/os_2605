import { ScreenFrame } from "./screen-frame";
import { SearchingContours } from "./contours/searching";

/** design-ref/screens/03_searching.html（掃引部分と針は CSS で回転。動きを減らす設定では静止） */
export function SearchingScreen({ finishing = false }: { finishing?: boolean }) {
  return (
    <ScreenFrame background="var(--ink)" label="目的地を探しています" live>
      <div className={`search-scene${finishing ? " search-scene-finishing" : ""}`}>
      <svg className="abs" width="390" height="844" style={{left:"0",top:"0"}}>
        <defs>
          <linearGradient id="sw" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#F5A524" stopOpacity="0" />
            <stop offset="1" stopColor="#F5A524" stopOpacity=".55" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#F5A524" stopOpacity=".25" />
            <stop offset="1" stopColor="#F5A524" stopOpacity="0" />
          </radialGradient>
        </defs>
        <SearchingContours />
        <circle cx="195" cy="400" r="190" fill="url(#glow)" />
        <g fill="none" stroke="#F5A524" strokeWidth="1.8" pointerEvents="none" aria-hidden="true">
          <circle className="radar-wave" cx="195" cy="400" r="176" />
          <circle className="radar-wave radar-wave-two" cx="195" cy="400" r="176" />
          <circle className="radar-wave radar-wave-three" cx="195" cy="400" r="176" />
        </g>
        <g className="radar">
        <path d="M195 400 L195 224 A176 176 0 0 1 351 316 Z" fill="url(#sw)" opacity=".75" />
        <line x1="195" y1="400" x2="195" y2="224" stroke="#F5A524" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="195" cy="400" r="9" fill="#F5A524" />
        {/* 北向きから時計回りの角度 / 360 × 掃引周期（3.2秒）で点灯を同期。 */}
        {[
          { x: 280, y: 318, r: 6, delay: "0.409s" },
          { x: 132, y: 470, r: 4, delay: "1.973s" },
          { x: 238, y: 505, r: 5, delay: "1.402s" },
        ].map(({ x, y, r, delay }) => (
          <g key={`${x}-${y}`} style={{ "--echo-delay": delay } as React.CSSProperties}>
            <circle className="radar-echo" cx={x} cy={y} r="14" fill="none" stroke="#F5A524" />
            <circle className="radar-target" cx={x} cy={y} r={r} fill="#fff" />
          </g>
        ))}
      </svg>
      <div className="logo" style={{color:"#fff"}}>
        <i>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{color:"currentColor"}}>
            <path d="M5 19 L19 5" />
            <path d="M9 5 H19 V15" />
          </svg>
        </i>
        ミステリップ
      </div>
      <div className="abs" style={{left:"0",right:"0",top:"690px",textAlign:"center",color:"#fff",fontWeight:"700",fontSize:"19px",letterSpacing:".2em"}}>
        さがしています
        <span style={{color:"#F5A524"}}>…</span>
      </div>
      </div>
    </ScreenFrame>
  );
}
