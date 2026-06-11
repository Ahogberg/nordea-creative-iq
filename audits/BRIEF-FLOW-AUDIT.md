# Brief Flow Audit

> **Audit:** Fable 5 Deep-Dive · **Datum:** 2026-06-11 · **Model:** `claude-fable-5`
> **Scope:** Sprint 10, 11B — wizard, AI-prompts, persistens, Nordea brand-context
> **Granskningstyp:** Read-only, evidensbaserad (alla fynd verifierade mot kod med radhänvisning)

## Executive Summary

Granskningen omfattar hela brief-flödet (wizard, upload, review, kampanjgenerering, API-rutter, persona-data och schema). Viktig observation först: **Sprint 11B-funktionerna (brand context, AI-thinking, Big Idea-hero, inline editing, refinement) finns INTE i det utcheckade trädet** — de ligger enbart på den omergade branchen `feature/sprint-11b-brief-excellence`. Arbetsytan är baserad på 11A. Båda versionerna har granskats (11B-filerna via `git show`, read-only).

Helhetsbild: flödet är välstrukturerat och fungerar på happy path, men har **allvarliga luckor i felhantering och datapersistens**: sparfel sväljs tyst, brief-status sätts till `approved` innan användaren godkänt, strategi-persist kan misslyckas tyst, och brief→kampanj-kedjan skriver till en Supabase-tabell som kampanjvyn aldrig läser. Auth/ägarskap saknas helt för briefs. AI-JSON-parsning är skör (ingen hantering av trunkering eller schemavalidering). Persona-data finns i tre osynkade källor.

---

## 🚨 KRITISKA BUGS

### 1. Wizard-resume mot obefintlig brief → allt arbete går tyst förlorat
**Fil:** `app/(dashboard)/create/brief/wizard/page.tsx` rad 38–57, 102–106
**Bevis:**
```ts
fetch(`/api/brief/${briefIdParam}`)
  .then((r) => r.json())
  .then((data) => {
    ...
    if (brief?.wizard_state) { ... }   // inget else / ingen felhantering
  })
```
API:t returnerar 404 `{ error: "Not found" }`, men wizarden visar bara en tom wizard på steg 0. `briefId`-state är dock satt till det trasiga id:t (rad 33), så varje "Nästa" gör `PUT /api/brief/<trasigt-id>` → `.single()` felar → felet sväljs i `catch` (rad 102–104, bara `console.error`).
**Repro:** öppna `/create/brief/wizard?id=00000000-0000-0000-0000-000000000000`, fyll i alla fem steg — ingenting sparas, ingen varning visas, och review-steget anropar synthesize mot ett id som inte finns.
**Fix-riktning:** felstate vid 404 (som review-sidan har, rad 55–75 i `[id]/review/page.tsx`), och visa fel + blockera "Nästa" när save misslyckas.

### 2. Sparfel sväljs — wizarden går vidare ändå
**Fil:** `wizard/page.tsx` rad 115–121
**Bevis:**
```ts
await saveProgress(field, answer, currentStage + 1, merged);
nextStage();
```
`saveProgress` kastar aldrig (try/catch internt), så `nextStage()` körs även när PUT/POST gav 500 eller nätverket låg nere. Användaren ser bara en spinner som försvinner och tror allt är sparat.
**Fix-riktning:** låt `saveProgress` returnera success/fel; stanna kvar på steget och visa felbanner + retry vid fel.

### 3. Dubbelklick på "Nästa" i steg 1 → duplicerade briefs (race)
**Fil:** `components/brief/stages/stage-base.tsx` rad 164–172 + `wizard/page.tsx` rad 68–69, 94–101
**Bevis:** "Nästa"-knappen disablas bara av `answer.trim().length < 10` — inte under pågående save. Två snabba klick ger två parallella `handleStageComplete`; i båda closures är `briefId === null` → två `POST /api/brief` → två rader i `creative_briefs`. Den andra POST:ens svar vinner i `setBriefId` (out-of-order-risk), och den första briefen blir ett föräldralöst utkast i biblioteket.
**Fix-riktning:** disabla knappen medan `isSaving`, eller en in-flight-guard (ref) i `handleStageComplete`.

### 4. `synthesize` sätter `status='approved'` innan användaren godkänt → briefen försvinner från "Pågående briefer"
**Fil:** `app/api/brief/synthesize/route.ts` rad 117–124; `app/(dashboard)/create/brief/page.tsx` rad 23
**Bevis:**
```ts
.update({ ...strategy, status: "approved", ... })   // körs direkt när synthesis lyckas
```
och i biblioteket:
```ts
const draftBriefs = briefs.filter((b) => b.status === "draft");
```
**Repro:** kör wizarden till review-steget (synthesis körs automatiskt), klicka "Tillbaka och justera", lämna sidan. Briefen är nu `approved` och syns aldrig mer under "Pågående briefer" — på 11A/main finns ingen annan väg in (ingen `[id]`-vy), så briefen är i praktiken oåtkomlig från UI:t. 11B:s bibliotek (visar alla statusar) mildrar detta men grundfelet — att granskning ≠ godkännande — kvarstår.
**Fix-riktning:** sätt `approved` först vid klick på "Generera kampanj" (eller en explicit "Godkänn"-knapp), inte i synthesize.

### 5. `persistStrategy` ignorerar DB-fel — strategin kan se sparad ut utan att vara det
**Fil:** `app/api/brief/synthesize/route.ts` rad 112–125
**Bevis:**
```ts
await supabase.from("creative_briefs").update({ ...strategy, ... }).eq("id", briefId);
// returvärdets error kontrolleras aldrig
```
Strategin sprids dessutom rakt in i UPDATE. Om Claude returnerar ett extra fält som inte är en kolumn (schemat valideras aldrig, rad 83) felar hela UPDATE:n hos PostgREST — tyst. UI:t visar strategin (den kommer från API-svaret, inte DB), men `generate-campaign` läser sedan briefen ur DB och får `big_idea: null` etc.
**Fix-riktning:** zod-validera/plocka whitelistade fält ur LLM-svaret innan UPDATE, kontrollera `error` och returnera 500 vid persist-fel.

### 6. Ingen auth, inget ägarskap, ingen RLS för briefs/campaigns
**Filer:** `app/api/brief/route.ts` rad 30–48 (GET utan user-filter), `app/api/brief/[id]/route.ts` (GET/PUT/DELETE utan ägarkontroll), `supabase/migration.sql` rad 514–571 (ingen `ENABLE ROW LEVEL SECURITY` för `creative_briefs`/`campaigns`, till skillnad från Sprint 1-tabellerna på rad 149–236), `created_by: "default-user"` hårdkodat överallt.
**Konsekvens:** vilken inloggad användare som helst (eller anon-key-klient) kan lista, läsa, ändra och radera alla briefs. Frågan "what if brief belongs to other user?" har svaret: det finns inget "other user" — allt är globalt.
**Fix-riktning:** RLS-policies + `auth.uid()` i `created_by` (UUID), user-filter i API-rutterna.

### 7. Brief→Campaign skriver till Supabase, men kampanjvyn läser localStorage — genererade kampanjer syns aldrig
**Filer:** `app/api/brief/[id]/generate-campaign/route.ts` rad 175–189 (INSERT i `public.campaigns`); `app/(dashboard)/campaigns/page.tsx` rad 17 (`import { listCampaigns } from '@/lib/campaigns'`); `lib/campaigns.ts` rad 26–40 (`localStorage.getItem('nordea-campaigns')`).
**Bevis på modellkollision:** `types/campaign.ts:1` har `'draft' | 'in_review' | 'approved' | 'exported'` medan `lib/brief/types.ts:78` har `'draft' | 'in_review' | 'approved' | 'live'`. Två helt olika `Campaign`-interfaces med samma namn.
**Konsekvens:** kampanjraden som skapas från en brief existerar bara i DB och visas ingenstans i UI:t; statusflödet draft→in_review→approved→live är **inte implementerat någonstans** för DB-kampanjer (status sätts till `'draft'` på rad 184 och rörs aldrig igen).
**Fix-riktning:** konsolidera till en Campaign-modell (Supabase), migrera /campaigns-sidan, inför statusövergångs-API.

### 8. (11B) Refine-svar valideras inte → kan krascha review-rendern
**Filer (branch `feature/sprint-11b-brief-excellence`):** `app/api/brief/refine/route.ts` (parsed JSON returneras direkt, ingen typkontroll trots prompten "Behåll EXAKT samma datatyp"); `components/brief/stages/review-stage.tsx` `saveField` (skriver `suggestion` rakt till state + PUT).
**Konsekvens:** om AI returnerar en sträng för `key_messages` accepterar `RefinementModal` den ("Använd förslaget"), `saveField` sätter den i state — `strategy.key_messages.length > 0` är sant för strängar och `strategy.key_messages.map(...)` kastar `TypeError` → vit sida. Värdet PUT:as dessutom till JSONB-kolumnen och korrumperar briefen permanent.
**Fix-riktning:** servervalidering att suggestion matchar fältets schema; klientvalidering innan accept.

---

## ⚠️ POTENTIELLA EDGE CASES

### A. Skör AI-JSON-parsning — ingen hantering av trunkering
**Filer:** `ai-suggest/route.ts` rad 136–139, `synthesize/route.ts` rad 80–83, `parse/route.ts` rad 57–60, `generate-campaign/route.ts` rad 108–111 — alla identiska:
```ts
const jsonMatch = text.match(/\{[\s\S]*\}/);
if (!jsonMatch) throw new Error("No JSON in Claude response");
const parsed = JSON.parse(jsonMatch[0]);
```
Regexen klarar markdown-fences (greedy `{...}`), men `max_tokens`-trunkering (2000/4000) ger ogiltig JSON → `JSON.parse` kastar → 500 utan retry. Inget av svaren schemavalideras (zod finns men används bara på request). Bättre: tool-use/strict JSON-läge eller åtminstone validering + en retry.

### B. Ingen längdbegränsning på input till AI
`ai-suggest/route.ts` rad 10–14: `currentAnswer: z.string()` utan max; `context: z.any()` skickas i sin helhet (rad 125–129). Textarean i `stage-base.tsx` har ingen maxlängd. En användare som klistrar in 200k tecken ger token-överskridning → 500. `parse/route.ts` har däremot `max(20000)` (rad 11) — men zod-felet bubblas rått som `message` och visas ordagrant i upload-UI:t (`upload/page.tsx` rad 74).

### C. `generate-campaign` saknar idempotens och förkrav
**Fil:** `generate-campaign/route.ts`
- Ingen kontroll att briefen har en strategi — `brief.big_idea` kan vara `null` (t.ex. efter kritisk bugg 5) och prompten fylls med null-fält (rad 88–101).
- Vid partiellt fel (template skapad rad 133–145, sedan campaign-INSERT felar rad 175–189) → 500; "Försök igen"-knappen (`[id]/campaign/page.tsx` rad 104–113) skapar **ny** template + master varje gång → dubbletter ackumuleras.
- `config.scenes.reduce` (rad 113) kastar om AI:n utelämnar `scenes` — fångas men blir okontrollerad 500.
- Brief flippas till `'used'` (rad 192–195) även om användaren aldrig använder mallen.

### D. Auto-AI-fetch triggas om vid varje återbesök av ett steg
**Fil:** `stage-base.tsx` rad 50, 68–82. `hasAutoFetchedRef` är per-mount; komponenter avmonteras vid stegbyte. Gå tillbaka till ett ifyllt steg (>30 tecken) → ny AI-fetch efter 1,5 s → onödig API-kostnad varje gång man bläddrar bakåt/framåt eller resumar.

### E. Back-navigering raderar inte svar — men positionen kan "backas" i resume
Att gå tillbaka raderar **inte** tidigare svar (`answers` lever i wizard-state, `StageBase` får `initialAnswer`). Men: går man tillbaka från steg 4 till steg 1 och klickar "Nästa" sparas `wizard_state.current_stage = 1+1` (`wizard/page.tsx` rad 119) — en senare resume landar på steg 2 trots att steg 3–4 redan är besvarade. Mindre, men förvirrande.

### F. Otryckta textarea-ändringar tappas vid "Avbryt"/stängning
`StageBase` håller svaret i lokal state (rad 46) och propagerar bara vid "Nästa". "Avbryt" (`wizard/page.tsx` rad 136–141) navigerar direkt utan bekräftelse; ingen `beforeunload`-guard. Risk för förlorad text i mitten av ett steg.

### G. AI-utdata kastas bort
`onComplete(answer, suggestions)` i `stage-base.tsx` rad 166 skickar AI-outputs, men alla stage-wrappers (`(a) => handleStageComplete("problem", a)`, `wizard/page.tsx` rad 160 m.fl.) ignorerar andra argumentet. `WizardState.ai_suggestions` (`lib/brief/types.ts` rad 33) skrivs aldrig. 11B:s action-stage genererar dessutom `kpis` som aldrig används.

### H. `audience_personas` skrivs aldrig — 11B:s persona-sektion är död kod
Grep över hela 11B-branchen: `audience_personas` förekommer endast som **läsningar** (review-stage rad 217–223, `[id]/page.tsx` rad 114, clone i biblioteket). Varken wizarden, parse-rutten eller synthesize-promptens output-schema producerar det. Persona-matchningen i audience-steget hamnar bara som fritext i `audience_description`. Sektionen "Personas vi pratar till" kan aldrig rendera.

### I. Upload accepterar PDF/DOCX i filväljaren men kastar fel i klienten
`upload/page.tsx` rad 115 (`accept=".pdf,.txt,.md,.docx"`) vs rad 51–57 (throw för icke-text). Hjälptexten säger rätt ("PDF/DOCX kommer i nästa sprint", rad 142) men accept-attributet bjuder in till fel.

---

## 🔧 KODKVALITET

### 1. Två konkurrerande `NORDEA_BRAND_CONTEXT`
`lib/claude.ts:29` exporterar `NORDEA_BRAND_CONTEXT = NORDEA_SYSTEM_PROMPT` (från `lib/nordea-brand-guidelines.ts`), medan 11B introducerar ett **helt annat** `NORDEA_BRAND_CONTEXT` i `lib/brand/nordea-context.ts`. Vid merge av 11B finns två exporter med samma namn och olika innehåll — importkällan avgör vilken röst AI:n får. Sprint 10-prompterna (`ai-suggest/route.ts` rad 79, `synthesize/route.ts` rad 44) duplicerar dessutom ToV-reglerna inline ("kreditkort inte kort, aldrig fixar") i en enradsversion — tre sanningskällor totalt. 11B-prompterna är klart bättre (full brand-kontext, copy-exempel, anti-klyschelista) men ärver problemet.

### 2. Persona-data i tre osynkade källor
- `lib/constants/personas.ts` — `defaultPersonas`, **utan id** (4 st, "Ung Förstagångsköpare").
- `lib/persona-library.ts` — `PERSONA_LIBRARY` med id `'forstagangskopare'`, `'spararen'` … (6 st, med namn som "Oscar Bergström").
- Mock-svaret i `ai-suggest/route.ts` rad 178 hittar på `id: "ung_forstagangskopare"` som inte finns i någon av dem.

Brief-flödet matchar mot `defaultPersonas` (namn-slug i 11B: `personaSlug()` i review-stage), medan **QA-gaten (`lib/qa/persona-jury.ts` rad 27) använder `PERSONA_LIBRARY`** — samma kampanj bedöms alltså mot andra personadefinitioner än den briefades mot, och id-rymderna (`ung_forstagangskopare` vs `forstagangskopare`) är inkompatibla. Namn-slug-matchning betyder också att ett namnbyte i `personas.ts` tyst bryter alla sparade referenser.
**Fix-riktning:** en kanonisk personakälla med stabila id:n, mappningslager för bakåtkompatibilitet.

### 3. PUT `/api/brief/[id]` validerar inte body alls
`[id]/route.ts` rad 37–49: `...body` sprids rakt in i UPDATE. Klienten kan skriva `created_by`, `status`, godtyckliga kolumner — eller orsaka PostgREST-fel med okända nycklar. POST har zod men med `z.any()` för `key_messages`/`value_props`/`recommended_kpis`/`wizard_state` (`route.ts` rad 20–26).

### 4. Felaktig kostnadsloggning
Alla brief-rutter loggar `kind: "video"` för rena textanrop (`ai-suggest` rad 143, `synthesize` rad 90, `parse` rad 65) och hårdkodade kostnader (`0.005`/`0.02`/`0.01`) i stället för faktisk token-användning från `response.usage`. Budgetspårningen blir fiktiv.

### 5. `title` skrivs över vid varje save
`wizard/page.tsx` rad 73–76: titeln räknas om från `problem.slice(0, 60)` vid varje stegsave — varje framtida titelredigering (11B-bibliotek) skrivs över om användaren rör wizarden igen.

### 6. Hårdgräns 50 briefs utan pagination
`api/brief/route.ts` rad 37: `.limit(50)`. Vid 100+ briefs trunkeras listan tyst; 11B:s sök/filter söker bara i de 50 senaste — äldre strategier blir ohittbara trots att "brief-bibliotek" är själva featuren. Klientsidesfiltrering skalar inte.

### 7. Worker-stubben
`lib/production/worker.ts` rad 9–17 + 88–96: ärligt dokumenterad, men i produktion: `RENDER_BACKEND=lambda` → hårt throw (rad 92–96); processbunden körning → en Node-restart lämnar jobb i `status='processing'` **för evigt** — ingen timeout, ingen recovery-sweep, ingen "stuck"-detektion. Samma mönster saknas för kampanjgenerering: `[id]/campaign/page.tsx` kör synkront i requesten (15 s) — vid timeout/crash finns inget spår alls (ingen jobbtabell), bara retry-knappen som skapar dubbletter (se edge case C).

---

## 💡 UX-FÖRBÄTTRINGAR

1. **Ingen sparbekräftelse vid inline-edits (11B).** `saveField` i review-stage är optimistisk; PUT-fel loggas bara i console — användaren tror redigeringen sparades. Lägg till "Sparat ✓"-indikator + felrollback.
2. **"Generera om" skriver över manuella edits utan varning (11B).** Knappen kör `generateStrategy` direkt; allt användaren just inline-redigerat ersätts. Bekräftelsedialog behövs.
3. **Refinement-modalen visar rå JSON** för arrayfält (`renderValue` = `JSON.stringify`) — svårläst för en marknadsförare. Renderad förhandsvy per fälttyp vore bättre.
4. **Format/kanal-chips utan whitelist:** `FORMAT_LABELS[f] ?? f` (review-stage rad 236, 255) renderar AI-påhittade värden rått ("instagram_reels" som chip) och skickas vidare till generate-campaign som `recommended_formats[0]` (rad 153–156) → ogiltig `config.format`.
5. **Stegindikatorn är inte klickbar** (`wizard-progress.tsx`) — man måste klicka "Tillbaka" fyra gånger för att nå steg 1; svar är redan sparade så direktnavigering vore säker.
6. **Mobil:** stage-etiketter döljs under `sm` (wizard-progress rad 30) — ok; men 11B-bibliotekets sökfält har fast `w-72` och hero-textens `text-3xl md:text-4xl` med inline-`Edit3` kan radbryta fult. Inga drag-interaktioner i brief-flödet (de finns i 11A canvas, utanför scope).
7. **Synthesis-loadern (11B)** stegar på fast 1,5 s-intervall oavsett verklig progress — ärligare med obestämd indikator eller riktig streaming.

---

## 📈 FÖRBÄTTRINGSPOTENTIAL

1. **Debounced autosave av textarea-innehåll** (inte bara vid "Nästa") + `beforeunload`-guard → tar bort hela klassen "förlorad text".
2. **Tool-use / strikt JSON-läge för alla Claude-anrop** + zod-validering av svar + en automatisk retry vid parse-fel — ersätter de fyra kopiorna av regex-parsern (extrahera till delad `parseClaudeJson()`-helper).
3. **Statusmaskin för campaigns** (draft→in_review→approved→live) med API-endpoints och DB-constraint; idag är enumen ren dokumentation.
4. **Idempotensnyckel för generate-campaign** (t.ex. unik på `brief_id` + upsert) så retry inte skapar dubbletter.
5. **`unique_value`-fält saknas i wizarden** — kolumnen finns (migration rad 528), upload-parse fyller den, men wizardens fem steg samlar aldrig in den → wizard-briefs får systematiskt sämre synthesis-underlag än upload-briefs.
6. **Synthesize bör producera `audience_personas`** (id-lista) så 11B:s persona-sektion och framtida QA-gate-koppling får data.
7. **Server-side sök/pagination för biblioteket** innan 50-gränsen blir ett verkligt problem.
8. **Riktig PDF-parsning** (pdf-parse/unpdf server-side) — accept-attributet lovar det redan.

---

## Specifika hot-spots

| Hot-spot | Fil | Varför |
|---|---|---|
| `saveProgress` + `handleStageComplete` | `app/(dashboard)/create/brief/wizard/page.tsx:59–121` | Tyst felsvällning, POST-race, resume utan 404-hantering — tre kritiska buggar i ~60 rader |
| `persistStrategy` | `app/api/brief/synthesize/route.ts:112–125` | Ovaliderad LLM-spread + ignorerat DB-fel + för tidig `approved` |
| `generate-campaign` POST | `app/api/brief/[id]/generate-campaign/route.ts:55–213` | Ingen idempotens, inga förkrav, partiella skrivningar utan rollback |
| Auth-frånvaro | `app/api/brief/route.ts`, `app/api/brief/[id]/route.ts`, `supabase/migration.sql:514–571` | Globalt läs/skriv/radera utan RLS |
| Campaign-modellklyvning | `lib/campaigns.ts` vs `lib/brief/types.ts:69–84` + `app/(dashboard)/campaigns/page.tsx:17` | Genererade kampanjer hamnar i ett svart hål |
| `saveField`/refine (11B) | `components/brief/stages/review-stage.tsx` + `app/api/brief/refine/route.ts` (branch) | Ovaliderad AI-output kan korrumpera JSONB och krascha rendern |
| Persona-källorna | `lib/constants/personas.ts`, `lib/persona-library.ts`, `lib/qa/persona-jury.ts:27` | Brief och QA-gate använder olika personavärldar med inkompatibla id:n |
| JSON-parse-mönstret | 4 rutter, identisk regex | En gemensam, robust parser med validering behövs |

**Notera även:** 11B-branchen (`feature/sprint-11b-brief-excellence`, 6 commits) är inte mergad till `main` — om den mergas efter 11A behöver `NORDEA_BRAND_CONTEXT`-namnkollisionen med `lib/claude.ts:29` lösas, och Sprint 10-versionen av review-stage (utan `initialStrategy`-prop) skiljer sig från 11B:s, vilket påverkar `[id]/review/page.tsx`.
