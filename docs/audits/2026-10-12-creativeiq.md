# Nordea CreativeIQ granskning och förbättringar

12 oktober 2026. Underlag: aktuell huvudgren och den publika Vercel-miljön. Kodförändringarna ligger separat på grenen codex/creativeiq-audit-simplification.

## Huvudbedömning

CreativeIQ har en användbar kärna: kampanjens strategi, video och displaymaterial kan samlas på ett ställe, och motionstudion erbjuder både AI-chatt och detaljerad redigering. Den största förbättringen är att göra samma arbetsflöde begripligt och tillförlitligt hela vägen: planera, skapa, anpassa, granska och exportera.

Prioritera sparning och tydlig granskningsstatus före fler animationsfunktioner. Färre synliga knappar hjälper, men användaren måste också kunna lita på att materialet är sparat, att resultatet gäller rätt version och att visade poäng faktiskt kommer från en genomförd bedömning.

## Vad som är granskat

Live-demot granskades utan kampanjändringar eller startade AI-jobb på 12 ytor: översikt, Skapa, Motion Studio, kampanjer, mallar, massproduktion, mediabibliotek, granskningar, personas, mediaplanering, lokalisering och inställningar. Annonsanalys och copy granskades i kod. Motionstudion kontrollerades vid 1440 och 1024 pixlars bredd. Automatisk kontroll hittade ingen horisontell sidöverströmning där och inga JavaScript-sidkrascher under rundan. Det ersätter inte en full visuell och interaktiv tillgänglighetsgranskning.

Live-demots översikt, kampanjer och QA-historik fick hämtningsfel. Därför är databasflödet i dessa ytor inte verifierat. Ett riktigt Nordea-konto, sparning över omladdning, faktisk AI-kvalitet, fokusgruppens fyra obligatoriska personas och rendering i produktion återstår att testa.

## Förbättringar i arbetskopian

| Område | Genomförd ändring | Nytta |
| --- | --- | --- |
| Skapa | Explicit val av arbetsuppgift i stället för automatisk nyckelordsstyrning | En begäran om att granska en video hamnar inte automatiskt i videogenerering |
| Motionstudions topprad | Sekundära handlingar samlas i Fler åtgärder; Granska text förklarar omfattningen | Färre konkurrerande åtgärder och tydligare granskning |
| Sparstatus | Väntande ändringar visas direkt; sparfel har ett omförsök | Sparad visas först när servern bekräftat ändringarna |
| Kampanjsparning | Skrivningar ordnas, pågående ändringar sparas efter den aktiva skrivningen | Äldre requests skriver inte över nyare redigering |
| Kampanjbyte | Sparfel stoppar bytet; sena laddningar ignoreras | Utkast försvinner inte vid misslyckad sparning |
| Tom kampanj | Tomt material öppnas som ett tomt utkast | Föregående kampanjs video följer inte med |
| AI-redigering | Ett sent AI-svar kan inte ersätta material som redan ändrats | Manuella ändringar och nyare kampanjkontext bevaras |
| Tillbaka från studion | Sparningen inväntas; fel stoppar navigationen | Användaren kan åtgärda problemet innan arbetet lämnas |
| Exportstatus | HTTP-fel och ogiltiga statusvärden hanteras | Exporten kan inte fastna i ett otydligt läge efter ett API-fel |
| Annonsanalys och lokalisering | Exempelresultat märks som demonstration; verkliga fel visas som fel | Inga osynliga ersättningar med påhittade lyckade resultat |
| Navigation | Översikt och Granskningar; lokalisering blir synlig; mobilmenyn markerar undervyer | Enklare språk och bättre orientering |
| Översikt | Aktuella kampanjer och snabbstart kommer före annonsexempel | Arbetsuppgifter får företräde framför inspirationsmaterial |

## Prioriterade fortsatta åtgärder

| Prioritet | Fynd och underlag | Åtgärd och acceptanskrav |
| --- | --- | --- |
| P0 | Live-demo kan öppnas publikt, men översikt, kampanjer och granskningar får hämtningsfel | Avgör avsedd demomiljö och verifiera dess databasägare. Visa tydligt demonstrationsläge. Testa alla tre läsflöden med avsedd användare |
| P0 | Middleware kontrollerar cookiens närvaro; flera AI-endpoints, exempelvis analyze-image och localize, saknar egen verifiering av sessionen | Verifiera användare och Nordea-domän i varje skyddad serverhandling. Testa anonym, ogiltig session och konto utanför Nordea. Ingen bypass provades mot produktion |
| P0 | Kampanjstatus kan sättas till Godkänd eller Live via ett vanligt val i kampanjvyn/API:et | Gör statusen till en spårbar handling med rätt roll, aktuellt material och granskningsunderlag. Behåll separat möjlighet att exportera ett märkt utkast |
| P1 | Text-QA, automatiska stillbildskontroller och fokusgrupp har olika omfattning men presenteras nära varandra | Visa tre begripliga delar: textgranskning, visuell kontroll och simulerad målgruppsfeedback. Visa vad som saknas och undvik ett gemensamt godkännande för ofullständigt underlag |
| P1 | Granskningsanrop använder kampanjreferens utan tydligt innehållsfingeravtryck i studioflödet | Koppla varje rapport till en bestämd materialversion. En text-, scen- eller formatändring måste visa att tidigare rapport gäller äldre material |
| P1 | Copy-sidan har fortfarande mock-fallback vid nätverksfel i generering och förbättring | Tillämpa samma tydliga demo- och felkontrakt som i annonsanalys. Inget fel får presenteras som en lyckad generering |
| P1 | Inställningar visar SSO som Aktiv, språkval och notifikationer utan att detta i granskningen kunde bekräftas som fungerande | Hämta faktisk systemstatus från servern. Visa ej tillgängligt för funktioner som saknar implementation. Verifiera att ändrad inställning påverkar avsedda flöden |
| P1 | Media-planerarens Exportera PDF och Spara kampanj saknar handling på de granskade knapparna | Implementera eller ta bort handlingarna tills de fungerar. Sparad budget ska kunna öppnas igen och exporten motsvara aktuell prognos |
| P1 | Lokalisering erbjuder bara SE, DK, NO och FI i UI:t; specifikationen kräver även EE och LT | Lägg till de återstående marknaderna genom hela kedjan, inklusive prompts, validering, format och kvalitetssäkring |
| P1 | Dashboard har marginaler både i gemensam layout och i sidan | Standardisera en sidbehållare för rubrik, innehåll och bredd. Kontrollera 768, 1024 och 1440 pixlar visuellt |
| P1 | Chatt, scenrad, lagerspår och inspektör konkurrerar om utrymmet i motionstudion | Gör Grundläggande redigering till standard och erbjud tidslinje/lager som ett tydligt avancerat läge. Klick på element ska öppna dess relevanta egenskaper |
| P1 | Exportmodala dialoger använder egen implementation | Använd en gemensam dialog med fokusfälla, Escape och återställd fokus. Testa hela flödet med tangentbord |
| P1 | API-felet i annonsanalys kan lämna separat persona-feedback synlig | Bind analys och persona-resultat till samma materialversion och visa fel per del. Återanvänd bara uttryckligen giltiga resultat |
| P2 | Mallar och massproduktion är separata ingångar även när användaren utgår från en kampanj | Låt kampanjens material ha Anpassa format och Skapa fler varianter som kontextuella handlingar. Återanvänd format/kanalval från briefen |
| P2 | Mediabiblioteket beskriver tillgångar som godkända utan synlig källa eller godkännandedatum | Visa tillgångens källa, marknad, användningsrätt och faktisk godkännandestatus innan den används |
| P2 | Simulerad klickvilja och uppmärksamhet riskerar att uppfattas som uppmätta resultat | Behåll tydlig märkning, visa återkommande invändningar först och osäkerheten nära värdet. Faktiska kampanjresultat kräver separat datakälla |

P0 betyder att åtgärden bör vara klar före skarp användning. P1 betyder nästa funktionella förbättringsomgång. P2 betyder fortsatt förenkling och kvalitet.

## Föreslagen struktur

Låt kampanjen vara den sammanhållande arbetsytan med fem steg: Brief, Material, Format och marknader, Granskning och Export. Skapa-sidan behålls för fristående arbetsuppgifter, med synligt val att koppla materialet till en kampanj. Budgeten kopplas till samma kampanj utan att användaren behöver skapa en separat plan på nytt.

Motionstudions huvudytor är AI-chatt, video och scenrad. Grundläggande redigering visar text, längd och relevanta varumärkesval. Avancerad redigering visar lager, keyframes och tidslinje. Formatväxling, safe zones och förhandsvisning förblir nära videon. Verktyg och koddetaljer som inte behövs för den aktuella uppgiften hålls bakom ett aktivt val.

Översikten bör svara på tre frågor: Vad arbetar jag med, vad behöver åtgärdas och vad är redo för nästa steg? Antal kampanjer och genomsnittspoäng kan vara sekundära mått. Visa en lista med återuppta arbete, granskningsbehov och misslyckade exporter; varje rad leder till rätt materialversion.

## Verifiering och leveransstatus

31 enhetstester passerar, varav sex nya regressionstester för kampanjsparning. Typkontrollen passerar i den tillfälliga miljön. Lint rapporterar befintliga problem; en jämförelse av ändrade filer mot huvudgrenens original kontrollerar att nya lintfel inte introducerats.

Full installation från låsfilen och ett tillförlitligt produktionsbygge har inte slutförts: C-disken var nästan full. Den tillfälliga miljön återanvänder tidigare installerade paket och är inte identisk med låsfilen. Ett byggförsök med en oförenlig gammal kommandogenväg avbröts; det räknas inte som ett godkänt bygge. Inga beroendeversioner eller låsfiler har ändrats i projektet.

Förbättringarna är därför ett granskningsbart första paket, inte en färdig produktionsrelease. CI med låsta beroenden, browser-test av den ändrade versionen, riktigt Nordea-login, databasrundtur, fokusgrupp med fyra obligatoriska personas och faktisk export måste vara klara innan release.

## Ordning för nästa förbättringsomgång

1. Verifiera rätt servermiljö, åtkomst och sparning över omladdning.
2. Inför materialversioner och sanningsenlig gransknings- och godkännandestatus.
3. Förenkla motionstudion med grundläggande och avancerad redigering; gör export återupptagbar.
4. Samla copy, format, lokalisering och budget kring kampanjen.
5. Genomför samma användaruppgift på dator och tablet med tangentbord och en ny användare; följ antal omvägar, fel och tid till exporterbart utkast.
