# Brand reference — Nordeas befintliga annonser

Här samlar vi Nordeas befintliga annonser (Sverige) så att Claude kan analysera
den visuella stilen: layout, färg, typografi, illustrationer och rörelse.
Resultatet blir en **visuell grammatik** som Motion Studio genererar efter.

```
brand-reference/
├── ads/            ← lägg annonserna här (undermappar går bra)
├── manifest.csv    ← en rad per annons: produkt, kanal, kampanj …
├── frames/         ← genereras: bildrutor ur videorna
├── analysis/       ← genereras: en JSON-analys per annons
└── VISUAL-GRAMMAR.md ← genereras: läsbar sammanfattning för granskning
```

## 1. Lägg in material

**Vad:** färdiga annonser som publicerats i Sverige, helst från de senaste 2–3
åren så att stilen är aktuell. 30–100 st är lagom; 10 räcker för en första
version.

| Typ | Format | Tips |
|---|---|---|
| Statiska (display, social, OOH) | PNG / JPG / WebP | Exportera i full storlek. En fil per format om samma annons finns i flera. |
| Video / animerade (social, CTV) | MP4 / MOV / WebM | Originalfilen, inte en skärminspelning om det går. |
| HTML5-banners | — | Spela in som video (MP4) eller exportera slutbilden som PNG. |

Välj en blandning av produkter (bolån, sparande, kort, pension …), kanaler och
format. Ta med annonser med **isometriska illustrationer** och **animationer**,
eftersom det är där vi behöver mest underlag.

**Filnamn:** beskrivande, t.ex. `Bolån Vår 2025 (9x16).mp4`. Filnamnet blir
annonsens id (`bolan-var-2025-9x16`), så två filer får inte heta likadant.

**Videor committas inte** (de är gitignorerade för att de är stora). Bildrutorna
i `frames/` committas i stället. Kör Claude Code lokalt där videorna finns.

## 2. Fyll i manifest.csv

En rad per fil. Bara `file` krävs, men resten gör analysen bättre:

```csv
file,product,channel,campaign,year,result_notes,notes
"Bolån Vår 2025 (9x16).mp4",mortgage,meta,Bolån vår,2025,"CTR 1,1 %",Toppresterande variant
"Spara MREC.png",savings,display,Månadsspar,2024,,
```

- `file`: sökväg relativt `ads/`
- `product`: `mortgage`, `savings`, `loans`, `pension`, `insurance`, `cards`,
  `business` eller `general`
- `channel`: t.ex. `meta`, `tiktok`, `youtube`, `display`, `ooh`, `ctv`
- `result_notes`: resultat om ni har dem (CTR, brand lift …). Används senare
  för att kalibrera persona-panelen mot verkligheten.

## 3. Kör analysen

```bash
npm run brand:frames     # plockar ut bildrutor ur videorna
npm run brand:validate   # visar vad som finns och vad som saknar analys
```

Be sedan Claude Code: **"Kör nordea-visual-grammar"** (skillen ligger i
`.claude/skills/nordea-visual-grammar/`). Claude:

1. analyserar varje annons till `analysis/<id>.json`,
2. sammanfattar allt till `lib/brand/visual-grammar/visual-grammar.json`,
3. skriver `VISUAL-GRAMMAR.md` med belägg, osäkerheter och det renderaren inte
   klarar i dag.

## 4. Granska

Läs `VISUAL-GRAMMAR.md`. Varje regel pekar på vilka annonser den bygger på.
Stryk eller rätta det som inte stämmer, och sätt sedan i `visual-grammar.json`:

```json
"status": "reviewed",
"reviewed_by": "namn@nordea.com"
```

Motion Studio använder grammatiken redan som `draft`, i Skapa video, varianter,
chatten och kampanjgenerering från brief. Granskningen är en kvalitetsstämpel.

## Rättigheter

Kontrollera att annonserna och illustrationerna får användas internt för
AI-analys. Byråavtal reglerar ibland just det. Material som inte får analyseras
ska inte läggas här.
