import Link from "next/link";
import type { ReactNode } from "react";
import { ScreenFrame } from "./screen-frame";
import { ArrivedStationArt } from "./art/arrived-station";
import { ArrivedNatureArt } from "./art/arrived-nature";
import { ArrivedCafeArt } from "./art/arrived-cafe";
import { ArrivedHistoryArt } from "./art/arrived-history";
import { ArrivedOnsenArt } from "./art/arrived-onsen";

export type ArrivedGenre = "roadside_station" | "nature" | "cafe" | "history" | "hot_spring";

const arts: Record<ArrivedGenre, () => ReactNode> = {
  roadside_station: ArrivedStationArt,
  nature: ArrivedNatureArt,
  cafe: ArrivedCafeArt,
  history: ArrivedHistoryArt,
  hot_spring: ArrivedOnsenArt,
};

const icons: Record<ArrivedGenre, ReactNode> = {
  roadside_station: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"currentColor"}}><path d="M3 9 L5 4 H19 L21 9" /><path d="M3 9 a3 3 0 0 0 6 0 a3 3 0 0 0 6 0 a3 3 0 0 0 6 0" /><path d="M5 12.5 V20 H19 V12.5" /><path d="M10 20 V15 H14 V20" /></svg>
  ),
  nature: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"currentColor"}}><path d="M5 19 C5 10 11 5 20 4 C20 13 15 19 5 19 Z" /><path d="M5 19 L14 10" /></svg>
  ),
  cafe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"currentColor"}}><path d="M4.5 9 H16 V14 a4 4 0 0 1 -4 4 H8.5 a4 4 0 0 1 -4 -4 Z" /><path d="M16 10.5 H17.5 a2 2 0 0 1 0 4 H16" /><path d="M8 3.5 Q9.2 5 8 6.5" /><path d="M12 3.5 Q13.2 5 12 6.5" /></svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"currentColor"}}><path d="M8 20 V7.5 a2.5 2.5 0 0 1 2.5 -2.5 H13.5 a2.5 2.5 0 0 1 2.5 2.5 V20" /><path d="M5 20 H19" /><path d="M12 9 V15" /></svg>
  ),
  hot_spring: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"currentColor"}}><path d="M4 14 H20 V15.5 a3.5 3.5 0 0 1 -3.5 3.5 H7.5 a3.5 3.5 0 0 1 -3.5 -3.5 Z" /><path d="M8 4 q-1.8 2 0 4.2" /><path d="M12 4 q-1.8 2 0 4.2" /><path d="M16 4 q-1.8 2 0 4.2" /></svg>
  ),
};

/** 名称が長いと元の 36px・折り返しなしでは収まらないため、文字数に応じて縮める。 */
function nameFontSize(name: string) {
  const width = 342;
  return Math.max(20, Math.min(36, Math.floor(width / Math.max(1, [...name].length))));
}

/** design-ref/screens/06_arrived_*.html（背景・アイコンはジャンルで出し分け） */
export function ArrivedScreen({ genre, name }: { genre: ArrivedGenre; name: string }) {
  const Art = arts[genre];
  return (
    <ScreenFrame background="var(--ink)" label={`到着 ${name}`}>
      <Art />
      <div className="abs" style={{left:"24px",top:"626px",display:"flex",alignItems:"center",gap:"10px"}}>
        <span style={{width:"34px",height:"34px",borderRadius:"50%",background:"var(--amber)",display:"grid",placeItems:"center",color:"var(--ink)"}}>
          {icons[genre]}
        </span>
        <span style={{color:"#F5A524",fontWeight:"900",fontSize:"15px",letterSpacing:".12em"}}>到着</span>
      </div>
      <div className="abs" style={{left:"24px",right:"24px",top:"672px",color:"#fff",fontWeight:"900",fontSize:nameFontSize(name),lineHeight:"1.15",whiteSpace:"nowrap"}}>{name}</div>
      <Link href="/search" className="cta amber" style={{bottom:"36px",height:"62px",borderRadius:"31px"}}>
        もう一度
        <b style={{width:"42px",height:"42px"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:"currentColor"}}>
            <rect x="4" y="4" width="16" height="16" rx="4" />
            <circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="9" cy="15" r="1.3" fill="currentColor" stroke="none" />
          </svg>
        </b>
      </Link>
    </ScreenFrame>
  );
}
