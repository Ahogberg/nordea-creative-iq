"use client";

// Fokusgruppens svar i Motion Studios chatt. Siffrorna är simulerade
// reaktioner — kortet säger det, visar spridningen mellan upprepade svar och
// varifrån segmentvikterna kommer.

import { useState } from "react";
import { Users, Wand2, ChevronDown, ChevronUp } from "lucide-react";
import { useStudioStore, type ChatAudience } from "@/lib/studio/store";
import type { AudienceCompareResponse, AudienceTestResponse } from "@/lib/audience/types";
import type { CalibrationStatus } from "@/lib/audience/calibration";

function clickColor(v: number): string {
  if (v >= 60) return "var(--color-nordea-green)";
  if (v >= 40) return "var(--color-nordea-amber)";
  return "var(--color-nordea-rose)";
}

export function AudienceBlock({ messageId, audience }: { messageId: string; audience: ChatAudience }) {
  if (audience.status !== "done" || !audience.data) return null;
  return audience.kind === "test" ? (
    <AudienceTestCard messageId={messageId} data={audience.data} />
  ) : (
    <AudienceCompareCard data={audience.data} />
  );
}

function AudienceTestCard({ messageId, data }: { messageId: string; data: AudienceTestResponse }) {
  const fix = useStudioStore((s) => s.fixFromAudience);
  const busy = useStudioStore((s) => s.isChatBusy);
  const [open, setOpen] = useState<string | null>(null);
  const score = data.weightSource ? data.summary.weighted : data.summary.unweighted;
  const failed = data.personas.filter((p) => p.error).length;
  const sorted = [...data.personas].sort((a, b) => (b.wouldClick?.mean ?? -1) - (a.wouldClick?.mean ?? -1));

  return (
    <div className="mt-2.5 rounded-lg border border-nordea-hairline bg-nordea-bg/60 p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-nordea-text-secondary">
        <Users className="w-3.5 h-3.5 text-nordea-blue" />
        Fokusgrupp
        <span className="font-normal text-nordea-text-tertiary">· simulerad, inte en prognos</span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-nordea-deep">{score}%</span>
        <span className="text-[11px] text-nordea-text-tertiary leading-tight">
          klickvilja{data.weightSource ? ", viktad efter segmentens storlek" : ""}
          <br />
          {data.summary.clickers} av {data.summary.responded} segment skulle klicka
        </span>
      </div>

      <ul className="mt-2 space-y-1">
        {sorted.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setOpen(open === p.id ? null : p.id)}
              disabled={!!p.error}
              className="w-full flex items-center gap-2 text-left rounded-md px-1 py-0.5 hover:bg-white disabled:hover:bg-transparent"
            >
              <span className="text-sm w-5 text-center flex-shrink-0">{p.avatar}</span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px] text-nordea-text flex-1 min-w-0 truncate">{p.name}</span>
                  {p.wouldClick ? (
                    <>
                      <span
                        className="text-[11px] tabular-nums text-nordea-text flex-shrink-0"
                        title={`${p.wouldClick.n} svar: ${p.wouldClick.min}–${p.wouldClick.max} %`}
                      >
                        {p.wouldClick.mean}%
                        {p.wouldClick.n > 1 && <span className="text-nordea-text-faint"> ±{p.wouldClick.sd}</span>}
                      </span>
                      {open === p.id ? (
                        <ChevronUp className="w-3 h-3 text-nordea-text-faint flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-nordea-text-faint flex-shrink-0" />
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] text-nordea-rose flex-shrink-0">inget svar</span>
                  )}
                </span>
                {p.wouldClick && (
                  <span className="relative block mt-1 h-1 rounded-full bg-nordea-blue-soft">
                    <span
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{ width: `${p.wouldClick.mean}%`, backgroundColor: clickColor(p.wouldClick.mean) }}
                    />
                    {/* Spannet mellan personans lägsta och högsta svar */}
                    {p.wouldClick.n > 1 && (
                      <span
                        className="absolute -top-px h-[calc(100%+2px)] rounded-full border border-nordea-deep/40"
                        style={{
                          left: `${p.wouldClick.min}%`,
                          width: `${Math.max(2, p.wouldClick.max - p.wouldClick.min)}%`,
                        }}
                      />
                    )}
                  </span>
                )}
              </span>
            </button>
            {open === p.id && p.wouldClick && (
              <div className="ml-7 mt-1 mb-1.5 space-y-1 text-[11px] leading-snug">
                {p.quote && <p className="italic text-nordea-text-secondary">”{p.quote}”</p>}
                {p.objections && p.objections.length > 0 && (
                  <p className="text-nordea-text">
                    <span className="text-nordea-text-tertiary">Invänder: </span>
                    {p.objections.join(" · ")}
                  </p>
                )}
                {p.dropOff && (
                  <p className="text-nordea-text">
                    <span className="text-nordea-text-tertiary">Slutar titta: </span>
                    {p.dropOff}
                  </p>
                )}
                {p.population && <p className="text-[10px] text-nordea-text-faint">Segmentet: {p.population}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => void fix(messageId)}
        disabled={busy || data.summary.responded === 0}
        className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-nordea-blue hover:bg-nordea-deep disabled:opacity-50 rounded-md px-2.5 py-1.5"
      >
        <Wand2 className="w-3.5 h-3.5" />
        Rätta detta
      </button>

      <Footnote
        lines={[
          `${data.samples} oberoende svar per persona${data.frameCount > 0 ? `, ${data.frameCount} bildrutor + manus` : ", bara manus (ingen renderare)"}${failed > 0 ? ` · ${failed} utan svar räknas inte` : ""}.`,
          data.weightSource ? `Vikter: ${data.weightSource}.` : "Ovägt snitt — segmentstatistik saknas för minst en persona.",
        ]}
        calibration={data.calibration}
      />
    </div>
  );
}

function AudienceCompareCard({ data }: { data: AudienceCompareResponse }) {
  const b = data.summary.weightedPreferB;
  const failed = data.personas.filter((p) => p.error).length;
  return (
    <div className="mt-2.5 rounded-lg border border-nordea-hairline bg-nordea-bg/60 p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-nordea-text-secondary">
        <Users className="w-3.5 h-3.5 text-nordea-blue" />
        Före eller efter?
        <span className="font-normal text-nordea-text-tertiary">· simulerat parvis val</span>
      </div>

      <div className="mt-2 flex h-2 rounded-full overflow-hidden bg-nordea-blue-soft">
        <div className="h-full bg-nordea-border-emphasis" style={{ width: `${100 - b}%` }} />
        <div className="h-full bg-nordea-blue" style={{ width: `${b}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums">
        <span className="text-nordea-text-secondary">Före {100 - b}%</span>
        <span className="font-medium text-nordea-blue">Efter {b}%</span>
      </div>

      <ul className="mt-2 space-y-1.5">
        {data.personas.map((p) => (
          <li key={p.id} className="text-[11px] leading-snug">
            <div className="flex items-center gap-2">
              <span className="text-sm w-5 text-center">{p.avatar}</span>
              <span className="flex-1 min-w-0 truncate text-nordea-text">{p.name}</span>
              {p.votes ? (
                <span className="tabular-nums text-nordea-text-secondary">
                  {p.votes.A} före · {p.votes.B} efter{p.votes.ingen > 0 ? ` · ${p.votes.ingen} ingen` : ""}
                </span>
              ) : (
                <span className="text-[10px] text-nordea-rose">inget svar</span>
              )}
            </div>
            {p.why && <p className="ml-7 italic text-nordea-text-tertiary">”{p.why}”</p>}
          </li>
        ))}
      </ul>

      <Footnote
        lines={[
          `${data.samples} val per persona, ordningen slumpad varje gång${failed > 0 ? ` · ${failed} utan svar räknas inte` : ""}.`,
          data.weightSource ? `Vikter: ${data.weightSource}.` : "Ovägt — segmentstatistik saknas för minst en persona.",
        ]}
        calibration={data.calibration}
      />
    </div>
  );
}

function Footnote({ lines, calibration }: { lines: string[]; calibration: CalibrationStatus }) {
  return (
    <div className="mt-2 pt-2 border-t border-nordea-hairline space-y-0.5 text-[10px] leading-snug text-nordea-text-faint">
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
      <p className={calibration.correlation === null ? "text-nordea-amber" : undefined}>{calibration.label}.</p>
    </div>
  );
}
