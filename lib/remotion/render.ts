// ── Server-side Remotion render pipeline ──
//
// Workflow:
//   1. Bundle the Remotion project once (cached in module scope)
//   2. selectComposition() with the video config as inputProps
//   3. renderMedia() to MP4
//   4. Write to public/renders/<id>.mp4 + metadata JSON
//
// NOTE: Requires Chromium. First render auto-downloads Chromium (~150MB).
// This only works on a writable filesystem — fine for local dev and
// self-hosted deployments, NOT for read-only serverless (Vercel etc).

import path from "node:path";
import fs from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
  ensureBrowser,
} from "@remotion/renderer";
import type { VideoConfig } from "./types";

export interface RenderRecord {
  id: string;
  title: string;
  format: VideoConfig["format"];
  durationSeconds: number;
  fileName: string;
  fileSize: number;
  createdAt: string; // ISO
  mp4Url: string; // /renders/<id>.mp4
}

export const RENDERS_DIR = path.join(process.cwd(), "public", "renders");

// ── Bundle cache (module-scoped) ──
let bundlePromise: Promise<string> | null = null;

async function getBundle(): Promise<string> {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      publicDir: path.join(process.cwd(), "public"),
      webpackOverride: (config) => config,
    });
  }
  return bundlePromise;
}

async function ensureRendersDir(): Promise<void> {
  await fs.mkdir(RENDERS_DIR, { recursive: true });
}

export interface RenderResult {
  record: RenderRecord;
  mp4Path: string;
}

export async function renderVideoConfig(config: VideoConfig): Promise<RenderResult> {
  await ensureRendersDir();
  await ensureBrowser();

  const serveUrl = await getBundle();

  const composition = await selectComposition({
    serveUrl,
    id: "NordeaMotion",
    inputProps: { config },
  });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = `${id}.mp4`;
  const mp4Path = path.join(RENDERS_DIR, fileName);

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: mp4Path,
    inputProps: { config },
  });

  const stat = await fs.stat(mp4Path);
  const record: RenderRecord = {
    id,
    title: config.title || "Namnlös",
    format: config.format,
    durationSeconds: config.totalDurationSeconds,
    fileName,
    fileSize: stat.size,
    createdAt: new Date().toISOString(),
    mp4Url: `/renders/${fileName}`,
  };

  // Write metadata sidecar so /api/motion-renders can list renders
  const metaPath = path.join(RENDERS_DIR, `${id}.json`);
  await fs.writeFile(metaPath, JSON.stringify(record, null, 2), "utf-8");

  return { record, mp4Path };
}

export async function listRenders(): Promise<RenderRecord[]> {
  try {
    await ensureRendersDir();
    const entries = await fs.readdir(RENDERS_DIR);
    const metaFiles = entries.filter((e) => e.endsWith(".json"));
    const records = await Promise.all(
      metaFiles.map(async (file) => {
        try {
          const raw = await fs.readFile(path.join(RENDERS_DIR, file), "utf-8");
          return JSON.parse(raw) as RenderRecord;
        } catch {
          return null;
        }
      })
    );
    return records
      .filter((r): r is RenderRecord => r !== null)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}
