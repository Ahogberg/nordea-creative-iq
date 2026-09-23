// Genererar supabase/personas_seed.sql från lib/persona-library.ts.
//
//   npm run personas:seed-sql
//
// Idempotent: uppdaterar befintliga standardrader (matchas på namn) och
// lägger till de som saknas. Egna personas rörs inte.

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { PERSONA_LIBRARY, toPersonaRecord } from '../../lib/persona-library';

const OUT = path.join(process.cwd(), 'supabase', 'personas_seed.sql');

const text = (v: string | null) => (v === null ? 'NULL' : `'${v.replace(/'/g, "''")}'`);
const int = (v: number | null) => (v === null ? 'NULL' : String(v));
const arr = (v: string[]) => `ARRAY[${v.map(text).join(', ')}]::TEXT[]`;

const COLUMNS = [
  'description', 'avatar', 'age_min', 'age_max', 'life_stage', 'income_level', 'location',
  'traits', 'goals', 'pain_points', 'interests', 'products_interested', 'digital_maturity',
  'channel_preference', 'system_prompt', 'response_style', 'is_active',
] as const;

function values(r: ReturnType<typeof toPersonaRecord>): Record<(typeof COLUMNS)[number], string> {
  return {
    description: text(r.description),
    avatar: text(r.avatar),
    age_min: int(r.age_min),
    age_max: int(r.age_max),
    life_stage: text(r.life_stage),
    income_level: text(r.income_level),
    location: text(r.location),
    traits: arr(r.traits),
    goals: arr(r.goals),
    pain_points: arr(r.pain_points),
    interests: arr(r.interests),
    products_interested: arr(r.products_interested),
    digital_maturity: text(r.digital_maturity),
    channel_preference: arr(r.channel_preference),
    system_prompt: text(r.system_prompt),
    response_style: text(r.response_style),
    is_active: r.is_active ? 'TRUE' : 'FALSE',
  };
}

const statements = PERSONA_LIBRARY.map((profile) => {
  const record = toPersonaRecord(profile);
  const v = values(record);
  const name = text(record.name);
  const set = COLUMNS.map((c) => `  ${c} = ${v[c]}`).join(',\n');

  return `-- ${record.name} (${profile.id})
UPDATE public.personas SET
${set},
  updated_at = NOW()
WHERE name = ${name} AND is_default = TRUE;

INSERT INTO public.personas (name, ${COLUMNS.join(', ')}, is_default)
SELECT ${name}, ${COLUMNS.map((c) => v[c]).join(', ')}, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.personas WHERE name = ${name} AND is_default = TRUE);`;
});

const sql = `-- ============================================================
-- GENERERAD FIL — redigera inte för hand.
-- Källa: lib/persona-library.ts
-- Generera om: npm run personas:seed-sql
--
-- Synkar standardpersonas i databasen med persona-biblioteket.
-- Säker att köra flera gånger.
-- ============================================================

BEGIN;

${statements.join('\n\n')}

COMMIT;
`;

writeFileSync(OUT, sql);
console.log(`Skrev ${path.relative(process.cwd(), OUT)} (${PERSONA_LIBRARY.length} personas)`);
