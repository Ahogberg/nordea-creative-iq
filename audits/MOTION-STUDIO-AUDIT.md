# Motion Studio Audit

> **Audit:** Fable 5 Deep-Dive · **Datum:** 2026-06-11 · **Model:** `claude-fable-5`
> **Scope:** Sprint 8a, 8b, 11A — canvas-manipulation, Remotion-pipeline, AI-flöden
> **Granskningstyp:** Read-only, evidensbaserad (alla fynd verifierade mot kod med radhänvisning)

## Executive Summary

Motion Studio är arkitektoniskt sund i grunden — Zustand-storen är enkel källa till sanning, Remotion-pipelinen är defensivt skriven för bakåtkompatibilitet (motion-fallback, `isInline`/`positionedElement`-mönstret, `renderSceneAssets` tål saknade fält) och Canvas-scener har riktiga error boundaries. Men Sprint 11A:s canvas-lager har ett allvarligt systemfel: **6 av 10 scen-typer exponerar dragbara element vars transforms aldrig läses av renderern**, plus ett id-mismatch (`cta` vs `button`), vilket bryter WYSIWYG-kontraktet — det användaren drar i canvas syns inte i preview eller exporterad MP4. Därtill blockerar overlayen Player-kontrollerna, och det finns en frys-bugg där `isDragging` kan fastna och permanent stoppa preview-uppdateringar.

---

## 🚨 KRITISKA BUGS

### 1. Drag gör ingenting för 6 av 10 scen-typer — overlayen ljuger för användaren
**Fil:** `components/studio/canvas-overlay.tsx:46-87` vs scen-komponenterna i `lib/remotion/scenes/`

`collectElementIds()` erbjuder dragbara boundaries för alla scen-typer:
```ts
case "highlight-number": ids.push("number", "label"); ...
case "text-reveal": ids.push("headline"); break;
case "split": ids.push("left", "right"); break;
case "bars": case "icon-grid": ... ids.push("title"); ...
case "lottie": if (scene.headline) ids.push("headline"); ...
```
Men endast **TitleScene, CtaScene och CounterScene** importerar/anropar `positionedElement`/`isInline` (verifierat via grep — `HighlightNumberScene.tsx`, `TextRevealScene.tsx`, `SplitScene.tsx`, `BarsScene.tsx`, `IconGridScene.tsx`, `LottieScene.tsx` läser aldrig `scene.elementTransforms`).

**Konsekvens:** Användaren drar t.ex. "number" i en highlight-number-scen → boundary-rutan flyttas (den läser store), men det renderade innehållet står stilla, och exporterad MP4 ignorerar layouten. Orphan-transforms sparas dessutom in i mallar/master via `elementTransforms`.
**Repro:** Välj highlight-number-scen → dra "number" till hörnet → previewn ändras inte; exportera → MP4 oförändrad.
**Fix-riktning:** Antingen implementera `positionedElement`-mönstret i alla 6 scener, eller låt `collectElementIds` bara returnera ids för scener som faktiskt stödjer det. Inför en delad `SCENE_DRAGGABLE_IDS`-konstant som både overlay och scener konsumerar (single source of truth).

### 2. Element-id-mismatch: overlay skriver `"cta"`, scenen läser `"button"`
**Fil:** `components/studio/canvas-overlay.tsx:61` (`ids.push("headline", "cta")`) vs `lib/remotion/scenes/CtaScene.tsx:117,121` (`isInline(scene, "button")` / `positionedElement(scene, "button", buttonNode)`).

Drag av CTA-knappen skriver `elementTransforms["cta"]` som ingen läser; `elementTransforms["button"]` kan aldrig sättas från UI:t. Knappen i en CTA-scen — den mest centrala interaktionen — kan alltså inte flyttas alls.
**Repro:** Välj CTA-scen → dra "cta"-elementet → boundary flyttas, knappen i videon står kvar centrerad.
**Fix-riktning:** Byt overlay-id till `"button"` (eller scen-id till `"cta"`) + migrera ev. sparade `"cta"`-nycklar.

### 3. CanvasOverlay blockerar Remotion Players kontroller
**Fil:** `components/studio/canvas-overlay.tsx:290-298`
```tsx
<div ref={overlayRef} onMouseDown={() => selectElement(null)} ... className="absolute inset-0" style={{ zIndex: 10 }}>
```
Roten har ingen `pointer-events: none` — den täcker hela playern (inkl. play/pause/scrubber/fullscreen som `<MotionPlayer ... controls />` renderar, `lib/remotion/PlayerWrapper.tsx:46`). Alla klick fångas av overlayen och tolkas som "avmarkera". Gäller både Motion Studio och Master Creative (`components/master/master-canvas.tsx` återanvänder `LivePreview`).
**Fix-riktning:** `pointer-events-none` på roten + `pointer-events-auto` på boundaries (som redan finns), och flytta drop/deselect-logik därefter.

### 4. `isDragging` kan fastna `true` → preview fryser permanent
**Fil:** `components/studio/canvas-overlay.tsx:226-257` + `lib/studio/store.ts:301-319`

- Mouse events (inte pointer events + `setPointerCapture`): släpps musknappen **utanför webbläsarfönstret** levereras ingen `mouseup` → `setDragging(false)` körs aldrig.
- useEffect-cleanup (rad 247-250) tar bara bort listeners — den nollställer **inte** `isDragging` om komponenten unmountas mitt i ett drag.
- Debounce-subscriptionen i store.ts ger upp efter **en** retry (rad 306-314): om `isDragging` fortfarande är true efter 400 ms görs aldrig något `triggerRender()` — och eftersom storen är modul-global överlever flaggan navigering. Resultat: previewen slutar uppdateras för all framtid i sessionen.
**Fix-riktning:** Pointer events + `setPointerCapture`, `setDragging(false)` i effect-cleanup, samt en självläkande retry-loop (eller att retryn alltid re-armerar sig).

### 5. Asset-overlays renderas med rå `<img>` → kan saknas i exporterad MP4
**Fil:** `lib/remotion/scene-utils.tsx:101-111`
```tsx
{/* eslint-disable-next-line @next/next/no-img-element */}
<img src={asset.url} ... />
```
Remotions server-render (`renderMedia` i `lib/remotion/render.ts`) väntar bara på resurser som laddas via Remotions `<Img>` (delayRender). Med rå `<img>` kan frames encodas innan bilden laddats → assets blinkar in/saknas i exporten. Jämför `LogoReveal.tsx:160-164` som korrekt använder `Img` från remotion.
**Repro:** Droppa en brand-ikon på en scen → exportera → ikonen saknas i de första framesen (eller helt, beroende på nätverk).
**Fix-riktning:** Byt till Remotions `<Img>`; lägg ev. `onError`-fallback (trasig URL ger idag tom yta utan felindikation, men kraschar åtminstone inte).

### 6. Foto-bakgrund från AssetPicker skrivs som `url(...)` men renderas som `backgroundColor` — gör ingenting
**Fil:** `components/studio/property-panel.tsx:28-31`
```ts
updateScene(selectedSceneIndex, { background: `url("${asset.url}")` });
```
vs alla nio scen-komponenter, t.ex. `lib/remotion/scenes/TitleScene.tsx:99`:
```ts
backgroundColor: scene.background || "transparent",
```
`backgroundColor: url(...)` är ogiltig CSS och ignoreras. Stock-foto-flödet (Sprint 8b-feature) är alltså helt dött — användaren väljer ett foto och inget händer.
**Fix-riktning:** Rendera `scene.background` via `background`-shorthand (med `backgroundSize: cover`) eller separera `backgroundColor`/`backgroundImage` i typerna.

### 7. Ogiltigt modell-id i `/api/motion-generate`
**Fil:** `app/api/motion-generate/route.ts:207`
```ts
model: "claude-sonnet-4-5-20250514",
```
Alla andra 25+ anrop i repot använder `claude-sonnet-4-5-20250929`; `-20250514` existerar inte → Anthropic svarar 404 (`not_found_error`) och routen ger alltid 500 när API-nyckel finns. Förmildrande: ingen klientkod refererar `/api/motion-generate` längre (grep gav noll träffar) — routen verkar vara död legacy-kod, vilket i sig är ett städbehov.

---

## ⚠️ POTENTIELLA EDGE CASES

### E1. AI-chat kan korrumpera config: out-of-range `scene_index` och saknad `durationSeconds`
- `components/studio/chat-input.tsx:67-93` applicerar Claude-actions utan validering. `updateScene` i `lib/studio/store.ts:133-138` gör `scenes[index] = { ...scenes[index], ...updates }` — med index utanför arrayen blir det en sparse array med `{...updates}` (utan `type`) → `renderScene` läser `scene.type` på trasigt objekt.
- `add_scene` med scen som saknar `durationSeconds`: `DynamicVideo.tsx:95` (`Math.round(scene.durationSeconds * FPS)`) och `PlayerWrapper.tsx:30` saknar fallback → `NaN` i `durationInFrames` → Remotion kastar. (Notera: `remotion/Root.tsx` har `|| 2`, men Player-vägen har det inte.)
**Fix:** Bounds-check + zod-validering av actions innan apply.

### E2. `stagger-letter`/`typewriter` överskrider scenens längd för långa texter
**Fil:** `lib/remotion/animations/TextAnimations.ts:42-47, 101-108`
- Stagger-offset klampas till **minst 2 frames per tecken**: en 60-teckens rubrik behöver 120+ frames bara för att starta sista bokstaven — i en 2,5 s-scen (75 frames) blir halva texten aldrig synlig.
- `typewriter` har fast `charDelay = 1.5` oavsett `durationFrames`.
**Fix:** Skala offset mot `durationFrames / totalElements` utan låg-klampen, eller varna i `TextAnimationEditor`.

### E3. Frame-avrundningsglapp mellan Player och Sequences
`PlayerWrapper.tsx:28-32` räknar `Math.round(sum(durationSeconds) * 30)` medan `DynamicVideo.tsx:91-100` summerar `Math.round(per-scen * 30)`. Med t.ex. två scener à 1,25 s blir Sequences 38+38=76 frames men Player-duration 75 → sista framen klipps / sista scenen trunkeras med upp till N-1 frames.

### E4. Resize från vänster-hörnen är inverterad
`canvas-overlay.tsx:216-222`: `scaleDelta = (deltaX + deltaY) * 1.2` för alla fyra handtag (`resize-handles.tsx` skickar ingen hörn-identitet). Att dra top-left-handtaget utåt (negativa deltas) **krymper** elementet. Fix: teckenjustera per hörn.

### E5. `selectedElementId` nollställs inte vid `loadConfig`/`applyVariant`/`removeScene`
`store.ts:181-186, 209-222`: endast `setSelectedScene` rensar valet (rad 130-131). Efter variant-apply kan panelen peka på ett element som inte finns i den nya scenen och skriva orphan-transforms. (SelectedElementPanel skyddar bara mot saknade *assets*, rad 36.)

### E6. Tyst fel vid variantgenerering
`store.ts:203-206`: catch loggar bara till console och nollar spinnern — användaren ser tom panel utan felmeddelande. Samma mönster: `generate-variants` med `max_tokens: 6000` och hela configen × 3 varianter i svaret trunkeras lätt → `JSON.parse` kastar → 500 → tyst.

### E7. Asset-id-kollision
`canvas-overlay.tsx:277`: `id: a${Date.now().toString(36)}` — två drops inom samma millisekund (eller framtida "duplicera"-funktion) ger samma id → `updateAssetTransform`/`removeAssetFromScene` träffar fel/båda.

### E8. Master och Video delar samma globala store
`app/(dashboard)/create/master/page.tsx:31` och `create/video/page.tsx:62` laddar båda in i `useStudioStore`. Navigerar man Video → Master utan `?id` redigerar man tyst vidare på förra sidans config (ingen reset vid mount). Risk att en användare sparar fel innehåll som master.

### E9. Nested `<button>` i Timeline
`components/studio/timeline.tsx:85-138`: delete-knappen (rad 122) ligger inuti scen-`<button>` — ogiltig HTML, React hydration-varning, och tangentbords-aktivering av yttre knappen kan trigga oväntat.

### E10. `localFrame` utan övre klamp i `StaggeredText` render-guard
`StaggeredText.tsx:41`: `if (frame < startFrame - 5 || frame > endFrame + 5) return null;` — med `AnimatedText`-vägen finns ingen fade-out alls, så scener med `textAnimation` saknar StaggeredTexts ut-tona (inkonsekvent slut mellan default och override-styles).

---

## 🔧 KODKVALITET

### K1. DRY-brott i AI-routerna
`app/api/studio/initial-prompt/route.ts`, `generate-variants/route.ts`, `chat-intent/route.ts` duplicerar var för sig: (a) `const client = process.env.ANTHROPIC_API_KEY ? new Anthropic(...) : null` (rad 17-19 / 15-17 / 15-17), (b) text-extraktion + `text.match(/\{[\s\S]*\}/)` + parse, (c) `logGeneration`-boilerplate. `app/api/motion-generate/route.ts` är en helt egen värld: annan client-helper (`getClaudeClient`), annan JSON-extraktion (code-fence-regex, rad 219), annat modell-id, ingen kostnadsloggning. Extrahera en `callClaudeJson()`-helper.

### K2. Cost-tracker: hårdkodade kostnader, fel `kind`, luckor
- `cost_usd: 0.01` resp. `0.003` är gissningar — `response.usage` (input/output tokens) ignoreras (`initial-prompt:112`, `generate-variants:103`, `chat-intent:112`).
- `kind: "video"` används för **chat-intent** (text-intent-parsning) — `LogParams.kind` (`cost-tracker.ts:14`) saknar en "text"/"chat"-kategori, så statistiken blir missvisande.
- `/api/motion-generate` och `/api/generate-variants` (template-copy-varianter) loggar **inte alls** → kostnads-audit är inkomplett.
- Endast success loggas; failed calls (429/401/överlast) syns aldrig i `ai_generations` trots `status: "failed"` finns i typen.

### K3. Ingen specifik 429/401-hantering någonstans
Alla tre studio-routes har en enda catch → generisk 500. En rate-limitad användare får "Failed to generate variants" istället för "försök igen om en stund". `Anthropic.APIError` med `status` finns tillgängligt i SDK:n.

### K4. `z.any()` för config
`generate-variants/route.ts:11`, `chat-intent/route.ts:11`: `config: z.any()` — hela poängen med zod försvinner; en korrupt klient-payload skickas rakt in i prompten och tillbaks ut.

### K5. Element-id-kunskap utspridd utan källa
Roten till KRITISK 1+2: id-listorna finns i `collectElementIds` (overlay), i JSDoc-kommentarer i scenerna ("Element IDs for per-element transforms: ...") och implicit i `positionedElement`-anropen. Inget delat kontrakt, ingen test.

### K6. FPS hårdkodad på sex ställen
`DynamicVideo.tsx:22`, `PlayerWrapper.tsx:9`, `TitleScene.tsx:11`, `CtaScene.tsx:12`, `TextRevealScene.tsx:8`, `utils.ts:101` (`s2f`), `remotion/Root.tsx`. Konsekvent 30 idag, men `styles.ts:33` har redan `VIDEO_FPS` som ingen importerar.

### K7. Dött/oanvänt
- `reorderScenes` i storen (rad 156-162) har inget UI (ingen drag-reorder i Timeline).
- `config.accentColor` skrivs av `BrandColorsEditor` men läses aldrig av renderern (grep: bara `scene.accentColor` i HighlightNumberScene används) — accent-väljaren är en placebo.
- `ElementTransform.rotation` har ingen UI och boundaryn renderar inte rotation (overlay/element driftar isär om AI sätter rotation).
- `hoveredElementId`/`hoverElement` driver bara outline — ok, men `BrandColorsEditor` kringgår actions med `useStudioStore.setState` direkt (rad 21-28) — inkonsekvent mot resten.

### K8. Mindre städfynd
`getBrandCategoryCounts` exporteras oanvänt; `SCENE_ELEMENT_MAP` i master-types saknar `lottie`/`canvas` (layout-hints uteblir tyst för dessa).

---

## 💡 UX-FÖRBÄTTRINGAR

1. **"Kör QA"-knappen gör ingenting** — `studio-topbar.tsx:55-61` saknar `onClick`. En död primär-yta i topbaren.
2. **TextAnimationEditor visas för alla scen-typer** (`property-panel.tsx:58-69`) men bara `title`/`cta`-headline konsumerar `scene.textAnimation` (grep). Välj "Typewriter" på en counter-scen → noll effekt, ingen förklaring.
3. **"Drag till canvas eller dubbelklicka"** (`asset-picker.tsx:171-173`) — `BrandAssetTile` har ingen `onDoubleClick`. Halva löftet är tomt.
4. **PreviewKey-remount nollställer playback** — varje config-ändring remountar Playern (`live-preview.tsx:91` `key={previewKey}`) → videon hoppar till frame 0 mitt i granskning. Dessutom dubbel-remount per drag: `store.ts:324-331` bumpar +100 ms efter drag-slut OCH debounce-subscriptionen bumpar igen ~1,5 s senare.
5. **Inga tangentbordsgenvägar för canvas**: Delete (ta bort valt asset), piltangenter (nudge), Escape (avmarkera) saknas helt — medan ChatInput har Enter/Shift+Enter. Inkonsekvent.
6. **`window.alert`/`confirm`** (`property-panel.tsx:25,33`, `timeline.tsx:126`) bryter mot appens annars polerade modal-språk.
7. **NumberField är trögjobbad**: `value={value.toFixed(2)}` (`selected-element-panel.tsx:210`) formaterar om vid varje keystroke → svår att skriva fritt.
8. **Färg-inkonsekvens**: canvas-selection och guides är hårdkodade `#40BFA3` (teal) medan Timeline-selection är Nordea Blue-ring; Nordea Blue `#0000A0` används korrekt i `DEFAULT_VIDEO_CONFIG`, brand-paletten och knappar — godkänt i stort, men selektionsspråket spretar.
9. **Boundary-storlek är en gissning** (`canvas-overlay.tsx:359-362`, fasta 55 %/12 %) — rutan matchar inte textens verkliga storlek, vilket gör precisionsplacering svår.
10. **Asset-drop utan vald scen ignoreras tyst** (`canvas-overlay.tsx:262`) — ingen feedback.
11. **Spara-beteenden spretar**: "Spara som mall" (modal, kategori-prefix i description), Master sparas via toolbar (separat flöde), Export skapar dolda `[Studio export]`-mallar (`api/studio/export/route.ts:41`) som aldrig städas — tre olika persistensmodeller utan gemensam mental modell.

---

## 📊 PERFORMANCE

1. **`JSON.stringify` på hela configen vid varje store-set** — `store.ts:318` (`equalityFn: (a,b) => JSON.stringify(a) === JSON.stringify(b)`). Körs 2× per mousemove under drag, per keystroke, per hover-inducerad set. Med stora configs (canvas-scener bär hela `tsxCode`+`compiledJs`-strängar!) blir det dyrt. Byt till referensjämförelse (configen är immutabelt uppdaterad — `Object.is` räcker).
2. **LivePreview prenumererar på hela `config`** (`live-preview.tsx:27`) → ny `inputProps={{ config }}` till `<Player>` varje mousemove; varken `MotionPlayer` eller `DynamicVideo` är `React.memo`-ade. Hela kompositionsträdet re-renderas ~60 ggr/s under drag.
3. **PropertyPanel prenumererar på hela `config`** (`property-panel.tsx:14`) → alla accordions (inkl. AssetPicker med sin fetch-effekt-trigger-yta) re-renderas per keystroke. Selektera `config.scenes[selectedSceneIndex]` i stället.
4. **CanvasOverlay** bygger `elements`-arrayen i en IIFE varje render (rad 136-154) och skapar inline style-objekt per boundary — kombinerat med hover-sets blir det mycket GC-churn. `ElementBoundary` bör memo-as.
5. **`computeSceneTimings` är memo-ad men `renderSceneAssets` skapar nya noder per frame** — ofrånkomligt i Remotion, men `buildScope()` i `CanvasScene.tsx` är korrekt memo-ad via `useMemo` (bra).

---

## 📈 FÖRBÄTTRINGSPOTENTIAL

- **Pointer Events + `setPointerCapture`** i CanvasOverlay löser både fastnande drag (KRITISK 4) och touch-stöd i ett svep.
- **Delad `SCENE_DRAGGABLE_IDS: Record<SceneType, string[]>`** i `lib/remotion/types.ts` + ett enhetstest som verifierar att varje id faktiskt konsumeras av scen-komponenten.
- **Zod-scheman för Claude-output** (VideoConfig, variants, chat-actions) i stället för `as VideoConfig`-casts — fångar trunkering/hallucinerade fält innan de når storen.
- **Token-baserad kostnadsberäkning** från `message.usage` i `logGeneration`.
- **Öppna mall i Studio**: `loadConfig` anropas idag bara från prompt-flödet och master — templates-biblioteket kan inte öppnas i Motion Studio (grep visar inga fler call-sites). Lågt hängande frukt med stort värde.
- **Städjobb för `[Studio export]`-mallar** (kommentaren i `export/route.ts:22-24` utlovar det).
- **Lambda fan-out i production-worker** (`worker.ts:92-96` felar hårt idag) innan Vercel-deploy.
- **Audio-stöd saknas helt** i VideoConfig — värt att flagga inför kommande sprintar eftersom timeline-UI:t redan antyder videoredigerare.

---

## Specifika hot-spots

| Fil/funktion | Varför |
|---|---|
| `components/studio/canvas-overlay.tsx` — `collectElementIds`, drag-effekten | Källan till 3 kritiska buggar (id-kontrakt, pointer-blockering, fastnande drag). Hela 11A:s värde hänger på den här filen. |
| `lib/studio/store.ts:294-331` — debounce/retry-subscriptions | Modul-globala timers + JSON-stringify-equality + give-up-retry; svårtestad och har redan en frys-bugg. |
| `lib/remotion/scene-utils.tsx` — `renderSceneAssets` | Rå `<img>` i server-render; även z-index-baslinjen (text `2+z`, assets `5+z`) gör att "Bakåt" på ett asset aldrig hamnar bakom text utan 4 klick. |
| `components/studio/chat-input.tsx:67-93` | Ovaliderad AI-output appliceras direkt på storen — enda vägen in för korrupt config. |
| `app/api/motion-generate/route.ts` | Död route med trasigt modell-id, egen prompt-värld och noll kostnadsloggning — ta bort eller konsolidera. |
| `lib/remotion/animations/TextAnimations.ts` — stagger-timing | Duration-okänslig bokstavs-stagger; behöver klamp mot scenlängd. |
| Export-kedjan `api/studio/export` → `lib/production/worker.ts` | Transient-mallar utan städning, hårdkodad `default-user`, Lambda-stub som felar — fungerar bara i exakt en miljökonfiguration. |
