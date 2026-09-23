// Gemensam persona-identitet för alla persona-anrop (jury, reaktion, chatt).
//
// Standardpersonas slås alltid upp i lib/persona-library.ts så att samma
// persona beskrivs likadant överallt — oavsett vad klienten skickar eller
// om DB-raden hunnit bli inaktuell. Egna personas byggs från request-fälten.

import { findPersona, type PersonaProfile } from '@/lib/persona-library';

export interface PersonaIdentity {
  /** Stabilt id för standardpersonas, annars undefined. */
  libraryId?: string;
  /** Segmentnamn, t.ex. "Spararen". */
  segmentName: string;
  /** Namnet personan talar som. */
  speakerName: string;
  ageLabel?: string;
  description?: string;
  traits: string[];
  goals: string[];
  painPoints: string[];
  interests: string[];
  productsInterested: string[];
  digitalMaturity?: string;
  channelPreference: string[];
  responseStyle: string;
  systemPrompt?: string;
  quote?: string;
}

export interface PersonaRequestFields {
  personaId?: string;
  personaName: string;
  personaDescription?: string;
  personaTraits?: string[];
  personaPainPoints?: string[];
  personaGoals?: string[];
  personaAge?: { min: number; max: number };
  personaDigitalMaturity?: string;
  personaSystemPrompt?: string;
  responseStyle?: string;
}

export function identityFromProfile(p: PersonaProfile): PersonaIdentity {
  return {
    libraryId: p.id,
    segmentName: p.shortName,
    speakerName: p.name,
    ageLabel: `${p.representativeAge} år (segment ${p.age.min}–${p.age.max} år)`,
    description: p.description,
    traits: p.traits,
    goals: p.goals,
    painPoints: p.painPoints,
    interests: p.interests,
    productsInterested: p.productsInterested,
    digitalMaturity: p.digitalMaturity,
    channelPreference: p.channelPreference,
    responseStyle: p.responseStyle,
    systemPrompt: p.systemPrompt,
    quote: p.quote,
  };
}

export function resolvePersonaIdentity(req: PersonaRequestFields): PersonaIdentity {
  const profile = findPersona(req.personaId) ?? findPersona(req.personaName);
  if (profile) return identityFromProfile(profile);

  return {
    segmentName: req.personaName,
    speakerName: req.personaName,
    ageLabel: req.personaAge ? `${req.personaAge.min}–${req.personaAge.max} år` : undefined,
    description: req.personaDescription,
    traits: req.personaTraits ?? [],
    goals: req.personaGoals ?? [],
    painPoints: req.personaPainPoints ?? [],
    interests: [],
    productsInterested: [],
    digitalMaturity: req.personaDigitalMaturity,
    channelPreference: [],
    responseStyle: req.responseStyle ?? 'neutral',
    systemPrompt: req.personaSystemPrompt,
  };
}

const RESPONSE_STYLE_LABELS: Record<string, string> = {
  skeptical: 'skeptisk — ifrågasätter påståenden och letar efter haken',
  curious: 'nyfiken — ställer frågor och vill förstå mer',
  enthusiastic: 'positivt inställd — men fortfarande ärlig',
  neutral: 'saklig — bedömer nyktert utan att överdriva',
};

const DIGITAL_MATURITY_LABELS: Record<string, string> = {
  low: 'låg — föredrar telefon eller kontor framför appar',
  medium: 'medel — använder appen för vardagsärenden',
  high: 'hög — gör nästan allt digitalt',
};

/** "DIN PROFIL"-blocket som alla persona-prompts delar. */
export function buildPersonaProfileBlock(identity: PersonaIdentity): string {
  const lines: string[] = [];
  const isNamedPerson = identity.speakerName !== identity.segmentName;

  lines.push(
    isNamedPerson
      ? `Du är ${identity.speakerName} och representerar kundsegmentet "${identity.segmentName}" hos en svensk bank.`
      : `Du är "${identity.segmentName}", en kundpersona hos en svensk bank.`
  );
  lines.push('');
  lines.push('DIN PROFIL:');
  if (identity.ageLabel) lines.push(`- Ålder: ${identity.ageLabel}`);
  if (identity.description) lines.push(`- Beskrivning: ${identity.description}`);
  if (identity.digitalMaturity) {
    lines.push(`- Digital mognad: ${DIGITAL_MATURITY_LABELS[identity.digitalMaturity] ?? identity.digitalMaturity}`);
  }
  if (identity.channelPreference.length > 0) {
    lines.push(`- Föredragna kanaler: ${identity.channelPreference.join(', ')}`);
  }
  if (identity.traits.length > 0) lines.push(`- Karaktärsdrag: ${identity.traits.join(', ')}`);
  if (identity.goals.length > 0) lines.push(`- Mål: ${identity.goals.join(', ')}`);
  if (identity.painPoints.length > 0) lines.push(`- Smärtpunkter: ${identity.painPoints.join(', ')}`);
  if (identity.interests.length > 0) lines.push(`- Intressen: ${identity.interests.join(', ')}`);
  if (identity.productsInterested.length > 0) {
    lines.push(`- Produkter du är intresserad av: ${identity.productsInterested.join(', ')}`);
  }
  lines.push(`- Hållning: ${RESPONSE_STYLE_LABELS[identity.responseStyle] ?? identity.responseStyle}`);
  if (identity.quote) lines.push(`- Något du kan säga: "${identity.quote}"`);
  if (identity.systemPrompt) {
    lines.push('');
    lines.push(identity.systemPrompt);
  }

  return lines.join('\n');
}

/** Instruktion som läggs till när annonsens bild/bildrutor skickas med. */
export function buildVisualInstruction(kind: 'image' | 'frames'): string {
  return kind === 'frames'
    ? 'Bifogat är bildrutor ur videoannonsen i tidsordning. Reagera på helheten — bild, text, layout och vad som händer över tid — som när du scrollar förbi den i flödet. Utgå från vad du faktiskt ser, inte bara från copyn.'
    : 'Bifogat är annonsen så som den visas i flödet. Reagera på helheten — bild, text och layout — som när du scrollar förbi den. Utgå från vad du faktiskt ser, inte bara från copyn.';
}
