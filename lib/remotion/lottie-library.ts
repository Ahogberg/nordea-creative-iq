// ── Curated Lottie Library ──
// AI picks an animationId from this registry. The scene resolves the URL.
//
// URLs can be either:
//   - Remote (lottiefiles CDN or similar public JSON URL)
//   - Local: "/lottie/<filename>.json" — drop .json files in /public/lottie/
//
// To add an animation:
//   1. Download the .json from lottiefiles.com
//   2. Place it in /public/lottie/<id>.json
//   3. Register it below with matching id

export interface LottieLibraryEntry {
  id: string;
  url: string;
  label: string;
  tags: string[];
  // Hint for the AI about when to use this animation
  useFor: string;
}

export const LOTTIE_LIBRARY: Record<string, LottieLibraryEntry> = {
  // ── Money & Finance ──
  "money-growth": {
    id: "money-growth",
    url: "/lottie/money-growth.json",
    label: "Pengar växer",
    tags: ["money", "growth", "savings", "investment"],
    useFor: "Sparande, investeringar, avkastning, pengatillväxt",
  },
  "coin-stack": {
    id: "coin-stack",
    url: "/lottie/coin-stack.json",
    label: "Myntstapel",
    tags: ["money", "savings", "coins"],
    useFor: "Sparande, samla pengar, småsparande",
  },
  "piggy-bank": {
    id: "piggy-bank",
    url: "/lottie/piggy-bank.json",
    label: "Spargris",
    tags: ["savings", "kids", "family"],
    useFor: "Barnsparande, grundsparande, familjesparande",
  },
  "chart-rising": {
    id: "chart-rising",
    url: "/lottie/chart-rising.json",
    label: "Stigande kurva",
    tags: ["growth", "chart", "investment", "fund"],
    useFor: "Fondavkastning, aktier, positiv utveckling",
  },

  // ── Banking & Cards ──
  "credit-card": {
    id: "credit-card",
    url: "/lottie/credit-card.json",
    label: "Kreditkort",
    tags: ["card", "payment", "banking"],
    useFor: "Kort, betalning, kontaktlöst",
  },
  "mobile-banking": {
    id: "mobile-banking",
    url: "/lottie/mobile-banking.json",
    label: "Mobilbank",
    tags: ["mobile", "app", "digital"],
    useFor: "Nordea-appen, mobilbank, digitala tjänster",
  },
  "secure-lock": {
    id: "secure-lock",
    url: "/lottie/secure-lock.json",
    label: "Säker låsning",
    tags: ["security", "trust", "lock"],
    useFor: "Säkerhet, BankID, trygghet, skydd",
  },

  // ── Home & Loans ──
  "house-keys": {
    id: "house-keys",
    url: "/lottie/house-keys.json",
    label: "Hus & nycklar",
    tags: ["home", "mortgage", "house"],
    useFor: "Bolån, första bostaden, flytt",
  },
  "calculator": {
    id: "calculator",
    url: "/lottie/calculator.json",
    label: "Kalkylator",
    tags: ["calculate", "budget", "planning"],
    useFor: "Bolånekalkyl, budget, uträkning",
  },

  // ── People & Service ──
  "handshake": {
    id: "handshake",
    url: "/lottie/handshake.json",
    label: "Handskakning",
    tags: ["agreement", "trust", "partnership"],
    useFor: "Rådgivning, avtal, förtroende, samarbete",
  },
  "customer-service": {
    id: "customer-service",
    url: "/lottie/customer-service.json",
    label: "Kundservice",
    tags: ["support", "chat", "help"],
    useFor: "Support, chatt, hjälp, rådgivare",
  },

  // ── Success & CTA ──
  "checkmark": {
    id: "checkmark",
    url: "/lottie/checkmark.json",
    label: "Bock / klart",
    tags: ["success", "done", "approved"],
    useFor: "Klart, godkänt, genomfört, success",
  },
  "celebration": {
    id: "celebration",
    url: "/lottie/celebration.json",
    label: "Konfetti-firande",
    tags: ["celebration", "success", "reward"],
    useFor: "Kampanjslut, vinst, belöning, positiv CTA",
  },
  "arrow-forward": {
    id: "arrow-forward",
    url: "/lottie/arrow-forward.json",
    label: "Pil framåt",
    tags: ["cta", "next", "forward"],
    useFor: "CTA, nästa steg, kom igång",
  },
};

export function getLottieUrl(animationId: string | undefined): string | null {
  if (!animationId) return null;
  const entry = LOTTIE_LIBRARY[animationId];
  return entry?.url ?? null;
}

export function getLottieEntry(animationId: string | undefined): LottieLibraryEntry | null {
  if (!animationId) return null;
  return LOTTIE_LIBRARY[animationId] ?? null;
}

// Formatted list for AI prompt
export function formatLibraryForPrompt(): string {
  return Object.values(LOTTIE_LIBRARY)
    .map((e) => `  - "${e.id}" (${e.label}) — ${e.useFor}`)
    .join("\n");
}
