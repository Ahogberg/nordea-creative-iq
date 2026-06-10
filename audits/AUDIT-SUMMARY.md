# CreativeIQ Audit Summary

> **Audit:** Fable 5 Deep-Dive · **Datum:** 2026-06-11 · **Model:** `claude-fable-5`
> **Underlag:** [MOTION-STUDIO-AUDIT.md](./MOTION-STUDIO-AUDIT.md) · [BRIEF-FLOW-AUDIT.md](./BRIEF-FLOW-AUDIT.md) · [CODEBASE-WIDE-AUDIT.md](./CODEBASE-WIDE-AUDIT.md)
> **Granskad bas:** branch `feature/sprint-11a-motion-studio-excellence` (+ 11B-branchen via git show)

## Plattformens hälsotillstånd

**Betyg: 6/10** — *funktionellt 8/10, produktionsredo 3/10.*

För 12 sprintar är detta en imponerande funktionell bredd (~31 500 rader TS/TSX, 40 API-routes, komplett brief→strategi→kampanj→video-kedja) med ovanligt hög typdisciplin (3 `any` totalt), bra DB-index och utmärkta kodkommentarer. Men tre saker drar ner helheten:

1. **Säkerheten är inte påbörjad i praktiken** — 0 av 40 API-routes autentiserar, 9 av 15 tabeller saknar RLS, all data är globalt läs- och skrivbar.
2. **Sprint 11A:s WYSIWYG-kontrakt är brutet** — 6 av 10 scen-typer renderar aldrig de transforms användaren drar fram, och overlayen blockerar player-kontrollerna.
3. **Felhantering saknas systematiskt i datakedjan** — sparfel sväljs tyst i wizarden, AI-JSON parsas med skör regex utan validering, genererade kampanjer skrivs till en tabell som UI:t aldrig läser.

**Viktig upptäckt:** Sprint 11B (Brief Excellence) är **inte mergad till main** — den ligger kvar på `feature/sprint-11b-brief-excellence`, och main är kvar på Sprint 10. 11A och 11B är dessutom byggda parallellt från olika baser; vid merge uppstår en namnkollision på `NORDEA_BRAND_CONTEXT` (`lib/claude.ts:29` vs `lib/brand/nordea-context.ts`).

---

## Top 5 kritiska bugs att fixa NU

Prioriterade efter risk × impact:

| # | Bugg | Var | Varför värst |
|---|------|-----|--------------|
| 1 | **API:t är helt öppet**: 0/40 routes autentiserar, middleware skyddar inte `/api/*`, 9 tabeller utan RLS, anon-nyckeln ger direkt DB-åtkomst | `middleware.ts`, `supabase/migration.sql`, alla routes | Vem som helst kan läsa/skriva all data, godkänna QA och bränna AI-budget med curl. Blockerar varje form av riktig användning på en bank. |
| 2 | **Canvas-drag gör ingenting för 6 av 10 scen-typer** + id-mismatch `"cta"` vs `"button"` | `components/studio/canvas-overlay.tsx:46-87`, `lib/remotion/scenes/CtaScene.tsx:117` | Sprint 11A:s kärnvärde (WYSIWYG-canvas) ljuger för användaren — boundaryn flyttas men preview och exporterad MP4 ignorerar det. |
| 3 | **CanvasOverlay blockerar player-kontrollerna** + `isDragging` kan fastna och frysa preview permanent | `canvas-overlay.tsx:290-298, 226-257`, `lib/studio/store.ts:301-319` | Play/pause/scrubber oklickbara i både Studio och Master; ett drag som släpps utanför fönstret dödar preview-uppdateringar för resten av sessionen. |
| 4 | **Wizard-sparfel sväljs tyst** (går vidare ändå; resume mot trasigt id tappar allt; dubbelklick skapar dubblett-briefs) | `create/brief/wizard/page.tsx:59-121`, `stage-base.tsx:164-172` | Användare kan fylla i hela briefen utan att något sparas — och får aldrig veta det. Dataförlust i nyckelflödet. |
| 5 | **Brief→Campaign skriver till Supabase men kampanjvyn läser localStorage** + `synthesize` sätter `approved` i förtid | `generate-campaign/route.ts:175-189`, `lib/campaigns.ts:26-40`, `synthesize/route.ts:117-124` | Genererade kampanjer hamnar i ett svart hål; briefer "försvinner" ur Pågående-listan utan att användaren godkänt något. |

**Hedersomnämnande:** ogiltigt modell-ID `claude-sonnet-4-5-20250514` i `app/api/motion-generate/route.ts:207` (död route — radera eller laga), och stock-foto-bakgrunder som skrivs som `url(...)` men renderas som `backgroundColor` (hela det flödet är dött).

---

## Top 5 förbättringar som lyfter plattformen

Prioriterade efter värde × insats:

1. **`requireUser()`-helper + RLS på alla tabeller + riktiga user-ID:n** — en dags arbete som tar plattformen från "demo" till "går att visa för IT-säkerhet". Löser samtidigt `default-user`-problemet i hela kostnads/audit-kedjan.
2. **En delad `callClaudeJson()`-helper** (en klientfabrik, en `CLAUDE_MODEL`-konstant, tool-use/strikt JSON + zod-validering av svar + retry) — ersätter 3 klientfabriker, 29 hårdkodade modell-ID:n och 4+ kopior av den sköra regex-parsern. Tar bort en hel felklass i ett svep.
3. **Delat element-id-kontrakt för canvas** (`SCENE_DRAGGABLE_IDS: Record<SceneType, string[]>` som både overlay och scener konsumerar) + Pointer Events med `setPointerCapture` — fixar kritisk bugg 2+3 strukturellt i stället för symptomvis, och ger touch-stöd på köpet.
4. **Token-baserad kostnadsspårning** (`response.usage` i stället för gissade belopp, `kind: "text"` i enumen, logga även failures, atomär spend-update) — gör kostnadsdashboarden sann i stället för fiktiv. Viktigt för business caset.
5. **En Campaign-modell + statusmaskin** (konsolidera `types/campaign.ts` och `lib/brief/types.ts`, migrera /campaigns från localStorage till Supabase, implementera draft→in_review→approved→live) — sluter den sista luckan i kedjan brief→strategi→kampanj→produktion.

---

## Förslag på Sprint 12 scope

**"Sprint 12: Hardening & Trust"** — ingen ny yta, bara att det som finns ska vara sant, säkert och robust:

1. **Säkerhetsbaslinje (störst, ~40 %):** auth-helper i alla 40 routes, RLS + policies på alla 15 tabeller, server-side `@nordea.com`-validering, service-nyckel utan anon-fallback, rate limit på AI/render-routes, CI med `tsc --noEmit` + lint.
2. **Canvas-kontraktet (~25 %):** `SCENE_DRAGGABLE_IDS`, `positionedElement` i de 6 saknade scenerna (eller krympt id-lista), `cta`→`button`-fixen, pointer-events-fix på overlayen, pointer capture + cleanup för isDragging, Remotion `<Img>` i scene-utils, background-url-buggen.
3. **Brief-robusthet (~20 %):** sparfel som syns + blockerar, 404-hantering vid resume, in-flight-guard mot dubblettbriefs, `approved` flyttas till explicit godkännande, validerad strategi-persist, `callClaudeJson()`-helpern.
4. **Kedjan campaign (~15 %):** en Campaign-modell, /campaigns läser Supabase, idempotent generate-campaign.

Merge-ordningen 11A → 11B → main (inkl. `NORDEA_BRAND_CONTEXT`-kollisionen) bör lösas **före** sprintstart så att hardening sker på den faktiska kodbasen.

---

## Risk-områden för business case

Vad en senior utvecklare/tech lead skulle invända mot imorgon:

- **"Ni har byggt en bank-intern plattform utan ett enda auth-check i API:t."** Det är den första frågan från Nordeas IT-säkerhet, och idag är svaret pinsamt. Att det är medvetet uppskjutet ("Sprint 11 Enterprise Prep" i kommentarerna) hjälper retoriskt men inte tekniskt.
- **"Var är testerna?"** Noll tester + `ignoreBuildErrors: true` + ingen CI = inget skyddsnät. För ren logik (QA-gate, safe-zones, kostnadsberäkning) är detta lätt att åtgärda och svårt att försvara att det saknas.
- **"Fungerar demon under press?"** Frys-buggen (isDragging), den blockerade playern och tysta sparfel är exakt den sortens fel som inträffar live i en visning. De kritiska Motion Studio-buggarna bör fixas före varje extern demo.
- **"Kan ni lita på era egna siffror?"** Kostnadsspårningen är gissade belopp under fel kategori mot en fiktiv användare. Om business caset bygger på "AI-kostnad per kampanj" är underlaget idag fiktion.
- **"Vad händer vid skala?"** localStorage-kampanjer, fire-and-forget-workers som dör med processen, renders på lokal disk (fungerar inte på Vercel), `.limit(50)` utan pagination — arkitekturen är demo-formad på flera ställen.
- **GDPR/regulatorik:** ingen dataexport, ingen retention, ingen audit-logg för CRUD/approvals — relevant för en bank redan vid intern användning.

---

## Rekommendation

**Polera — sedan visa.** Inte bygga mer ny yta nu.

Plattformen har redan mer än tillräcklig funktionell bredd för att imponera; det som saknas är trovärdighet på djupet. Konkret:

1. **Vecka 1:** Fixa Motion Studio kritisk 2+3 (canvas-kontraktet, overlay, isDragging) och wizard-sparfelen — det är det som syns i en demo.
2. **Vecka 2–3:** Säkerhetsbaslinjen (Sprint 12 punkt 1). Utan den går plattformen inte att visa för någon teknisk intressent på Nordea utan att skada förtroendet.
3. **Därefter:** visa internt, samla feedback, och låt Sprint 13 bli funktionsdriven igen (audio i Motion Studio, mall-öppning i Studio, riktig PDF-parsning är de bästa kandidaterna från fyndlistorna).

Att demo:a *nu* utan fixarna är riskabelt (frys-buggar i kärnflödet); att bygga *mer* ovanpå ett brutet canvas-kontrakt och ett öppet API gör bara skulden dyrare. Hardening-sprinten är den högsta avkastningen per timme just nu.
