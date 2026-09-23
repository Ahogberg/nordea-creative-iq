// Plockar ut bildrutor ur videoannonser så att Claude kan analysera rörelse.
//
//   npm run brand:frames            # bara videor som saknar rutor
//   npm run brand:frames -- --force # gör om alla
//
// Rutor sparas i brand-reference/frames/<ad_id>/ tillsammans med frames.json.
// Tätt i början (hook + logo/illustration som byggs upp), glesare i mitten,
// tätt igen i slutet (CTA + end card).
//
// Använder ffmpeg från PATH om det finns, annars Remotions medföljande
// (`npx remotion ffmpeg`).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { FRAMES_DIR, listAds } from './shared';

const MAX_EDGE = 1280;
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

function timestamps(duration: number): number[] {
  const t = new Set<number>();
  // Hook: första 2 sekunderna var kvartssekund.
  for (let s = 0; s <= 2; s += 0.25) t.add(s);
  // Mitten: varje sekund.
  for (let s = 3; s < duration - 2; s += 1) t.add(s);
  // Slutet: sista 2 sekunderna var halvsekund + sista rutan.
  for (let s = Math.max(0, duration - 2); s < duration; s += 0.5) t.add(s);
  t.add(Math.max(0, duration - 0.05));
  return [...t]
    .map((s) => Math.round(s * 100) / 100)
    .filter((s) => s >= 0 && s < duration)
    .sort((a, b) => a - b);
}

function main() {
  const videos = listAds().filter((a) => a.kind === 'video');
  if (videos.length === 0) {
    console.log('Inga videor i brand-reference/ads/ — inget att göra.');
    return;
  }

  const ffmpeg = findTool('ffmpeg');
  const ffprobe = findTool('ffprobe');
  let done = 0;

  for (const video of videos) {
    const outDir = path.join(FRAMES_DIR, video.adId);
    if (existsSync(path.join(outDir, 'frames.json')) && !force) {
      console.log(`– ${video.file}: har redan rutor (hoppar över)`);
      continue;
    }
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    const meta = probe(ffprobe, video.absPath);
    if (!meta.duration) {
      console.warn(`! ${video.file}: kunde inte läsa längd — hoppar över`);
      continue;
    }

    const scale = meta.width >= meta.height ? `${Math.min(MAX_EDGE, meta.width)}:-2` : `-2:${Math.min(MAX_EDGE, meta.height)}`;
    const frames: { file: string; t: number }[] = [];
    const grab = (t: number, file: string) => {
      const out = path.join(outDir, file);
      run(ffmpeg, [
        '-v', 'error', '-y',
        '-ss', String(t),
        '-i', video.absPath,
        '-frames:v', '1',
        '-vf', `scale=${scale}`,
        // Remotions ffmpeg saknar format-filtret; mjpeg kräver full range.
        '-pix_fmt', 'yuvj420p',
        '-q:v', '3',
        out,
      ]);
      return existsSync(out);
    };

    for (const t of timestamps(meta.duration)) {
      const file = `t${String(Math.round(t * 1000)).padStart(6, '0')}ms.jpg`;
      // Allra sista ruta kan sakna data exakt vid sluttiden — backa lite.
      const ok = grab(t, file) || (t > meta.duration - 0.5 && grab(Math.max(0, t - 0.25), file));
      if (ok) frames.push({ file, t });
    }

    writeFileSync(
      path.join(outDir, 'frames.json'),
      JSON.stringify({ ad_id: video.adId, source: video.file, ...meta, frames }, null, 2) + '\n'
    );
    console.log(`✓ ${video.file}: ${frames.length} rutor (${meta.duration.toFixed(1)}s) → frames/${video.adId}/`);
    done++;
  }

  console.log(`\nKlart: ${done} video(r) bearbetade.`);
}

main();
