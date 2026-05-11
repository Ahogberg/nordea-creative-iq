/**
 * Nordea brand prompt suffix injected into provider prompts when
 * brand_lock=true (the default for any Nordea-context generation).
 * Suffix is appended verbatim — providers should not strip or modify it.
 */
export const NORDEA_BRAND_PROMPT_SUFFIX = `

Style requirements (strict):
- Clean Nordic aesthetic, professional but warm
- Nordea blue (#0000A0) and teal (#40BFA3) as accent colors only
- No competitor bank logos or branding
- No politically sensitive imagery
- No imagery that could be perceived as misleading financial promises
- Faces and hands should be diverse and realistic
- Settings should reflect Nordic life: Stockholm, Copenhagen, Oslo, Helsinki cityscapes; Scandinavian interiors; Nordic nature
- Professional but approachable mood — never aggressive sales
`.trim();

export function applyBrandLock(prompt: string, brand_lock: boolean = true): string {
  if (!brand_lock) return prompt;
  return `${prompt}\n\n${NORDEA_BRAND_PROMPT_SUFFIX}`;
}
