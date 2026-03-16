// ============================================================================
// NORDEA PERSONA LIBRARY
// 6 förbyggda personas som representerar Nordeas kundsegment
// ============================================================================

export interface PersonaProfile {
  id: string;
  name: string;
  shortName: string;
  description: string;
  age: { min: number; max: number };
  gender: 'female' | 'male' | 'neutral';
  traits: string[];
  goals: string[];
  painPoints: string[];
  productsInterested: string[];
  digitalMaturity: 'low' | 'medium' | 'high';
  incomeLevel: 'low' | 'medium' | 'high';
  responseStyle: 'skeptical' | 'curious' | 'enthusiastic' | 'neutral';
  quote: string;
  color: string;
}

export const PERSONA_LIBRARY: PersonaProfile[] = [
  {
    id: 'forstagangskopare',
    name: 'Oscar Bergström',
    shortName: 'Förstagångsköpare',
    description: 'Tech-intresserad 28-åring som drömmer om sin första bostad. Researchar mycket online och vill ha snabba, digitala processer.',
    age: { min: 25, max: 32 },
    gender: 'male',
    traits: ['Digital native', 'Otålig', 'Researchar mycket', 'Gillar data'],
    goals: ['Köpa första bostaden', 'Förstå bolåneprocessen', 'Snabba svar'],
    painPoints: ['Kontantinsats känns ouppnåelig', 'Bankprocesser för långsamma', 'Svårt förstå alla termer'],
    productsInterested: ['bolån', 'sparkonto', 'ISK', 'budgetverktyg'],
    digitalMaturity: 'high',
    incomeLevel: 'medium',
    responseStyle: 'skeptical',
    quote: 'Varför ska det ta veckor att få ett lånelöfte? Det borde gå på minuter.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'spararen',
    name: 'Anna Johansson',
    shortName: 'Spararen',
    description: 'Erfaren sparare som jämför alternativ noga. Vill få pengarna att växa men är riskavert och ogillar dolda avgifter.',
    age: { min: 35, max: 50 },
    gender: 'female',
    traits: ['Noggrann', 'Jämför alltid', 'Riskavert', 'Långsiktig'],
    goals: ['Bättre avkastning än sparkonto', 'Förstå risk', 'Minimera avgifter'],
    painPoints: ['Osäker på risknivå', 'Svårt jämföra fonder', 'Orolig för dolda avgifter'],
    productsInterested: ['fonder', 'ISK', 'sparkonto', 'räntefonder'],
    digitalMaturity: 'medium',
    incomeLevel: 'high',
    responseStyle: 'skeptical',
    quote: 'Jag vill se exakt vad jag betalar i avgifter och vad historiken visar.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'familjeforaldern',
    name: 'Erik Svensson',
    shortName: 'Familjeföräldern',
    description: 'Småbarnsförälder som försöker få ihop livspusslet. Vill ha trygghet för familjen och ordning på ekonomin.',
    age: { min: 33, max: 45 },
    gender: 'male',
    traits: ['Tidspressad', 'Ansvarstagande', 'Praktisk', 'Vill ha enkelt'],
    goals: ['Trygghet för familjen', 'Spara till barnen', 'Ha koll på försäkringar'],
    painPoints: ['Har inte tid för detaljer', 'Osäker om rätt försäkringar', 'Orolig för oväntade utgifter'],
    productsInterested: ['barnförsäkring', 'sparande till barn', 'bolån', 'livförsäkring'],
    digitalMaturity: 'medium',
    incomeLevel: 'medium',
    responseStyle: 'curious',
    quote: 'Jag vill veta att vi är skyddade om något händer.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'pensionsspararen',
    name: 'Birgitta Karlsson',
    shortName: 'Pensionsspararen',
    description: 'Närmar sig pension och funderar på framtiden. Värdesätter personlig kontakt och tydliga förklaringar.',
    age: { min: 57, max: 67 },
    gender: 'female',
    traits: ['Trygghetsfokuserad', 'Värdesätter personlig kontakt', 'Försiktig', 'Långsiktig'],
    goals: ['Förstå pensionen', 'Veta att pengarna räcker', 'Ha någon att prata med'],
    painPoints: ['Pensionssystemet förvirrande', 'Orolig att pengarna inte räcker', 'Digital osäkerhet'],
    productsInterested: ['pension', 'trygghetssparande', 'räntefonder', 'kapitalförsäkring'],
    digitalMaturity: 'low',
    incomeLevel: 'medium',
    responseStyle: 'neutral',
    quote: 'Jag vill prata med någon som kan förklara i lugn och ro.',
    color: 'from-rose-400 to-pink-500',
  },
  {
    id: 'foretagaren',
    name: 'Magnus Holm',
    shortName: 'Företagaren',
    description: 'Driver eget företag med några anställda. Behöver en bank som förstår småföretagare och erbjuder snabb service.',
    age: { min: 38, max: 55 },
    gender: 'male',
    traits: ['Driven', 'Praktisk', 'Relationsbyggare', 'Resultatfokuserad'],
    goals: ['Finansiera tillväxt', 'Enkel hantering', 'Ha en bankrelation'],
    painPoints: ['Byråkrati tar tid', 'Svårt att få lån', 'Vill ha personlig kontakt'],
    productsInterested: ['företagskonto', 'företagslån', 'leasing', 'fakturatjänster'],
    digitalMaturity: 'medium',
    incomeLevel: 'high',
    responseStyle: 'skeptical',
    quote: 'Jag vill kunna ringa någon som känner mitt företag.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'studenten',
    name: 'Wilma Eriksson',
    shortName: 'Studenten',
    description: 'Universitetsstudent som precis börjat hantera egen ekonomi. Nyfiken på sparande men har begränsad budget.',
    age: { min: 19, max: 25 },
    gender: 'female',
    traits: ['Nyfiken', 'Prismedveten', 'Digital', 'Social'],
    goals: ['Lära sig om ekonomi', 'Börja spara lite', 'Inga avgifter'],
    painPoints: ['Har inte råd med avgifter', 'Vet inte var man börjar', 'Banker känns inte för mig'],
    productsInterested: ['sparkonto', 'studentkonto', 'app', 'swish'],
    digitalMaturity: 'high',
    incomeLevel: 'low',
    responseStyle: 'curious',
    quote: 'Jag vill börja spara men vet inte hur man gör.',
    color: 'from-lime-500 to-green-600',
  },
];

export function getPersonaById(id: string): PersonaProfile | undefined {
  return PERSONA_LIBRARY.find(p => p.id === id);
}

export function getPersonasByProduct(product: string): PersonaProfile[] {
  const lowerProduct = product.toLowerCase();
  return PERSONA_LIBRARY.filter(p =>
    p.productsInterested.some(pi => pi.toLowerCase().includes(lowerProduct))
  );
}

export function getPersonasByCategory(category: string): PersonaProfile[] {
  const categoryMap: Record<string, string[]> = {
    mortgage: ['forstagangskopare', 'familjeforaldern'],
    savings: ['spararen', 'studenten'],
    pension: ['pensionsspararen'],
    business: ['foretagaren'],
    family: ['familjeforaldern'],
    loans: ['forstagangskopare', 'foretagaren'],
    insurance: ['familjeforaldern', 'pensionsspararen'],
  };

  const ids = categoryMap[category] || [];
  return PERSONA_LIBRARY.filter(p => ids.includes(p.id));
}

export function getPersonaInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
