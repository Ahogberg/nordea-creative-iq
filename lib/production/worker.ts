// ── Producer worker for bulk video production jobs ──
//
// Consumes a `production_jobs` row and:
//   1. Iterates the Cartesian product of variants × formats
//   2. Renders each combination via the configured RENDER_BACKEND
//   3. Packages outputs into a single ZIP under /public/renders/jobs/
//   4. Streams progress back to the row (completed_videos, status, zip_url)
//
// Limitations (Sprint 3 demo scope; addressed in later sprints):
//   - Process-bound: a Node restart orphans in-progress jobs. Sprint 9 swaps
//     this for an Inngest queue.
//   - Sequential: no render parallelism. Practical limit ~30 videos per job.
//   - Local FS only: ZIPs land in public/renders/jobs/, so this won't work
//     on read-only serverless FS (Vercel). Sprint 11 abstracts storage.
//   - When RENDER_BACKEND=lambda each render returns an S3 URL; we don't
//     currently fetch those back to disk for ZIPing — the worker fails
//     fast in that case so a future sprint owns adding the Lambda fan-out.

import path from 'node:path';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { createRequire } from 'node:module';

import { createServiceClient } from '@/lib/supabase/service';

// archiver is a CommonJS-only package whose main export is the factory
// function itself (module.exports = factory). Turbopack's ESM treatment
// rejects `import archiver from 'archiver'` because there is no `default`
// export to alias, so we go through createRequire to keep the runtime
// shape predictable. Type-only import is safe — it doesn't emit runtime code.
import type { Archiver } from 'archiver';
const require = createRequire(import.meta.url);
const archiver = require('archiver') as (
  format: string,
  options?: { zlib?: { level?: number } }
) => Archiver;
import { enumerateProductionConfigs } from '@/lib/video-types';
import type {
  ProductionVariants,
  VideoFormatId,
  Template,
  VariantText,
} from '@/lib/video-types';
import type { VideoConfig } from '@/lib/remotion/types';

const RENDERS_DIR = path.join(process.cwd(), 'public', 'renders');
const JOBS_DIR = path.join(RENDERS_DIR, 'jobs');

interface RenderOutput {
  index: number;
  format: VideoFormatId;
  variant: Required<VariantText>;
  mp4Path: string;
  fileName: string;
}

/**
 * Run a production job to completion. Fire-and-forget — caller should NOT
 * await this. All errors are caught and written to the job row.
 */
export async function doProduction(jobId: string): Promise<void> {
  const supabase = createServiceClient();

  try {
    await supabase
      .from('production_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId);

    const { data: job, error: jobError } = await supabase
      .from('production_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    if (jobError || !job) throw new Error('Production job not found');

    if (!job.template_id) {
      throw new Error('Produktionsjobbet saknar mall-referens');
    }

    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', job.template_id)
      .single();
    if (templateError || !template) throw new Error('Mall hittades inte');

    const renderBackend = (process.env.RENDER_BACKEND || 'local').toLowerCase();
    if (renderBackend === 'disabled') {
      throw new Error('RENDER_BACKEND=disabled — kan inte producera videos');
    }
    if (renderBackend === 'lambda') {
      throw new Error(
        'Bulk-produktion stöder bara RENDER_BACKEND=local just nu. Lambda-fan-out kommer i senare sprint.'
      );
    }

    const { renderVideoConfig } = await import('@/lib/remotion/render');
    const baseConfig = (template as Template).config as VideoConfig;
    const variants = job.variants as ProductionVariants;
    const formats = job.formats as VideoFormatId[];
    const totalVideos = job.total_videos as number;

    const outputs: RenderOutput[] = [];
    let completed = 0;

    for (const item of enumerateProductionConfigs(baseConfig, variants, formats)) {
      try {
        const { record, mp4Path } = await renderVideoConfig(item.config);
        outputs.push({
          index: item.index,
          format: item.format,
          variant: item.variant,
          mp4Path,
          fileName: record.fileName,
        });
        completed++;

        await supabase
          .from('production_jobs')
          .update({ completed_videos: completed })
          .eq('id', jobId);
      } catch (renderErr) {
        // Log but continue — partial-success is more useful to the user
        // than aborting the whole job on a single bad render.
        console.error(
          `[producer:${jobId}] render failed at index ${item.index}:`,
          renderErr
        );
      }
    }

    if (outputs.length === 0) {
      throw new Error('Alla renderingar misslyckades — inget att paketera');
    }

    await fs.mkdir(JOBS_DIR, { recursive: true });
    const zipFileName = `${jobId}.zip`;
    const zipPath = path.join(JOBS_DIR, zipFileName);
    const zipUrl = `/renders/jobs/${zipFileName}`;

    await zipOutputs(zipPath, outputs);

    const failedCount = totalVideos - outputs.length;
    await supabase
      .from('production_jobs')
      .update({
        status: 'completed',
        completed_videos: outputs.length,
        zip_url: zipUrl,
        output_urls: outputs.map((o) => `/renders/${o.fileName}`),
        error_message:
          failedCount > 0
            ? `${failedCount} av ${totalVideos} renderingar misslyckades`
            : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Okänt produktionsfel';
    console.error(`[producer:${jobId}] failed:`, err);
    await supabase
      .from('production_jobs')
      .update({
        status: 'failed',
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}

function slugifyForFilename(text: string, maxLen = 30): string {
  const cleaned = text
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen);
  return cleaned || 'video';
}

async function zipOutputs(zipPath: string, outputs: RenderOutput[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', reject);
    archive.pipe(output);

    for (const out of outputs) {
      const slug = slugifyForFilename(out.variant.headline);
      const archiveName = `${String(out.index + 1).padStart(2, '0')}_${out.format}_${slug}.mp4`;
      archive.file(out.mp4Path, { name: archiveName });
    }

    archive.finalize();
  });
}
