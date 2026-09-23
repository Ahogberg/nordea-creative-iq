'use client';

// Claude skalar ändå ner bilder vars långsida är större än ~1568 px. Att göra
// det i webbläsaren först håller request-storleken nere (Vercel-gräns 4,5 MB).
const MAX_EDGE = 1568;

export async function downscaleDataUrl(
  dataUrl: string,
  maxEdge = MAX_EDGE,
  quality = 0.85
): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}
