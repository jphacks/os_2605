/* design-ref/screens/06_arrived_cafe.html の背景。座標は元 HTML の値のまま。 */
export function ArrivedCafeArt() {
  return (
      <svg className="abs" width="390" height="844" style={{left:"0",top:"0"}}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFEBD6" />
            <stop offset=".55" stopColor="#F9B98A" />
            <stop offset="1" stopColor="#D9777A" />
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
        <path d="M0 520 C80 470 160 500 240 470 S360 480 390 460 V660 H0Z" fill="#8E5A5E" opacity=".55" />
        <path d="M0 565 C100 535 200 560 390 530 V660 H0Z" fill="#3E2A33" />
        <g fill="#0D2B2E">
          <path d="M110 580 V470 H290 V580Z" />
          <path d="M96 474 L200 415 L304 474Z" />
          <rect x="262" y="420" width="16" height="44" />
          <circle cx="52" cy="500" r="30" />
          <rect x="49" y="520" width="6" height="60" />
          <circle cx="342" cy="505" r="26" />
          <rect x="339" y="522" width="6" height="58" />
          <rect x="0" y="575" width="390" height="40" />
        </g>
        <g fill="#FFD58A">
          <rect x="130" y="495" width="46" height="46" rx="3" />
          <rect x="224" y="495" width="46" height="46" rx="3" />
          <path d="M186 580 V520 a14 14 0 0 1 28 0 V580Z" />
        </g>
        <g fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="5" strokeLinecap="round">
          <path d="M270 405 c-10 -14 10 -22 0 -38" />
          <path d="M286 400 c-10 -14 10 -22 0 -38" />
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
