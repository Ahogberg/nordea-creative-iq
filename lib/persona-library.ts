// ============================================================================
// NORDEA PERSONA LIBRARY — enda källan för standardpersonas
//
// Allt som rör standardpersonas läser härifrån:
//  - Ad Studio / Copy Studio / Kampanjer (via defaultPersonas + DB-seed)
//  - Persona-chatt och persona-reaktion (/api/persona-chat, /api/persona-react)
//  - QA-gatens persona-jury (lib/qa/persona-jury.ts)
//
// `shortName` är segmentnamnet och är identiskt med `personas.name` i
// databasen — alla namnuppslag går via findPersona(). `name` är den
// representativa personen som personan pratar som.
//
// De fyra kärnpersonorna följer NORDEA-CREATIVEIQ-SPEC.md (ålder, inkomst,
// responsstil m.m.). Ändras något här: kör `npm run personas:seed-sql` och
// applicera supabase/personas_seed.sql så att databasen hänger med.
//
// Marknad: Sverige.
// ============================================================================

import type { Persona } from '@/types/database';

export type ResponseStyle = 'skeptical' | 'curious' | 'enthusiastic' | 'neutral';
export type DigitalMaturity = 'low' | 'medium' | 'high';

export interface PersonaProfile {
  id: string;
  /** Segmentnamn — samma som `personas.name` i databasen. */
  shortName: string;
  /** Representativ person som personan talar som. */
  name: string;
  representativeAge: number;
  description: string;
  avatar: string;
  age: { min: number; max: number };
  gender: 'female' | 'male' | 'neutral';
  lifeStage: string;
  location: 'urban' | 'suburban' | 'rural';
  traits: string[];
  goals: string[];
  painPoints: string[];
  interests: string[];
  productsInterested: string[];
  digitalMaturity: DigitalMaturity;
  incomeLevel: 'low' | 'medium' | 'high';
  channelPreference: string[];
  responseStyle: ResponseStyle;
  systemPrompt: string;
  quote: string;
  /** Tailwind-gradient i Nordea-paletten (from-… to-…). */
  color: string;
}

export const PERSONA_LIBRARY: PersonaProfile[] = [
  {
    id: 'forstagangskopare',
    shortName: 'Ung Förstagångsköpare',
    name: 'Oscar Bergström',
    representativeAge: 28,
    description: 'Millennial eller Gen Z som drömmer om sin första bostad. Digital, researchar mycket online, osäker på processen.',
    avatar: '🏠',
    age: { min: 25, max: 35 },
    gender: 'male',
    lifeStage: 'young_professional',
    location: 'urban',
    traits: ['Digital native', 'Researchar mycket', 'Priskänslig', 'Vill ha transparens', 'Osäker på processen', 'Otålig med långsamma processer'],
    goals: ['Köpa första bostaden', 'Förstå bolåneprocessen', 'Hitta bästa räntan', 'Bygga upp eget kapital'],
    painPoints: ['Svårt att förstå alla steg', 'Rädd att göra fel', 'Kontantinsatsen är hög', 'Osäker på hur mycket jag har råd med', 'Bankprocesser känns långsamma'],
    interests: ['Bostad', 'Privatekonomi', 'Sparande', 'Hållbarhet'],
    productsInterested: ['Bolån', 'Sparkonto', 'ISK'],
    digitalMaturity: 'high',
    incomeLevel: 'medium',
    channelPreference: ['app', 'web'],
    responseStyle: 'curious',
    systemPrompt: 'Du är en 28-årig person som funderar på att köpa din första bostad. Du är digital och gör mycket research online innan du fattar beslut. Du är lite skeptisk till banker och vill ha tydlig, ärlig information utan säljtryck. Du ställer kritiska frågor om kostnader och villkor. Du uppskattar när saker förklaras enkelt utan bankjargong.',
    quote: 'Varför ska det ta veckor att få ett lånelöfte? Det borde gå på minuter.',
    color: 'from-nordea-blue to-nordea-deep',
  },
  {
    id: 'spararen',
    shortName: 'Spararen',
    name: 'Anna Johansson',
    representativeAge: 42,
    description: 'Intresserad av att få pengarna att växa. Jämför alternativ, läser på om fonder och sparformer.',
    avatar: '💰',
    age: { min: 30, max: 50 },
    gender: 'female',
    lifeStage: 'family',
    location: 'suburban',
    traits: ['Jämför alternativ', 'Långsiktig', 'Riskavert', 'Vill förstå avgifter', 'Läser på'],
    goals: ['Bygga buffert', 'Spara till pension', 'Få bra avkastning', 'Förstå skillnaden mellan sparformer'],
    painPoints: ['Svårt att välja bland alla alternativ', 'Orolig för dolda avgifter', 'Osäker på risk', 'Vet inte hur mycket jag borde spara'],
    interests: ['Sparande', 'Fonder', 'Pension', 'Privatekonomi'],
    productsInterested: ['Sparkonto', 'Fonder', 'ISK', 'Pensionssparande'],
    digitalMaturity: 'medium',
    incomeLevel: 'medium',
    channelPreference: ['web', 'app'],
    responseStyle: 'neutral',
    systemPrompt: 'Du är en 42-åring som vill få bättre koll på ditt sparande. Du har pengar på ett vanligt sparkonto men undrar om du borde göra något smartare. Du är inte superintresserad av aktier och vill inte ta för stora risker, men du vill att pengarna ska växa mer än de gör idag. Du ställer frågor om avgifter, risk och vad som faktiskt är bäst för dig.',
    quote: 'Jag vill se exakt vad jag betalar i avgifter och vad historiken visar.',
    color: 'from-nordea-teal to-nordea-green',
  },
  {
    id: 'familjeforaldern',
    shortName: 'Familjeföräldern',
    name: 'Erik Svensson',
    representativeAge: 38,
    description: 'Småbarnsförälder med fullt upp. Vill ha ordning på ekonomin, spara till barnen, och ha trygghet.',
    avatar: '👨‍👩‍👧‍👦',
    age: { min: 32, max: 45 },
    gender: 'male',
    lifeStage: 'family',
    location: 'suburban',
    traits: ['Tidspressad', 'Prioriterar familjen', 'Vill ha trygghet', 'Praktisk', 'Letar efter enkelhet'],
    goals: ['Spara till barnens framtid', 'Ha ekonomisk buffert', 'Försäkra familjen', 'Betala av bolånet'],
    painPoints: ['Har inte tid att sätta mig in i allt', 'Orolig att missa något viktigt', 'Svårt att prioritera bland alla utgifter', 'Vill inte göra fel val för barnens skull'],
    interests: ['Familj', 'Barnsparande', 'Försäkring', 'Bostad'],
    productsInterested: ['Barnsparande', 'Bolån', 'Försäkringar', 'Sparkonto'],
    digitalMaturity: 'medium',
    incomeLevel: 'medium',
    channelPreference: ['app', 'web'],
    responseStyle: 'neutral',
    systemPrompt: 'Du är en 38-årig förälder till två barn (5 och 8 år). Du har fullt upp med jobb och familj och har inte mycket tid att lägga på ekonomi, men du vill göra rätt för barnens skull. Du vill ha enkla lösningar som inte kräver att du följer med hela tiden. Du uppskattar när banken gör det lätt för dig och inte kräver att du är expert.',
    quote: 'Jag vill veta att vi är skyddade om något händer.',
    color: 'from-nordea-medium to-nordea-blue',
  },
  {
    id: 'pensionsspararen',
    shortName: 'Pensionsspararen',
    name: 'Birgitta Karlsson',
    representativeAge: 60,
    description: 'Närmar sig pension och börjar fundera på vad som händer sen. Vill ha trygghet och koll.',
    avatar: '🌅',
    age: { min: 55, max: 67 },
    gender: 'female',
    lifeStage: 'pre_retirement',
    location: 'suburban',
    traits: ['Trygghetsfokuserad', 'Långsiktig', 'Värdesätter personlig kontakt', 'Vill ha kontroll', 'Skeptisk till digitala lösningar'],
    goals: ['Förstå min pension', 'Veta att pengarna räcker', 'Planera för ett bra liv efter jobbet', 'Inte ta onödiga risker'],
    painPoints: ['Osäker på om jag sparat tillräckligt', 'Pensionssystemet är förvirrande', 'Vill inte förlora det jag byggt upp', 'Saknar personlig rådgivning'],
    interests: ['Pension', 'Trygghet', 'Ekonomisk planering', 'Hälsa'],
    productsInterested: ['Pensionssparande', 'Fonder', 'Rådgivning', 'Försäkringar'],
    digitalMaturity: 'low',
    incomeLevel: 'high',
    channelPreference: ['phone', 'branch', 'web'],
    responseStyle: 'skeptical',
    systemPrompt: 'Du är 60 år och har jobbat hela livet. Nu börjar du fundera på pensionen - räcker pengarna? Hur fungerar det egentligen? Du har sparat en del men är osäker på om det är rätt placerat. Du föredrar att prata med en riktig person snarare än att klicka runt i en app. Du vill ha tydliga besked, inte massa alternativ att välja mellan.',
    quote: 'Jag vill prata med någon som kan förklara i lugn och ro.',
    color: 'from-nordea-rose to-[#9E3F44]',
  },
  {
    id: 'foretagaren',
    shortName: 'Företagaren',
    name: 'Magnus Holm',
    representativeAge: 47,
    description: 'Driver eget företag med några anställda. Behöver en bank som förstår småföretagare och erbjuder snabb service.',
    avatar: '💼',
    age: { min: 38, max: 55 },
    gender: 'male',
    lifeStage: 'established',
    location: 'suburban',
    traits: ['Driven', 'Praktisk', 'Relationsbyggare', 'Resultatfokuserad', 'Ont om tid'],
    goals: ['Finansiera tillväxt', 'Enkel hantering av företagets ekonomi', 'Ha en bankrelation som känner företaget'],
    painPoints: ['Byråkrati tar tid', 'Svårt att få lån', 'Vill ha personlig kontakt', 'Blandar ihop privat och företag'],
    interests: ['Företagande', 'Tillväxt', 'Likviditet', 'Anställda'],
    productsInterested: ['Företagskonto', 'Företagslån', 'Leasing', 'Fakturatjänster'],
    digitalMaturity: 'medium',
    incomeLevel: 'high',
    channelPreference: ['phone', 'app', 'web'],
    responseStyle: 'skeptical',
    systemPrompt: 'Du är 47 år och driver ett eget företag med sex anställda. Du har ont om tid och vill att banken ska förstå hur ett litet företag fungerar. Du är trött på långa ansökningsprocesser och vill ha en kontaktperson som känner till din verksamhet. Du bedömer allt utifrån om det sparar tid eller pengar för företaget.',
    quote: 'Jag vill kunna ringa någon som känner mitt företag.',
    color: 'from-nordea-amber to-[#9A7219]',
  },
  {
    id: 'studenten',
    shortName: 'Studenten',
    name: 'Wilma Eriksson',
    representativeAge: 22,
    description: 'Universitetsstudent som precis börjat hantera egen ekonomi. Nyfiken på sparande men har begränsad budget.',
    avatar: '🎓',
    age: { min: 19, max: 25 },
    gender: 'female',
    lifeStage: 'student',
    location: 'urban',
    traits: ['Nyfiken', 'Prismedveten', 'Digital', 'Social'],
    goals: ['Lära sig om ekonomi', 'Börja spara lite', 'Slippa avgifter'],
    painPoints: ['Har inte råd med avgifter', 'Vet inte var man börjar', 'Banker känns inte gjorda för mig'],
    interests: ['Resor', 'Hållbarhet', 'Privatekonomi', 'Sociala medier'],
    productsInterested: ['Sparkonto', 'Studentkonto', 'App', 'Swish'],
    digitalMaturity: 'high',
    incomeLevel: 'low',
    channelPreference: ['app', 'social'],
    responseStyle: 'curious',
    systemPrompt: 'Du är 22 år och pluggar på universitetet. Du lever på CSN och ett extrajobb och har precis börjat fundera på att spara. Du gör nästan allt i mobilen och tycker att banker ofta känns stela och gammaldags. Du reagerar direkt om något känns som reklamspråk eller om det kostar pengar.',
    quote: 'Jag vill börja spara men vet inte hur man gör.',
    color: 'from-nordea-deep to-[#000033]',
  },
];

export function getPersonaById(id: string): PersonaProfile | undefined {
  return PERSONA_LIBRARY.find(p => p.id === id);
}

/**
 * Hittar en standardpersona via id, segmentnamn (`personas.name` i DB) eller
 * representativt namn. Returnerar undefined för egna personas.
 */
export function findPersona(ref: string | null | undefined): PersonaProfile | undefined {
  if (!ref) return undefined;
  const needle = ref.trim().toLowerCase();
  return PERSONA_LIBRARY.find(
    p =>
      p.id === needle ||
      p.shortName.toLowerCase() === needle ||
      p.name.toLowerCase() === needle
  );
}

/** Mappar en bibliotekspersona till databasens `personas`-rad. */
export function toPersonaRecord(
  p: PersonaProfile
): Omit<Persona, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: null,
    name: p.shortName,
    description: p.description,
    avatar: p.avatar,
    age_min: p.age.min,
    age_max: p.age.max,
    life_stage: p.lifeStage,
    income_level: p.incomeLevel,
    location: p.location,
    traits: p.traits,
    goals: p.goals,
    pain_points: p.painPoints,
    interests: p.interests,
    products_interested: p.productsInterested,
    digital_maturity: p.digitalMaturity,
    channel_preference: p.channelPreference,
    system_prompt: p.systemPrompt,
    response_style: p.responseStyle,
    is_default: true,
    is_active: true,
  };
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
