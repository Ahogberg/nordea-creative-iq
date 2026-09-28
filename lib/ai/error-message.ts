/** Begriplig feltext (svenska) för fel från Anthropic-anrop, att visa i gränssnittet. */
export function aiErrorMessage(error: unknown, fallback = "Något gick fel vid generering"): string {
  const status = (error as { status?: number })?.status;
  if (status === 401) return "AI-nyckeln är ogiltig — kontrollera ANTHROPIC_API_KEY";
  if (status === 429) return "AI:n är överbelastad just nu — försök igen om en stund";
  if (status === 529 || status === 503) return "AI-tjänsten är tillfälligt otillgänglig — försök igen";
  return fallback;
}
