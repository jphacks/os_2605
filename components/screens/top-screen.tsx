import Link from "next/link";
import { ScreenFrame } from "./screen-frame";
import { TopContours } from "./contours/top";

/** design-ref/screens/01_top.html */
export function TopScreen() {
  return (
    <ScreenFrame background="var(--mist)" label="ミステリップ トップ">
      <svg className="abs" width="390" height="844" style={{left:"0",top:"0"}}>
        <defs>
          <radialGradient id="fog" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff" stopOpacity=".95" />
            <stop offset=".62" stopColor="#F6F8F3" stopOpacity=".9" />
            <stop offset="1" stopColor="#E4ECE6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fade" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#0D2B2E" />
            <stop offset=".55" stopColor="#0D2B2E" />
            <stop offset="1" stopColor="#0D2B2E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <TopContours />
        <circle cx="195" cy="330" r="168" fill="url(#fog)" />
        <circle cx="195" cy="330" r="138" fill="none" stroke="#16413F" strokeOpacity=".35" strokeDasharray="2 7" strokeLinecap="round" strokeWidth="2" />
        <g transform="translate(195 330) rotate(45)">
          <path d="M-12 120 V-20 H-40 L0 -92 L40 -20 H12 V120 Z" fill="url(#fade)" />
        </g>
        <circle cx="276" cy="228" r="9" fill="#F5A524" />
      </svg>
      <div className="abs" style={{left:"24px",top:"566px",fontWeight:"900",fontSize:"56px",lineHeight:"1.05",letterSpacing:"-.02em",whiteSpace:"nowrap"}}>ミステリップ</div>
      <div className="abs" style={{left:"27px",top:"650px",fontWeight:"700",fontSize:"19px",color:"#16413F",letterSpacing:".14em"}}>未知の地へ</div>
      <Link href="/setup" className="cta dark">
        出発
        <b>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{color:"currentColor"}}>
            <path d="M5 19 L19 5" />
            <path d="M9 5 H19 V15" />
          </svg>
        </b>
      </Link>
      <p className="credit">地図 © OpenStreetMap contributors ・ 経路 OSRM ・ 操作は安全な場所に停車して行ってください</p>
    </ScreenFrame>
  );
}
