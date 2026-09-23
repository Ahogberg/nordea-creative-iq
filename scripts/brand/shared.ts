// Delade hjälpfunktioner för brand-reference-skripten.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

export const ROOT = path.join(process.cwd(), 'brand-reference');
export const ADS_DIR = path.join(ROOT, 'ads');
export const FRAMES_DIR = path.join(ROOT, 'frames');
export const STILLS_DIR = path.join(ROOT, 'stills');
export const ANALYSIS_DIR = path.join(ROOT, 'analysis');
export const MANIFEST = path.join(ROOT, 'manifest.csv');
export const GRAMMAR_FILE = path.join(process.cwd(), 'lib', 'brand', 'visual-grammar', 'visual-grammar.json');

export const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
export const VIDEO_EXT = ['.mp4', '.mov', '.webm', '.m4v'];

export interface AdFile {
  adId: string;
  /** Sökväg relativt brand-reference/ads, med snedstreck. */
  file: string;
  absPath: string;
  kind: 'static' | 'video';
}

/** "Bolån Vår 2025 (9x16).mp4" → "bolan-var-2025-9x16" */
export function adIdFromFile(file: string): string {
  return path
    .basename(file, path.extname(file))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function listAds(): AdFile[] {
  if (!existsSync(ADS_DIR)) return [];
  const out: AdFile[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.')) continue;
      const abs = path.join(dir, name);
      if (statSync(abs).isDirectory()) {
        walk(abs);
        continue;
      }
      const ext = path.extname(name).toLowerCase();
      const kind = IMAGE_EXT.includes(ext) ? 'static' : VIDEO_EXT.includes(ext) ? 'video' : null;
      if (!kind) continue;
      out.push({
        adId: adIdFromFile(name),
        file: path.relative(ADS_DIR, abs).split(path.sep).join('/'),
        absPath: abs,
        kind,
      });
    }
  };
  walk(ADS_DIR);
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

/** Minimal CSV-läsare (stöder citattecken och kommatecken inom citat). */
export function readManifest(): Record<string, string>[] {
  if (!existsSync(MANIFEST)) return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const text = readFileSync(MANIFEST, 'utf8').replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);

  const [header, ...data] = rows;
  if (!header) return [];
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}
