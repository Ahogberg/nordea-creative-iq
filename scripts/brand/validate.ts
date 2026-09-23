// Validerar brand-reference-materialet och visual-grammar.json.
//
//   npm run brand:validate
//
// Kontrollerar:
//  - manifest.csv ↔ filer i brand-reference/ads/
//  - att annonserna har analyskopior (npm run brand:prepare)
//  - varje analysis/<ad_id>.json mot AdAnalysisSchema
//  - visual-grammar.json mot VisualGrammarSchema, och att varje regel
//    pekar på annonser som faktiskt är analyserade
//
// Avslutar med kod 1 vid fel (varningar stoppar inte).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  AdAnalysisSchema,
  VisualGrammarSchema,
  type AdAnalysis,
} from '../../lib/brand/visual-grammar/schema';
import { ANALYSIS_DIR, FRAMES_DIR, GRAMMAR_FILE, STILLS_DIR, adIdFromFile, listAds, readManifest } from './shared';

const errors: string[] = [];
const warnings: string[] = [];

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    errors.push(`${path.relative(process.cwd(), file)}: ogiltig JSON (${(e as Error).message})`);
    return undefined;
  }
}

function formatIssues(file: string, issues: z.core.$ZodIssue[]) {
  for (const issue of issues.slice(0, 10)) {
    errors.push(`${file}: ${issue.path.join('.') || '(rot)'} — ${issue.message}`);
  }
  if (issues.length > 10) errors.push(`${file}: …och ${issues.length - 10} fel till`);
}

// ── Annonser + manifest ──

const ads = listAds();
const adIds = new Map<string, { kind: 'static' | 'video' }>(ads.map((a) => [a.adId, a]));
// Originalen committas inte — finns bara kopiorna (stills/, frames/) räknas
// annonsen ändå som känd, t.ex. i en molnsession eller hos en kollega.
if (existsSync(FRAMES_DIR)) {
  for (const id of readdirSync(FRAMES_DIR)) {
    if (!adIds.has(id) && existsSync(path.join(FRAMES_DIR, id, 'frames.json'))) {
      adIds.set(id, { kind: 'video' });
    }
  }
}
if (existsSync(STILLS_DIR)) {
  for (const name of readdirSync(STILLS_DIR).filter((n) => n.endsWith('.jpg'))) {
    const id = name.slice(0, -4);
    if (!adIds.has(id)) adIds.set(id, { kind: 'static' });
  }
}
const duplicateIds = ads.filter((a, i) => ads.findIndex((b) => b.adId === a.adId) !== i);
for (const d of duplicateIds) errors.push(`Två filer ger samma ad_id "${d.adId}" — byt namn på ${d.file}`);

const manifest = readManifest();
const manifestFiles = new Set(manifest.map((r) => r.file));
for (const row of manifest) {
  if (!row.file) continue;
  const copyOnly = adIds.has(adIdFromFile(row.file));
  if (!ads.some((a) => a.file === row.file) && !copyOnly) {
    errors.push(`manifest.csv: "${row.file}" finns inte i brand-reference/ads/`);
  }
}
for (const ad of ads) {
  if (!manifestFiles.has(ad.file)) warnings.push(`${ad.file} saknas i manifest.csv (produkt/kanal blir okänd)`);
  if (ad.kind === 'video' && !existsSync(path.join(FRAMES_DIR, ad.adId, 'frames.json'))) {
    warnings.push(`${ad.file} har inga bildrutor — kör \`npm run brand:prepare\``);
  }
  if (ad.kind === 'static' && !existsSync(path.join(STILLS_DIR, `${ad.adId}.jpg`))) {
    warnings.push(`${ad.file} saknar analyskopia — kör \`npm run brand:prepare\``);
  }
}

// ── Analyser ──

const analyses = new Map<string, AdAnalysis>();
if (existsSync(ANALYSIS_DIR)) {
  for (const name of readdirSync(ANALYSIS_DIR).filter((n) => n.endsWith('.json'))) {
    const rel = `analysis/${name}`;
    const data = readJson(path.join(ANALYSIS_DIR, name));
    if (data === undefined) continue;
    const parsed = AdAnalysisSchema.safeParse(data);
    if (!parsed.success) {
      formatIssues(rel, parsed.error.issues);
      continue;
    }
    const a = parsed.data;
    if (`${a.ad_id}.json` !== name) errors.push(`${rel}: ad_id "${a.ad_id}" matchar inte filnamnet`);
    const source = adIds.get(a.ad_id);
    if (!source) warnings.push(`${rel}: ingen annons med ad_id "${a.ad_id}" i brand-reference/ads/`);
    else if (source.kind !== a.kind) errors.push(`${rel}: kind "${a.kind}" men filen är ${source.kind}`);
    if (a.kind === 'video' && !a.motion) errors.push(`${rel}: videoannons saknar "motion"`);
    analyses.set(a.ad_id, a);
  }
}

const unanalyzed = [...adIds.entries()].filter(([id]) => !analyses.has(id));

// ── Grammatik ──

let grammarStatus = 'saknas';
if (existsSync(GRAMMAR_FILE)) {
  const data = readJson(GRAMMAR_FILE);
  const parsed = data === undefined ? undefined : VisualGrammarSchema.safeParse(data);
  if (parsed && !parsed.success) {
    formatIssues('visual-grammar.json', parsed.error.issues);
  } else if (parsed?.success) {
    const g = parsed.data;
    grammarStatus = g.status;
    if (g.status !== 'empty') {
      const checkIds = (where: string, ids: string[]) => {
        for (const id of ids) {
          if (!analyses.has(id)) errors.push(`visual-grammar.json ${where}: "${id}" är inte en analyserad annons`);
        }
      };
      checkIds('source_ad_ids', g.source_ad_ids);
      g.layout_archetypes.forEach((a) => checkIds(`layout_archetypes[${a.id}]`, a.evidence));
      g.motion_recipes.forEach((r) => checkIds(`motion_recipes[${r.id}]`, r.evidence));
      g.color_rules.forEach((r, i) => checkIds(`color_rules[${i}]`, r.evidence));
      g.typography_rules.forEach((r, i) => checkIds(`typography_rules[${i}]`, r.evidence));
      g.copy_patterns.forEach((r, i) => checkIds(`copy_patterns[${i}]`, r.evidence));
      g.do.forEach((r, i) => checkIds(`do[${i}]`, r.evidence));
      g.dont.forEach((r, i) => checkIds(`dont[${i}]`, r.evidence));
      if (g.illustration_style) checkIds('illustration_style', g.illustration_style.evidence);
      if (g.photography_style) checkIds('photography_style', g.photography_style.evidence);
      checkIds('golden_examples', g.golden_examples.map((e) => e.ad_id));

      const ids = (xs: { id: string }[]) => xs.map((x) => x.id);
      for (const [name, list] of [['layout_archetypes', ids(g.layout_archetypes)], ['motion_recipes', ids(g.motion_recipes)]] as const) {
        const dup = list.filter((id, i) => list.indexOf(id) !== i);
        if (dup.length > 0) errors.push(`visual-grammar.json ${name}: dubblerade id:n ${dup.join(', ')}`);
      }
      if (g.status === 'reviewed' && !g.reviewed_by) errors.push('visual-grammar.json: status "reviewed" kräver reviewed_by');
      const newer = [...analyses.keys()].filter((id) => !g.source_ad_ids.includes(id));
      if (newer.length > 0) warnings.push(`${newer.length} analyserade annonser ingår inte i grammatiken ännu: ${newer.join(', ')}`);
    }
  }
}

// ── Rapport ──

console.log('Brand reference');
const known = [...adIds.values()];
console.log(`  Annonser:     ${adIds.size} (${known.filter((a) => a.kind === 'static').length} statiska, ${known.filter((a) => a.kind === 'video').length} video)`);
console.log(`  Analyserade:  ${analyses.size}`);
console.log(`  Grammatik:    ${grammarStatus}`);
if (unanalyzed.length > 0) {
  console.log(`\nEj analyserade (${unanalyzed.length}):`);
  for (const [id, a] of unanalyzed) console.log(`  - ${id}  (${a.kind === 'video' ? `frames/${id}/` : `stills/${id}.jpg`})`);
}
if (warnings.length > 0) {
  console.log(`\nVarningar (${warnings.length}):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length > 0) {
  console.log(`\nFel (${errors.length}):`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\n✓ Inga fel');
