# Sprint 9 — Master Creative — Manual QA

Verifiering på `/create/master` efter att Sprint 9 mergats. Förutsätter att
`master_creatives`-migrationen har körts mot databasen (se
`supabase/migration.sql`).

## Skapa Master
- [ ] `/create` visar 5 shortcut-kort (Annontext, Video, Analysera, Brief, Master)
- [ ] Klick "Master" → `/create/master`
- [ ] Editor visar AspectRatioTabs + PropertyPanel + LivePreview + Timeline (reusear Sprint 8a-komponenter)
- [ ] Inline-editable namn i topbar
- [ ] Klick "Skapa master" → POST `/api/master` → URL uppdateras med `?id=`
- [ ] Tomt namn tillåts (default "Namnlös master")

## Ladda Existing Master
- [ ] Direkt-länk `/create/master?id=<uuid>` laddar `master_config`
- [ ] Loader visas tills GET `/api/master/[id]` returnerar
- [ ] 404 → loader försvinner gracefully (ingen krasch)

## View Toggle
- [ ] "Master" / "Alla format" segmentkontroll i topbar
- [ ] Klick "Alla format" → variant-grid renderas
- [ ] Klick tillbaka "Master" → editor återkommer med samma config

## Variant Grid
- [ ] 4 thumbnails (Story/Feed/Landscape/Vertical) i höger panel
- [ ] Default-vald = aktuell aspect ratio från Studio store
- [ ] Klick thumbnail → large preview byts ut
- [ ] Alla 4 visar "Auto-genererad"-badge (auto-genererat från master)
- [ ] Aspect ratios stämmer (Story 9:16, Feed 1:1, Landscape 16:9, Vertical 4:5)
- [ ] Large preview använder samma Remotion-pipeline som Studio (`PlayerWrapper`)

## Brand Safe Zones (TODO-stub)
- [ ] Layout-hints attached till varje scen via `applyFormatLayout` (verifiera via React DevTools: scen-objektet har en `layout`-property med element-typer)
- [ ] Renderaren konsumerar INTE hints än (medvetet — scaffolding)
- [ ] `BRAND_SAFE_ZONES` har TODO-kommentar att ersätta defaults med officiella Nordea-värden

## Validering
- [ ] Långa headlines (>60 tecken) i title/CTA-scener triggrar amber-banner i variant-grid
- [ ] Korta headlines: ingen banner

## Export
- [ ] Klick "Exportera alla format" → modal öppnar
- [ ] Default: alla 4 format markerade
- [ ] Toggle in/ut funkar
- [ ] "Exportera N format" → POST `/api/master/export` skapar transient template + production_job
- [ ] Progress-bar uppdateras (polling var 2s mot `/api/studio/export/[jobId]`)
- [ ] Done → "Ladda ner"-länk
- [ ] Failed → röd ruta med error_message

## Templates Integration
- [ ] `/templates` visar "Master creatives"-sektion ovanför Favoriter (om masters finns)
- [ ] Master-kort har Layers-ikon + Master-badge + namn + uppdaterat-datum
- [ ] Klick master-kort → `/create/master?id=<id>`
- [ ] Tom masters-lista: sektionen visas inte alls
- [ ] EmptyState visas bara om BÅDA templates och masters är tomma

## Robusthet — Sprint 8a/8b får inte brytas
- [ ] `/create/video` fungerar (Studio intakt)
- [ ] `/create/video` topbar har AI-varianter, Spara som mall, Exportera-knappar
- [ ] `/templates` listar templates normalt
- [ ] `/produce` (massproduktion) fungerar
- [ ] `npm run build` clean
- [ ] `npm run typecheck` clean

## Database
- [ ] `master_creatives` skapad: kolumner `id, name, source_format, master_config, format_overrides, created_by, created_at, updated_at`
- [ ] Index på `created_by` och `updated_at DESC`
- [ ] POST `/api/master` skapar rad med `created_by='default-user'`

## Vad som *inte* är klart (medvetet — Sprint 10+)
- AI rescue för konstiga layouter
- Direktmanipulation (drag handles på elements)
- Per-format manuella justeringar i UI (overrides finns i datalager men ingen UI för att redigera dem ännu)
- Renderaren läser inte safe-zone hints
- Brand-config hot reload (refresh fungerar)
