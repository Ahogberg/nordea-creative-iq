# Codebase-Wide Audit

> **Audit:** Fable 5 Deep-Dive · **Datum:** 2026-06-11 · **Model:** `claude-fable-5`
> **Scope:** Hela projektet — typer, dubblering, inkonsekvenser, säkerhet, performance, arkitektur, tester/docs, production-readiness
> **Granskningstyp:** Read-only, evidensbaserad (alla fynd verifierade mot kod med radhänvisning)

## Executive Summary

Kodbasen är funktionellt imponerande för 12 sprintar (~31 500 rader TS/TSX, 40 API-routes, 9 DB-tabeller utöver originalschemat) och håller hög disciplin på vissa punkter: endast **3 förekomster av `any`** i hela kodbasen, genomtänkta kommentarer, bra index i migrationen och en ren QA-gate-arkitektur med parallella checks.

**Men plattformen är inte produktionsredo ur säkerhetssynpunkt.** De tre största fynden:

1. **0 av 40 API-routes verifierar session** — och `middleware.ts` skyddar bara sid-prefix, inte `/api/*`. Hela API:t är öppet för oautentiserade anrop.
2. **9 av 15 tabeller saknar RLS** (alla Sprint 3+-tabeller), kombinerat med hårdkodad `user_id: "default-user"` på 22+ ställen — ingen dataisolering alls mellan användare.
3. **`@nordea.com`-kravet valideras endast client-side** — vem som helst kan registrera konto direkt mot Supabase med anon-nyckeln.

Därtill: noll tester, `ignoreBuildErrors: true` i next.config, ingen rate limiting, inget error tracking, och dyra endpoints (Chromium-rendering, video-generering med riktig kostnad) helt oskyddade. Mycket av detta är *medvetet* uppskjutet till "Sprint 11 Enterprise Prep" enligt kodkommentarer — men det bör behandlas som blockerande före någon form av riktig användning.

---

## 🚨 KRITISKA BUGS

### 1. Inga auth-checks i något API — middleware skyddar inte `/api/*`
**Fil:** `middleware.ts:17–35` + samtliga 40 `app/api/**/route.ts`

```ts
const PROTECTED_PREFIXES = ["/dashboard", "/create", "/templates", ...]; // inget "/api"
```

Grep över alla 40 routes efter `auth.getUser|getSession|requireAuth` ger **0 träffar**. Dashboard-layouten (`app/(dashboard)/layout.tsx:20–27`) validerar sessionen för *sidor*, men varenda API-route — inklusive `motion-render`, `ai/generate-video`, `qa/[id]/approve`, `brief/*`, `templates` (CRUD) — kan anropas direkt med curl utan cookie.

**Varför det spelar roll:** Vem som helst med URL:en kan läsa/skriva all data, godkänna QA-körningar, radera renders och bränna AI-budget.
**Fix-riktning:** Skapa en `requireUser()`-helper (Supabase `auth.getUser()` i route-handlern) och anropa den först i varje route, alternativt lägg `/api` i middleware + validera token där. Returnera 401 enhetligt.

### 2. RLS saknas på 9 tabeller
**Fil:** `supabase/migration.sql`

RLS är aktiverat med policies på 6 tabeller (`profiles`, `personas`, `ad_analyses`, `generated_copies`, `campaign_plans`, `localizations`, rad 153–236). Men **`templates`, `production_jobs`, `qa_runs`, `qa_thresholds`, `ai_generations`, `user_credits`, `master_creatives`, `creative_briefs`, `campaigns` saknar RLS helt**. Kommentaren på rad 300–302 bekräftar att detta är medvetet uppskjutet ("RLS hardening is scoped to Sprint 11").

**Varför det spelar roll:** Utan RLS kan *vem som helst med den publika anon-nyckeln* läsa/skriva dessa tabeller direkt via Supabase REST-API:t — inte ens appens API behövs. Det inkluderar `ai_generations` (prompts, kostnader) och `user_credits` (kan nollställa sin egen spend).
**Fix-riktning:** Aktivera RLS + deny-by-default på alla tabeller; ge service-rollen åtkomst för workern.

### 3. `"default-user"` som hårdkodat user-ID överallt
**Filer:** 22+ ställen, bl.a. `app/api/brief/route.ts:60`, `app/api/qa/[id]/approve/route.ts:33`, `app/api/ai/generate-video/route.ts:42`, `lib/ai/providers/image/*.ts`, `lib/ai/providers/video/*.ts`

Alla skrivningar och budgetkontroller sker mot samma fiktiva användare. `approved_by: "default-user"` i QA-approve gör dessutom hela approval-spårningen meningslös (vem godkände egentligen?).
**Fix-riktning:** Härled user-ID från sessionen (fynd #1) och tråda det genom `logGeneration`/`checkBudget`/alla inserts.

### 4. `@nordea.com`-validering endast client-side
**Filer:** `lib/auth.ts:1–3`, `app/(auth)/login/page.tsx:36–39`

`validateNordeaEmail()` anropas bara i login-sidans React-kod. `supabase.auth.signUp` kan anropas direkt med anon-nyckeln med valfri e-post, och `app/auth/callback/route.ts` gör ingen domänkontroll. Profilen auto-skapas via trigger (`migration.sql:23–39`) oavsett domän.
**Varför det spelar roll:** CLAUDE.md listar detta som krav #1 ("Login ska ENDAST tillåta Nordea-mailadresser") — det är inte uppfyllt server-side.
**Fix-riktning:** Supabase Auth Hook / DB-constraint på `profiles.email`, eller domänkontroll i `handle_new_user()`-triggern som kastar exception.

### 5. Förfalskningsbar demo-cookie
**Filer:** `middleware.ts:40–42`, `app/(dashboard)/layout.tsx:13–15`, `app/(auth)/login/page.tsx:25`

```ts
document.cookie = 'demo-session=true; path=/; max-age=86400; SameSite=Lax';
```

Cookien är en ren klartext-flagga utan signatur. Om `NEXT_PUBLIC_ENABLE_DEMO=true` råkar vara satt i produktion kan vem som helst sätta cookien manuellt och få full dashboard-åtkomst.
**Fix-riktning:** Signerad cookie (HMAC) satt server-side, eller en riktig demo-användare i Supabase. Säkerställ att flaggan aldrig är på i prod.

### 6. `typescript: { ignoreBuildErrors: true }` i produktion-build
**Fil:** `next.config.ts`

Kommentaren förklarar att Next 16:s TS-worker OOM:ar och att `tsc --noEmit` ska köras separat "CI / pre-push" — men det finns **ingen CI-konfiguration i repot** (ingen `.github/workflows`, inga hooks i package.json). Typfel kan alltså nå produktion osedda.
**Fix-riktning:** Lägg till CI som kör `npm run typecheck` + `lint` som gate.

### 7. Service-client faller tillbaka på anon-nyckel
**Fil:** `lib/supabase/service.ts:12–15`

```ts
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
```

Fungerar idag bara *för att* RLS saknas (kommenterat i filen). Den dagen fynd #2 åtgärdas slutar produktions-workern tyst att fungera, och fallbacken maskerar felkonfiguration.
**Fix-riktning:** Kasta tydligt fel om service-nyckeln saknas när workern behöver den.

### 8. Ogiltigt modell-ID — runtime-krasch i motion-generate
**Fil:** `app/api/motion-generate/route.ts:207`

```ts
model: "claude-sonnet-4-5-20250514",
```

Detta modell-ID existerar inte (övriga 28 anrop använder `claude-sonnet-4-5-20250929`). Anropet får 404 `not_found_error` från Anthropic-API:t vid körning — vägen som träffar rad 207 är trasig med riktig API-nyckel.
**Fix-riktning:** Rätta ID:t och inför en delad `MODEL`-konstant (se Kodkvalitet #2).

### 9. Oskyddade dyra endpoints + noll rate limiting = kostnads-DoS
**Filer:** `app/api/motion-render/route.ts` (`maxDuration = 300`, startar Chromium per anrop), `app/api/ai/generate-video/route.ts` (riktiga provider-kostnader), `app/api/persona-chat/route.ts` m.fl. (Claude-anrop)

Ingen rate limiting finns någonstans i kodbasen (inga träffar på upstash/ratelimit/limiter; inget i package.json). Kombinerat med fynd #1: en oautentiserad loop kan bränna obegränsat med compute och API-pengar. Budgetkontrollen (`checkBudget`) finns bara i `generate-video` och räknar dessutom mot delade `default-user`.
**Fix-riktning:** Auth först, sedan per-användare rate limit (t.ex. Upstash Ratelimit eller enkel token bucket i DB) på alla AI/render-routes.

### 10. Oautentiserad DELETE av renderade filer
**Fil:** `app/api/motion-renders/route.ts:18–28`

DELETE raderar `<id>.mp4` + `<id>.json` från disk utan auth. (Plus: id-regexen `/^[a-zA-Z0-9_-]+$/` skyddar korrekt mot path traversal — bra.) Vem som helst kan radera alla teamets renders genom att lista dem via GET (också öppen) och loopa DELETE.

---

## ⚠️ POTENTIELLA EDGE CASES

### 1. Race condition i spend-ackumulering
**Fil:** `lib/ai/providers/cost-tracker.ts:54–99`
`updateUserSpend` gör read-then-write (`select` → `update` med `current + amount` beräknat i JS). Två parallella genereringar tappar den ena kostnaden. Eftersom detta är budget-*enforcement*-data kan användare överskrida budget via parallellism.
**Fix-riktning:** Atomär `UPDATE ... SET spend = spend + $1` via RPC/Postgres-funktion.

### 2. Fail-open överallt i kostnads/cache-lagret
**Filer:** `lib/ai/providers/cost-tracker.ts:29–51`, `lib/ai/providers/cache.ts:5–6`
Designat medvetet ("we lose audit data, not the user's artifact") — rimligt för UX men betyder att audit-loggen inte kan litas på, och en trasig DB gör budgetkontrollen verkningslös (gratis obegränsade anrop).

### 3. Fire-and-forget-worker dör med processen
**Filer:** `app/api/studio/export/route.ts:78–82` (`setImmediate(() => doProduction(...))`), `lib/production/worker.ts:10–17`
Dokumenterat i workerns kommentar: Node-restart lämnar jobb i `processing` för evigt; på Vercel avbryts bakgrundsarbete när response skickats. Det finns ingen "stale job"-städning, så UI:t visar fastfrusna jobb.
**Fix-riktning:** Kö (Inngest/QStash) eller åtminstone timeout-baserad statusstädning vid GET.

### 4. Ovaliderad `VideoConfig` castas rakt in i renderaren
**Filer:** `app/api/motion-render/route.ts:21` (`body.config as VideoConfig`, endast `scenes.length`-check), `app/api/studio/export/route.ts:16` (`config: z.any()`)
En illasinnad/trasig config når Remotion-renderingen och kan krascha Chromium-processen eller skriva oväntat innehåll. Zod-scheman finns redan för andra delar — `VideoConfig` saknar ett.

### 5. Öppen `next`-parameter i auth-callback
**Fil:** `app/auth/callback/route.ts:7,13` — `redirect(`${origin}${next}`)` utan att kräva att `next` börjar med `/`. Begränsad effekt (origin prefixas), men `next=//evil.com` ger en udda URL; validera `next.startsWith('/') && !next.startsWith('//')`.

### 6. Felkategoriserad kostnadslogg
**Fil:** `app/api/brief/parse/route.ts:62–72` — en textparse loggas som `kind: "video"` med gissad `cost_usd: 0.01`. `kind`-enum (`video|image|stock-search`, `cost-tracker.ts:14`) saknar `text/llm`, så all Claude-textanvändning blir antingen ologgad eller fellabelad — kostnadsdashboarden (`/api/ai/usage`) blir missvisande.

### 7. JSON-extraktion ur Claude-svar via regex
**Mönster i flera routes:** `responseText.match(/\{[\s\S]*\}/)` (t.ex. `brief/parse/route.ts:57`). Greedy match tar första `{` till sista `}` — om modellen lägger till text efter JSON:en kastar `JSON.parse`. Fångas av catch men ger 500 i stället för retry/graceful degradering. Anthropic-SDK:t stöder strukturerade svar via tool use, vilket vore robustare.

### 8. `qa_runs`-approve saknar status-guard för `running`/`error`
**Fil:** `app/api/qa/[id]/approve/route.ts:23–28` — endast `fail` blockeras; en körning i `running` eller `error` kan "godkännas".

---

## 🔧 KODKVALITET

### 1. Typsäkerhet: överlag mycket bra — 3 `any` totalt
`app/(dashboard)/layout.tsx:42` (`Header user={displayUser as any}` — demo-user matchar inte Supabase `User`-typen; gör en egen `DisplayUser`-union i stället), `lib/remotion/render-lambda.ts:36` (`let lambdaModule: any` — acceptabelt för dynamisk import), plus `z.any()` i `studio/export`. Scene-typerna i `lib/remotion/types.ts` är en korrekt diskriminerad union på `type`, och `lib/video-types.ts:83–89` använder riktiga type guards. Godkänt.

### 2. Tre parallella Anthropic-klientfabriker + 28 hårdkodade modell-ID
- `lib/claude.ts:7–13` (`getClaudeClient` + `claude.messages`-proxy)
- `lib/ai/anthropic.ts:5–12` (`getAnthropicClient` + `callClaude`/`callClaudeChat`)
- 7 routes skapar `new Anthropic(...)` inline på modulnivå (`brief/ai-suggest:17`, `brief/parse:15`, `brief/synthesize:16`, `brief/[id]/generate-campaign:14`, `studio/chat-intent:16`, `studio/generate-variants:16`, `studio/initial-prompt:18`)

`"claude-sonnet-4-5-20250929"` förekommer 28 gånger som strängliteral (+ den felaktiga på `motion-generate:207`). En modelluppgradering kräver 29 redigeringar.
**Fix-riktning:** En klientmodul, en `CLAUDE_MODEL`-konstant, en `callClaudeJSON()`-helper som äger JSON-extraktionen.

### 3. Zod i bara 11 av 40 routes
Brief-, studio- och master-routes validerar med Zod; `analyze*`, `generate-copy`, `improve-copy`, `localize`, `persona-*`, `motion-*`, `templates`, `production`, `qa` gör manuella checks eller inga alls (`templates/route.ts:31` kollar bara `body?.name || body?.config`).

### 4. Inkonsekventa API-svarsformat
Grep över routes: `{ error: ... }` ×19, `{ message: ... }` ×3, `{ success: true }` ×4, plus payload-format som spretar: `{ brief, parsed }`, `{ templates }`, `{ records }`, `{ record, elapsedMs }`, `{ ...result, provider_info }`. Klientkoden måste komma ihåg formatet per endpoint.
**Fix-riktning:** Konvention `{ data } | { error: { code, message } }` + delad `apiError()`-helper.

### 5. Namnkonventioner blandas
- Komponenter: PascalCase-filer (`components/layout/Header.tsx`, `Sidebar.tsx`, `components/brand/NordeaLogo.tsx`, `components/campaign-planner/MediaCalculator.tsx`) sida vid sida med kebab-case (`components/layout/section-title.tsx`, hela `components/studio/*`) — t.o.m. inom samma mapp (`components/layout`).
- ID-namn: `briefId` ×33 (camelCase, klientsida) vs `brief_id` ×4 (DB-sida) — väntat vid Supabase-gränsen men det saknas ett mappinglager.
- Två orelaterade `Brief`-typer: `types/campaign.ts:32` (camelCase wizard-state för `/campaigns/new`) och `lib/brief/types.ts:36` `CreativeBrief` (snake_case DB-spegel). Namnkrocken är förvirrande — döp om den ena.

### 6. Hårdkodad Nordea-blå på 117 ställen
`#0000A0` förekommer 117 gånger i TSX/TS trots att Tailwind-tema/CSS-variabler finns. En brandfärgsjustering blir en 117-filers sökersättning.
**Fix-riktning:** `nordea-blue` som Tailwind-token, ersätt klasserna `bg-[#0000A0]` etc.

### 7. Jättefiler
`app/(dashboard)/campaigns/new/page.tsx` — **1 228 rader** (hela kampanjwizarden i en klientkomponent). Därtill `create/copy/page.tsx` 791, `campaign-planner/page.tsx` 671, `create/analyze/page.tsx` 670, `produce/page.tsx` 647, `MediaCalculator.tsx` 568. Stegen i wizarden bör bli egna komponenter (mönstret finns redan i `components/brief/stages/`).

### 8. Noll tester
Inga `*.test.*`/`*.spec.*`-filer, ingen jest/vitest-konfig, inget `test`-script i package.json. Ren logik som `lib/qa/compliance.ts`, `lib/brand/safe-zones.ts`, `lib/video-types.ts` (variant-enumerering) och `cost-tracker` vore billiga och värdefulla att enhetstesta.

### 9. Dokumentation föråldrad + skräp
- `README.md` säger "OpenAI API key (or Anthropic)" — projektet är Anthropic-only (`.env.example` har bara `ANTHROPIC_API_KEY`).
- `package.json` heter fortfarande `"nordea-temp-scaffold"`.
- Bra: kodkommentarerna är genomgående utmärkta (t.ex. middleware-historiken, worker-begränsningarna), och DEPLOYMENT.md + sprint-QA-checklistor finns.

### 10. 97 `console.*`-anrop som enda loggstrategi
Spritt över app/lib/components; ingen strukturerad logger, ingen Sentry/error tracking i dependencies. Fel i produktion försvinner i stdout.

---

## 💡 UX-FÖRBÄTTRINGAR

### 1. 45 handrullade `fetch('/api/...')`-anrop utan delad klient
Varje sida har egen `useState(loading)` (15 träffar på loading-state-mönstret), egen felhantering, eget response-parsande. En `useApi()`-hook eller liten typad API-klient skulle radera hundratals rader och ge konsekvent fel-UX (toast via redan installerade `sonner`).

### 2. Tillgänglighet: 12 `aria-`-attribut på 84 klientkomponenter
Drag/resize-canvasen (`components/studio/canvas-overlay.tsx`, `resize-handles.tsx`) är helt musdriven utan tangentbordsalternativ. Radix-primitiver (installerat) hjälper i modaler, men egna interaktiva element saknar roller/labels.

### 3. i18n: hårdkodad svenska överallt — inklusive API-felmeddelanden
Felsträngar på svenska sitter i API-lagret (`motion-render/route.ts:25,36,46`), prompts blandar svenska/engelska, och `profiles.language` ('sv'/'en') finns i DB men används inte i UI:t. Spec:en kräver nordisk/baltisk räckvidd — minst en strängkatalog behövs innan EN-stöd blir realistiskt.

### 4. Frusna produktionsjobb syns utan förklaring
Pga edge case #3 kan `/produce` visa jobb i `processing` för evigt utan retry-knapp eller felinfo. En "markera som misslyckad efter X min"-regel + retry vore billig.

---

## 📈 FÖRBÄTTRINGSPOTENTIAL

### Prestanda
- **Tunga klientberoenden:** `html2canvas` + `jspdf` (campaign-planner-export) och `@imgly/background-removal` (flera MB WASM) — verifiera att de är dynamiskt importerade vid interaktion, inte i sidbundlen. Remotion Player är korrekt isolerad i `lib/remotion/PlayerWrapper.tsx`.
- **`templates` GET hämtar allt:** `select('*')` utan paginering (`app/api/templates/route.ts:10–13`); `config`-kolumnen är hela VideoConfig-JSON:en — listvyn behöver inte den. Samma mönster i brief/master-listor.
- **Suspense bara i 5 sidor;** övriga dashboard-sidor är klientkomponenter som fetchar i `useEffect` → vattenfall + spinner-kaskader.
- Index i `migration.sql:464–483` är genomtänkta (partiella index för favoriter/cache) — bra.

### Drift/Enterprise-luckor (utöver säkerhet)
- **Ingen CI**, ingen monitoring, ingen analytics, ingen backupstrategi dokumenterad.
- **Audit-loggen** (`ai_generations`) är fail-open och täcker bara provider-anrop — inte CRUD på briefs/campaigns/templates eller QA-approvals.
- **Lagring:** allt renderat landar i `public/renders/` på lokal disk (`lib/remotion/render.ts:34`) — fungerar inte på Vercel (dokumenterat); Supabase Storage/S3-abstraktion behövs.
- **Dataexport/retention:** ingen mekanism att exportera eller gallra användardata (GDPR-relevant för en bank).

---

## Specifika hot-spots

| Fil | Varför |
|---|---|
| `middleware.ts` | Skyddar inte `/api/*`; cookie-*presence*-check + förfalskningsbar demo-cookie |
| `supabase/migration.sql:297–571` | 9 tabeller utan RLS, `user_id TEXT` utan FK, `DEFAULT 'default-user'` |
| `lib/supabase/service.ts` | Service-nyckel-fallback till anon |
| `lib/ai/providers/cost-tracker.ts` | Race i spend-uppdatering, fail-open budget |
| `app/api/motion-render/route.ts` + `app/api/motion-renders/route.ts` | Oautentiserad Chromium-rendering resp. fillistning/-radering |
| `app/api/motion-generate/route.ts:207` | Ogiltigt modell-ID (`claude-sonnet-4-5-20250514`) |
| `app/(dashboard)/campaigns/new/page.tsx` | 1 228 rader monolitisk klientkomponent |
| `lib/claude.ts` + `lib/ai/anthropic.ts` + 7 inline-klienter | Tre parallella Anthropic-integrationsmönster |
| `app/(auth)/login/page.tsx` + `lib/auth.ts` | Domänvalidering endast client-side |
| `next.config.ts` | `ignoreBuildErrors: true` utan CI som kompenserar |

**Rekommenderad prioritetsordning:** (1) auth-helper i alla API-routes, (2) RLS på alla tabeller + riktig service-nyckel, (3) server-side domänvalidering, (4) rätta modell-ID + konsolidera Claude-klienten, (5) CI med typecheck/lint, (6) rate limiting på AI/render-routes, (7) riktiga user-ID:n genom hela kostnads/audit-kedjan.
