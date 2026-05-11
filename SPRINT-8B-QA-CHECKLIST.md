# Sprint 8b — Motion Studio AI Flows — Manual QA

Verifiering på `/create/video` (Motion Studio) efter att Sprint 8b mergats.
Förutsätter att `ANTHROPIC_API_KEY` är satt — annars verifiera mock-fallbacks
separat.

## AI Varianter
- [ ] Klick "AI-varianter" i topbar startar generation (Loader-ikon)
- [ ] Loader visas också i höger panel under generation
- [ ] 3 varianter visas i höger panel med beskrivning + change-list
- [ ] Klick "Använd denna" applicerar variant → preview uppdateras inom 1,5s
- [ ] Variant-listan rensas efter applicering
- [ ] "Rensa" tar bort kvarvarande varianter
- [ ] "Generera nya förslag" fungerar
- [ ] Utan `ANTHROPIC_API_KEY`: mock-varianter (energisk/lugn/fråga) genereras med config-transform

## Chat Input
- [ ] Chat-rad syns ovanför timeline
- [ ] "Gör hela videon mer energisk" → motion-fält uppdateras (cta.spring → snappy, kortare transitions)
- [ ] "Byt rubriken till X" → titel-scen.headline uppdateras
- [ ] "Lägg till en CTA-scen" → ny scen syns sist i timeline + är vald
- [ ] "Ta bort scen 3" → scen försvinner
- [ ] Enter skickar, Shift+Enter ny rad
- [ ] Auto-resize fungerar (max 120px)
- [ ] Inline-status visar explanation efter klar (~4s), error efter fel (~5s)
- [ ] Utan API-key: status visar "Chat-AI ej konfigurerad", inga actions körs

## Save as Template
- [ ] Klick "Spara som mall" öppnar modal
- [ ] Modal har name-input + kategori-dropdown + beskrivning
- [ ] Tomt namn → inline error "Namn krävs" + Spara-knappen disabled
- [ ] Spara med namn → modal stänger
- [ ] Mall syns i `/templates` med kategori-prefix i beskrivningen (`[Bolån] ...`)
- [ ] Servererror surfas inline i modalen

## Export
- [ ] Klick "Exportera" öppnar modal
- [ ] Default-format = nuvarande aspect ratio (markerat med blå border + check)
- [ ] Klick på fler format toggleas in/ut
- [ ] Estimerad renderingstid uppdateras (~30s per format)
- [ ] Klick "Exportera N format" startar render → modalen visar progress-bar
- [ ] Progress uppdateras under rendering (polling var 2s)
- [ ] Done-state visar grön check + "Ladda ner"-länk
- [ ] Failed-state visar rött + error_message
- [ ] "Ny export" återställer modalen utan att stänga
- [ ] Polling stannar när modalen stängs (inget request-spam i Network-tab)

## Asset Picker
- [ ] Accordion "Tillgångar" finns nederst i property panel
- [ ] Sök "Stockholm" → 12 träffar i 3-col grid
- [ ] Foto/video-toggle byter mellan typer (resultat-set ändras)
- [ ] Tooltip på asset visar fotograf + källa
- [ ] Video-träffar har "VIDEO"-badge
- [ ] Klick foto → bakgrund på vald scen byts ut (syns i preview efter debounce)
- [ ] Klick video → alert "kommer i nästa iteration"
- [ ] Ingen scen vald + klick foto → alert "Välj en scen i tidslinjen först"
- [ ] Utan `PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY`: inline-meddelande
  "Stock-leverantör ej konfigurerad" (ingen krasch)

## Robusthet — Sprint 8a får inte brytas
- [ ] Property edits → preview uppdateras (debounced ~1,5s)
- [ ] Timeline-klick markerar scen, scen-editor öppnar
- [ ] Add scene / remove scene från timeline fungerar
- [ ] Aspect ratio-toggle bytar canvas-format i preview
- [ ] Brand colors + Logo + Motion-editor i property panel funkar
- [ ] `npm run build` clean
- [ ] `npm run typecheck` clean

## Cost tracking
- [ ] Efter variants-anrop syns rad i `ai_generations` (prompt = `studio_variants`)
- [ ] Efter chat-anrop syns rad (prompt = `studio_chat`)
- [ ] Båda har provider=`claude`, model=`claude-sonnet-4-5-20250929`, status=`success`
- [ ] Kostnaden ackumuleras i `user_credits.current_period_spend_usd`

## Storage-städning (manuell)
- [ ] Studio-export skapar transient template med beskrivning
  `[Studio export] auto-generated for one-off render` — verifiera att den
  syns i `/templates` (för nu) och planera städning till nästa sprint
