import { CheckCircle2, Sparkles } from "lucide-react";

// Vänsterhalvan på login: en levande vitrin av det plattformen gör —
// annonser i flera format, persona-reaktioner och QA-poäng. Ren CSS,
// inga bildfiler. Rörelsen stängs av vid prefers-reduced-motion.

const ADS = [
  {
    className: "left-[7%] top-[15%] w-[150px] rotate-[-6deg] [animation-delay:0s]",
    ratio: "9 / 16",
    bg: "#0000A0",
    headline: "Drömhuset väntar",
    sub: "Räkna på ditt bolån",
    accent: "#40BFA3",
    format: "9:16",
  },
  {
    className: "left-[38%] top-[11%] w-[190px] rotate-[3deg] [animation-delay:-2s]",
    ratio: "1 / 1",
    bg: "#FBD9CA",
    headline: "Det är aldrig för sent att börja",
    sub: "Boka 30 min med en rådgivare",
    accent: "#0000A0",
    format: "1:1",
    dark: true,
  },
  {
    className: "left-[25%] top-[40%] w-[210px] rotate-[-2deg] [animation-delay:-4s]",
    ratio: "4 / 5",
    bg: "#00005E",
    headline: "Innan du bokar — kolla kortförmånerna",
    sub: "Gäller vissa Nordea-kreditkort",
    accent: "#40BFA3",
    format: "4:5",
  },
];

export function LoginShowcase() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Ljus och rutnät */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(64,191,163,0.25),transparent_45%),radial-gradient(ellipse_at_90%_90%,rgba(51,153,255,0.25),transparent_50%)]" />
      <div aria-hidden className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      {ADS.map((ad) => (
        <div
          key={ad.headline}
          className={`absolute login-float motion-reduce:animate-none ${ad.className}`}
        >
          <div
            className="rounded-2xl p-4 flex flex-col justify-between shadow-[0_30px_60px_-20px_rgba(0,0,40,0.6)] ring-1 ring-white/10"
            style={{ aspectRatio: ad.ratio, background: ad.bg }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-bold tracking-wide ${ad.dark ? "text-[#0000A0]" : "text-white"}`}>Nordea</span>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${ad.dark ? "bg-[#0000A0]/10 text-[#0000A0]" : "bg-white/15 text-white/80"}`}>
                {ad.format}
              </span>
            </div>
            <div>
              <div className={`nordea-display text-[15px] leading-tight ${ad.dark ? "text-[#0000A0]" : "text-white"}`}>{ad.headline}</div>
              <div className={`text-[9px] mt-1 ${ad.dark ? "text-[#0000A0]/70" : "text-white/70"}`}>{ad.sub}</div>
              <div className="mt-2.5 inline-block rounded-full px-2.5 py-1 text-[8px] font-semibold" style={{ background: ad.accent, color: ad.dark ? "white" : "#00005E" }}>
                Läs mer
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Persona-reaktion */}
      <div className="absolute right-[6%] top-[31%] w-[230px] login-float motion-reduce:animate-none [animation-delay:-1s]">
        <div className="rounded-2xl bg-white/95 backdrop-blur p-3.5 shadow-[0_20px_50px_-15px_rgba(0,0,40,0.5)]">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nordea-teal to-nordea-green text-white text-[11px] font-semibold flex items-center justify-center">AJ</div>
            <div className="leading-tight">
              <div className="text-[11px] font-semibold text-nordea-text">Anna, 42</div>
              <div className="text-[9px] text-nordea-text-tertiary">Spararen</div>
            </div>
            <span className="ml-auto text-[10px] font-semibold text-nordea-green">74 %</span>
          </div>
          <p className="text-[10.5px] leading-snug text-nordea-text-secondary">
            &ldquo;Tydligt och lugnt. Jag vill bara se vad det kostar innan jag klickar.&rdquo;
          </p>
        </div>
      </div>

      {/* QA-poäng */}
      <div className="absolute right-[9%] top-[55%] login-float motion-reduce:animate-none [animation-delay:-3s]">
        <div className="rounded-2xl bg-white/95 backdrop-blur px-4 py-3 shadow-[0_20px_50px_-15px_rgba(0,0,40,0.5)] flex items-center gap-3">
          <div className="relative w-11 h-11">
            <svg viewBox="0 0 44 44" className="-rotate-90 w-11 h-11">
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(0,0,160,0.1)" strokeWidth="5" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="#1FA084" strokeWidth="5" strokeLinecap="round" strokeDasharray="113" strokeDashoffset="15" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-nordea-deep">87</span>
          </div>
          <div className="leading-tight">
            <div className="text-[11px] font-semibold text-nordea-text flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-nordea-green" /> QA godkänd
            </div>
            <div className="text-[9.5px] text-nordea-text-tertiary">Compliance · ToV · Persona-jury</div>
          </div>
        </div>
      </div>

      {/* AI-chip */}
      <div className="absolute right-[5%] top-[14%] login-float motion-reduce:animate-none [animation-delay:-5s]">
        <div className="rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur px-3.5 py-2 text-white text-[11px] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-nordea-teal" /> 3 varianter genererade · 4 format
        </div>
      </div>
    </div>
  );
}
