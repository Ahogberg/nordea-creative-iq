import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { z, ZodError } from "zod";
import { parseDisplaySet } from "@/lib/display/schema";
import { renderDisplaySet, DisplayRenderUnavailable } from "@/lib/display/render";
import { HTML5_ASSET_ALLOWLIST, HTML5_MAX_KB, HTML5_TARGETS, type Html5Target } from "@/lib/display/html5/build";
import { findDisplayFormat } from "@/lib/formats/registry";
import { zipEntries, type ZipEntry } from "@/lib/zip";

// HTML5-leverans: en ZIP per format (det annonsservrarna tar emot), en
// reservbild per format och ett leveransblad. index.html byggs i webbläsaren
// (illustrationen kräver React); servern packar bara filer ur en fast
// vitlista och mäter den riktiga vikten.

export const runtime = "nodejs";
export const maxDuration = 180;

const BodySchema = z.object({
  set: z.unknown(),
  target: z.enum(["iab", "adform"]),
  clickUrl: z.string().url().startsWith("https://").max(2000),
  banners: z.record(z.string(), z.object({ html: z.string().min(100).max(600_000), durationSeconds: z.number().min(0).max(120) })),
});

interface PackedBanner {
  formatId: string;
  label: string;
  width: number;
  height: number;
  zipName: string;
  zipBytes: number;
  backupName: string;
  backupBytes: number;
  durationSeconds: number;
  issues: string[];
}

function adformManifest(title: string, width: number, height: number, clickUrl: string): string {
  return JSON.stringify(
    {
      version: "1.0",
      title,
      description: "Nordea CreativeIQ",
      width,
      height,
      events: { enabled: 1, list: {} },
      clicktags: { clickTAG: clickUrl },
      source: "index.html",
    },
    null,
    2
  );
}

function sheet(name: string, target: Html5Target, clickUrl: string, packed: PackedBanner[]): string {
  const rows = packed.map(
    (p) =>
      `| ${p.label} | ${p.width}×${p.height} | html5/${p.zipName} | ${Math.round(p.zipBytes / 1024)} / ${HTML5_MAX_KB} kB | ${p.durationSeconds.toFixed(1)} s | backup/${p.backupName} | ${p.issues.length ? `${p.issues.length} anm.` : "OK"} |`
  );
  const notes = packed.flatMap((p) => p.issues.map((i) => `- ${p.label} ${p.width}×${p.height}: ${i}`));
  return [
    `# HTML5-leverans — ${name}`,
    "",
    `Annonsserver: ${HTML5_TARGETS[target].label} (${HTML5_TARGETS[target].note}).`,
    `Klickadress: ${clickUrl} — sätts om i annonsservern via ${target === "adform" ? "clickTAG" : "clickTag"}.`,
    "",
    "| Format | Mått | Paket | Vikt / riktvärde | Animation | Reservbild | Kontroll |",
    "|---|---|---|---|---|---|---|",
    ...rows,
    "",
    notes.length ? "## Att åtgärda eller stämma av\n\n" + notes.join("\n") : "## Kontroll\n\nInga anmärkningar.",
    "",
    "Animationen spelas en gång och stannar på slutbilden (samma som reservbilden). Juridisk text syns hela tiden.",
    `Vikten är paketets komprimerade storlek. ${HTML5_MAX_KB} kB är IAB:s riktvärde — publicisterna kan ha egna gränser.`,
    "",
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json().catch(() => null));
    const set = parseDisplaySet(body.set);
    const ids = set.formats.filter((id) => body.banners[id]);
    if (ids.length === 0) return NextResponse.json({ error: "Inga banners att packa" }, { status: 400 });

    // Reservbilder = de statiska bilderna (samma slutbild som animationen).
    const backups = await renderDisplaySet(set, ids);
    const assetCache = new Map<string, Buffer>();
    const readAsset = async (publicPath: string) => {
      if (!assetCache.has(publicPath)) {
        assetCache.set(publicPath, await fs.readFile(path.join(process.cwd(), "public", publicPath)));
      }
      return assetCache.get(publicPath) as Buffer;
    };

    const entries: ZipEntry[] = [];
    const packed: PackedBanner[] = [];
    for (const backup of backups) {
      const spec = findDisplayFormat(backup.formatId);
      const banner = body.banners[backup.formatId];
      if (!spec || !banner) continue;
      // Bara filer ur vitlistan som faktiskt refereras i HTML:en.
      const assets = HTML5_ASSET_ALLOWLIST.filter((a) => banner.html.includes(`"${a.zipPath}"`));
      const inner: ZipEntry[] = [{ name: "index.html", data: banner.html }];
      for (const a of assets) inner.push({ name: a.zipPath, data: await readAsset(a.publicPath) });
      if (body.target === "adform") {
        inner.push({ name: "manifest.json", data: adformManifest(set.name, spec.width, spec.height, body.clickUrl) });
      }
      const innerZip = await zipEntries(inner);
      const base = backup.fileName.replace(/\.(png|jpg)$/, "");
      const zipName = `${base}_html5.zip`;
      const backupName = backup.fileName;
      entries.push({ name: `html5/${zipName}`, data: innerZip });
      entries.push({ name: `backup/${backupName}`, data: backup.buffer });

      const issues: string[] = [];
      if (innerZip.length > HTML5_MAX_KB * 1024) {
        issues.push(`Paketet är ${Math.round(innerZip.length / 1024)} kB — över riktvärdet ${HTML5_MAX_KB} kB`);
      }
      if (banner.durationSeconds > 15) issues.push(`Animationen är ${banner.durationSeconds.toFixed(1)} s — riktlinjen är högst 15 s`);
      for (const i of backup.issues) if (i.severity !== "info") issues.push(i.message);
      packed.push({
        formatId: backup.formatId,
        label: spec.label,
        width: spec.width,
        height: spec.height,
        zipName,
        zipBytes: innerZip.length,
        backupName,
        backupBytes: backup.bytes,
        durationSeconds: banner.durationSeconds,
        issues,
      });
    }
    entries.push({ name: "LEVERANS.md", data: sheet(set.name, body.target, body.clickUrl, packed) });
    entries.push({ name: "specifikation.json", data: JSON.stringify({ target: body.target, clickUrl: body.clickUrl, banners: packed }, null, 2) });

    const zip = await zipEntries(entries);
    const slug = backups[0]?.fileName.split("_")[0] ?? "kampanj";
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}_html5_${body.target}.zip"`,
        "Content-Length": String(zip.length),
        "X-Banner-Sizes": packed.map((p) => `${p.formatId}=${p.zipBytes}`).join(","),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Ogiltig begäran — kontrollera klickadressen (https://)" }, { status: 400 });
    if (error instanceof DisplayRenderUnavailable) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("[display:html5-export] error:", error);
    return NextResponse.json({ error: "Kunde inte skapa HTML5-paketet" }, { status: 500 });
  }
}
