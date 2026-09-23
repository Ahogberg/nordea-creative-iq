"use client";

// Vänster kant i Motion Studio: skapa och ändra videon genom att prata med AI:n.
// Går mot /api/motion-generate, som har Nordeas visuella grammatik och
// renderarens förmågor (illustrationer, fetstil, rubrikfärg, juridik).

import { useEffect, useRef, useState } from "react";
import { ArrowUp, RotateCcw, Sparkles, AlertCircle, SquarePen, RefreshCw, ScanEye, Check, Info, Users, GitCompare } from "lucide-react";
import { useStudioStore, type ChatMessage, type ChatReview } from "@/lib/studio/store";
import { useStudioPlayer } from "./player-context";
import { renderRichTokens, parseRichText } from "@/lib/remotion/rich-text";
import { AudienceBlock } from "./audience-card";

// Exempel att börja från — inom varumärkets ramar, men fria att bryta.
const STARTERS = [
  "Förstagångsköpare, 9:16: ett hus där mynt faller ner, sedan ett svar på frågan",
  "Sparande i fonder, 1:1: en fråga med fetade nyckelord och riskrad",
  "Kreditkort med reseförsäkring, 4:5: kort som fläktar ut, villkor och varningsband",
];

// Kontextuella förslag när det redan finns en video.
function suggestionsFor(sceneTypes: string[], hasLegal: boolean, format: string): string[] {
  const out: string[] = [];
  if (!sceneTypes.includes("canvas")) out.push("Gör första scenen till en isometrisk illustration");
  else out.push("Lägg till en liten rörelse i illustrationen");
  if (!hasLegal && !sceneTypes.includes("terms")) out.push("Lägg till villkor sist");
  out.push(format === "story" ? "Gör en 1:1-version" : "Gör en 9:16-version");
  out.push("Sätt fetstil på nyckelorden");
  return out.slice(0, 3);
}

// Statusrader medan AI:n arbetar. Tidsstyrda (ett steg per fem sekunder),
// inte faktiska steg från servern — de visar att något händer.
const WORKING = [
  "Läser videon…",
  "Följer Nordeas visuella grammatik…",
  "Skriver scenerna…",
  "Animerar…",
  "Kontrollerar safe zone och juridik…",
];

const AUDIENCE_WORKING = [
  "Renderar bildrutor ur videon…",
  "Personorna tittar på filmen…",
  "Varje persona svarar tre gånger…",
  "Sammanställer svaren…",
];

export function ChatPanel() {
  const messages = useStudioStore((s) => s.messages);
  const isBusy = useStudioStore((s) => s.isChatBusy);
  const send = useStudioStore((s) => s.sendChatMessage);
  const clearChat = useStudioStore((s) => s.clearChat);
  const runAudienceTest = useStudioStore((s) => s.runAudienceTest);
  const scenes = useStudioStore((s) => s.config.scenes);
  const legal = useStudioStore((s) => s.config.legal);
  const format = useStudioStore((s) => s.config.format);
  const selected = useStudioStore((s) => s.selectedSceneIndex);

  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Senaste svaret som ändrade videon och inte är ångrat — bara det kan ångras.
  const undoableId = [...messages].reverse().find((m) => m.role === "assistant" && m.status === "done" && m.before)?.id;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [text]);

  const submit = (value: string) => {
    const v = value.trim();
    if (!v || isBusy) return;
    setText("");
    void send(v);
  };

  const suggestions = suggestionsFor(
    scenes.map((s) => s.type),
    !!legal,
    format
  );

  return (
    <aside className="w-[320px] 2xl:w-[380px] flex-shrink-0 h-full border-r border-nordea-border bg-white flex flex-col">
      <div className="h-12 px-4 flex items-center justify-between border-b border-nordea-hairline flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-nordea-blue flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-nordea-text">Skapa med AI</span>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            disabled={isBusy}
            title="Ny konversation (videon behålls)"
            className="flex items-center gap-1 text-xs text-nordea-text-tertiary hover:text-nordea-text disabled:opacity-40 px-2 py-1 rounded-md hover:bg-nordea-bg-hover"
          >
            <SquarePen className="w-3.5 h-3.5" />
            Ny
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyState onPick={submit} hasVideo={scenes.length > 0} />
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <UserBubble key={m.id} message={m} />
            ) : (
              <AssistantMessage key={m.id} message={m} canUndo={m.id === undoableId && !m.undone} />
            )
          )
        )}
      </div>

      <div className="border-t border-nordea-hairline p-3 flex-shrink-0">
        {!isBusy && scenes.length > 0 && (
          <button
            type="button"
            onClick={() => void runAudienceTest()}
            title="Sex simulerade kundsegment tittar på videon och säger vad de tycker"
            className="w-full mb-2 flex items-center justify-center gap-1.5 text-xs font-medium text-nordea-blue border border-nordea-blue/20 bg-nordea-blue-soft hover:bg-nordea-blue/10 rounded-lg py-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            Testa i fokusgrupp
          </button>
        )}
        {!isBusy && messages.length > 0 && scenes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="text-[11px] leading-tight text-nordea-text-secondary border border-nordea-border rounded-full px-2.5 py-1 hover:border-nordea-blue/30 hover:text-nordea-blue hover:bg-nordea-blue-soft transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="relative rounded-xl border border-nordea-border bg-nordea-bg focus-within:border-nordea-blue/40 focus-within:ring-2 focus-within:ring-nordea-blue/10 transition-shadow">
          {selected !== null && scenes.length > 1 && (
            <div className="px-3 pt-2 text-[11px] text-nordea-text-tertiary">
              Scen {selected + 1} är markerad
            </div>
          )}
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(text);
              }
            }}
            rows={2}
            placeholder={scenes.length > 0 ? "Beskriv en ändring eller en ny idé…" : "Beskriv videon du vill skapa…"}
            className="w-full bg-transparent resize-none px-3 pt-2.5 pb-10 text-sm text-nordea-text placeholder:text-nordea-text-faint focus:outline-none"
          />
          <div className="absolute left-3 bottom-2.5 text-[10px] text-nordea-text-faint">Enter skickar · Shift+Enter ny rad</div>
          <button
            type="button"
            onClick={() => submit(text)}
            disabled={!text.trim() || isBusy}
            aria-label="Skicka"
            className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-nordea-blue text-white flex items-center justify-center hover:bg-nordea-deep disabled:bg-nordea-border-emphasis disabled:text-white/80 transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function EmptyState({ onPick, hasVideo }: { onPick: (text: string) => void; hasVideo: boolean }) {
  return (
    <div className="pt-6">
      <div className="w-10 h-10 rounded-xl bg-nordea-blue-soft flex items-center justify-center mb-3">
        <Sparkles className="w-5 h-5 text-nordea-blue" />
      </div>
      <h2 className="text-base font-semibold text-nordea-text">
        {hasVideo ? "Vad vill du göra med videon?" : "Vad vill du skapa?"}
      </h2>
      <p className="text-sm text-nordea-text-secondary mt-1 leading-relaxed">
        Beskriv idén med egna ord. AI:n följer Nordeas visuella grammatik — färger, typografi, logga och
        juridik — men kan animera och komponera fritt inom ramarna.
      </p>
      <div className="mt-4 space-y-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="w-full text-left text-[13px] text-nordea-text-secondary border border-nordea-border rounded-lg px-3 py-2.5 hover:border-nordea-blue/30 hover:bg-nordea-bg-hover hover:text-nordea-text transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-nordea-blue text-white text-sm px-3.5 py-2 leading-relaxed whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}

function AssistantMessage({ message, canUndo }: { message: ChatMessage; canUndo: boolean }) {
  const undo = useStudioStore((s) => s.undoMessage);
  const retry = useStudioStore((s) => s.retryMessage);
  const runAudienceTest = useStudioStore((s) => s.runAudienceTest);
  const compare = useStudioStore((s) => s.compareWithBefore);
  const busy = useStudioStore((s) => s.isChatBusy);

  if (message.status === "pending") {
    return <Working startedAt={message.startedAt} steps={message.audience ? AUDIENCE_WORKING : WORKING} />;
  }

  if (message.status === "error") {
    const canRetry = !!message.retryText || message.audience?.kind === "test";
    return (
      <div className="rounded-lg border border-nordea-rose/20 bg-nordea-rose-soft px-3 py-2.5 text-sm">
        <div className="flex items-start gap-2 text-nordea-rose">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{message.content}</span>
        </div>
        {canRetry && (
          <button
            type="button"
            onClick={() => void (message.audience ? runAudienceTest() : retry(message.id))}
            disabled={busy}
            className="mt-2 ml-6 inline-flex items-center gap-1 text-xs font-medium text-nordea-text hover:text-nordea-blue disabled:opacity-50"
          >
            <RefreshCw className="w-3 h-3" />
            Försök igen
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="w-6 h-6 rounded-md bg-nordea-blue-soft flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-nordea-blue" />
      </div>
      <div className="min-w-0 flex-1">
        {message.audience ? (
          <AudienceBlock messageId={message.id} audience={message.audience} />
        ) : (
          <p className={`text-sm leading-relaxed ${message.undone ? "text-nordea-text-tertiary line-through" : "text-nordea-text"}`}>
            {renderRichTokens(parseRichText(message.content))}
          </p>
        )}
        {message.changes && message.changes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.changes.map((c) => (
              <span
                key={c}
                className="text-[11px] text-nordea-text-secondary bg-nordea-bg border border-nordea-hairline rounded-md px-1.5 py-0.5"
              >
                {c}
              </span>
            ))}
          </div>
        )}
        {message.review && <ReviewBlock review={message.review} />}
        {canUndo && (
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => undo(message.id)}
              className="inline-flex items-center gap-1 text-xs text-nordea-text-tertiary hover:text-nordea-text"
            >
              <RotateCcw className="w-3 h-3" />
              Ångra
            </button>
            <button
              type="button"
              onClick={() => void compare(message.id)}
              disabled={busy}
              title="Personorna ser versionen före och efter ändringen och väljer"
              className="inline-flex items-center gap-1 text-xs text-nordea-text-tertiary hover:text-nordea-blue disabled:opacity-50"
            >
              <GitCompare className="w-3 h-3" />
              Jämför före/efter
            </button>
          </div>
        )}
        {message.undone && <span className="mt-2 inline-block text-xs text-nordea-text-tertiary">Ångrad</span>}
      </div>
    </div>
  );
}

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 } as const;

/** Självgranskningen under ett svar: bilderna AI:n tittade på och vad den hittade. */
function ReviewBlock({ review }: { review: ChatReview }) {
  const { seekToSeconds } = useStudioPlayer();
  const [showAll, setShowAll] = useState(false);

  if (review.status === "pending") {
    return (
      <div className="mt-2.5 flex items-center gap-2 text-xs text-nordea-text-tertiary">
        <ScanEye className="w-3.5 h-3.5 animate-pulse text-nordea-blue" />
        Granskar resultatet — renderar bilder och tittar på dem…
      </div>
    );
  }
  if (review.status === "error") {
    return <div className="mt-2.5 text-xs text-nordea-text-tertiary">Granskningen kunde inte köras: {review.error}</div>;
  }

  const issues = [...(review.issues ?? [])].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const shown = showAll ? issues : issues.slice(0, 4);
  const fixedCount = issues.filter((i) => i.fixed && review.applied).length;

  return (
    <div className="mt-2.5 rounded-lg border border-nordea-hairline bg-nordea-bg/60 p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-nordea-text-secondary">
        <ScanEye className="w-3.5 h-3.5 text-nordea-blue" />
        {review.visual ? "Självgranskning" : "Regelkontroll"}
        <span className="font-normal text-nordea-text-tertiary">
          · {issues.length === 0 ? "inga fel hittades" : fixedCount > 0 ? `${fixedCount} rättat` : `${issues.length} noterat`}
        </span>
      </div>

      {review.frames && review.frames.length > 0 && (
        <div className="flex gap-1.5 mt-2">
          {review.frames.map((f) => (
            <button
              key={`${f.sceneIndex}-${f.seconds}`}
              type="button"
              onClick={() => seekToSeconds(f.seconds)}
              title={`Scen ${f.sceneIndex + 1} · ${f.seconds.toFixed(1).replace(".", ",")} s`}
              className="flex-1 min-w-0 max-w-[64px] rounded overflow-hidden ring-1 ring-nordea-border hover:ring-nordea-blue/40 transition-shadow"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.src} alt={`Scen ${f.sceneIndex + 1}`} className="w-full h-auto block" />
            </button>
          ))}
        </div>
      )}

      {shown.length > 0 && (
        <ul className="mt-2 space-y-1">
          {shown.map((issue, i) => {
            const fixed = issue.fixed && review.applied;
            return (
              <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug">
                {fixed ? (
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-nordea-green" />
                ) : issue.severity === "info" ? (
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-nordea-text-faint" />
                ) : (
                  <AlertCircle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${issue.severity === "error" ? "text-nordea-rose" : "text-nordea-amber"}`} />
                )}
                <span className={fixed ? "text-nordea-text-secondary" : issue.severity === "info" ? "text-nordea-text-tertiary" : "text-nordea-text"}>
                  {fixed && "Rättat: "}
                  {issue.message}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {issues.length > 4 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-1 text-[11px] text-nordea-text-tertiary hover:text-nordea-text">
          {showAll ? "Visa färre" : `Visa alla (${issues.length})`}
        </button>
      )}
      {!review.visual && (
        <p className="mt-1.5 text-[10px] text-nordea-text-faint">
          {review.visualError
            ? `Bara regelkontroll — ${review.visualError}.`
            : "Ingen renderare i den här miljön — bara regelkontroll."}
        </p>
      )}
    </div>
  );
}

function Working({ startedAt, steps }: { startedAt?: number; steps: string[] }) {
  const [start] = useState(() => startedAt ?? Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - start) / 1000));
  const step = steps[Math.min(steps.length - 1, Math.floor(seconds / 5))];

  return (
    <div className="flex gap-2.5">
      <div className="w-6 h-6 rounded-md bg-nordea-blue flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm text-nordea-text-secondary">
          <span key={step} className="animate-in fade-in duration-300">{step}</span>
          <span className="text-xs tabular-nums text-nordea-text-faint">{seconds} s</span>
        </div>
        <div className="mt-2 h-1 w-40 rounded-full bg-nordea-blue-soft overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-nordea-blue/60 animate-[chat-progress_1.4s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
