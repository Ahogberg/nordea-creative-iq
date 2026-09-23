import { Persona } from '@/types/database';
import { PERSONA_LIBRARY, toPersonaRecord } from '@/lib/persona-library';

// Standardpersonas i databasens form. Härleds från lib/persona-library.ts —
// redigera personadata där, inte här.
export const defaultPersonas: Omit<Persona, 'id' | 'created_at' | 'updated_at'>[] =
  PERSONA_LIBRARY.map(toPersonaRecord);
