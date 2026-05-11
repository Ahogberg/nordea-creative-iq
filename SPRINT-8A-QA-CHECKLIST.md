# Sprint 8a — Manuell QA

Walka igenom efter merge + preview-deploy. Sprintet bygger en ny
property-driven Studio under `/create/video`. Den gamla chat-baserade
Studio-sidan är ersatt — chat-flödet kommer tillbaka i Sprint 8b.

## Layout

- [ ] `/create/video` laddar utan crash
- [ ] 3-kolumn body syns: 330px properties / flex preview / 320px AI-varianter (stub)
- [ ] 120px timeline-strip i botten
- [ ] StudioTopbar med "Motion Studio" + scen-count + total-duration
- [ ] AspectRatioTabs visar Story / Feed / Landskap / Vertikal med ikoner + ratio

## Aspect ratio

- [ ] Klick på Feed → Preview-rutan blir kvadratisk (1080 × 1080)
- [ ] Klick på Landskap → bredare ratio (1920 × 1080)
- [ ] Klick på Vertikal → 4:5 portrait
- [ ] Tillbaka till Story → ursprunglig portrait 9:16
- [ ] Eyebrow ovanför preview uppdaterar dimensions

## Property Panel — Aktuell scen

- [ ] Default-scen ("Titel") är vald när sidan laddar
- [ ] Längd-slider (0.5–10s) uppdaterar scen-längden direkt
- [ ] Rubrik-input för title-scenen fungerar; ändring → preview byter efter ~1.5s
- [ ] Underrubrik-input fungerar
- [ ] Välj en counter-scen i timeline → editor visar etikett / från / till / suffix / beskrivning
- [ ] Välj en CTA-scen → editor visar rubrik / knapptext / underrubrik
- [ ] Andra scen-typer (bars, icon-grid, etc) visar "Egen editor kommer i 8b"-meddelande

## Property Panel — Logotyp

- [ ] Upload-zon visas när ingen logo
- [ ] Klicka → filväljare öppnas; välj PNG eller SVG
- [ ] Logo visas som thumbnail på mörk bakgrund
- [ ] "Byt logotyp" + X-knapp fungerar
- [ ] Preview uppdateras med ny logo

## Property Panel — Motion

- [ ] 5 preset-knappar visas (Standard / Energisk / Lugn / Minimal / Premium)
- [ ] Aktuellt preset highlight:as (auto-detekterat från config.motion)
- [ ] Klick byter preset → preview animation ändras efter ~1.5s

## Property Panel — Färger

- [ ] 3 swatches för Bakgrund (Nordea Deep / Blue / Teal)
- [ ] 3 swatches för Accentfärg
- [ ] Aktuell färg har blå ring runtom
- [ ] Klick byter färg → preview uppdateras

## Live Preview

- [ ] Preview renderar default-scenerna (Titel / Räknare / CTA)
- [ ] Player-kontroller (play / pause / scrubber) fungerar
- [ ] Loop fungerar
- [ ] Eyebrow visar `dimensions · X.Ys totalt`
- [ ] Empty state (om alla scener tas bort) visar "Inga scener att förhandsvisa"

## Timeline

- [ ] 3 default-scener visas som block med färgkodad övre kant
- [ ] Block-bredd proportionell mot varaktighet
- [ ] Klick → väljer scen → property panel skiftar
- [ ] "Lägg till scen" lägger till en ny Titel-scen i slutet
- [ ] Markerad scen visar Trash-ikon (när 2+ scener finns)
- [ ] Klick på Trash → confirm-dialog → scen tas bort
- [ ] Ta bort sista scenen → fallback-knapp "Lägg till första scenen"

## State sync

- [ ] Property-ändring → Timeline-block uppdaterar label
- [ ] Lägg till scen i Timeline → Property panel visar nya scenen vald
- [ ] Ta bort scen → Property panel visar närmaste scen
- [ ] Snabba ändringar i Property panel → preview triggas EN gång efter ~1.5s tystnad

## Topbar-stubs (förväntat)

- [ ] "AI-varianter" disabled, tooltip "Kommer i Sprint 8b"
- [ ] "Spara som mall" disabled, tooltip "Kommer i Sprint 8b"
- [ ] "Kör QA" är aktiv (visuellt) — implementation behövs i 8b men knappen är inte stubbed
- [ ] "Exportera" disabled, tooltip "Kommer i Sprint 8b"

## Variants Panel (höger)

- [ ] Visar "Kommer i Sprint 8b" empty state
- [ ] Inga felmeddelanden i konsolen

## Robustness

- [ ] `npm run build` clean
- [ ] `npm run typecheck` clean
- [ ] Inga `console.error` i devtools
- [ ] Existing /api/motion-render fungerar fortfarande (server-side render-pipeline orörd)

## Known limitations (medvetna)

- Chat-baserad AI-generering är borta tillfälligt — kommer tillbaka i 8b
- Save-as-template + Export disabled tills 8b
- Free-form color picker saknas; bara Nordea-swatches just nu
- "Add scene" lägger alltid till en Titel-scen (typ-väljare kommer i 8b)
- Drag-reorder i Timeline ej implementerad i 8a (reorderScenes-action finns i store, UI-binding i 8b)
