// Delade mock-lokaliseringar — används både av /api/localize-fallbacken och
// lokaliserings-sidan så att klientvägen är identisk med och utan AI-nyckel.

export interface LocalizedResult {
  market: string;
  headline: string;
  body: string;
  cta: string;
  scores: { linguistic: number; cultural: number; legal: number };
  adaptations: Array<{
    type: string;
    original: string;
    adapted: string;
    reason: string;
  }>;
  alternativeHeadlines: Array<{ text: string; confidence: number }>;
}

export const mockLocalizations: Record<string, LocalizedResult> = {
  dk: {
    market: 'dk',
    headline: 'Dit første hjem starter med en simpel beregning',
    body: 'At købe sin første bolig er en stor beslutning. Vi ved, det kan føles overvældende med afdragskrav, udbetaling og rentebinding. Derfor har vi gjort det nemt. Med vores boliglånsberegner får du svar på få minutter – helt uforpligtende.',
    cta: 'Prøv beregneren',
    scores: { linguistic: 92, cultural: 88, legal: 85 },
    adaptations: [
      { type: 'linguistic', original: 'bolånekalkylator', adapted: 'boliglånsberegner', reason: 'Dansk terminologi för bolåneverktyg' },
      { type: 'cultural', original: 'kontantinsats', adapted: 'udbetaling', reason: 'Dansk term för handpenning' },
      { type: 'tone', original: 'steg för steg', adapted: 'nemt', reason: 'Danskare föredrar enkel, direkt kommunikation' },
    ],
    alternativeHeadlines: [
      { text: 'Din første bolig? Start med en hurtig beregning', confidence: 88 },
      { text: 'Se hvad du har råd til – på få minutter', confidence: 82 },
    ],
  },
  no: {
    market: 'no',
    headline: 'Din første bolig starter med en enkel kalkulator',
    body: 'Å kjøpe sin første bolig er stort. Vi vet at det kan føles overveldende med avdragskrav, egenkapital og rentebinding. Derfor har vi gjort det enkelt. Med vår boliglånskalkulator får du svar på noen minutter – uten forpliktelser.',
    cta: 'Test kalkulatoren',
    scores: { linguistic: 95, cultural: 90, legal: 87 },
    adaptations: [
      { type: 'linguistic', original: 'kontantinsats', adapted: 'egenkapital', reason: 'Norsk term för handpenning' },
      { type: 'legal', original: 'amorteringskrav', adapted: 'avdragskrav', reason: 'Norsk juridisk terminologi' },
    ],
    alternativeHeadlines: [
      { text: 'Drømmer du om egen bolig? Start her', confidence: 85 },
      { text: 'Finn ut hva du har råd til – helt gratis', confidence: 80 },
    ],
  },
  fi: {
    market: 'fi',
    headline: 'Ensimmäinen kotisi alkaa yksinkertaisella laskelmalla',
    body: 'Ensimmäisen asunnon ostaminen on iso asia. Tiedämme, että se voi tuntua ylivoimaiselta lyhennysvaatimusten, käsirahan ja korkojen kanssa. Siksi olemme tehneet siitä helppoa. Asuntolainlaskurillamme saat vastaukset muutamassa minuutissa – ilman sitoumuksia.',
    cta: 'Kokeile laskuria',
    scores: { linguistic: 88, cultural: 92, legal: 90 },
    adaptations: [
      { type: 'cultural', original: 'steg för steg', adapted: 'yksinkertaisella', reason: 'Finsk kultur värderar rakhet och effektivitet' },
      { type: 'tone', original: 'Vi hjälper dig förstå', adapted: 'Olemme tehneet siitä helppoa', reason: 'Mer faktabaserad ton för finsk marknad' },
    ],
    alternativeHeadlines: [
      { text: 'Paljonko sinulla on varaa? Selvitä minuuteissa', confidence: 90 },
      { text: 'Ensiasunnon ostajan laskuri – nopea ja helppo', confidence: 86 },
    ],
  },
  ee: {
    market: 'ee',
    headline: 'Sinu esimene kodu algab lihtsast arvutusest',
    body: 'Esimese kodu ostmine on suur samm. Teame, et sissemakse, laenumaksed ja intressid võivad tunduda keerulised. Seepärast oleme teinud selle lihtsaks. Meie kodulaenukalkulaatoriga saad vastused mõne minutiga – ilma kohustusteta.',
    cta: 'Proovi kalkulaatorit',
    scores: { linguistic: 90, cultural: 91, legal: 86 },
    adaptations: [
      { type: 'cultural', original: 'utan förpliktelser', adapted: 'ilma kohustusteta', reason: 'Digital-first-marknad – betona snabbhet och enkelhet' },
      { type: 'tone', original: 'Vi vet att det kan kännas överväldigande', adapted: 'Teame, et …', reason: 'Estnisk kommunikation är effektiv och rak' },
    ],
    alternativeHeadlines: [
      { text: 'Arvuta oma kodulaen minutitega', confidence: 87 },
      { text: 'Esimene kodu? Alusta siit', confidence: 81 },
    ],
  },
  lt: {
    market: 'lt',
    headline: 'Jūsų pirmieji namai prasideda nuo paprasto skaičiavimo',
    body: 'Pirmojo būsto pirkimas – didelis žingsnis. Žinome, kad pradinis įnašas, įmokos ir palūkanos gali atrodyti sudėtingai. Todėl viską padarėme paprasta. Su mūsų būsto paskolos skaičiuokle atsakymus gausite per kelias minutes – be jokių įsipareigojimų.',
    cta: 'Išbandykite skaičiuoklę',
    scores: { linguistic: 89, cultural: 88, legal: 85 },
    adaptations: [
      { type: 'cultural', original: 'Ditt första boende', adapted: 'Jūsų pirmieji namai', reason: 'Familjeorienterad kultur – "hem" resonerar starkare än "boende"' },
      { type: 'tone', original: 'Testa kalkylatorn', adapted: 'Išbandykite skaičiuoklę', reason: 'Artig ni-form bygger förtroende på litauisk marknad' },
    ],
    alternativeHeadlines: [
      { text: 'Sužinokite, kiek būsto galite sau leisti', confidence: 86 },
      { text: 'Pirmasis būstas – pradėkite nuo skaičiuoklės', confidence: 80 },
    ],
  },
};
