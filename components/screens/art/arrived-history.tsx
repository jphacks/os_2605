/* design-ref/screens/06_arrived_history.html の背景。座標は元 HTML の値のまま。 */
export function ArrivedHistoryArt() {
  return (
      <svg className="abs" width="390" height="844" style={{left:"0",top:"0"}}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFE9E0" />
            <stop offset=".55" stopColor="#F2B5B0" />
            <stop offset="1" stopColor="#8F7BB0" />
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
        <path d="M0 500 L90 450 L170 490 L260 440 L390 490 V660 H0Z" fill="#6E6FA0" opacity=".55" />
        <path d="M0 560 L130 525 L250 550 L390 520 V660 H0Z" fill="#2C3A63" />
        <g fill="#0D2B2E">
          <rect x="40" y="425" width="310" height="14" rx="3" />
          <rect x="58" y="400" width="274" height="16" rx="3" />
          <path d="M30 404 Q58 408 58 400 H332 Q332 408 360 404 L350 398 H40Z" />
          <rect x="82" y="439" width="18" height="140" />
          <rect x="290" y="439" width="18" height="140" />
          <rect x="62" y="462" width="266" height="9" />
          <rect x="0" y="575" width="390" height="40" />
          <rect x="12" y="510" width="22" height="66" rx="2" />
          <rect x="8" y="498" width="30" height="14" />
          <rect x="356" y="510" width="22" height="66" rx="2" />
          <rect x="352" y="498" width="30" height="14" />
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
