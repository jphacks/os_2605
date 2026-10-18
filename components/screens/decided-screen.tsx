import { TransitionLink } from "@/components/navigation/page-transition";
import { ScreenFrame } from "./screen-frame";
import { DecidedContours } from "./contours/decided";

/** design-ref/screens/04_decided.html（目的地・ジャンルは表示しない。所要時間のチップのみ） */
export function DecidedScreen({ minutes, onStart }: { minutes: number; onStart?: () => void }) {
  return (
    <ScreenFrame background="var(--ink)" label="目的地が決まりました">
      <svg className="abs" width="390" height="844" style={{left:"0",top:"0"}}>
        <defs>
          <radialGradient id="fg" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#E4ECE6" stopOpacity=".95" />
            <stop offset=".65" stopColor="#E4ECE6" stopOpacity=".55" />
            <stop offset="1" stopColor="#E4ECE6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <DecidedContours />
        <circle cx="195" cy="330" r="178" fill="url(#fg)" />
        <circle cx="195" cy="330" r="146" fill="none" stroke="#F5A524" strokeWidth="2.4" strokeDasharray="2 9" strokeLinecap="round" />
        <text x="195" y="396" textAnchor="middle" fontWeight="900" fontSize="190" fill="#0D2B2E">?</text>
        <circle cx="86" cy="214" r="7" fill="#F5A524" />
        <circle cx="322" cy="448" r="5" fill="#F5A524" opacity=".8" />
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
      <div className="abs" style={{left:"0",right:"0",top:"560px",textAlign:"center",color:"#fff",fontWeight:"900",fontSize:"34px",letterSpacing:".08em"}}>未知の地へ</div>
      <div className="abs" style={{left:"0",right:"0",top:"626px",display:"flex",justifyContent:"center"}}>
        <div style={{height:"52px",borderRadius:"26px",border:"1.5px solid rgba(255,255,255,.28)",display:"flex",alignItems:"center",gap:"8px",padding:"0 22px",color:"#fff",fontWeight:"900",fontSize:"24px"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5A524" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {minutes}
          <small style={{fontSize:"14px",marginLeft:"-2px"}}>分</small>
        </div>
      </div>
      <TransitionLink href="/adventure" className="cta amber" onClick={onStart}>
        出発
        <b>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5A524" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{color:"#F5A524"}}>
            <path d="M5 19 L19 5" />
            <path d="M9 5 H19 V15" />
          </svg>
        </b>
      </TransitionLink>
    </ScreenFrame>
  );
}
