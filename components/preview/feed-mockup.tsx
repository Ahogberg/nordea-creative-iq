import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ChevronRight,
  ChevronUp,
  MoreHorizontal,
} from "lucide-react";

export type FeedPlacement = "story" | "feed";

interface FeedMockupProps {
  placement: FeedPlacement;
  /** Själva annonsen — bild, video eller Remotion-player. Fyller mediaytan. */
  children: React.ReactNode;
  headline?: string;
  body?: string;
  cta?: string;
  /** Bredd på telefonen i px. */
  width?: number;
  /** Mediaytans proportioner i flödet (story är alltid 9:16). */
  feedAspect?: "1:1" | "4:5";
  className?: string;
}

/**
 * Visar annonsen så som den möter kunden: i en story eller i flödet på en
 * telefon. Neutralt socialt gränssnitt — inga plattformsvarumärken.
 */
export function FeedMockup({
  placement,
  children,
  headline,
  body,
  cta = "Läs mer",
  width = 300,
  feedAspect = "4:5",
  className = "",
}: FeedMockupProps) {
  return (
    <div
      className={`relative rounded-[44px] bg-[#0B0B1A] p-[10px] shadow-[0_24px_60px_-12px_rgba(0,0,94,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] ${className}`}
      style={{ width }}
    >
      {/* Dynamic island */}
      <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[34%] h-[22px] rounded-full bg-black z-30" />

      <div className="relative overflow-hidden rounded-[34px] bg-white" style={{ aspectRatio: "9 / 19.5" }}>
        {placement === "story" ? (
          <StoryScreen cta={cta}>{children}</StoryScreen>
        ) : (
          <FeedScreen headline={headline} body={body} cta={cta} aspect={feedAspect}>
            {children}
          </FeedScreen>
        )}
      </div>
    </div>
  );
}

function SponsorHeader({ dark }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-nordea-blue flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-white/70">
        N
      </div>
      <div className="leading-tight">
        <div className={`text-[11px] font-semibold ${dark ? "text-white" : "text-[#111]"}`}>nordea</div>
        <div className={`text-[9px] ${dark ? "text-white/75" : "text-[#737373]"}`}>Sponsrad</div>
      </div>
      <MoreHorizontal className={`w-4 h-4 ml-auto ${dark ? "text-white" : "text-[#111]"}`} />
    </div>
  );
}

function StoryScreen({ children, cta }: { children: React.ReactNode; cta: string }) {
  return (
    <div className="absolute inset-0 bg-black">
      <div className="absolute inset-x-0 top-[9%] bottom-[11%] overflow-hidden rounded-lg">{children}</div>

      <div className="absolute inset-x-0 top-0 pt-[46px] px-3 z-20 bg-gradient-to-b from-black/50 to-transparent pb-6">
        <div className="flex gap-1 mb-2.5">
          <div className="h-[2px] flex-1 rounded-full bg-white/40 overflow-hidden">
            <div className="h-full bg-white rounded-full animate-[story-progress_6s_linear_infinite]" />
          </div>
        </div>
        <SponsorHeader dark />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[11%] flex flex-col items-center justify-center z-20">
        <ChevronUp className="w-3.5 h-3.5 text-white -mb-0.5" />
        <div className="px-4 py-1.5 rounded-full bg-white text-[#111] text-[11px] font-semibold">{cta}</div>
      </div>
    </div>
  );
}

function FeedScreen({
  children,
  headline,
  body,
  cta,
  aspect,
}: {
  children: React.ReactNode;
  headline?: string;
  body?: string;
  cta: string;
  aspect: "1:1" | "4:5";
}) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white text-[#111]">
      <div className="h-[44px] shrink-0" />
      {/* Föregående inlägg skymtar */}
      <div className="h-6 mx-3 mb-2 rounded bg-[#F2F2F4]" />

      <div className="px-3 py-2">
        <SponsorHeader />
      </div>

      <div className="relative w-full bg-[#F2F2F4] overflow-hidden" style={{ aspectRatio: aspect === "1:1" ? "1 / 1" : "4 / 5" }}>
        {children}
      </div>

      <div className="flex items-center justify-between px-3 py-2 bg-nordea-blue text-white">
        <span className="text-[11px] font-semibold">{cta}</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>

      <div className="flex items-center gap-3 px-3 pt-2">
        <Heart className="w-4 h-4" />
        <MessageCircle className="w-4 h-4" />
        <Send className="w-4 h-4" />
        <Bookmark className="w-4 h-4 ml-auto" />
      </div>

      <div className="px-3 pt-1.5 text-[10.5px] leading-snug">
        <span className="font-semibold mr-1">nordea</span>
        {headline && <span className="font-medium">{headline} </span>}
        {body && <span className="text-[#262626]">{body}</span>}
        {!headline && !body && <span className="text-[#8E8E8E]">Rubrik och brödtext visas här</span>}
      </div>
    </div>
  );
}
