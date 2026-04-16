export interface NordicMarket {
  id: string;
  name: string;
  flag: string;
  language: string;
  currency: string;
  regulator: string;
  culturalNotes: string[];
  legalRequirements: string[];
  toneAdjustments: string;
}

export const nordicMarkets: NordicMarket[] = [
  {
    id: 'se',
    name: 'Sverige',
    flag: '🇸🇪',
    language: 'Svenska',
    currency: 'SEK',
    regulator: 'Finansinspektionen',
    culturalNotes: [
      'Lagom-principen – undvik överdrifter och skryt',
      'Jämlikhet och inkludering är viktigt',
      'Miljö och hållbarhet resonerar starkt',
      'Direkt men artig kommunikation',
      'Förtroende byggs långsamt men är starkt',
    ],
    legalRequirements: [
      'Marknadsföringslagen (2008:486)',
      'Konsumentkreditlagen för låneprodukter',
      'Riskdisclaimer krävs för investeringsprodukter',
      'Tydliga villkor och effektiv ränta',
    ],
    toneAdjustments: 'Balanserad, faktabaserad, undvik superlativ',
  },
  {
    id: 'dk',
    name: 'Danmark',
    flag: '🇩🇰',
    language: 'Dansk',
    currency: 'DKK',
    regulator: 'Finanstilsynet',
    culturalNotes: [
      'Hygge-konceptet – trygghet och välbefinnande',
      'Humor och ironi uppskattas mer än i Sverige',
      'Mer informell ton fungerar bra',
      'Skeptisk mot överdrivna löften',
      'Värdesätter ärlighet och rakt på sak',
    ],
    legalRequirements: [
      'Markedsføringsloven',
      'Kreditaftaleloven för lån',
      'ÅOP (årlig omkostning i procent) måste anges',
    ],
    toneAdjustments: 'Mer avslappnad, får vara lite rolig, direkt',
  },
  {
    id: 'no',
    name: 'Norge',
    flag: '🇳🇴',
    language: 'Norsk',
    currency: 'NOK',
    regulator: 'Finanstilsynet',
    culturalNotes: [
      'Friluftsliv och natur resonerar starkt',
      'Självständighet och frihet viktigt',
      'Oljefonden = högt sparfokus i kulturen',
      'Skeptiska mot "säljsnack" och push',
      'Föredrar att göra egen research',
    ],
    legalRequirements: [
      'Markedsføringsloven',
      'Finansavtaleloven',
      'Strikt krav på tydliga villkor',
    ],
    toneAdjustments: 'Rak, ärlig, naturlig, undvik säljspråk',
  },
  {
    id: 'fi',
    name: 'Finland',
    flag: '🇫🇮',
    language: 'Finska',
    currency: 'EUR',
    regulator: 'Finanssivalvonta',
    culturalNotes: [
      'Sisu-mentalitet – uthållighet och beslutsamhet',
      'Rakt på sak, minimal small talk',
      'Hög digital mognad och tekniktillit',
      'Förtroende byggs genom fakta, inte känslor',
      'Tysta pauser är OK, inget att fylla',
    ],
    legalRequirements: [
      'Kuluttajansuojalaki (konsumentskydd)',
      'Luottolaitoslaki (kreditinstitut)',
      'Tvåspråkighet (finska/svenska) kan krävas',
    ],
    toneAdjustments: 'Saklig, faktabaserad, kortfattad, rak',
  },
];
