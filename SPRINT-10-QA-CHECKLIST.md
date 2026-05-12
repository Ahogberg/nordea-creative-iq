# Sprint 10 — Brief-flöde + Strategi-modul — Manual QA

Verifiering på `/create/brief` efter att Sprint 10 mergats. Förutsätter att
`creative_briefs` + `campaigns`-migrationerna har körts mot Supabase (se
slutet av `supabase/migration.sql`).

## Förberedelser
- [ ] `creative_briefs`-tabellen finns (verifiera via Dashboard → Tables)
- [ ] `campaigns`-tabellen finns
- [ ] `NOTIFY pgrst, 'reload schema';` körd i SQL Editor om tabellerna är osynliga via REST
- [ ] `ANTHROPIC_API_KEY` med credits i Vercel ENV (för riktig output — annars kickar mock-fallback in)

## Entry Page
- [ ] `/create/brief` visar två kort: "Brainstorma med AI" + "Ladda upp brief"
- [ ] Klick "Brainstorma" → `/create/brief/wizard`
- [ ] Klick "Ladda upp" → `/create/brief/upload`
- [ ] "Pågående briefer"-sektion: tom visar "Inga pågående briefer än"; med drafts visar kort med status-stage + datum
- [ ] Klick på pågående wizard-brief → resumear på rätt stage
- [ ] Klick på pågående upload-brief → öppnar `/review`

## Wizard — Mode A (Brainstorming) — *Sprintens hjärta*
### Progress + Navigation
- [ ] WizardProgress visar 6 steg (Problem/Målgrupp/Insikt/Budskap/Handling/Granska)
- [ ] Aktivt steg är blå, klara steg är teal med check, kommande är grå
- [ ] Topbar visar "Steg X av 6" + "Avbryt" tillbaka till `/create/brief`
- [ ] Spara-spinner syns kort vid varje stage-byte

### Co-creation pattern (samma för alla stages)
- [ ] Textarea finns med svensk placeholder
- [ ] Efter ~1,5s av stabil text (>30 tecken) hämtas AI-förslag automatiskt
- [ ] Loader visas i AI-rutan under hämtning
- [ ] Klick på förslag *appendar* till textfältet (skriver ej över)
- [ ] "Hämta nya förslag"-knapp triggrar ny hämtning
- [ ] "Nästa"-knapp disabled tills svaret är ≥10 tecken trimmat
- [ ] AI-fel surfas inline i förslagsrutan (rött), kraschar inte stagen

### Stage-specifika förslag (kräver API-key för riktig output)
- [ ] **Problem:** 3 insights som bullet-list med 💡-prefix
- [ ] **Målgrupp:** persona-kort med match-% (matchas mot `defaultPersonas`: Ung Förstagångsköpare, Spararen, Familjeföräldern, Pensionsspararen)
- [ ] **Insikt:** insight-kort (teal-ram) + tension-kort (amber-ram)
- [ ] **Budskap:** 3 angle/headline/rationale-kort
- [ ] **Handling:** CTA-chips + value-prop-kort med primary/secondary-badge

### Auto-save
- [ ] Första stagen → POST `/api/brief` skapar brief, URL får `?id=`
- [ ] Efterföljande stages → PUT `/api/brief/[id]`
- [ ] Refresh mitt i wizarden laddar tillbaka rätt stage + svar
- [ ] Stänga och öppna draft från entry-sidan resumear korrekt

### Granska-steget (synthesis)
- [ ] Loader visas i ~10-15s under synthesis
- [ ] "Big Idea" syns som hero
- [ ] Insight + Tension i två kolumner
- [ ] 3 budskap-vinklar som kort
- [ ] 4-5 value props med primary/secondary check
- [ ] Tone of Voice-block
- [ ] Format + Channel-pills
- [ ] KPI-lista med metric/target/measurement
- [ ] "Tillbaka och justera" → Handling-stage
- [ ] "Generera kampanj" → `/create/brief/[id]/campaign`
- [ ] Synthesis-fel: röd alert + "Försök igen"-knapp

## Wizard — Mode B (Upload)
- [ ] `/create/brief/upload` visar fil-uppladdare + textarea
- [ ] TXT/MD-filer laddas in som text, blir parsade
- [ ] PDF/DOCX → inline-meddelande "klistra in som text istället" (medvetet stub:at)
- [ ] Tomt input → felmeddelande "Ladda upp en fil eller klistra in text"
- [ ] Parse-loader körs ~10s
- [ ] Vid framgång → `/create/brief/[id]/review` med strategy synthesis
- [ ] Review-sidan kör samma `ReviewStage` som wizard

## Brief → Campaign
- [ ] Klick "Generera kampanj" från ReviewStage → `/create/brief/[id]/campaign`
- [ ] Generation-loader ~15s
- [ ] Klar-state visar 1-2 kort:
  - "Massproducera" (alltid) → `/produce?template=<id>`
  - "Öppna i Master" (om Sprint 9 deployad) → `/create/master?id=<id>`
- [ ] Briefen flyttas från "Pågående" till "used" status (försvinner från listan)
- [ ] En ny rad i `templates`-tabellen med description `[Från brief] ...`
- [ ] En ny rad i `campaigns`-tabellen som länkar brief + template (+ master om Sprint 9)
- [ ] Fel: röd alert + "Tillbaka" / "Försök igen"

## Robusthet — Tidigare sprintar får inte brytas
- [ ] `/create/video` fungerar (Sprint 8a/8b)
- [ ] `/templates` listar templates inkl. de nya `[Från brief]`-mallarna
- [ ] `/produce` kan starta från en `[Från brief]`-mall
- [ ] `npm run build` clean
- [ ] `npm run typecheck` clean

## Cost tracking
- [ ] `ai_generations`-tabellen får rader per AI-anrop:
  - `prompt: brief_problem|audience|perception|message|action` från wizard
  - `prompt: brief_synthesize` från review
  - `prompt: brief_parse` från upload
  - `prompt: brief_to_campaign` från campaign generation

## Out of scope (medvetet)
- PDF/DOCX-parsing (per spec: "kan stub:as om det blir krångligt")
- AI rescue / re-synthesis från review-stage
- Kampanj-listsidan (campaigns visas indirekt via templates "Från brief")
- Editering av strategi-fält efter synthesis (kräver back-and-forth UX — Sprint 11+)
