/* design-ref/screens/06_arrived_station.html の背景。座標は元 HTML の値のまま。 */
export function ArrivedStationArt() {
  return (
      <svg className="abs" width="390" height="844" style={{left:"0",top:"0"}}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF1D0" />
            <stop offset=".55" stopColor="#FFC46B" />
            <stop offset="1" stopColor="#F28C4E" />
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
        <path d="M0 500 L80 450 L150 490 L240 440 L330 485 L390 455 V660 H0Z" fill="#7FB3A3" opacity=".6" />
        <path d="M0 560 L120 520 L220 550 L320 515 L390 540 V660 H0Z" fill="#2D6A62" />
        <g fill="#0D2B2E">
          <path d="M70 560 V470 H320 V560Z" />
          <path d="M52 474 L92 430 H298 L338 474Z" />
          <rect x="88" y="500" width="34" height="60" fill="#FFD58A" />
          <rect x="140" y="498" width="60" height="30" fill="#FFD58A" />
          <rect x="214" y="498" width="60" height="30" fill="#FFD58A" />
          <rect x="286" y="498" width="22" height="62" fill="#FFD58A" />
          <rect x="170" y="400" width="52" height="30" rx="4" />
          <rect x="194" y="384" width="4" height="18" />
          <rect x="0" y="560" width="390" height="40" />
          <rect x="30" y="500" width="5" height="62" />
          <circle cx="32" cy="496" r="7" fill="#FFD58A" />
          <rect x="356" y="500" width="5" height="62" />
          <circle cx="358" cy="496" r="7" fill="#FFD58A" />
        </g>
        <circle cx="52" cy="150" r="5" fill="#fff" />
        <circle cx="330" cy="120" r="6" fill="#F5A524" />
        <circle cx="96" cy="246" r="3.5" fill="#F5A524" />
        <circle cx="300" cy="230" r="4" fill="#fff" />
        <circle cx="40" cy="330" r="4" fill="#fff" />
        <circle cx="352" cy="330" r="3.5" fill="#F5A524" />
        <circle cx="150" cy="92" r="3.5" fill="#fff" />
        <circle cx="248" cy="70" r="4.5" fill="#fff" />
        <rect y="600" width="390" height="244" fill="#0D2B2E" />
      </svg>
  );
}
