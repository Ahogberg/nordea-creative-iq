// Förbereder brand-reference för analys: små kopior som går att committa.
//
//   npm run brand:prepare            # bara det som saknas
//   npm run brand:prepare -- --force # gör om allt
//
// Originalen i brand-reference/ads/ stannar lokalt (gitignorerade — de är
// ofta för stora att ladda upp). Det som skapas och committas:
//   stills/<ad_id>.jpg        statiska annonser, max 1600 px långsida
//   frames/<ad_id>/*.jpg      bildrutor ur videor, max 960 px långsida
//   frames/<ad_id>/frames.json
//
// Rutorna tas tätt i början (hook + logo/illustration som byggs upp),
// glesare i mitten och tätt i slutet (CTA + end card).
//
// Använder ffmpeg från PATH om det finns, annars Remotions medföljande
// (`npx remotion ffmpeg`).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { FRAMES_DIR, STILLS_DIR, listAds } from './shared';

const STILL_MAX_EDGE = 1600;
const FRAME_MAX_EDGE = 960;
const MAX_MIDDLE_FRAMES = 12;
const force = process.argv.includes('--force');

type Tool = { cmd: string; prefix: string[] };

function findTool(name: 'ffmpeg' | 'ffprobe'): Tool {
  if (spawnSync(name, ['-version'], { stdio: 'ignore' }).status === 0) {
    return { cmd: name, prefix: [] };
  }
  return { cmd: 'npx', prefix: ['--no-install', 'remotion', name] };
}

function run(tool: Tool, args: string[]) {
  const res = spawnSync(tool.cmd, [...tool.prefix, ...args], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`${tool.prefix.join(' ') || tool.cmd} misslyckades: ${res.stderr?.slice(-500)}`);
  }
  return res.stdout;
}

function probe(ffprobe: Tool, file: string): { duration: number; width: number; height: number } {
  const out = run(ffprobe, [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height:format=duration',
    '-of', 'json',
    file,
  ]);
  const data = JSON.parse(out) as {
    streams?: { width?: number; height?: number }[];
    format?: { duration?: string };
  };
  return {
    duration: Number(data.format?.duration ?? 0),
    width: data.streams?.[0]?.width ?? 0,
    height: data.streams?.[0]?.height ?? 0,
  };
}

function scaleFilter(width: number, height: number, maxEdge: number): string {
  return width >= height ? `${Math.min(maxEdge, width)}:-2` : `-2:${Math.min(maxEdge, height)}`;
}

function timestamps(duration: number): number[] {
  const t = new Set<number>();
  // Hook: första 2 sekunderna var kvartssekund.
  for (let s = 0; s <= 2; s += 0.25) t.add(s);
  // Mitten: högst MAX_MIDDLE_FRAMES rutor, minst en sekund isär.
  const middle = Math.max(0, duration - 5);
  const step = Math.max(1, middle / MAX_MIDDLE_FRAMES);
  for (let s = 3; s < duration - 2; s += step) t.add(s);
  // Slutet: sista 2 sekunderna var halvsekund + sista rutan.
  for (let s = Math.max(0, duration - 2); s < duration; s += 0.5) t.add(s);
  t.add(Math.max(0, duration - 0.05));
  return [...t]
    .map((s) => Math.round(s * 100) / 100)
    .filter((s) => s >= 0 && s < duration)
    .sort((a, b) => a - b);
}

function dirSize(dir: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).reduce((sum, name) => {
    const p = path.join(dir, name);
    const st = statSync(p);
    return sum + (st.isDirectory() ? dirSize(p) : st.size);
  }, 0);
}

function main() {
  const ads = listAds();
  if (ads.length === 0) {
    console.log('Inga annonser i brand-reference/ads/ — inget att göra.');
    return;
  }

  const ffmpeg = findTool('ffmpeg');
  const ffprobe = findTool('ffprobe');
  mkdirSync(STILLS_DIR, { recursive: true });
  let done = 0;
  const failed: string[] = [];

  for (const ad of ads) {
    try {
      if (ad.kind === 'static') {
        const out = path.join(STILLS_DIR, `${ad.adId}.jpg`);
        if (existsSync(out) && !force) continue;
        const meta = probe(ffprobe, ad.absPath);
        run(ffmpeg, [
          '-v', 'error', '-y',
          '-i', ad.absPath,
          '-frames:v', '1',
          '-vf', `scale=${scaleFilter(meta.width, meta.height, STILL_MAX_EDGE)}`,
          // Remotions ffmpeg saknar format-filtret; mjpeg kräver full range.
          '-pix_fmt', 'yuvj420p',
          '-q:v', '3',
          out,
        ]);
        console.log(`✓ ${ad.file} → stills/${ad.adId}.jpg`);
        done++;
        continue;
      }

      const outDir = path.join(FRAMES_DIR, ad.adId);
      if (existsSync(path.join(outDir, 'frames.json')) && !force) continue;
      rmSync(outDir, { recursive: true, force: true });
      mkdirSync(outDir, { recursive: true });

      const meta = probe(ffprobe, ad.absPath);
      if (!meta.duration) throw new Error('kunde inte läsa längden');
      const scale = scaleFilter(meta.width, meta.height, FRAME_MAX_EDGE);

      const grab = (t: number, file: string) => {
        const out = path.join(outDir, file);
        run(ffmpeg, [
          '-v', 'error', '-y',
          '-ss', String(t),
          '-i', ad.absPath,
          '-frames:v', '1',
          '-vf', `scale=${scale}`,
          '-pix_fmt', 'yuvj420p',
          '-q:v', '4',
          out,
        ]);
        return existsSync(out);
      };

      const frames: { file: string; t: number }[] = [];
      for (const t of timestamps(meta.duration)) {
        const file = `t${String(Math.round(t * 1000)).padStart(6, '0')}ms.jpg`;
        // Allra sista rutan kan sakna data exakt vid sluttiden — backa lite.
        const ok = grab(t, file) || (t > meta.duration - 0.5 && grab(Math.max(0, t - 0.25), file));
        if (ok) frames.push({ file, t });
      }

      writeFileSync(
        path.join(outDir, 'frames.json'),
        JSON.stringify({ ad_id: ad.adId, source: ad.file, ...meta, frames }, null, 2) + '\n'
      );
      console.log(`✓ ${ad.file} → frames/${ad.adId}/ (${frames.length} rutor, ${meta.duration.toFixed(1)} s)`);
      done++;
    } catch (e) {
      failed.push(`${ad.file}: ${(e as Error).message.split('\n')[0]}`);
    }
  }

  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;
  console.log(`\nKlart: ${done} annons(er) bearbetade.`);
  console.log(`Att committa: stills/ ${mb(dirSize(STILLS_DIR))} · frames/ ${mb(dirSize(FRAMES_DIR))}`);
  console.log('Originalen i ads/ stannar lokalt och laddas inte upp.');
  if (failed.length > 0) {
    console.log(`\nKunde inte bearbetas (${failed.length}) — exportera som PNG/JPG/MP4 och försök igen:`);
    for (const f of failed) console.log(`  ✗ ${f}`);
    process.exitCode = 1;
  }
}

main();
