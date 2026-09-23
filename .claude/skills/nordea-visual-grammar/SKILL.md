---
name: nordea-visual-grammar
description: Analysera Nordeas befintliga annonser i brand-reference/ och bygg den visuella grammatiken (lib/brand/visual-grammar/visual-grammar.json) som styr Motion Studios AI-generering. Använd när användaren lagt in nya annonser, ber om stilanalys/stilextraktion, eller vill uppdatera grammatiken.
---

# Nordea Visual Grammar — stilextraktion

Målet är att beskriva hur Nordeas annonser **faktiskt** ser ut och rör sig, i en
strukturerad form som Motion Studio kan generera efter. Du beskriver, du hittar
inte på. Varje regel ska gå att spåra till annonser som belägg.

Marknad: **Sverige**. Analysera bara svenska annonser.

## Filer

| Vad | Var |
|---|---|
| Annonser (bilder + videor) | `brand-reference/ads/` |
| Metadata per annons | `brand-reference/manifest.csv` |
| Bildrutor ur videor | `brand-reference/frames/<ad_id>/` (+ `frames.json` med tidpunkter) |
| Analys per annons | `brand-reference/analysis/<ad_id>.json` |
| Syntes (styr AI:n) | `lib/brand/visual-grammar/visual-grammar.json` |
| Läsbar version för granskning | `brand-reference/VISUAL-GRAMMAR.md` |
| Schema (källan till sanning) | `lib/brand/visual-grammar/schema.ts` |

`ad_id` = filnamnet utan ändelse, gemener, åäö → aao, övrigt → `-`
(`Bolån Vår 2025 (9x16).mp4` → `bolan-var-2025-9x16`). Validatorn listar id:n.

## Steg 0 — Läge

1. Kör `npm run brand:frames` (plockar ut rutor för videor som saknar dem).
2. Kör `npm run brand:validate` — den listar annonser som inte är analyserade.
3. Läs `lib/brand/visual-grammar/schema.ts`, `docs/nordea_brand_reference.md`
   (färger, typsnitt, format) och typerna `SceneType`/`MotionConfig` i
   `lib/remotion/types.ts`.

## Steg 1 — Analysera varje annons

För varje annons som saknar analys:

- **Statisk:** läs bildfilen.
- **Video:** läs `frames.json` och sedan rutorna. Läs *alla* rutor från de första
  2 sekunderna (hooken och hur illustration/logo byggs upp) och från slutet
  (CTA, end card). Tidpunkten står i filnamnet (`t001250ms.jpg` = 1,25 s).

Skriv `brand-reference/analysis/<ad_id>.json` enligt `AdAnalysisSchema`:

- **Beskriv det som syns.** Gissa inte på det som inte syns. Sätt `confidence`
  ärligt: `low` om bilden är liten eller otydlig.
- **Färger:** uppskatta hex. Ligger den nära Nordeas palett (`#0000A0`,
  `#FBD9CA`, `#40BFA3`, `#FFFFFF`, `#00005E`), använd paletten. Avviker den tydligt,
  skriv det faktiska värdet och nämn det i `color.notes`.
- **Typografi:** `NordeaSansLarge` för rubriker, `NordeaSansSmall` för brödtext och
  CTA om det stämmer med vad du ser; annars `okänd`.
- **Illustrationer:** var konkret om projektion (isometrisk ≈ 30°), skuggning,
  konturer, detaljnivå, hur människor ritas, återkommande motiv (hus, mynt,
  telefon …) och komposition. Det här är underlaget för att senare kunna ta fram
  nya illustrationer i samma stil.
- **Rörelse (video):** `sequence` med tidpunkter från rutorna: vad kommer in,
  när och hur. Beskriv i `logo_reveal`/`text_animation`/`cta_reveal`/`transitions`
  med fri text; syntesen mappar till renderarens enums senare.
- **Copy:** transkribera ordagrant. Beskriv mönstret (t.ex. "fråga + svar",
  "siffra i fokus + förklaring").
- **Personer i bild:** beskriv generellt (ålder, situation), aldrig identitet.
- Fyll `channel`/`product`/`campaign`/`year` från `manifest.csv` om raden finns.

Jobba i omgångar om ~5 annonser och kör `npm run brand:validate` efter varje.
Vid många annonser (>15) och om Agent-verktyget finns: dela ut omgångar till
parallella subagenter med denna instruktion och en lista `ad_id`, och validera
resultatet själv.

## Steg 2 — Syntes

Kräver minst 3 analyser; bättre ju fler (10+). Skriv
`lib/brand/visual-grammar/visual-grammar.json` enligt `VisualGrammarSchema`:

- **`evidence` överallt.** En regel utan belägg är en gissning. Generalisera inte
  från en enda annons om det finns fler: då krävs minst 2 belägg.
- **`layout_archetypes`:** gruppera annonser med samma grundlayout. Ge korta,
  stabila id:n (`illustration-hoger-rubrik-vanster`). `scene_types` ska vara de
  scentyper i `lib/remotion/types.ts` som kommer närmast. Om en arketyp inte kan
  uttryckas med befintliga scener: ta de närmaste och skriv upp gapet (se Steg 3).
- **`motion_recipes`:** översätt observerad rörelse till `MotionConfig` exakt.
  Tider är i **bildrutor vid 30 fps** (`logo.duration: 18` = 0,6 s,
  `text.delayBetween: 3` = 0,1 s per ord). Välj närmaste enum-värde.
- **`illustration_style.generation_prompt`:** en fristående beskrivning på
  **engelska** (bildmodeller fungerar bäst så) som en illustratör eller
  bildmodell kan följa för att göra en ny illustration i samma stil. Inga
  varumärkesnamn eller specifika personer.
- **`golden_examples`:** 3–5 av de mest typiska annonserna återskapade som
  `VideoConfig` (bara scentyper och fält som finns i `lib/remotion/types.ts`;
  copy ordagrant). Format: 9:16 → `story`, 1:1 → `feed`, 16:9 → `landscape`,
  4:5 → `vertical`.
- `status: "draft"`, `generated_at` = dagens datum, `source_ad_ids` = alla
  analyserade id:n, `market: "SE"`, `reviewed_by: null`.
- **Sätt aldrig `status: "reviewed"`.** Det gör en människa på marknad efter
  granskning, tillsammans med `reviewed_by`.

## Steg 3 — Läsbar version + gap

Skriv `brand-reference/VISUAL-GRAMMAR.md` på svenska för marknadsteamets granskning:

1. Sammanfattning (5–10 meningar).
2. Varje arketyp, regel och recept med belägg (`ad_id`) så att granskaren kan
   slå upp annonsen.
3. **Osäkerheter:** där analyserna spretar eller `confidence` var låg.
4. **Gap mot renderaren:** det annonserna gör som Motion Studio inte kan i dag
   (t.ex. isometriska illustrationer som byggs upp i delar, fotobakgrunder,
   scenövergångar som saknas). Det blir utvecklingsbackloggen.

## Steg 4 — Klart

Kör `npm run brand:validate` tills den är grön. Rapportera till användaren:
antal annonser analyserade, arketyper och recept som togs fram, de viktigaste
osäkerheterna och gapen, och att grammatiken är `draft` tills någon granskat den.
Motion Studio använder grammatiken så fort status är `draft` eller `reviewed`
(`withVisualGrammar` i `lib/brand/visual-grammar/index.ts`).
