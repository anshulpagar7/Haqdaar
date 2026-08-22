/* Four full-bleed scenes for the scroll story. Flat vector, all original.
   Continuous motion is CSS; the cross-fade between scenes is driven by the
   IntersectionObserver in ScrollStory. */

export function SceneFarm() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="f-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BFE6F2" /><stop offset="55%" stopColor="#E7F3DE" />
          <stop offset="100%" stopColor="#F6F2E2" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#f-sky)" />
      <g transform="translate(1160,170)">
        <g className="sk-spin-slow">
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x="-2.5" y="-108" width="5" height="26" rx="2.5"
                  fill="#F2A93B" opacity=".55" transform={`rotate(${i * 25.7})`} />
          ))}
        </g>
        <circle r="58" fill="#F2A93B" opacity=".22" /><circle r="40" fill="#FFC65B" />
      </g>
      {/* hills */}
      <path d="M0 540q220-120 430-40t420-30 590 60v370H0z" fill="#B9D9A8" />
      <path d="M0 610q250-90 470-20t480-30 490 50v290H0z" fill="#8DC47F" />
      <path d="M0 690q300-60 560 0t880-20v230H0z" fill="#5FA96A" />
      {/* field rows */}
      {[720, 760, 802, 848, 898].map((y, r) => (
        <path key={y} d={`M-40 ${y}q400-26 760 0t760 0`} stroke="#3F8B54"
              strokeWidth={3 + r} fill="none" opacity={.35 + r * .08} />
      ))}
      {/* crops */}
      {Array.from({ length: 26 }, (_, i) => (
        <g key={i} transform={`translate(${40 + i * 56},${700 + (i % 3) * 34})`}>
          <g className="sk-sway" style={{ animationDelay: `${i * -0.25}s` }}>
            <path d="M0 0v-40" stroke="#2E7D4F" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M0-14q-13-8-15-22 15 2 15 16" fill="#48A56C" />
            <path d="M0-26q13-8 15-22-15 2-15 16" fill="#61C084" />
            <circle cy="-42" r="5" fill="#F2A93B" />
          </g>
        </g>
      ))}
      {/* tractor */}
      <g className="sk-drive">
        <g transform="translate(0,742)">
          <path d="M-6 -6q26-16 52 0" stroke="#8A9A90" strokeWidth="3" fill="none" opacity=".5" />
          <rect x="26" y="-70" width="66" height="46" rx="9" fill="#2E7D4F" />
          <rect x="34" y="-62" width="24" height="22" rx="4" fill="#CDE9DA" />
          <rect x="0" y="-40" width="128" height="30" rx="8" fill="#1C5836" />
          <rect x="96" y="-58" width="34" height="20" rx="6" fill="#2E7D4F" />
          <rect x="112" y="-84" width="8" height="28" rx="4" fill="#274C3A" />
          <g className="sk-puff"><circle cx="116" cy="-92" r="8" fill="#DCE7DF" /></g>
          <g className="sk-wheel">
            <circle cx="26" cy="-4" r="26" fill="#2A2A2A" />
            <circle cx="26" cy="-4" r="12" fill="#D9812A" />
            <path d="M26-30v52M0-4h52M8-22l36 36M44-22 8 14" stroke="#4A4A4A" strokeWidth="3" />
          </g>
          <g className="sk-wheel" style={{ animationDuration: "1.1s" }}>
            <circle cx="106" cy="-8" r="20" fill="#2A2A2A" />
            <circle cx="106" cy="-8" r="9" fill="#D9812A" />
            <path d="M106-28v40M86-8h40" stroke="#4A4A4A" strokeWidth="3" />
          </g>
        </g>
      </g>
      {/* farmer */}
      <g transform="translate(300,700)">
        <path d="M-17 84q17-50 34 0z" fill="#3E7A54" />
        <rect x="-16" y="30" width="32" height="56" rx="13" fill="#4E8F63" />
        <g className="sk-wave">
          <path d="M14 44l22-30" stroke="#B9764A" strokeWidth="9" strokeLinecap="round" />
        </g>
        <rect x="-4" y="19" width="9" height="14" rx="4" fill="#B9764A" />
        <circle cy="7" r="16" fill="#B9764A" />
        <path d="M-19 3q19-16 38 0l3-6q-22-14-44 0z" fill="#E8B04B" />
        <ellipse cy="-1" rx="23" ry="4.5" fill="#F2C766" />
      </g>
      <g className="sk-birds"><path d="M0 0q9-9 18 0" stroke="#4E6157" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M28 12q7-7 14 0" stroke="#4E6157" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".7" /></g>
    </svg>
  );
}

export function SceneSchool() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9FD4EC" /><stop offset="60%" stopColor="#D8EEF7" />
          <stop offset="100%" stopColor="#F3F1E4" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#s-sky)" />
      {[[180, 150, 1], [620, 110, .8], [1090, 180, 1.15]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x},${y}) scale(${s})`}>
          <g className="sk-cloud" style={{ animationDelay: `${i * -9}s` }}>
            <ellipse cx="0" cy="0" rx="62" ry="30" fill="#fff" opacity=".92" />
            <ellipse cx="46" cy="10" rx="46" ry="24" fill="#fff" opacity=".92" />
            <ellipse cx="-44" cy="12" rx="38" ry="20" fill="#fff" opacity=".92" />
          </g>
        </g>
      ))}
      <path d="M0 640q300-70 720 0t720-20v280H0z" fill="#7FB88C" />
      <path d="M0 730q360-40 720 10t720-10v170H0z" fill="#5FA96A" />
      {/* school */}
      <g transform="translate(430,300)">
        <rect x="0" y="120" width="580" height="290" rx="10" fill="#F6EFDD" />
        <rect x="0" y="120" width="580" height="26" fill="#D9812A" />
        <path d="M-30 120 290 26l320 94z" fill="#B4552F" />
        <rect x="240" y="0" width="100" height="34" rx="6" fill="#F6EFDD" />
        <path d="M290 0V-58" stroke="#7A6A4E" strokeWidth="6" strokeLinecap="round" />
        <g className="sk-flag"><path d="M292-58h68l-14 18 14 18h-68z" fill="#2E7D4F" /></g>
        {[40, 150, 260, 370, 480].map((x) => (
          <g key={x}><rect x={x} y="180" width="66" height="74" rx="6" fill="#2E6E8E" opacity=".85" />
            <path d={`M${x + 33} 180v74M${x} 217h66`} stroke="#F6EFDD" strokeWidth="4" /></g>
        ))}
        <rect x="252" y="300" width="76" height="110" rx="6" fill="#8A5A34" />
        <circle cx="316" cy="358" r="5" fill="#F2C766" />
        <rect x="40" y="300" width="66" height="70" rx="6" fill="#2E6E8E" opacity=".7" />
        <rect x="474" y="300" width="66" height="70" rx="6" fill="#2E6E8E" opacity=".7" />
        {/* student at a window, reading */}
        <g transform="translate(413,206)">
          <circle cy="0" r="14" fill="#C98B5E" />
          <path d="M-14-2q0-16 14-16t14 16q-4-10-14-10t-14 10z" fill="#2A2118" />
          <rect x="-15" y="14" width="30" height="30" rx="10" fill="#B4552F" />
          <g className="sk-read"><rect x="-14" y="26" width="28" height="16" rx="2" fill="#F6EFDD" /></g>
        </g>
      </g>
      {/* children walking */}
      {[[210, 0], [286, -1.1], [1140, -2.2]].map(([x, d], i) => (
        <g key={i} transform={`translate(${x},742)`}>
        <g className="sk-bob" style={{ animationDelay: `${d}s` }}>
          <path d="M-13 56q13-34 26 0z" fill={i === 1 ? "#2E6E8E" : "#B4552F"} />
          <rect x="-12" y="24" width="24" height="34" rx="10" fill={i === 1 ? "#3C82A5" : "#C4623A"} />
          <rect x="-3" y="16" width="7" height="11" rx="3" fill="#C98B5E" />
          <circle cy="6" r="13" fill="#C98B5E" />
          <path d="M-13 4q0-15 13-15t13 15q-4-9-13-9t-13 9z" fill="#2A2118" />
          <rect x="10" y="28" width="16" height="20" rx="3" fill="#2E7D4F" />
        </g></g>
      ))}
      <g transform="translate(150,560)">
        <path d="M0 190V70" stroke="#7A5A38" strokeWidth="16" strokeLinecap="round" />
        <circle cy="40" r="60" fill="#3F8B54" /><circle cx="-48" cy="70" r="40" fill="#4E9B62" />
        <circle cx="48" cy="66" r="44" fill="#357C4A" />
      </g>
    </svg>
  );
}

export function SceneWork() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F6C98A" /><stop offset="50%" stopColor="#F7E0BC" />
          <stop offset="100%" stopColor="#F5EEE0" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#w-sky)" />
      <circle cx="270" cy="230" r="70" fill="#F2A93B" opacity=".55" />
      {/* skyline */}
      <g fill="#C9AE8E" opacity=".75">
        <rect x="60" y="430" width="110" height="300" /><rect x="190" y="360" width="90" height="370" />
        <rect x="300" y="470" width="130" height="260" /><rect x="1120" y="400" width="120" height="330" />
        <rect x="1260" y="480" width="100" height="250" />
      </g>
      {/* crane */}
      <g transform="translate(880,140)">
        <path d="M0 20v560" stroke="#D9812A" strokeWidth="14" />
        <path d="M0 60h-30M0 140h-30M0 220h-30M0 300h-30" stroke="#D9812A" strokeWidth="6" opacity=".7" />
        <g className="sk-crane">
          <path d="M-150 20h430" stroke="#D9812A" strokeWidth="12" strokeLinecap="round" />
          <path d="M0-46l150 66M0-46l-92 66" stroke="#D9812A" strokeWidth="5" />
          <path d="M0 20V-46" stroke="#D9812A" strokeWidth="8" />
          <g className="sk-hook"><path d="M200 22v78" stroke="#7A6A4E" strokeWidth="4" />
            <rect x="176" y="100" width="48" height="34" rx="4" fill="#8A5A34" /></g>
        </g>
      </g>
      <path d="M0 700h1440v200H0z" fill="#B0A184" />
      <path d="M0 700q360-24 720 6t720-6" stroke="#8E8069" strokeWidth="5" fill="none" />
      {/* scaffold + worker */}
      <g transform="translate(790,420)">
        <path d="M0 280V0h300v280" stroke="#8E8069" strokeWidth="7" fill="none" />
        <path d="M0 90h300M0 180h300" stroke="#8E8069" strokeWidth="7" />
        <rect x="190" y="190" width="60" height="24" rx="3" fill="#B4552F" />
        <rect x="196" y="216" width="60" height="24" rx="3" fill="#C4623A" />
        <rect x="182" y="242" width="60" height="24" rx="3" fill="#B4552F" />
        <g transform="translate(90,150)">
          <g transform="translate(24,44)"><g className="sk-hammer">
            <path d="M0 0l34-30" stroke="#7A5A38" strokeWidth="6" strokeLinecap="round" />
            <rect x="28" y="-40" width="24" height="14" rx="3" fill="#9A9A9A" transform="rotate(-40 40 -33)" />
          </g></g>
          <path d="M-18 96q18-54 36 0z" fill="#2E6E8E" />
          <rect x="-17" y="42" width="34" height="58" rx="14" fill="#3C82A5" />
          <path d="M-19 62h38" stroke="#F2C766" strokeWidth="8" strokeLinecap="round" />
          <rect x="-4" y="30" width="9" height="15" rx="4" fill="#A9663D" />
          <circle cy="17" r="17" fill="#A9663D" />
          <path d="M-18 12a18 15 0 0 1 36 0z" fill="#F2A93B" />
          <rect x="-24" y="9" width="48" height="7" rx="3.5" fill="#D9812A" />
        </g>
        {[0, 1, 2].map((i) => (
          <circle key={i} className="sk-spark" style={{ animationDelay: `${i * -0.5}s` }}
                  cx="196" cy="188" r="3" fill="#D9812A" />
        ))}
      </g>
      {/* mixer */}
      <g transform="translate(1080,640)">
        <path d="M0 60h120M14 60V22M106 60V22" stroke="#8E8069" strokeWidth="7" />
        <g className="sk-spin">
          <ellipse cx="60" cy="6" rx="46" ry="34" fill="#D9812A" />
          <path d="M22 6h76M60-28v68" stroke="#B4552F" strokeWidth="5" />
        </g>
      </g>
    </svg>
  );
}

export function SceneHome() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="h-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3B27A" /><stop offset="45%" stopColor="#F7D9AE" />
          <stop offset="100%" stopColor="#F4EFE0" />
        </linearGradient>
        <radialGradient id="h-lamp"><stop offset="0%" stopColor="#FFD98A" stopOpacity=".85" />
          <stop offset="100%" stopColor="#FFD98A" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#h-sky)" />
      <circle cx="1180" cy="290" r="86" fill="#F2A93B" opacity=".7" />
      <path d="M0 600q300-60 720 10t720-30v320H0z" fill="#9BBF8E" />
      <path d="M0 700q340-40 720 14t720-14v200H0z" fill="#6BA372" />
      {/* houses */}
      {[[180, 0], [1180, 1]].map(([x, k]) => (
        <g key={x} transform={`translate(${x},470)`}>
          <rect x="0" y="90" width="230" height="180" rx="8" fill="#F0E4CE" />
          <path d="M-24 90 115 6l139 84z" fill="#B4552F" />
          <rect x="86" y="176" width="58" height="94" rx="5" fill="#8A5A34" />
          <rect x="24" y="130" width="46" height="42" rx="5" fill="#E8912A" opacity=".8" />
          <rect x="160" y="130" width="46" height="42" rx="5" fill="#E8912A" opacity=".8" />
          {k === 0 && <>
            <rect x="176" y="24" width="22" height="46" fill="#A5644A" />
            {[0, 1, 2].map((i) => (
              <circle key={i} className="sk-smoke" style={{ animationDelay: `${i * -2}s` }}
                      cx="187" cy="18" r="10" fill="#E6DCCB" />
            ))}
          </>}
        </g>
      ))}
      {/* tree + leaves */}
      <g transform="translate(540,400)">
        <path d="M0 320V120" stroke="#7A5A38" strokeWidth="22" strokeLinecap="round" />
        <circle cy="70" r="92" fill="#3F8B54" /><circle cx="-78" cy="112" r="60" fill="#4E9B62" />
        <circle cx="80" cy="106" r="66" fill="#357C4A" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${-60 + i * 44},170)`}>
            <path className="sk-leaf" style={{ animationDelay: `${i * -1.8}s` }}
                  d="M0 0q9-10 0-18-9 8 0 18z" fill="#61C084" />
          </g>
        ))}
      </g>
      {/* bench + elders */}
      <g transform="translate(330,700)">
        <ellipse cx="150" cy="-46" rx="150" ry="80" fill="url(#h-lamp)" />
        <rect x="10" y="16" width="290" height="12" rx="6" fill="#6B4E33" />
        <rect x="10" y="-28" width="290" height="10" rx="5" fill="#7A5A3C" />
        <rect x="26" y="28" width="10" height="42" fill="#5A4229" />
        <rect x="274" y="28" width="10" height="42" fill="#5A4229" />
        {[[74, "#9A8CB0"], [196, "#7E6E96"]].map(([x, c], i) => (
          <g key={i} transform={`translate(${x},-40)`}>
          <g className={i ? "sk-bob" : ""}>
            <path d="M-17 56q17-46 34 0z" fill={c as string} />
            <rect x="-16" y="14" width="32" height="46" rx="13" fill={c as string} />
            <rect x="-4" y="2" width="9" height="14" rx="4" fill={i ? "#A9663D" : "#D69A6C"} />
            <circle cy="-12" r="16" fill={i ? "#A9663D" : "#D69A6C"} />
            <path d="M-16-14q0-18 16-18t16 18q-4-11-16-11t-16 11z" fill="#EDEAF2" />
            {i === 1 && <path d="M20 18v42" stroke="#7A5A38" strokeWidth="4" strokeLinecap="round" />}
          </g></g>
        ))}
      </g>
      <g className="sk-birds"><path d="M0 0q9-9 18 0" stroke="#8A6A50" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M28 12q7-7 14 0" stroke="#8A6A50" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".7" /></g>
    </svg>
  );
}
