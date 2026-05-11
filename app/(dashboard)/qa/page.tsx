"use client";

import { Download, CheckCircle2, X, AlertCircle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { SectionTitle } from "@/components/layout/section-title";
import { NordeaBadge } from "@/components/ui/nordea-badge";

// ── MOCK DATA — TODO Sprint 8+ ─────────────────────────────────────────────
// This page renders a sample QA report so the design pattern is visible.
// Real wiring will fetch the latest /api/qa/[id] (or list via a new
// /api/qa endpoint that doesn't exist yet) and render the actual report.
// Data shape below matches QAReport type in lib/qa/types.ts so swapping
// in real data is a straight replacement.

const MOCK_REPORT = {
  total_score: 87,
  status: "pass" as const,
  threshold: 80,
  breakdowns: [
    { label: "Persona-jury", value: 84, color: "var(--nordea-green)" },
    { label: "Tone of voice", value: 91, color: "var(--nordea-teal)" },
    { label: "Compliance", value: 92, color: "var(--nordea-blue)" },
    { label: "Heatmap focus", value: 79, color: "var(--nordea-amber)" },
  ],
  suggestions: [
    { tone: "amber" as const, title: "Slow down headline by 0.4s", sub: "Lars (67) reports text reads too fast." },
    { tone: "cobalt" as const, title: "Add amorteringsfrihet line", sub: "Erik (52) — missing detail." },
    { tone: "green" as const, title: "Tone is on-brand", sub: "No changes needed." },
  ],
  personas: [
    { name: "Anna, 34", role: "Förstagångsköpare bostad", score: 92, take: '"Känns ärlig och konkret. Räkneknappen är tydlig."', tone: "green" as const },
    { name: "Erik, 52", role: "Befintlig bolånekund", score: 84, take: '"Visa något om amorteringsfrihet — saknas."', tone: "cobalt" as const },
    { name: "Sofia, 28", role: "Hyresgäst, börjar fundera", score: 88, take: '"Snyggt, men jag vill veta vad ett ja kostar."', tone: "green" as const },
    { name: "Lars, 67", role: "Pensionär, andrahandsboende", score: 71, take: '"Texten går för fort. Ge mig 1 sekund till."', tone: "amber" as const },
  ],
  tov: [
    { axis: "Personlig", value: 78, target: 70 },
    { axis: "Expert", value: 64, target: 65 },
    { axis: "Ansvarsfull", value: 88, target: 80 },
  ],
  compliance: [
    { ok: true, label: "Riskinformation present", sub: "§ 6.2.1" },
    { ok: true, label: "Effektiv ränta visible", sub: "§ 4.1" },
    { ok: true, label: "Disclaimer time ≥ 2s", sub: "2.4s detected" },
    { ok: false, label: "Logo clear-space", sub: "8% short on left" },
    { ok: true, label: "Brand colors only", sub: "0 off-palette pixels" },
    { ok: true, label: "Subtitles present", sub: "WCAG AA" },
  ],
};

export default function QAReportsPage() {
  const r = MOCK_REPORT;
  const scoreColor =
    r.total_score >= 80
      ? "text-nordea-green"
      : r.total_score >= 70
        ? "text-nordea-amber"
        : "text-nordea-rose";

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={["QA-rapporter", "Bolån Hero — variant 03"]}
        right={
          <div className="flex gap-2">
            <button type="button" className="nordea-btn nordea-btn-secondary">
              <Download className="w-4 h-4" />
              Exportera rapport
            </button>
            <button type="button" className="nordea-btn nordea-btn-primary">
              <CheckCircle2 className="w-4 h-4" />
              Godkänn
            </button>
          </div>
        }
      />

      {/* Exempel-rapport banner */}
      <div className="px-8 pt-4">
        <div className="bg-nordea-amber-soft border border-nordea-amber/30 rounded-md px-4 py-2.5 flex items-center gap-2 text-xs text-nordea-amber">
          <AlertCircle className="w-3.5 h-3.5" />
          Exempelrapport — full QA-historik kommer i Sprint 8. Kör QA från Skapa → Video för att bedöma riktiga assets.
        </div>
      </div>

      <div className="px-8 py-6 grid grid-cols-[320px_1fr] gap-5 max-w-[1400px] mx-auto">
        {/* LEFT — total score */}
        <div className="flex flex-col gap-4">
          <div className="nordea-card p-6">
            <div className="nordea-eyebrow mb-4">Total QA-poäng</div>
            <div className="flex items-baseline gap-2">
              <span className={`nordea-display text-7xl tracking-tighter ${scoreColor}`}>
                {r.total_score}
              </span>
              <span className="text-base text-nordea-text-tertiary">/100</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <NordeaBadge tone="green" dot>
                Över tröskel
              </NordeaBadge>
              <span className="text-[11px] text-nordea-text-tertiary">
                Tröskel {r.threshold}
              </span>
            </div>
            <div className="mt-5 flex flex-col gap-3.5">
              {r.breakdowns.map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-nordea-text-secondary">{b.label}</span>
                    <span className="font-mono text-[11px]" style={{ color: b.color }}>
                      {b.value}
                    </span>
                  </div>
                  <div className="h-1.5 bg-nordea-bg-hover rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${b.value}%`, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="nordea-card p-4">
            <SectionTitle title="Förslag" hint={`${r.suggestions.length}`} />
            <div className="flex flex-col gap-2.5">
              {r.suggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 p-2.5 bg-nordea-bg-hover border border-nordea-hairline rounded-md"
                >
                  <span
                    className="w-1 rounded"
                    style={{
                      background:
                        s.tone === "amber"
                          ? "var(--nordea-amber)"
                          : s.tone === "cobalt"
                            ? "var(--nordea-blue)"
                            : "var(--nordea-teal)",
                    }}
                  />
                  <div>
                    <div className="text-xs font-medium text-nordea-text">{s.title}</div>
                    <div className="text-[11px] text-nordea-text-tertiary mt-0.5">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — sections */}
        <div className="grid grid-cols-2 gap-3.5 content-start">
          {/* Persona jury — full width */}
          <div className="nordea-card p-4 col-span-2">
            <SectionTitle
              title="Persona-jury"
              hint="4 personas · viktat snitt 84"
            />
            <div className="grid grid-cols-4 gap-2.5">
              {r.personas.map((p, i) => (
                <div
                  key={i}
                  className="p-3 bg-nordea-bg-hover border border-nordea-hairline rounded-md"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-nordea-blue-soft text-nordea-blue flex items-center justify-center text-[10px] font-semibold">
                      {p.name.split(" ")[0].charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-nordea-text">{p.name}</div>
                      <div className="text-[10px] text-nordea-text-tertiary truncate">
                        {p.role}
                      </div>
                    </div>
                    <span
                      className="font-mono text-[13px] font-semibold"
                      style={{
                        color:
                          p.tone === "green"
                            ? "var(--nordea-green)"
                            : p.tone === "cobalt"
                              ? "var(--nordea-blue)"
                              : "var(--nordea-amber)",
                      }}
                    >
                      {p.score}
                    </span>
                  </div>
                  <div className="text-[11px] text-nordea-text-secondary italic leading-relaxed">
                    {p.take}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ToV */}
          <div className="nordea-card p-4">
            <SectionTitle title="Tone of voice" hint="3 axlar" />
            <div className="flex flex-col gap-3.5">
              {r.tov.map((a) => (
                <div key={a.axis}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span>{a.axis}</span>
                    <span className="font-mono text-[11px] text-nordea-text-tertiary">
                      <span className="text-nordea-teal">{a.value}</span>
                      <span className="mx-1.5">/</span>
                      mål {a.target}
                    </span>
                  </div>
                  <div className="h-1.5 bg-nordea-bg-hover rounded-full relative overflow-hidden">
                    <div
                      className="absolute top-[-2px] bottom-[-2px] w-px bg-nordea-text-tertiary"
                      style={{ left: `${a.target}%` }}
                    />
                    <div
                      className="h-full bg-nordea-teal rounded-full"
                      style={{ width: `${a.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className="nordea-card p-4">
            <SectionTitle title="Compliance" hint={`${r.compliance.length} kontroller`} />
            <div className="flex flex-col gap-2">
              {r.compliance.map((c, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span
                    className={`w-4 h-4 rounded inline-flex items-center justify-center ${
                      c.ok ? "bg-nordea-green-soft text-nordea-green" : "bg-nordea-rose-soft text-nordea-rose"
                    }`}
                  >
                    {c.ok ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </span>
                  <span className="text-xs flex-1">{c.label}</span>
                  <span className="text-[11px] font-mono text-nordea-text-tertiary">{c.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap — full width */}
          <div className="nordea-card p-4 col-span-2">
            <SectionTitle title="Uppmärksamhets-heatmap" hint="Predikterat fokus · första 3s" />
            <div className="aspect-[16/6] bg-nordea-deep rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-nordea-deep via-nordea-blue to-nordea-deep opacity-90" />
              <div className="absolute left-[12%] top-[40%] w-24 h-24 rounded-full bg-nordea-rose/40 blur-2xl" />
              <div className="absolute left-[20%] top-[70%] w-16 h-16 rounded-full bg-nordea-amber/40 blur-2xl" />
              <div className="absolute left-[70%] top-[35%] w-20 h-20 rounded-full bg-nordea-amber/30 blur-2xl" />
              <div className="absolute left-[60%] top-[60%] w-12 h-12 rounded-full bg-nordea-blue/30 blur-xl" />
              <div className="absolute left-[5%] bottom-[15%] max-w-[50%]">
                <div className="nordea-display text-xl text-white/85">
                  Drömhuset — utan drömräntan
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-2.5 text-[11px] text-nordea-text-tertiary">
              <div className="flex gap-3.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-nordea-rose" />
                  Hett
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-nordea-amber" />
                  Varmt
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-nordea-blue" />
                  Kallt
                </span>
              </div>
              <span>Logo får 12% uppmärksamhet — inom mål</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
