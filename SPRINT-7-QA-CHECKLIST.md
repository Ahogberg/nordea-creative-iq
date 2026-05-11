# Sprint 7 — QA Checklist

Manual verification after preview-deploy is live. Walk each section in
order; tick the boxes that pass and file an issue / comment per failure.

## Navigation

- [ ] Sidebar visar ny struktur (8 huvud-items + Verktyg-sektion + System-sektion)
- [ ] Verktyg-sektion har subtle uppercase header (letter-spacing 0.08em)
- [ ] System-sektion har samma subtle header (innehåller bara Inställningar)
- [ ] `/ad-studio`, `/copy-studio`, `/motion-studio` ger 404 (ska vara borta)
- [ ] Klick på "Create" → `/create` landar i AI-driven entry-sida med 4 shortcuts
- [ ] Klick på en shortcut routar till `/create/{copy,video,analyze,brief}`

## Theme — globala

- [ ] Bakgrund är `#F7F8FA` (light grey-blue)
- [ ] Sidebar har vit bakgrund med subtle `#E5E7EB`-border
- [ ] Primary text använder Nordea Deep `#00005E`
- [ ] Primary CTA-knappar är teal `#40BFA3` med deep-blue text
- [ ] Cobalt-knappar är Nordea Blue `#0000A0` med vit text
- [ ] Font är `Nordea Sans` (verifiera i devtools → Computed → font-family)
- [ ] Skuggor är subtila (`0 1-12px rgba(0,0,94,...)`), inte hårda mörka

## Theme — Sprint 6.5 dark scope intakt

- [ ] `SaveTemplateModal` i Motion Studio är fortfarande dark themed
- [ ] `QAModal` i Motion Studio är fortfarande dark themed
- [ ] Producer progress-overlay i `/produce` är dark themed
- (Light-theme har inte spillt över till modaler)

## Dashboard (`/dashboard`)

- [ ] Topbar med breadcrumb `Workspace › Brand · Q2 2026`
- [ ] Time-based greeting (God morgon / Hej / God kväll baserat på klockan)
- [ ] "3 projekt väntar på din review" subtitle
- [ ] 4 KPI-kort i grid (Videos this quarter, Active templates, Avg QA score, Time saved)
- [ ] KPI:erna har delta-värden i grön/cobalt/teal
- [ ] Recent projects-lista med thumbnail-placeholder, namn, formats, score (färgkodad), status badge
- [ ] Quick start panel med 3 links (Generate from brief, Use a template, Upload existing)
- [ ] Production queue med 2 progress bars + ETA-text

## Create (`/create`)

- [ ] Stor centrerad prompt-input med textarea + teal Sparkles-knapp
- [ ] `⌘+Enter`-hint under input
- [ ] Divider "eller välj verktyg"
- [ ] 4 shortcut-kort (Copy, Video, Analysera annons, Från brief) med teal-soft ikoner

## Create — sub-routes

- [ ] `/create/copy` öppnar gamla Copy Studio-flödet (rendering OK)
- [ ] `/create/video` öppnar gamla Motion Studio (chat + scen-editor OK)
- [ ] `/create/analyze` öppnar gamla Ad Studio
- [ ] `/create/brief` visar stub med "Kommer i en senare sprint" + länkar till alternativ

## Templates (`/templates`)

- [ ] Topbar "Templates" + "New template"-CTA till `/create/video`
- [ ] Hero: "Template Library" + "{N} brand-approved layouts"
- [ ] Search + kategori-pills (All/Brand/Mortgages/Invest/Cards/App/HR)
- [ ] Grid/List-toggle till höger
- [ ] Favorites-sektion visas när användaren har starred templates
- [ ] All templates-grid med Format-chip + use_count + Producera-länk
- [ ] Empty state har teal-soft icon + CTA till `/create/video`

## Produce (`/produce`)

- [ ] Topbar `Produce › {template name}` + Cancel-knapp
- [ ] Two-col layout (1fr / 380px)
- [ ] Selected template-kort med thumbnail + Change-link
- [ ] AI Generate-sektion med textarea + "Suggest variants"-knapp
- [ ] Headlines/Bodies/CTAs-inputs numrerade med selectable rows
- [ ] Format-väljare (4 kort med ratio + label)
- [ ] Höger panel: Live preview med text-overlay
- [ ] Cycling-indikator under preview
- [ ] Summary card med `X × Y × Z × N = TOTAL` math
- [ ] "Producera N videor" stor primary-knapp
- [ ] Klick på produce öppnar progress-overlay (dark scope)

## QA Reports (`/qa`)

- [ ] Sample-banner överst ("Sample report — full QA history view ships in Sprint 8")
- [ ] Två-kolumn 320px / 1fr
- [ ] Vänster: Total score (stor siffra färgkodad) + 4 breakdown bars
- [ ] Vänster: Suggestions-card med 3 förslag (amber/cobalt/teal tone-bars)
- [ ] Höger: Persona-jury full bredd (4 kort med initial-avatar + score)
- [ ] Höger: ToV-card med 3 axes + target-markörer
- [ ] Höger: Compliance-card med 6 checks (check/x icons + paragraf)
- [ ] Höger: Heatmap full bredd med blob-overlay + legend

## Asset Library (`/dam`)

- [ ] Stub-banner överst ("Stub layout — full DAM ships in Sprint 8")
- [ ] Tre-kolumn layout (220px / 1fr / 320px)
- [ ] Vänster: Type-filter, Source-checkboxes, Tags-badges, Upload dropzone
- [ ] Mitten: Semantic search-bar (med teal sparkle + Semantic badge)
- [ ] Mitten: 4-col grid med 12 assets (foton/video/audio med olika ikoner)
- [ ] Selected asset har teal border + check-overlay
- [ ] Höger: Detail-panel med preview, attribution, tags, metadata, actions

## Personas, Kampanjer, Mediaplanering

- (Sprint 7 lämnade dessa med befintlig styling — globala tokens applicerade via globals.css.
  Säg till om någon av dem ser ut att stå ut visuellt mot resten av appen.)
- [ ] `/personas` laddar utan crash, visar persona-grid
- [ ] `/campaigns` laddar utan crash
- [ ] `/campaign-planner` laddar utan crash

## Critical paths

- [ ] Kan skapa en video i `/create/video` (chat-baserad generering)
- [ ] Kan spara en video som mall (Save-knapp i toolbar)
- [ ] Kan starta produktion i `/produce` med en mall + variants
- [ ] QA-gate funkar (klick på ShieldCheck i `/create/video`)
- [ ] Inga 404:or eller crashes i sidopanelen

## Mobile (responsivt)

- [ ] Sidebar är dold på `< 1024px`, Header visar mobil-meny
- [ ] Mobile menu (Sheet) visar fullständig nav
- [ ] `/create`-shortcuts blir 2-col på mobil
- [ ] `/dashboard` KPI-grid blir mindre kolumner på mindre skärmar
- (Vissa sidor (Produce, /dam) har komplexa grid som kan brytas på mobil — godkänt för Sprint 7)

## Performance + build

- [ ] `npm run typecheck` clean
- [ ] `npm run build` clean
- [ ] Vercel preview deploy laddar utan crash på `/dashboard`, `/create`, `/templates`, `/produce`, `/qa`, `/dam`
- [ ] Inga console errors i browser DevTools

---

## Documented limitations

- **Mock data** på Dashboard, `/qa`, `/dam` — markerade tydligt i kod med
  `MOCK_` prefix och TODO-kommentarer pekande på Sprint 8/9.
- **Brief mode** (`/create/brief`) är stub — full implementation kräver
  Inngest-kö (Sprint 9).
- **Personas/Kampanjer/Mediaplanering** har inte fått fullständig
  Designs-spec redesign i denna sprint — befintlig styling använder
  redan delar av Nordea-paletten via globala CSS-variabler. Pixel-
  perfect alignment mot Designs kan göras i en uppföljnings-sprint.
- **AI mode detection** i `/create` är regex-baserad — kan ersättas med
  Claude-routing när vi har bandwidth.
- **`claude-design-reference/`** innehåller en README som mappar varje
  design-fil → implementations-fil + color mappings. JSX-original
  finns hos design-team:et utanför repot.
