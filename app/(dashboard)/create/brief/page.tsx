"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Rocket } from "lucide-react";

/**
 * /create/brief — STUB.
 *
 * Planned scope: paste/upload a campaign brief → Claude extracts product,
 * target persona, channels, KPI:s → generates a multi-asset draft kit
 * (copy variants, video templates, suggested formats) which the user
 * iterates on. Wires into Sprint 9's Inngest queue for the heavy work.
 *
 * Sprint 7 ships only the empty-state shell so the route exists, the
 * sidebar link doesn't 404, and the design tokens land. Brief-mode
 * implementation is its own sprint.
 */
export default function CreateBriefPage() {
  return (
    <div className="main-content">
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <Link
          href="/create"
          className="inline-flex items-center gap-2 text-sm text-nordea-text-tertiary hover:text-nordea-text mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till Create
        </Link>

        <div className="w-16 h-16 bg-nordea-teal/10 text-nordea-teal rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-7 h-7" />
        </div>

        <h1 className="nordea-display text-3xl text-nordea-deep mb-3">
          Från brief → komplett kampanj
        </h1>
        <p className="text-nordea-text-secondary mb-10 leading-relaxed">
          Klistra in en kampanjbrief så extraherar AI:n produkt, målgrupp,
          kanaler och KPI:er — och bygger ett första utkast med copy,
          mall-förslag och format. Du itererar därifrån.
        </p>

        <div className="bg-white border border-nordea-border rounded-2xl p-8 text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-nordea-amber-soft text-nordea-amber flex items-center justify-center text-xs font-semibold">
              !
            </div>
            <span className="text-sm font-medium text-nordea-text">
              Kommer i en senare sprint
            </span>
          </div>
          <p className="text-sm text-nordea-text-secondary leading-relaxed">
            Brief-läget kräver bakgrundsjobbskö (Inngest, Sprint 9) eftersom
            generering tar längre än en standard-request. Under tiden:
            kombinera <Link href="/create/copy" className="text-nordea-blue underline">Copy</Link>{" "}
            + <Link href="/create/video" className="text-nordea-blue underline">Video</Link>{" "}
            manuellt — eller starta från en{" "}
            <Link href="/templates" className="text-nordea-blue underline">mall</Link>.
          </p>
        </div>

        <Link
          href="/templates"
          className="inline-flex items-center gap-2 nordea-btn nordea-btn-primary nordea-btn-lg mt-8"
        >
          <Rocket className="w-4 h-4" />
          Börja från en mall istället
        </Link>
      </div>
    </div>
  );
}
