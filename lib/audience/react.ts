// ── Personornas reaktion på en annons (server) ──
//
// Delas av Ad Studio (/api/persona-react) och Motion Studio
// (/api/studio/audience-*). Reaktionen är en simulering: AI:n spelar
// personan utifrån profilen och verifierad statistik om segmentet. Varje
// persona kan svara flera gånger så att spridningen syns.

import type Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai/anthropic";
import { PRODUCT_LABELS, type ProductCategory } from "@/lib/product-detection";
import {
  buildPersonaProfileBlock,
  buildVisualInstruction,
  type PersonaIdentity,
} from "@/lib/ai/prompts/persona-simulation";
import { summarize, type Spread } from "./aggregate";

type ImageBlock = Anthropic.ImageBlockParam;

export interface AdStimulus {
  copy: { headline: string; body: string; cta: string };
  channel: string;
  images: ImageBlock[];
  isVideo: boolean;
  /** Beskrivning när bild saknas, eller manus/tidslinje för en video. */
  description?: string;
  productCategory?: ProductCategory;
}

export interface PersonaReaction {
  firstImpression: string;
  wouldClick: number;
  emotionalResponse: string | null;
  objections: string[];
  relevance: { score: number; explanation?: string } | null;
  trustLevel: { score: number; explanation?: string } | null;
  whatWorked: string | null;
  firstNoticed: string | null;
  sawVisual: boolean;
  missingInfo: string | null;
  videoSpecific: { hookReaction?: string; watchTime?: string; dropOffReason?: string } | null;
  suggestion: string | null;
}

export interface SampledReaction {
  /** Första svaret — citat och invändningar visas från det. */
  reaction: PersonaReaction;
  wouldClick: Spread;
  relevance: Spread | null;
  trust: Spread | null;
  /** Invändningar från alla svar, vanligaste först. */
  objections: string[];
  /** Antal svar som faktiskt kom tillbaka. */
  samples: number;
}

export class ReactionError extends Error {}

function systemPrompt(identity: PersonaIdentity, s: AdStimulus): string {
  const productContext =
    s.productCategory && s.productCategory !== "general"
      ? `\nPRODUKTKATEGORI: ${PRODUCT_LABELS[s.productCategory]}\nTänk på hur relevant denna produktkategori är för dig utifrån din livssituation och dina behov.`
      : "";
  const hasVisual = s.images.length > 0;
  return `${buildPersonaProfileBlock(identity)}

Du ska reagera på en bankannons från Nordea.
${productContext}

INSTRUKTIONER:
- Reagera som denna persona skulle reagera i verkligheten — de flesta scrollar förbi de flesta annonser
- Var ärlig och autentisk – om annonsen inte tilltalar dig, säg det
- Tänk på dina specifika smärtpunkter och hur annonsen adresserar (eller missar) dem
- Bedöm relevansen utifrån din specifika livssituation och behov

Svara ENDAST i följande JSON-format:
{
  "firstImpression": "Din spontana reaktion (2-4 meningar, skriv i jag-form)",
  "wouldClick": 0-100,
  "emotionalResponse": "Vilka känslor väcker annonsen?",
  "objections": ["Invändning 1", "Invändning 2", "Invändning 3"],
  "relevance": { "score": 0-100, "explanation": "Hur relevant känns detta för din livssituation?" },
  "trustLevel": { "score": 0-100, "explanation": "Hur trovärdig känns annonsen?" },
  "whatWorked": "Vad i annonsen fungerade bra för dig? (1 mening)",${
    hasVisual ? `\n  "firstNoticed": "Vad du lade märke till först i bilden (max 10 ord)",` : ""
  }
  "missingInfo": "Vad saknar du för att ta nästa steg?"${
    s.isVideo
      ? `,\n  "videoSpecific": { "hookReaction": "Reaktion på första 3 sekunderna", "watchTime": "Hur länge skulle du titta?", "dropOffReason": "Om du skulle scrolla vidare – varför?" }`
      : ""
  },
  "suggestion": "Ett konkret förslag på hur annonsen kunde tilltala dig bättre"
}

Svara PÅ SVENSKA och i karaktär.`;
}

function userContent(identity: PersonaIdentity, s: AdStimulus): Anthropic.MessageParam["content"] {
  const hasVisual = s.images.length > 0;
  const text = `Reagera på denna ${s.isVideo ? "videoannons" : "annons"} på ${s.channel || "digital"}:

RUBRIK: ${s.copy.headline}
BRÖDTEXT: ${s.copy.body}
CTA: ${s.copy.cta}
${s.description ? `\n${hasVisual ? "MANUS OCH TIDSLINJE" : "VISUELLT MATERIAL"}: ${s.description}\n` : ""}${
    hasVisual ? `\n${buildVisualInstruction(s.isVideo ? "frames" : "image")}\n` : ""
  }
Ge din ärliga reaktion som ${identity.speakerName}.`;
  return [...s.images, { type: "text", text }];
}

function jsonFrom(text: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new ReactionError("AI:n svarade inte med JSON");
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    throw new ReactionError("AI:ns svar gick inte att tolka");
  }
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : null);

/** Ett svar från en persona. Kastar om svaret saknas eller inte går att tolka. */
export async function reactOnce(client: Anthropic, identity: PersonaIdentity, s: AdStimulus): Promise<PersonaReaction> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    temperature: 0.8,
    system: systemPrompt(identity, s),
    messages: [{ role: "user", content: userContent(identity, s) }],
  });
  const block = response.content[0];
  if (block?.type !== "text") throw new ReactionError("Tomt svar från AI:n");
  const p = jsonFrom(block.text);
  const wouldClick = num(p.wouldClick);
  if (wouldClick === null) throw new ReactionError("Svaret saknade klickvilja");
  const scored = (v: unknown) => {
    const o = v as { score?: unknown; explanation?: string } | undefined;
    const score = num(o?.score);
    return score === null ? null : { score, explanation: o?.explanation };
  };
  const hasVisual = s.images.length > 0;
  return {
    firstImpression: typeof p.firstImpression === "string" ? p.firstImpression : "",
    wouldClick,
    emotionalResponse: typeof p.emotionalResponse === "string" ? p.emotionalResponse : null,
    objections: Array.isArray(p.objections) ? p.objections.filter((o): o is string => typeof o === "string") : [],
    relevance: scored(p.relevance),
    trustLevel: scored(p.trustLevel),
    whatWorked: typeof p.whatWorked === "string" ? p.whatWorked : null,
    firstNoticed: hasVisual && typeof p.firstNoticed === "string" ? p.firstNoticed : null,
    sawVisual: hasVisual,
    missingInfo: typeof p.missingInfo === "string" ? p.missingInfo : null,
    videoSpecific: (p.videoSpecific as PersonaReaction["videoSpecific"]) ?? null,
    suggestion: typeof p.suggestion === "string" ? p.suggestion : null,
  };
}

/**
 * `n` oberoende svar från samma persona (parallellt). Misslyckade svar räknas
 * inte; kastar bara om inget svar alls kom tillbaka.
 */
export async function reactSampled(
  client: Anthropic,
  identity: PersonaIdentity,
  s: AdStimulus,
  n: number
): Promise<SampledReaction> {
  const settled = await Promise.allSettled(Array.from({ length: Math.max(1, n) }, () => reactOnce(client, identity, s)));
  const ok = settled.filter((r): r is PromiseFulfilledResult<PersonaReaction> => r.status === "fulfilled").map((r) => r.value);
  if (ok.length === 0) {
    const first = settled.find((r): r is PromiseRejectedResult => r.status === "rejected");
    throw first?.reason instanceof Error ? first.reason : new ReactionError("Inget svar från personan");
  }
  const counts = new Map<string, number>();
  for (const r of ok) for (const o of r.objections) counts.set(o, (counts.get(o) ?? 0) + 1);
  const rel = ok.map((r) => r.relevance?.score).filter((v): v is number => v != null);
  const trust = ok.map((r) => r.trustLevel?.score).filter((v): v is number => v != null);
  return {
    reaction: ok[0],
    wouldClick: summarize(ok.map((r) => r.wouldClick)),
    relevance: rel.length ? summarize(rel) : null,
    trust: trust.length ? summarize(trust) : null,
    objections: [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([o]) => o).slice(0, 5),
    samples: ok.length,
  };
}

// ── A/B: vilken av två annonser föredrar personan? ──

export interface CompareVote {
  /** Vilken annons personan valde, i A/B-termer (ordningen slumpas i prompten). */
  choice: "A" | "B" | "ingen";
  strength: number;
  why: string;
}

export interface SampledCompare {
  votes: CompareVote[];
  /** Andel röster på B (ingen = 0,5). */
  preferB: number;
  why: string;
}

async function compareOnce(
  client: Anthropic,
  identity: PersonaIdentity,
  a: AdStimulus,
  b: AdStimulus
): Promise<CompareVote> {
  // Slumpa ordningen så att AI:n inte gynnar den som visas först.
  const swap = Math.random() < 0.5;
  const [first, second] = swap ? [b, a] : [a, b];
  const label = (s: AdStimulus, n: number): Anthropic.MessageParam["content"] => [
    { type: "text", text: `ANNONS ${n}${s.isVideo ? " (bildrutor ur videon i tidsordning)" : ""}:` },
    ...s.images,
    {
      type: "text",
      text: `Rubrik: ${s.copy.headline}\nBrödtext: ${s.copy.body}\nCTA: ${s.copy.cta}${s.description ? `\nManus: ${s.description}` : ""}`,
    },
  ];
  const content = [
    ...(label(first, 1) as Anthropic.ContentBlockParam[]),
    ...(label(second, 2) as Anthropic.ContentBlockParam[]),
    {
      type: "text" as const,
      text: `Du ser båda annonserna i ditt flöde. Vilken skulle du hellre stanna för och klicka på — om någon? Svara ENDAST med JSON: { "val": 1 | 2 | "ingen", "styrka": 1-5, "varför": "1-2 meningar i jag-form" }`,
    },
  ];
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 400,
    temperature: 0.8,
    system: `${buildPersonaProfileBlock(identity)}\n\nDu jämför två bankannonser från Nordea. Var ärlig och välj utifrån din situation. Svara på svenska.`,
    messages: [{ role: "user", content }],
  });
  const block = response.content[0];
  if (block?.type !== "text") throw new ReactionError("Tomt svar från AI:n");
  const p = jsonFrom(block.text);
  const val = p.val === 1 || p.val === "1" ? 1 : p.val === 2 || p.val === "2" ? 2 : null;
  const choice: CompareVote["choice"] = val === null ? "ingen" : (val === 1) !== swap ? "A" : "B";
  return {
    choice,
    strength: typeof p.styrka === "number" ? Math.max(1, Math.min(5, p.styrka)) : 3,
    why: typeof p["varför"] === "string" ? (p["varför"] as string) : "",
  };
}

export async function compareSampled(
  client: Anthropic,
  identity: PersonaIdentity,
  a: AdStimulus,
  b: AdStimulus,
  n: number
): Promise<SampledCompare> {
  const settled = await Promise.allSettled(Array.from({ length: Math.max(1, n) }, () => compareOnce(client, identity, a, b)));
  const votes = settled.filter((r): r is PromiseFulfilledResult<CompareVote> => r.status === "fulfilled").map((r) => r.value);
  if (votes.length === 0) {
    const first = settled.find((r): r is PromiseRejectedResult => r.status === "rejected");
    throw first?.reason instanceof Error ? first.reason : new ReactionError("Inget svar från personan");
  }
  const preferB = votes.reduce((s, v) => s + (v.choice === "B" ? 1 : v.choice === "ingen" ? 0.5 : 0), 0) / votes.length;
  // Motiveringen från den mest bestämda rösten åt majoritetens håll.
  const majority = preferB > 0.5 ? "B" : preferB < 0.5 ? "A" : "ingen";
  const why = [...votes].filter((v) => v.choice === majority).sort((x, y) => y.strength - x.strength)[0]?.why ?? votes[0].why;
  return { votes, preferB, why };
}
