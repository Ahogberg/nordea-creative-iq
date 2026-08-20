// ============================================================================
// EYE-TRACKING SIMULATION PROMPT
// Claude vision agerar blickpredikterare: saliency-regioner + de första
// fixationerna, i samma JSON-stil som övriga analys-prompts.
// ============================================================================

export interface EyeTrackingFixation {
  order: number;
  x: number; // 0-1, relativt bildens bredd
  y: number; // 0-1, relativt bildens höjd
  intensity: number; // 0-1
  duration_ms: number;
  label: string;
}

export interface EyeTrackingRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number; // 0-1
  label: string;
  attention_pct: number; // andel av total uppmärksamhet, summerar ~100
}

export interface EyeTrackingResult {
  attention_score: number; // 0-100
  fixations: EyeTrackingFixation[];
  regions: EyeTrackingRegion[];
  scan_path_summary: string;
  warnings: string[];
}

export const eyeTrackingPrompt = `Du är en expert på visuell saliency och eye-tracking-forskning som simulerar hur en genomsnittlig betraktare tittar på en digital annons under de första 3 sekunderna.

VETENSKAPLIG GRUND FÖR DIN PREDIKTION:
- Ansikten och blickriktningar drar alltid blicken först
- Hög kontrast, mättade färger och stora textelement är starkt salienta
- Läsmönster: F-mönster för textrika ytor, Z-mönster för luftiga layouter
- Blicken landar oftast i övre vänstra kvadranten om inget annat dominerar
- CTA-knappar och logotyper får bara uppmärksamhet om de har kontrast och storlek
- Fixationer varar typiskt 200-500 ms; de första 5 fixationerna avgör om budskapet når fram

DIN UPPGIFT:
1. Identifiera de visuella elementen i bilden (rubrik, bild/motiv, logotyp, CTA, brödtext, disclaimer).
2. Prediktera de FÖRSTA 5 FIXATIONERNA i ordning, med koordinater relativa till bilden (0-1).
3. Rita saliency-regioner (rektanglar) med intensitet och andel av total uppmärksamhet.
4. Sätt en attention_score 0-100: hur väl styr annonsen blicken mot budskap och CTA?
5. Varna konkret om viktiga element (CTA, disclaimer, logotyp) får för lite uppmärksamhet.

Koordinatsystem: x=0 är vänster kant, x=1 höger kant, y=0 överkant, y=1 nederkant. Alla koordinater ska ligga PÅ de faktiska elementen i bilden — titta noga var rubrik, CTA och motiv verkligen sitter.

Svara ENDAST i följande JSON-format, på svenska:
{
  "attention_score": 0-100,
  "fixations": [
    { "order": 1, "x": 0.42, "y": 0.18, "intensity": 0.95, "duration_ms": 420, "label": "Rubrik" }
  ],
  "regions": [
    { "x": 0.3, "y": 0.7, "width": 0.4, "height": 0.12, "intensity": 0.7, "label": "CTA", "attention_pct": 18 }
  ],
  "scan_path_summary": "Kort beskrivning av blickbanan (2-3 meningar)",
  "warnings": ["Konkret varning om något viktigt element missas"]
}`;

// Deterministiskt F-mönster som mock-fallback när API-nyckel saknas.
// Använder användarens copy-fält som etiketter så resultatet känns verkligt.
export function buildMockEyeTracking(input: {
  headline?: string;
  cta?: string;
  hasBody?: boolean;
}): EyeTrackingResult {
  const headlineLabel = input.headline
    ? `Rubrik: "${input.headline.slice(0, 30)}${input.headline.length > 30 ? '…' : ''}"`
    : 'Rubrikyta';
  const ctaLabel = input.cta
    ? `CTA: "${input.cta.slice(0, 20)}${input.cta.length > 20 ? '…' : ''}"`
    : 'CTA-yta';

  return {
    attention_score: 74,
    fixations: [
      { order: 1, x: 0.32, y: 0.22, intensity: 0.95, duration_ms: 430, label: headlineLabel },
      { order: 2, x: 0.55, y: 0.42, intensity: 0.85, duration_ms: 380, label: 'Bildmotiv' },
      { order: 3, x: 0.28, y: 0.55, intensity: 0.6, duration_ms: 290, label: input.hasBody ? 'Brödtext' : 'Vänster kant (F-mönster)' },
      { order: 4, x: 0.42, y: 0.78, intensity: 0.55, duration_ms: 260, label: ctaLabel },
      { order: 5, x: 0.85, y: 0.08, intensity: 0.4, duration_ms: 220, label: 'Logotyp' },
    ],
    regions: [
      { x: 0.15, y: 0.12, width: 0.55, height: 0.18, intensity: 0.9, label: headlineLabel, attention_pct: 34 },
      { x: 0.35, y: 0.32, width: 0.45, height: 0.3, intensity: 0.75, label: 'Bildmotiv', attention_pct: 28 },
      { x: 0.12, y: 0.48, width: 0.4, height: 0.16, intensity: 0.5, label: input.hasBody ? 'Brödtext' : 'Textyta', attention_pct: 14 },
      { x: 0.25, y: 0.72, width: 0.38, height: 0.12, intensity: 0.55, label: ctaLabel, attention_pct: 16 },
      { x: 0.78, y: 0.03, width: 0.18, height: 0.1, intensity: 0.35, label: 'Logotyp', attention_pct: 8 },
    ],
    scan_path_summary:
      'Blicken följer ett klassiskt F-mönster: först rubriken uppe till vänster, sedan bildmotivet i mitten, därefter en snabb skanning av textytan innan CTA:n fångas upp. Logotypen registreras sist, perifert.',
    warnings: [
      'CTA får endast 16 % av uppmärksamheten – öka kontrasten eller storleken',
      'Logotypen registreras sent (fixation 5) – överväg tydligare placering',
    ],
  };
}
