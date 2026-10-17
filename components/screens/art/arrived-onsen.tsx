/* design-ref/screens/06_arrived_onsen.html の背景。座標は元 HTML の値のまま。 */
export function ArrivedOnsenArt() {
  return (
      <svg className="abs" width="390" height="844" style={{left:"0",top:"0"}}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFEFE4" />
            <stop offset=".55" stopColor="#F6BFC0" />
            <stop offset="1" stopColor="#9C86C4" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".6" stopColor="#FFF1C2" />
            <stop offset="1" stopColor="#FFD58A" stopOpacity="0" />
          </radialGradient>
          <filter id="bl">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <rect width="390" height="660" fill="url(#sky)" />
        <line x1="195" y1="270" x2="-185.0" y2="270.0" stroke="#fff" strokeOpacity=".26" strokeWidth="1.5" />
        <line x1="195" y1="270" x2="-179.2" y2="204.0" stroke="#fff" strokeOpacity=".26" strokeWidth="3" />
        <line x1="195" y1="270" x2="-162.1" y2="140.0" stroke="#fff" strokeOpacity=".26" strokeWidth="1.5" />
        <line x1="195" y1="270" x2="-134.1" y2="80.0" stroke="#fff" strokeOpacity=".26" strokeWidth="3" />
        <line x1="195" y1="270" x2="-96.1" y2="25.7" stroke="#fff" strokeOpacity=".26" strokeWidth="1.5" />
        <line x1="195" y1="270" x2="-49.3" y2="-21.1" stroke="#fff" strokeOpacity=".26" strokeWidth="3" />
        <line x1="195" y1="270" x2="5.0" y2="-59.1" stroke="#fff" strokeOpacity=".26" strokeWidth="1.5" />
        <line x1="195" y1="270" x2="65.0" y2="-87.1" stroke="#fff" strokeOpacity=".26" strokeWidth="3" />
        <line x1="195" y1="270" x2="129.0" y2="-104.2" stroke="#fff" strokeOpacity=".26" strokeWidth="1.5" />
        <line x1="195" y1="270" x2="195.0" y2="-110.0" stroke="#fff" strokeOpacity=".26" strokeWidth="3" />
        <line x1="195" y1="270" x2="261.0" y2="-104.2" stroke="#fff" strokeOpacity=".26" strokeWidth="1.5" />
        <line x1="195" y1="270" x2="325.0" y2="-87.1" stroke="#fff" strokeOpacity=".26" strokeWidth="3" />
        <line x1="195" y1="270" x2="385.0" y2="-59.1" stroke="#fff" strokeOpacity=".26" strokeWidth="1.5" />
        <line x1="195" y1="270" x2="439.3" y2="-21.1" stroke="#fff" strokeOpacity=".26" strokeWidth="3" />
        <line x1="195" y1="270" x2="486.1" y2="25.7" stroke="#fff" strokeOpacity=".26" strokeWidth="1.5" />
        <line x1="195" y1="270" x2="524.1" y2="80.0" stroke="#fff" strokeOpacity=".26" strokeWidth="3" />
        <line x1="195" y1="270" x2="552.1" y2="140.0" stroke="#fff" strokeOpacity=".26" strokeWidth="1.5" />
        <line x1="195" y1="270" x2="569.2" y2="204.0" stroke="#fff" strokeOpacity=".26" strokeWidth="3" />
        <line x1="195" y1="270" x2="575.0" y2="270.0" stroke="#fff" strokeOpacity=".26" strokeWidth="1.5" />
        <circle cx="195" cy="270" r="120" fill="url(#sun)" />
        <circle cx="195" cy="270" r="54" fill="#fff" />
        <path d="M0 480 C70 430 140 470 210 430 S340 450 390 420 V660 H0Z" fill="#7A74A8" opacity=".6" />
        <path d="M0 540 C100 505 180 535 270 500 S360 510 390 495 V660 H0Z" fill="#2E3560" />
        <g fill="#0D2B2E">
          <rect x="0" y="560" width="390" height="60" />
          <path d="M40 585 Q60 550 100 558 Q120 540 150 556 Q170 548 170 585Z" />
          <path d="M250 585 Q262 556 296 560 Q322 546 346 566 Q362 560 360 585Z" />
        </g>
        <ellipse cx="195" cy="585" rx="110" ry="14" fill="#7FD0D4" opacity=".85" />
        <g fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="6" strokeLinecap="round">
          <path d="M150 570 c-16 -22 16 -38 0 -62 s16 -38 0 -62" />
          <path d="M195 570 c-16 -22 16 -38 0 -62 s16 -38 0 -62" />
          <path d="M240 570 c-16 -22 16 -38 0 -62 s16 -38 0 -62" />
        </g>
        <circle cx="52" cy="150" r="5" fill="#fff" />
        <circle cx="330" cy="120" r="6" fill="#FFD58A" />
        <circle cx="96" cy="246" r="3.5" fill="#FFD58A" />
        <circle cx="300" cy="230" r="4" fill="#fff" />
        <circle cx="40" cy="330" r="4" fill="#fff" />
        <circle cx="352" cy="330" r="3.5" fill="#FFD58A" />
        <circle cx="150" cy="92" r="3.5" fill="#fff" />
        <circle cx="248" cy="70" r="4.5" fill="#fff" />
        <rect y="600" width="390" height="244" fill="#0D2B2E" />
      </svg>
  );
}
