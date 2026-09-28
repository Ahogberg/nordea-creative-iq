// ── Illustrationskit för canvas-scener ──
//
// AI-genererad canvas-kod (se CanvasScene.tsx) får allt i den här filen i
// scope. Det är byggklossar, inte en mall: koden kan rita helt fritt i SVG
// och använda kitet där det passar.
//
// Stilen kommer från Nordeas annonser (brand-reference/VISUAL-GRAMMAR.md):
// isometrisk projektion (30°), platta ytor med 2–3 blå toner per objekt,
// inga konturer, persika som enda varma accent, mjuk mörkblå skugga.
//
// Koordinater: isometriska enheter (x, y, z) där x går snett ned åt höger,
// y snett ned åt vänster och z uppåt. `unit` = pixlar per enhet. Origo ritas
// där den omgivande <g> placerats, t.ex. translate(width/2, height*0.6).

import React from "react";
import { interpolate, Easing } from "remotion";

// ── Palett ──

export const palette = {
  blue: "#0000A0",
  deep: "#00005E",
  electric: "#0300ED",
  electricSoft: "#1A1AF0",
  mid: "#3D9BF5",
  sky: "#9ECAF9",
  pale: "#A5CEFC",
  mist: "#E5EFFB",
  white: "#FFFFFF",
  peach: "#FBD9CA",
  peachLight: "#FCE4E0",
  peachDark: "#E8B9A5",
  roof: "#1A1A7A",
  shadow: "#00007A",
} as const;

export interface FaceColors {
  top: string;
  left: string;
  right: string;
}

/** Standardtoner för blå objekt: ljus ovansida, mellanblå höger, klarblå vänster. */
export const BLUE_FACES: FaceColors = {
  top: palette.pale,
  right: palette.mid,
  left: palette.electric,
};

/** Persika objekt (mynt, pilar, accenter). */
export const PEACH_FACES: FaceColors = {
  top: palette.peachLight,
  right: palette.peach,
  left: palette.peachDark,
};

// ── Projektion ──

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

/** Isometrisk punkt → skärmkoordinat [x, y] i pixlar. */
export function iso(x: number, y: number, z = 0, unit = 1): [number, number] {
  return [(x - y) * COS30 * unit, (x + y) * SIN30 * unit - z * unit];
}

function points(pts: Array<[number, number]>): string {
  return pts.map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`).join(" ");
}

// ── Primitiver (returnerar <g>, ritas i en <svg>) ──

interface BoxProps {
  x?: number;
  y?: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  unit: number;
  colors?: Partial<FaceColors>;
  opacity?: number;
}

/** Låda från (x, y, z) med bredd w (x-led), djup d (y-led) och höjd h. */
export const IsoBox: React.FC<BoxProps> = ({ x = 0, y = 0, z = 0, w, d, h, unit, colors, opacity = 1 }) => {
  const c = { ...BLUE_FACES, ...colors };
  const p = (px: number, py: number, pz: number) => iso(px, py, pz, unit);
  return (
    <g opacity={opacity}>
      <polygon
        fill={c.left}
        points={points([p(x, y + d, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x, y + d, z + h)])}
      />
      <polygon
        fill={c.right}
        points={points([p(x + w, y, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x + w, y, z + h)])}
      />
      <polygon
        fill={c.top}
        points={points([p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)])}
      />
    </g>
  );
};

interface FaceRectProps {
  /** "right" = planet x = at, "left" = planet y = at, "top" = planet z = at. */
  face: "left" | "right" | "top";
  at: number;
  /** Utsträckning längs planets två axlar: [från, till]. */
  a: [number, number];
  b: [number, number];
  unit: number;
  fill: string;
  opacity?: number;
}

/**
 * Rektangel som ligger i en av lådans ytor — fönster, dörrar, skyltar.
 *  face "right": a = y-intervall, b = z-intervall
 *  face "left":  a = x-intervall, b = z-intervall
 *  face "top":   a = x-intervall, b = y-intervall
 */
export const IsoFaceRect: React.FC<FaceRectProps> = ({ face, at, a, b, unit, fill, opacity = 1 }) => {
  const p = (px: number, py: number, pz: number) => iso(px, py, pz, unit);
  const corners: Array<[number, number]> =
    face === "right"
      ? [p(at, a[0], b[0]), p(at, a[1], b[0]), p(at, a[1], b[1]), p(at, a[0], b[1])]
      : face === "left"
        ? [p(a[0], at, b[0]), p(a[1], at, b[0]), p(a[1], at, b[1]), p(a[0], at, b[1])]
        : [p(a[0], b[0], at), p(a[1], b[0], at), p(a[1], b[1], at), p(a[0], b[1], at)];
  return <polygon fill={fill} opacity={opacity} points={points(corners)} />;
};

interface RoofProps {
  x?: number;
  y?: number;
  z: number;
  w: number;
  d: number;
  /** Höjd från takfot till nock. */
  rise: number;
  unit: number;
  roof?: string;
  roofShade?: string;
  gable?: string;
}

/** Sadeltak med nock längs x-axeln, gavel mot höger. */
export const IsoRoof: React.FC<RoofProps> = ({
  x = 0,
  y = 0,
  z,
  w,
  d,
  rise,
  unit,
  roof = palette.roof,
  roofShade = palette.deep,
  gable = palette.mid,
}) => {
  const p = (px: number, py: number, pz: number) => iso(px, py, pz, unit);
  const ry = y + d / 2;
  const rz = z + rise;
  return (
    <g>
      <polygon fill={roofShade} points={points([p(x, y, z), p(x + w, y, z), p(x + w, ry, rz), p(x, ry, rz)])} />
      <polygon fill={gable} points={points([p(x + w, y, z), p(x + w, y + d, z), p(x + w, ry, rz)])} />
      <polygon fill={roof} points={points([p(x, ry, rz), p(x + w, ry, rz), p(x + w, y + d, z), p(x, y + d, z)])} />
    </g>
  );
};

interface CylinderProps {
  x?: number;
  y?: number;
  z?: number;
  /** Radie i isometriska enheter. */
  r: number;
  h: number;
  unit: number;
  top?: string;
  side?: string;
  /** Inre ring på ovansidan (mynt). */
  rim?: string;
  opacity?: number;
}

/** Stående cylinder: mynt, burkar, pelare. */
export const IsoCylinder: React.FC<CylinderProps> = ({
  x = 0,
  y = 0,
  z = 0,
  r,
  h,
  unit,
  top = palette.peachLight,
  side = palette.peachDark,
  rim,
  opacity = 1,
}) => {
  // En cirkel i xy-planet blir en axelparallell ellips på skärmen.
  const rx = r * Math.SQRT2 * COS30 * unit;
  const ry = r * Math.SQRT2 * SIN30 * unit;
  const [cx, cyBottom] = iso(x, y, z, unit);
  const cyTop = cyBottom - h * unit;
  return (
    <g opacity={opacity}>
      <path
        fill={side}
        d={`M ${cx - rx} ${cyTop} L ${cx - rx} ${cyBottom} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cyBottom} L ${cx + rx} ${cyTop} Z`}
      />
      <ellipse cx={cx} cy={cyTop} rx={rx} ry={ry} fill={top} />
      {rim && <ellipse cx={cx} cy={cyTop} rx={rx * 0.72} ry={ry * 0.72} fill="none" stroke={rim} strokeWidth={Math.max(1, rx * 0.08)} />}
    </g>
  );
};

/** Mjuk skugga på marken under ett objekt. */
export const IsoShadow: React.FC<{ x?: number; y?: number; r: number; unit: number; opacity?: number }> = ({
  x = 0,
  y = 0,
  r,
  unit,
  opacity = 0.45,
}) => {
  const [cx, cy] = iso(x, y, 0, unit);
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={r * Math.SQRT2 * COS30 * unit}
      ry={r * Math.SQRT2 * SIN30 * unit}
      fill={palette.shadow}
      opacity={opacity}
    />
  );
};

// ── Färdiga motiv ──

/** Hus med sadeltak, fönster och dörr. Fotavtryck 2 × 2 enheter från (x, y). */
export const IsoHouse: React.FC<{
  x?: number;
  y?: number;
  unit: number;
  /** 0–1: fönstren tänds (vitt) — animera för liv. */
  lit?: number;
  roof?: string;
}> = ({ x = 0, y = 0, unit, lit = 0, roof = palette.roof }) => {
  const w = 2;
  const d = 2;
  const h = 1.5;
  const windowFill = lit > 0 ? palette.white : palette.pale;
  return (
    <g>
      <IsoBox x={x} y={y} w={w} d={d} h={h} unit={unit} colors={{ top: palette.mid, right: palette.sky, left: palette.mid }} />
      {/* Fönster på vänstra fasaden, dörr på högra gaveln */}
      {[0.3, 1.2].map((wx) => (
        <IsoFaceRect key={wx} face="left" at={y + d} a={[x + wx, x + wx + 0.5]} b={[0.65, 1.15]} unit={unit} fill={windowFill} opacity={0.6 + 0.4 * lit} />
      ))}
      <IsoFaceRect face="right" at={x + w} a={[y + 0.75, y + 1.25]} b={[0, 0.9]} unit={unit} fill={palette.electric} />
      <IsoRoof x={x - 0.1} y={y - 0.1} z={h} w={w + 0.2} d={d + 0.2} rise={1} unit={unit} roof={roof} gable={palette.sky} />
      {/* Skorsten på det främre takfallet — ritas efter taket */}
      <IsoBox x={x + 1.3} y={y + 1.3} z={h + 0.45} w={0.3} d={0.3} h={0.8} unit={unit} colors={{ top: palette.pale, right: palette.mid, left: palette.electric }} />
    </g>
  );
};

/** Ett persika mynt. */
export const IsoCoin: React.FC<{ x?: number; y?: number; z?: number; unit: number; opacity?: number }> = ({
  x = 0,
  y = 0,
  z = 0,
  unit,
  opacity = 1,
}) => (
  <IsoCylinder x={x} y={y} z={z} r={0.5} h={0.18} unit={unit} top={palette.peachLight} side={palette.peachDark} rim={palette.peach} opacity={opacity} />
);

/** Stapel av mynt. `count` kan animeras (avrundas nedåt). */
export const IsoCoinStack: React.FC<{ x?: number; y?: number; count: number; unit: number }> = ({
  x = 0,
  y = 0,
  count,
  unit,
}) => (
  <g>
    {Array.from({ length: Math.max(0, Math.floor(count)) }, (_, i) => (
      <IsoCoin key={i} x={x} y={y} z={i * 0.2} unit={unit} />
    ))}
  </g>
);

/** Platt cirkel bakom ett illustrationskluster (klarare blå, som i annonserna). */
export const Disc: React.FC<{ cx: number; cy: number; r: number; fill?: string; opacity?: number }> = ({
  cx,
  cy,
  r,
  fill = palette.electricSoft,
  opacity = 1,
}) => <circle cx={cx} cy={cy} r={r} fill={fill} opacity={opacity} />;

/**
 * Nordeas stapelmönster: rundade vertikala staplar av olika höjd, som en
 * ljudvåg. Lägg det gärna avskuret mot en kant. `frame` ger en lugn puls.
 */
export const PillBars: React.FC<{
  x: number;
  y: number;
  /** Stapelbredd i px. */
  barWidth: number;
  heights?: number[];
  gap?: number;
  fill?: string;
  frame?: number;
  opacity?: number;
}> = ({ x, y, barWidth, heights = [0.45, 1, 0.8, 0.35, 0.18], gap, fill = palette.blue, frame = 0, opacity = 1 }) => {
  const g = gap ?? barWidth * 0.45;
  const maxH = barWidth * 5;
  return (
    <g opacity={opacity}>
      {heights.map((hf, i) => {
        const pulse = 1 + 0.06 * Math.sin(frame * 0.12 + i * 1.3);
        const h = Math.max(barWidth, hf * maxH * pulse);
        return (
          <rect
            key={i}
            x={x + i * (barWidth + g)}
            y={y - h / 2}
            width={barWidth}
            height={h}
            rx={barWidth / 2}
            fill={fill}
          />
        );
      })}
    </g>
  );
};

/** Strålkrans ("tap"/kontaktlöst) som pulserar runt en punkt. */
export const Sparkle: React.FC<{
  cx: number;
  cy: number;
  r: number;
  frame: number;
  start?: number;
  rays?: number;
  color?: string;
  strokeWidth?: number;
}> = ({ cx, cy, r, frame, start = 0, rays = 10, color = palette.white, strokeWidth }) => {
  const local = frame - start;
  if (local < 0) return null;
  // Två pulser: ut, in, ut — som i annonserna.
  const pulse = 0.75 + 0.25 * Math.abs(Math.sin((local / 18) * Math.PI));
  const opacity = interpolate(local, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const sw = strokeWidth ?? r * 0.12;
  return (
    <g opacity={opacity} stroke={color} strokeWidth={sw} strokeLinecap="round">
      {Array.from({ length: rays }, (_, i) => {
        const a = (i / rays) * Math.PI * 2;
        const r0 = r * pulse;
        const r1 = r * pulse * 1.35;
        return (
          <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} />
        );
      })}
    </g>
  );
};

// ── Rörelse ──
// Lugnt tempo: ease-out, ingen studs. Alla tar `frame` och returnerar
// värden att sätta på en <g transform=…> eller opacity.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);

export const ease = { out: easeOut, inOut: easeInOut };

/** 0→1 mellan start och start+dur (ease-out). */
export function progress(frame: number, start: number, dur: number, easing = easeOut): number {
  return interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing });
}

/** Faller in uppifrån och landar: { y, opacity }. */
export function fall(frame: number, start: number, dur: number, distance: number) {
  const t = progress(frame, start, dur);
  return { y: -distance * (1 - t), opacity: interpolate(frame, [start, start + dur * 0.4], [0, 1], clamp) };
}

/** Glider in från en förskjutning [dx, dy] i pixlar: { x, y, opacity }. */
export function slideIn(frame: number, start: number, dur: number, from: [number, number]) {
  const t = progress(frame, start, dur);
  return {
    x: from[0] * (1 - t),
    y: from[1] * (1 - t),
    opacity: interpolate(frame, [start, start + dur * 0.5], [0, 1], clamp),
  };
}

/** Glider in längs de isometriska axlarna (dx, dy, dz i enheter). */
export function slideAlongIso(
  frame: number,
  start: number,
  dur: number,
  offset: [number, number, number],
  unit: number
) {
  const [sx, sy] = iso(offset[0], offset[1], offset[2], unit);
  return slideIn(frame, start, dur, [sx, sy]);
}

/** Växer fram från 0 till 1 i skala (ease-out, ingen överslängning). */
export function grow(frame: number, start: number, dur: number) {
  const t = progress(frame, start, dur);
  return { scale: t, opacity: Math.min(1, t * 2) };
}

/** Upprepande 0→1 med perioden `period` bildrutor, från `start`. */
export function loop(frame: number, period: number, start = 0): number {
  if (frame < start) return 0;
  return ((frame - start) % period) / period;
}

/** Lugn sinusrörelse — gungning, svävande. */
export function bob(frame: number, amplitude: number, period = 60): number {
  return Math.sin((frame / period) * Math.PI * 2) * amplitude;
}

/** Ritar upp en linje: sätt strokeDasharray={length} och strokeDashoffset={drawOn(...)}. */
export function drawOn(frame: number, start: number, dur: number, length: number): number {
  return length * (1 - progress(frame, start, dur, easeInOut));
}

/** SVG-transform för en <g>: translate + skala runt en punkt. */
export function transformAt(x: number, y: number, scale = 1): string {
  return `translate(${x} ${y}) scale(${scale})`;
}
