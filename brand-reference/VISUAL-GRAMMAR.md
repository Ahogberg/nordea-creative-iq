# Nordeas visuella grammatik — utkast

> **Status: utkast (`draft`).** Genererad 2026-09-23 ur 18 svenska videoannonser.
> Ingen på marknad har granskat den ännu. Rätta eller stryk det som inte stämmer, och
> sätt sedan `"status": "reviewed"` och `"reviewed_by": "namn@nordea.com"` i
> `lib/brand/visual-grammar/visual-grammar.json`.

## 1. Sammanfattning

Nordeas sociala videoannonser är korta (6–8 s, högst 15 s) och lugna. De bygger på
enfärgad Nordea-blå (#0000A0) med en vit Nordea-logga som står helt stilla överst i
mitten från första till sista rutan, också över scenbyten. Budskapet syns inom 0,5 s.
Text tonar in som hela block, aldrig ord för ord. Den är alltid centrerad och i
meningsversal, med nyckelorden i bold och resten i regular i samma storlek.
Rubriker på blått sätts ofta i persika- eller krämton medan loggan är ren vit.

Bilden är antingen en isometrisk illustration (ca 30°, platta ytor utan konturer,
blå skala med persika som enda varma accent) eller en livsstilsfilm som följs av ett
blått textkort. I illustrationerna bär en enda liten rörelse berättelsen: ett mynt
som faller, en boll som rullar, fordon som glider in. Copy är oftast fråga + svar,
eller en mening som delas över två textkort.

Ingen av de 18 annonserna har en CTA-knapp eller använder turkos. CTA:n är en URL i
text eller en mjuk uppmaning. Kreditprodukter avslutas med räkneexempel och
Konsumentverkets varning i ett vitt band.

**Ramar, inte mallar.** Grammatiken styr Motion Studio på två nivåer:

- **Fasta ramar som alltid gäller:**
  - färgpalett
  - typografi
  - stilla logga
  - juridisk text
  - tonalitet
  - "gör inte"-listan
- **Inspiration:** arketyper, rörelserecept och referensannonser. De är beprövade
  utgångslägen som AI:n använder när användaren inte ber om något specifikt.
  Användarens prompt går före, och nya kompositioner och fri animation
  (canvas-scener) är välkomna inom ramarna.

## 2. Underlag

18 videor (inga statiska annonser), jämnt fördelade på format: 6 × 4:5, 6 × 9:16,
6 × 1:1. Filnamnen är UUID:n, så produkt, kanal och år är **härledda ur innehållet**
(år bara där ett datum syns i villkoren). Två filer i `Hämtade filer/CreativeIQ` var
byte-identiska dubbletter (`… (1).mp4`) och togs inte med.

**Viktigt för tolkningen:** 18 filer är bara **10 olika kreativ**. Samma kreativ
förekommer ofta i flera format, så ett belägg med tre id:n kan vara en och samma
annons.

| Kreativ | Produkt | Id (kort) | Format | Bild |
|---|---|---|---|---|
| Betalarmband för barn | kort/betalning | `307740cc`, `6b8c07f2`, `cd7057b4`, `d7e8ef2c`, `e845df0c`, `f2fc7560` | 4:5, 9:16, 4:5, 1:1, 1:1, 9:16 | Film (2–3 inspelningar) |
| Res smart i sommar | kreditkort | `7711d667`, `8a639c36`, `9035e2f3` | 4:5, 1:1, 9:16 | Produktbild + isometrisk |
| Hole in one | kreditkort | `7e8b34cf`, `e6f84a0f` | 4:5, 9:16 | Platt illustration |
| Dags att renovera? (burk) | lån, oklart | `4a5f9fdc` | 9:16 | Platt illustration |
| Dags att renovera? (pensel) | lån, oklart | `a0ae388d` | 9:16 | Platt illustration |
| Kan du få ett bättre bolån? | bolån | `76b3ac7a` | 1:1 | Typografisk |
| Räntero | bolån | `85b1de33` | 4:5 | Typografisk |
| Förstagångsköpare? | bolån | `9a635d11` | 4:5 | Isometrisk |
| Samla lån och krediter | lån | `94e1b8a6` | 1:1 | Isometrisk |
| Spara tid eller spara pengar? | sparande | `f8d59013` | 1:1 | Isometrisk |

Hela id:n: se `source_ad_ids` i `visual-grammar.json`. Varje analys finns i
`brand-reference/analysis/<id>.json` och bildrutorna i `brand-reference/frames/<id>/`.

## 3. Layout-arketyper

### `illustration-mitt-rubrik-under` — Illustration i mitten, rubrik under
Enfärgad bakgrund, logga överst. En centrerad illustration tar 20–45 % av ytan,
ibland på en klarare blå cirkel. Rubriken i 1–2 rader under den (ca 63–82 % av
höjden). Eventuell disclaimer längst ned.
*Scentyper:* `canvas` (illustrationsscen med `illustrationLayout: "illustration-top"`), `title`.
*Belägg:* `f8d59013`, `94e1b8a6`, `9a635d11`, `7711d667`/`8a639c36`/`9035e2f3` (scen 2) — 4 kreativ.

### `rubrik-over-bild` — Rubrik överst, bild under
Rubrik och underrubrik direkt under loggan, med produkten (kreditkort som solfjäder)
eller en platt illustration (golfhål) under. Används som öppningsscen.
*Scentyper:* `canvas` (`illustrationLayout: "illustration-bottom"`), `title`.
*Belägg:* `7711d667`, `8a639c36`, `9035e2f3`, `7e8b34cf`, `e6f84a0f` — 2 kreativ.

### `typografisk-fraga-med-stapelmonster` — Typografisk fråga med stapelmönster
Ingen bild. En kort fråga i stort, fett snitt i mitten. Nordeas stapelmönster (4–5
rundade vertikala staplar, som en ljudvåg) ligger nere till vänster, avskuret av
kanterna.
*Scentyper:* `title`, `text-reveal`.
*Belägg:* `76b3ac7a`, `85b1de33` — 2 kreativ.

### `helbildsfilm-rubrik-nedre-tredjedel` — Helbildsfilm med rubrik i nedre tredjedelen
Utfallande livsstilsfilm med långsam inzoomning. Vit logga, blått stapelmönster vid
vänsterkanten, vit rubrik och underrubrik direkt på bilden utan platta, och en vit
strålkrans som pulserar runt produkten. Följs alltid av ett blått textkort.
*Scentyper:* `title` (bild via `background: url(...)`).
*Belägg:* alla 6 betalarmbandsfilmer — **1 kreativ**.

### `centrerat-textkort` — Centrerat textkort (svar eller end card)
Andra scenen i de flesta annonser. Enfärgad yta (blå, eller persika med blå text och
logga) med loggan kvar på samma plats. Textblock i 2–4 rader i mitten med nyckelord i
bold, och eventuellt en URL i mindre text under.
*Scentyper:* `title`, `text-reveal`.
*Belägg:* `307740cc`, `cd7057b4`, `4a5f9fdc`, `a0ae388d`, `f8d59013`, `85b1de33` — 5 kreativ.

### `villkor-med-varningsband` — Villkor eller räkneexempel med konsumentkreditvarning
Villkor i liten vit text i mitten, med första raden i bold. För konsumentkrediter
dessutom ett vitt band över nedre 18–27 % med mörkröd varningstriangel och svart text
("Att låna kostar pengar! …"). I 9:16 står triangeln ovanför texten, i övriga format
till vänster. Bandet kan ligga kvar över flera scener (`94e1b8a6`).
*Scentyper:* `terms` + `legal.creditWarning` på videonivå.
*Belägg:* `7711d667`, `8a639c36`, `9035e2f3`, `94e1b8a6`, samt `76b3ac7a` och `85b1de33` (räkneexempel utan band) — 4 kreativ.

## 4. Rörelserecept

Alla recept har samma rörelsespråk, eftersom annonserna har det. Det som skiljer dem
åt är scenordningen:

- **Logga:** ingen animation (`reveal: none`).
- **Text:** tonas in som hela block (`stagger: none`, `text_animation: fade-up`).
  Underrubriken kommer 0,75–1,3 s efter rubriken.
- **Övergång:** mjuk toning (`crossfade`, 9–15 bildrutor).
- **CTA och siffror:** CTA:n tonar in lugnt (`fade`/`gentle`). Siffror räknas inte upp
  (`numbers.enabled: false`).

| Recept | Scenordning | Längd | Belägg |
|---|---|---|---|
| `illustration-fraga-svar` — illustration med fråga → svarskort | canvas → title | ~6 s | `f8d59013`, `94e1b8a6`, `9a635d11`, `7e8b34cf`, `e6f84a0f` |
| `produktintro-till-forman-med-villkor` — kort som fläktar ut → isometrisk förmån → villkor | canvas → canvas → terms | ~7 s | `7711d667`, `8a639c36`, `9035e2f3` (1 kreativ) |
| `typografisk-fraga-till-rakneexempel` — fråga (+ ordmorf) → erbjudande/URL → räkneexempel | title → text-reveal → terms | ~9 s | `76b3ac7a`, `85b1de33` |
| `foto-hook-bla-endcard` — film med rubrik och strålkrans → blått end card med knorr och URL | title → title | ~6 s | 6 × betalarmband (1 kreativ) |
| `fargbyte-avslojar-svar` — pensel eller burk sprider persika som avslöjar frågan → persika svarskort | canvas → title | ~6 s | `a0ae388d`, `4a5f9fdc` |

Tidsmönster som återkommer:
- Rubriken är fullt synlig vid 0,25–0,5 s.
- Illustrationens lilla rörelse börjar vid 0,75–1,0 s.
- Scenen byts vid 3–3,5 s.
- Texten tonar ut de sista 0,5 s. Flera filmer slutar på samma bild som de börjar med,
  så att de loopar.

## 5. Färg

- **Enfärgad Nordea-blå #0000A0** i nästan alla scener. Inga gradienter.
  *(`f8d59013`, `94e1b8a6`, `7711d667`, `8a639c36`, `76b3ac7a`, `7e8b34cf`, `cd7057b4`, `a0ae388d`)*
- **Loggan är ren vit. Rubriker på blått är ofta ljust persika eller kräm** (#FBD9CA,
  ibland ljusare #FDEEEC). Underrubriker, villkor och text på foto är vita.
  *(`94e1b8a6`, `7e8b34cf`, `e6f84a0f`, `7711d667`, `8a639c36`, `76b3ac7a`)*
- **Ljus variant:** ljusblå #E5EFFB med logga, text och grafik i Nordea-blå. Färgen
  finns inte i den dokumenterade paletten. *(`9a635d11`, `85b1de33`)*
- **Persika som hel bakgrund** i andra scenen, med blå logga och text. Färgbytet är
  självt berättelsen. *(`4a5f9fdc`, `a0ae388d`)*
- **Illustrationer är monokromt blå**, med persika som enda varma accent på det
  viktigaste objektet. *(`7711d667`, `94e1b8a6`, `9a635d11`, `f8d59013`, `8a639c36`)*
- **Turkos #40BFA3 förekommer inte** i någon av de 18. *(alla)*
- **Enda undantaget från paletten** är Konsumentverkets varning: vitt band, svart text
  och röd triangel. *(`7711d667`, `8a639c36`, `9035e2f3`, `94e1b8a6`)*
- **Stapelmönstret** är Nordea-blått på foto och ljus bakgrund, och klarare blått
  (#0200ED) på Nordea-blå. *(`76b3ac7a`, `85b1de33`, `cd7057b4`, `e845df0c`)*

## 6. Typografi

- **Blandade vikter i samma rubrik:** regular för löptexten och bold för nyckelordet,
  i samma storlek. Exempel: "Spara **tid** eller spara **pengar?**".
  *(`f8d59013`, `7711d667`, `94e1b8a6`, `76b3ac7a`, `7e8b34cf`, `a0ae388d`, `cd7057b4`)*
- **Centrerat och i meningsversal.** Versaler bara i rubriken på ett räkneexempel.
  *(`f8d59013`, `94e1b8a6`, `9a635d11`, `8a639c36`, `e845df0c`, `85b1de33`)*
- **Rubrik** i NordeaSansLarge, 1–3 rader, 4–8 % av bildhöjden, tätt radavstånd.
  **Underrubrik** i regular, ca 55–60 % av rubrikstorleken.
  *(`307740cc`, `7711d667`, `8a639c36`, `76b3ac7a`)*
- **En mening över två textkort** på samma plats ("Samla lån och krediter" → "och
  sänk din månadskostnad"). *(`94e1b8a6`, `7e8b34cf`, `e6f84a0f`)*
- **Produktnamn i CamelCase och bold** (SparaSmart, FlyttaBolån). Namnet får vara
  största texten i svarskortet. *(`f8d59013`, `85b1de33`)*
- **Villkor** i liten regular (2,5–3 % av höjden), med första raden i bold.
  *(`7711d667`, `94e1b8a6`, `76b3ac7a`, `85b1de33`)*

## 7. Illustrationsstil

**Isometrisk (ca 30°) med cel-skuggning:**
- Varje yta har en platt ton, med 2–3 blå toner per objekt.
- Inga konturer. En mjuk, mörkblå skugga under objekten.
- Rundade, leksaksaktiga former med låg till medel detaljnivå.
- Inga människor.
- Objekten svävar fritt, ensamma eller i ett centrerat kluster.
- Palett: #0300ED / #1A1AF0 (klarblå sida), #3D9BF5 (mellanblå), #9ECAF9 / #A5CEFC
  (ljus ovansida), #00007A (skugga) och #FBD9CA (persika-accent).

**Återkommande motiv:** hus, mynt och myntstaplar, spargris, varukorg, pilar, paj­diagram,
pengasäck, barnvagn, granar, flygplan, tåg och buss.

**Rörelse:** illustrationen står oftast färdig från första rutan. Sedan lever en eller
ett par detaljer:
- mynt som faller i grisen (`f8d59013`) eller landar vid huset (`9a635d11`)
- pilar som sjunker ner i korgen (`94e1b8a6`)
- fordon som glider in längs de isometriska axlarna (`7711d667`)

Platta varianter (golf, färgburk, pensel) använder samma palett och är också utan
konturer.

Engelsk prompt för illustratör eller bildmodell: se `illustration_style.generation_prompt` i JSON-filen.
*Belägg:* `f8d59013`, `94e1b8a6`, `9a635d11`, `7711d667`, `8a639c36`, `9035e2f3`.

## 8. Foto och film

Underlaget kommer **bara från betalarmbandskampanjen**, plus kreditkorten som
utskurna produktbilder.

- **Bildinnehåll:** livsstilsfilm med produkten i användning. Produkten är skarp, och
  personen syns bakifrån eller med ansiktet utanför fokus.
- **Ljus och styling:** starkt, varmt solljus och grunt skärpedjup. Ton-i-ton-styling
  i pastellrosa eller salviagrönt.
- **Rörelse:** långsam inzoomning (push-in).
- **Grafik ovanpå filmen:** vit text direkt på bilden, blått stapelmönster vid
  vänsterkanten och en vit strålkrans som pulserar två gånger runt produkten.
- **Övergång:** efter ca 3,5 s byts filmen alltid mot ett blått textkort.
- **Produktbilder:** kreditkorten visas som utskurna renderingar med mjuk skugga på blått.

*Belägg:* `307740cc`, `cd7057b4`, `d7e8ef2c`, `e845df0c`, (produktbild) `7711d667`, `8a639c36`.

## 9. Copy-mönster

| Mönster | Exempel | Belägg |
|---|---|---|
| Fråga + lugnt svar | "Spara tid eller spara pengar?" → "Välj SparaSmart när du vill spara både tid och pengar." | `f8d59013`, `76b3ac7a`, `a0ae388d`, `4a5f9fdc`, `9a635d11`, `85b1de33` |
| En mening över två kort, där nyttan står i bold | "Samla lån och krediter" → "och sänk din månadskostnad" | `94e1b8a6`, `7e8b34cf`, `e6f84a0f` |
| Produkt + målgrupp, sedan "Dessutom …" och URL | "Betalarmband för barn" → "Dessutom mobilförbudssäker." | betalarmband |
| Säsong + produkt, sedan förmånen | "Res smart i sommar" → "Få reseförsäkring för familjen" | `7711d667` m.fl. |
| Ordlek mellan text och bild eller mellan ordformer | "Ränteoro?" → "Räntero." | `85b1de33`, `7e8b34cf`, `f8d59013` |
| Mjuk CTA, aldrig knapp | "Räkna på hur mycket du har råd att köpa för" | `9a635d11`, `85b1de33`, `cd7057b4` |

## 10. Gör / gör inte

**Gör**
- Logga (ordmärket) stilla överst i mitten, på samma plats genom hela filmen.
  Uppmätt i annonserna (bredd av bildbredden / överkant av bildhöjden):

  | Format | Bredd | Överkant | Belägg |
  |---|---|---|---|
  | 1:1 | 23 % | 5,9 % | 4 av 6 |
  | 4:5 | 29 % | 4,8 % | 4 av 6 |
  | 9:16 | 28,5 % | 15,7 % | 3 av 6 |

  Bolånekampanjen (`85b1de33`, `9a635d11`) har en något mindre logga (25 %, 6,9 %)
  i 4:5, och betalarmbandet i 9:16 har 24 % och 14,8 %.
- Visa budskapet inom 0,5 s.
- Håll filmen till 6–8 s med 2–3 scener och byt scen kring 3–3,5 s.
- Låt en enda liten rörelse bära illustrationen.
- Avsluta kreditprodukter med villkor eller räkneexempel, och konsumentkrediter också
  med Konsumentverkets varning.
- Låt riskupplysningen "Investeringar innebär en risk." ligga kvar genom hela filmen
  för sparprodukter (bara ett belägg: `f8d59013`).
- Håll nedre ca 20 % tom i 9:16.

**Gör inte**
- Ingen CTA-knapp.
- Ingen animation ord för ord eller bokstav för bokstav.
- Ingen logo-animation, ingen studs och inga fjädrande rörelser.
- Återskapa inte produktionsfel: `f2fc7560` bryter "mobilförbudssäke / r.", och
  `7e8b34cf`/`e6f84a0f` har en ocentrerad panel som ser flyttad ut från ett annat format.
- Inga ansikten i fokus.

## 11. Osäkerheter

- **Tunt och likriktat underlag.** 10 kreativ, varav en kampanj (betalarmband) står för
  en tredjedel av filerna. Fotostilen, filmreceptet och filmarketypen vilar på **en
  enda kampanj**. Produktintro-receptet vilar på ett kreativ i tre format.
- **Bara video.** Grammatiken säger inget om statiska annonser (display, OOH), där
  referensdokumentet beskriver turkosa CTA-knappar. Regeln "ingen CTA-knapp" gäller
  alltså bara de här sociala videorna.
- **Övergångar är gissade.** Mellan 2 och 5 s tas bildrutorna med 1 s mellanrum, så
  typen av scenbyte (klipp eller toning) gick oftast inte att se. `crossfade` är vald
  eftersom de tydligt synliga bytena (`94e1b8a6`, `9a635d11`, `a0ae388d`, `8a639c36`)
  är toningar. Det behöver verifieras mot originalen.
- **Rubrikfärgen skiljer sig mellan kampanjer.** Den är persika (#FBD9CA) i golf och
  lån, nästan vit kräm (#FDEEEC/#FBEDE8) i kreditkort och bolån, och ren vit i
  SparaSmart och betalarmband. Oklart om det är en regel eller byråvariation.
- **Färger utanför paletten:** ljusblå #E5EFFB, klarblå #0200ED–#1A1AF0 i mönster och
  illustrationer, mörkare textblå ca #00007F (`9a635d11`) och en mörkare laxpersika
  #F3B9AB (`4a5f9fdc`). Blått mäts genomgående till #010094 i rutorna, vilket tolkats
  som #0000A0 efter videokomprimering.
- **Typsnitt:** skillnaden mellan NordeaSansLarge och Small är en bedömning från
  bildrutorna. Varningsbandets text kan vara ett systemtypsnitt.
- **Produkt:** alla produkter är härledda ur innehållet. Betalarmbandet har satts till
  `cards` (närmaste värde). Renoveringsannonserna har ingen produkt.
- **Regelefterlevnad (inte vår bedömning, men värt att flagga):** golf-annonserna
  (`7e8b34cf`, `e6f84a0f`) marknadsför kreditkort utan villkor och utan
  konsumentkreditvarning. De kan vara en förmånsannons till befintliga kunder.

## 12. Gap mot renderaren (utvecklingsbacklogg)

Status 2026-09-23. ✅ = åtgärdat i renderaren, ◐ = delvis, ☐ = kvar.

1. ✅ **Disclaimer och varningsband.** Ny scentyp `terms` (villkor och räkneexempel,
   första raden i bold) och `legal` på videonivå: `riskNote` (en rad genom hela
   filmen) och `creditWarning` (Konsumentverkets vita band med röd triangel, texten
   läggs in automatiskt). Scenerna hålls ovanför bandet. Berör 7 av 18.
2. ✅ **Blandade vikter.** `**fet**` i rubriker, underrubriker, rader, bildtexter och
   villkor: löptexten blir regular och det markerade bold. Berör 17 av 18.
3. ✅ **Rubrikfärg.** `headlineColor` på video och scen. Den ignoreras automatiskt där
   kontrasten är för låg, så att en persika rubrik på en persika scen blir blå.
4. ✅ **Illustrationer som huvudelement med egen rörelse.** Canvas-scenen kan vara en
   illustrationsscen (`headline` + `illustrationLayout`). Illustrationen är AI-skriven
   SVG-kod med fri animation och ett Nordea-kit i scope: isometriska primitiver, hus,
   mynt, palett, `fall`/`slideAlongIso`/`loop` m.fl.
   Det som återstår är ett större bibliotek med färdiga motiv. Spargris, varukorg och
   fordon byggs i dag av AI:n ur primitiverna, och kvaliteten beror på koden.
5. ✅ **Logga.** Storlek och avstånd från toppen följer de uppmätta värdena per format
   (`LOGO_LAYOUT` i `lib/remotion/styles.ts`); 16:9 saknar underlag och är härlett
   ur 1:1. Standardloggan är Nordeas ordmärke (`public/images/nordea-logo-neg.png`),
   färgat efter aktuell scen: vit på blått, blå på persika och ljusblått. En uppladdad
   logobild får samma storlek och läge men byter inte färg.
   **Säker yta:** allt innehåll hålls under loggan (loggans underkant + 3 % luft) och
   ovanför nedre marginalen. Marginalen är 20 % i 9:16 och 6 % i övriga format, eller
   högre upp om varningsband eller riskrad ligger där. Mallscenerna följer ytan
   automatiskt. Illustrationsytan klipps vid kanterna, så att inget som faller in
   hamnar vid loggan. Fri canvas-kod får ytan som `props.safe`. Bakgrunder går
   fortfarande ut i kanten.
6. ✅ **Färgbyte och mask-reveal** går att göra i canvas-scener (penseldrag som avslöjar
   rubriken finns som exempel i AI-prompten).
7. ◐ **Ordmorf och rubrik som glider** går att skriva fritt i canvas, men mallscenerna
   har inget stöd.
8. ◐ **Stapelmönstret** finns som `PillBars` i kitet (dekor, lugn puls). Det finns
   ännu inte som scenövergång.
9. ☐ **Övergångar.** `crossfade` tonar ut till bakgrunden och in igen, utan att blanda
   två scener. `slide` saknar utgång.
10. ◐ **Foto och film (sekundärt spår):**
    - Canvas-koden har `Img` och kan göra långsam inzoomning (Ken Burns) på en bild.
    - `Sparkle` (strålkransen) finns i kitet.
    - Filmbakgrund saknas fortfarande.
11. ✅ **CTA utan knapp.** Promptkatalogen styr mot en `title` med URL som underrubrik
    ("nordea.se/**betalarmband**"). `cta`-scenen ritar fortfarande en knapp, men används
    bara på begäran.

---

*Källa: `lib/brand/visual-grammar/visual-grammar.json` (maskinläsbar, styr Motion
Studio). Analyserna i `brand-reference/analysis/` innehåller ordagrann copy, tidslinjer
och observationer per annons.*
