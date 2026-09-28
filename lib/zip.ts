// ── ZIP i minnet (server) ──
//
// archiver 8 är ESM och exporterar klasser (ZipArchive); @types/archiver
// beskriver fortfarande v7:s fabriksfunktion, så typen anges här.

import { PassThrough } from "node:stream";

interface ZipArchiveLike {
  append(source: Buffer | string, data: { name: string; date?: Date }): void;
  finalize(): Promise<void>;
  pipe<T extends NodeJS.WritableStream>(destination: T): T;
  on(event: "error", listener: (err: Error) => void): unknown;
}
type ZipArchiveCtor = new (options?: { zlib?: { level?: number } }) => ZipArchiveLike;

export interface ZipEntry {
  name: string;
  data: Buffer | string;
}

export async function zipEntries(entries: ZipEntry[]): Promise<Buffer> {
  const { ZipArchive } = (await import("archiver")) as unknown as { ZipArchive: ZipArchiveCtor };
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const sink = new PassThrough();
  const chunks: Buffer[] = [];
  sink.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<void>((resolve, reject) => {
    sink.on("end", resolve);
    archive.on("error", reject);
  });
  archive.pipe(sink);
  for (const e of entries) archive.append(e.data, { name: e.name });
  await archive.finalize();
  await done;
  return Buffer.concat(chunks);
}
