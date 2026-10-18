import { TransitionLink } from "@/components/navigation/page-transition";
import { ScreenFrame } from "./screen-frame";
import { TopContours } from "./contours/top";

/** 霧の地図に「未知の入口」が開くタイトル画面。 */
export function TopScreen() {
  return (
    <ScreenFrame background="var(--mist)" label="ミステリップ トップ">
      <svg className="abs top-visual" width="390" height="844" style={{ left: "0", top: "0" }}>
        <defs>
          <radialGradient id="portalDepth" cx="50%" cy="42%" r="62%">
            <stop offset="0" stopColor="#245A57" />
            <stop offset=".38" stopColor="#0D2B2E" />
            <stop offset="1" stopColor="#031416" />
          </radialGradient>
          <radialGradient id="portalMist" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#F5A524" stopOpacity=".24" />
            <stop offset=".5" stopColor="#E4ECE6" stopOpacity=".08" />
            <stop offset="1" stopColor="#E4ECE6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="openingVeil" cx="50%" cy="46%" r="72%">
            <stop offset="0" stopColor="#16413F" />
            <stop offset=".48" stopColor="#0D2B2E" />
            <stop offset="1" stopColor="#031416" />
          </radialGradient>
          <linearGradient id="routeLight" x1="45" y1="495" x2="202" y2="218" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F5A524" stopOpacity="0" />
            <stop offset=".42" stopColor="#F5A524" stopOpacity=".85" />
            <stop offset="1" stopColor="#FFD58A" />
          </linearGradient>
          <filter id="portalGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <clipPath id="portalClip">
            <circle cx="195" cy="278" r="112" />
          </clipPath>
        </defs>

        <g className="top-world-lines">
          <TopContours />
        </g>

        <rect className="top-opening-veil" width="390" height="844" fill="url(#openingVeil)" />

        <g className="top-portal-reveal">
          <g className="top-portal-breathe">
            <circle className="top-portal-aura" cx="195" cy="278" r="148" fill="url(#portalMist)" />
            <circle cx="195" cy="278" r="116" fill="url(#portalDepth)" />

            <g clipPath="url(#portalClip)">
              <g className="top-depth-rings">
                <circle cx="195" cy="278" r="30" fill="none" stroke="#E4ECE6" strokeOpacity=".18" />
                <circle cx="195" cy="278" r="52" fill="none" stroke="#E4ECE6" strokeOpacity=".15" />
                <circle cx="195" cy="278" r="76" fill="none" stroke="#E4ECE6" strokeOpacity=".12" />
                <circle cx="195" cy="278" r="102" fill="none" stroke="#E4ECE6" strokeOpacity=".1" />
              </g>
              <g className="top-star-field" fill="#FFD58A">
                <circle cx="143" cy="225" r="2.2" />
                <circle cx="249" cy="242" r="1.4" />
                <circle cx="224" cy="319" r="1.8" />
                <circle cx="159" cy="337" r="1.2" />
                <circle cx="268" cy="291" r="1" />
                <circle cx="124" cy="285" r="1.1" />
              </g>
              <path className="top-inner-route" d="M116 366 C141 335 132 306 160 288 C181 274 177 244 204 213" fill="none" stroke="url(#routeLight)" strokeWidth="4" strokeLinecap="round" />
            </g>

            <g className="top-ring top-ring-outer">
              <circle cx="195" cy="278" r="128" fill="none" stroke="#16413F" strokeWidth="1.5" strokeDasharray="78 22 16 34" />
            </g>
            <g className="top-ring top-ring-inner">
              <circle cx="195" cy="278" r="121" fill="none" stroke="#F5A524" strokeOpacity=".72" strokeWidth="2" strokeDasharray="8 18 52 31" />
            </g>
            <circle cx="195" cy="278" r="114" fill="none" stroke="#E4ECE6" strokeOpacity=".38" />

            <circle className="top-beacon-glow" cx="204" cy="213" r="18" fill="#F5A524" opacity=".45" filter="url(#portalGlow)" />
            <circle className="top-beacon" cx="204" cy="213" r="5.5" fill="#FFD58A" />
          </g>
        </g>

        <circle className="top-portal-wave top-portal-wave-one" cx="195" cy="278" r="118" fill="none" stroke="#F5A524" />
        <circle className="top-portal-wave top-portal-wave-two" cx="195" cy="278" r="118" fill="none" stroke="#16413F" />
        <path className="top-journey-line" d="M38 500 C72 446 116 449 137 392 C153 350 149 313 178 288" fill="none" stroke="url(#routeLight)" strokeWidth="4" strokeLinecap="round" />
      </svg>

      <div className="abs top-kicker" style={{ left: "27px", top: "514px" }}>DESTINATION&nbsp;&nbsp;/&nbsp;&nbsp;UNKNOWN</div>
      <div className="abs top-title" style={{ left: "24px", top: "544px", fontWeight: "900", fontSize: "56px", lineHeight: "1.05", letterSpacing: "-.02em", whiteSpace: "nowrap" }}>ミステリップ</div>
      <div className="abs top-subtitle" style={{ left: "27px", top: "626px", fontWeight: "700", fontSize: "18px", color: "#16413F", letterSpacing: ".12em" }}>まだ名前のない場所へ</div>
      <TransitionLink href="/setup" className="cta dark top-cta">
        出発
        <b>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "currentColor" }}>
            <path d="M5 19 L19 5" />
            <path d="M9 5 H19 V15" />
          </svg>
        </b>
      </TransitionLink>
      <p className="credit top-credit">地図 © OpenStreetMap contributors ・ 経路 OSRM ・ 操作は安全な場所に停車して行ってください</p>
    </ScreenFrame>
  );
}
