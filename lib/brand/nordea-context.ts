// Nordea brand-rösten i kodform. Injiceras i alla Claude-prompts som rör
// copy och strategi. Det här är PLATTFORMENS RÖST — strukturen bevaras
// när officiell tone-of-voice doc importeras (då uppdateras texten,
// inte exporterna).
// TODO: ersätt innehållet med officiell Nordea tone-of-voice när importerad.

export const NORDEA_BRAND_CONTEXT = `
NORDEA BRAND CONTEXT:

Brand personality:
- Trygg utan att vara tråkig
- Kunnig utan att vara nedlåtande
- Hjälpsam utan att vara säljpushig
- Modern utan att glömma traditionen
- Mänsklig utan att vara informell

Tone of Voice:
- Lugn och rådgivande, aldrig pushig
- Direkt men inte hård
- Använder "du" — aldrig "ni"
- Frågeformat fungerar bra för problemrubriker
  ("Försenat flyg? Ersättningen ingår.")
- Förkortar inte ("att" inte "att.")
- Skriver siffror med mellanslag (4 500 kr, inte 4500kr)

ABSOLUTA REGLER:
- Alltid "kreditkort", aldrig "kort"
- Aldrig "fixar" (det lovar operativ lösning vi inte kan ge)
- Aldrig "garanterar" (compliance-issue)
- Aldrig "billigaste" eller "lägsta räntan" (måste kunna bevisa)
- Aldrig "snabb och enkel" (klyscha + okontrollerat löfte)

ENGLISH/SVENSKA BLANDNING:
- Behåll engelska tekniska termer (CTA, ROI, KPI)
- Behåll branschtermer (cashback, bonusprogram, etc.)
- Svenskifiera vardagsord ("login" → "logga in")

EMOTIONELL TYNGD:
- Tryggheten är central — människor har sina liv hos Nordea
- Stora livshändelser är heliga: första bostad, första bilen,
  pension, sparmål uppfyllt
- Pengaångest är reell — adressera utan att skuldbelägga
- Optimism utan naivitet

NORDEAS POSITION:
- Inte den nyaste eller hippaste — men den som finns kvar
- Stabil partner, inte en disruptor
- Lokal förståelse + internationell muskel
- Långsiktig relation, inte snabb transaktion
`.trim();

export interface NordeaCopyExample {
  context: string;
  headline: string;
  body: string;
  why_good: string;
}

export const NORDEA_COPY_EXAMPLES: NordeaCopyExample[] = [
  {
    context: "Bolån för förstagångsköpare",
    headline: "Drömhuset väntar — räkna på det idag",
    body: "Vi vet att ett första hem är ett stort beslut. Därför finns vi här när du behöver oss — innan, under och efter köpet.",
    why_good:
      'Erkänner storheten i beslutet utan att skuldbelägga. "Räkna på det" = låg friktion. "Innan, under och efter" = relationsbudskap.',
  },
  {
    context: "Kreditkort med trygghetspaket",
    headline: "Innan du bokar — kolla kortförmånerna",
    body: "Avbeställningsskydd, försenat bagage, sjukvård utomlands. Allt ingår med vissa Nordea-kreditkort.",
    why_good:
      'Tipsar utan att tvinga. Listar konkret. "Vissa" = ärlig (inte alla kort har detta).',
  },
  {
    context: "Sparande för pension",
    headline: "Det är aldrig för sent att börja",
    body: "Boka 30 minuter med en rådgivare — vi hjälper dig se hur långt din pension räcker idag, och vad du kan göra åt det.",
    why_good:
      'Empati ("aldrig för sent") + konkret action ("30 minuter") + transparent löfte.',
  },
];

export const NORDIC_INSPIRATION = `
INSPIRATION (utan att kopiera):

- Volvo: trygghet utan att skrämma
- IKEA: vardagsmagi, inte lyx
- Telenor "Hjälper Norge": social connection
- Spotify "Wrapped": personlig data som upplevelse
- ICA: humor som verktyg för förtroende

UNDVIK CLICHÉS:
- "I en värld där..." (för pretentiöst)
- "Vi tror på..." (alla brands "tror" på något)
- "Tillsammans kan vi..." (för vagt)
- "En ny era av..." (alltid en lögn)
`.trim();
