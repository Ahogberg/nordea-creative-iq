import { NextResponse } from "next/server";
import { PassThrough } from "node:stream";
import { ZodError } from "zod";
import { parseDisplaySet } from "@/lib/display/schema";
import { renderDisplaySet, DisplayRenderUnavailable, type RenderedBanner } from "@/lib/display/render";

// Leveranspaket: alla format som bilder + specifikation, i en ZIP.

export const runtime = "nodejs";
export const maxDuration = 180;

// archiver 8 är ESM och exporterar klasser (ZipArchive); @types/archiver
// beskriver fortfarande v7:s fabriksfunktion, så typen anges här.
interface ZipArchiveLike {
  append(source: Buffer | string, data: { name: string }): void;
  finalize(): Promise<void>;
  pipe<T extends NodeJS.WritableStream>(destination: T): T;
  on(event: "error", listener: (err: Error) => void): unknown;
}
type ZipArchiveCtor = new (options?: { zlib?: { level?: number } }) => ZipArchiveLike;

function specSheet(name: string, banners: RenderedBanner[]): string {
  const rows = banners.map((b) => {
    const errors = b.issues.filter((i) => i.severity === "error").length;
    const warnings = b.issues.filter((i) => i.severity === "warning").length;
    const status = errors ? `${errors} fel` : warnings ? `${warnings} varning${warnings > 1 ? "ar" : ""}` : "OK";
    return `| ${b.spec.label} | ${b.spec.width}×${b.spec.height} | ${b.spec.channel} | ${b.fileName} | ${Math.round(b.bytes / 1024)} / ${b.spec.maxKb} kB | ${status} |`;
  });
  const notes = banners.flatMap((b) =>
    b.issues.filter((i) => i.severity !== "info").map((i) => `- ${b.spec.label} ${b.spec.width}×${b.spec.height}: ${i.message}`)
  );
  return [
    `# Displayleverans — ${name}`,
    "",
    `Skapad ${new Date().toISOString().slice(0, 16).replace("T", " ")} i Nordea CreativeIQ.`,
    "",
    "| Format | Mått | Placering | Fil | Vikt / max | Kontroll |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
    notes.length ? "## Att åtgärda eller stämma av\n\n" + notes.join("\n") : "## Regelkontroll\n\nInga anmärkningar.",
    "",
    "Maxvikterna är standardvärden — kontrollera mot respektive publicists spec och mediaplanen före trafikering.",
    "",
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { set?: unknown } | null;
    const set = parseDisplaySet(body?.set);
    const banners = await renderDisplaySet(set);

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
    for (const b of banners) archive.append(b.buffer, { name: `display/${b.fileName}` });
    archive.append(specSheet(set.name, banners), { name: "LEVERANS.md" });
    archive.append(
      JSON.stringify(
        banners.map((b) => ({
          format: b.formatId,
          width: b.spec.width,
          height: b.spec.height,
          file: `display/${b.fileName}`,
          bytes: b.bytes,
          maxKb: b.spec.maxKb,
          issues: b.issues,
        })),
        null,
        2
      ),
      { name: "specifikation.json" }
    );
    await archive.finalize();
    await done;

    const zip = Buffer.concat(chunks);
    const fileName = `${banners[0]?.fileName.split("_")[0] ?? "kampanj"}_display.zip`;
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(zip.length),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Ogiltigt displaypaket" }, { status: 400 });
    if (error instanceof DisplayRenderUnavailable) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("[display:export] error:", error);
    return NextResponse.json({ error: "Kunde inte skapa leveranspaketet" }, { status: 500 });
  }
}
