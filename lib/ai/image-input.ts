// Server-side: gör om annonsbilder till Claude image-block.
//
// Accepterar:
//  - data-URL:er ("data:image/png;base64,...") — från uppladdning i Ad Studio
//  - https-URL:er — hämtas av Anthropic direkt
//  - sökvägar under /public ("/renders/x.png") — läses från disk
// Allt annat (blob:, localhost-URL:er, video) hoppas över.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type Anthropic from '@anthropic-ai/sdk';

type ImageBlock = Anthropic.ImageBlockParam;
type SupportedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const SUPPORTED: readonly SupportedMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const EXTENSION_TYPES: Record<string, SupportedMediaType> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};
// Claude API-gräns per bild (base64-avkodad storlek).
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function isSupported(mediaType: string): mediaType is SupportedMediaType {
  return (SUPPORTED as readonly string[]).includes(mediaType);
}

function base64Block(mediaType: SupportedMediaType, data: string): ImageBlock | null {
  if ((data.length * 3) / 4 > MAX_IMAGE_BYTES) {
    console.warn('[image-input] Bilden är större än 5 MB och skickas inte till Claude');
    return null;
  }
  return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
}

export async function toImageBlock(src: string): Promise<ImageBlock | null> {
  if (src.startsWith('data:')) {
    const match = src.match(/^data:([^;,]+);base64,(.+)$/);
    if (!match || !isSupported(match[1])) return null;
    return base64Block(match[1], match[2]);
  }

  if (src.startsWith('https://')) {
    const host = new URL(src).hostname;
    if (host === 'localhost' || host.startsWith('127.')) return null;
    return { type: 'image', source: { type: 'url', url: src } };
  }

  if (src.startsWith('/')) {
    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.resolve(publicDir, `.${decodeURIComponent(src.split('?')[0])}`);
    if (!filePath.startsWith(publicDir + path.sep)) return null;
    const mediaType = EXTENSION_TYPES[path.extname(filePath).toLowerCase()];
    if (!mediaType) return null;
    try {
      const data = await readFile(filePath);
      return base64Block(mediaType, data.toString('base64'));
    } catch {
      return null;
    }
  }

  return null;
}

/** Konverterar upp till `max` källor och hoppar tyst över det som inte går. */
export async function toImageBlocks(sources: string[] | undefined, max = 4): Promise<ImageBlock[]> {
  if (!sources || sources.length === 0) return [];
  const blocks = await Promise.all(sources.slice(0, max).map(toImageBlock));
  return blocks.filter((b): b is ImageBlock => b !== null);
}
