# CreativeIQ arbetsflöden

Huvudmenyn har fem val: Översikt, Kampanjer, Skapa, Bibliotek och Granskningar. Inställningar ligger separat. Mallar och mediatillgångar finns som flikar i Bibliotek. Befintliga länkar till mallar, media och massproduktion fungerar fortfarande och markerar Bibliotek i menyn. Briefar, budget och lokalisering hör till Kampanjer.

## Video

En ny video börjar tom och med en prompt för hela filmen, format och längd. Första genereringen använder initial-prompt-API:et. Därefter visas hela utkastet och AI-chatten. Hela videon är alltid standardomfattning för ändringar, även om en scen är markerad för uppspelning. Användaren måste välja Endast scen uttryckligen för en lokal ändring.

Scenraden är infälld tills användaren väljer Redigera scener. Grundläggande läge ger scenegenskaper; Avancerad visar rörelsekontroller, lager och keyframes. En ny kampanj eller mall som läses in återställer omfattningen till hela videon och stänger detaljredigeringen. Ett sent AI-svar får inte skriva över nyare manuella ändringar.

## Kampanjer

Arbetsytan har Brief, Material, Format och marknader, Granskning och Export. Budget och målgrupp ligger i Brief. Budgetplaner använder den befintliga campaign_plans-tabellen: den kopplade planens primärnyckel är kampanjens UUID. Servern verifierar kampanjägare och använder den inloggade klientens RLS. Demoklientens servernyckel används aldrig för budgetskrivningar. Schema och befintliga fristående planer ändras inte.

Lokalisering börjar med texten från kampanjens video. Kampanjens rapportlänk filtrerar användarens QA-historik före resultatbegränsningen. Export öppnar exportdialogen i studion. Fler varianter startas från kampanjens sparade mall. Export är inte ett automatiskt godkännande och tidigare rapporter kan gälla äldre material.

## Verifiering

49 tester täcker sparning, explicit promptomfattning, navigation samt budgetvalidering, ägaråtkomst och sparrundtur i en simulerad datakälla. CI verifierar typkontroll, lint och produktionsbygge med låsfilen. Browser-test med kontrollerade AI- och kampanjsvar verifierar tom videostart, generering av en hel video, hela-videon-scope efter scenmarkering, uttrycklig scenändring, avancerat läge, bibliotek, kampanjsteg samt budgetens återöppning.

Ett riktigt Nordea-konto och databasens befintliga campaign_plans-tabell behövs för sparning av budget i den driftsatta miljön. I demo kan budget beräknas och exporteras till PDF, men inga budgetskrivningar görs.
