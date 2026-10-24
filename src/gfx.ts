import { mix, type Pal } from "./palette";

export type C = CanvasRenderingContext2D;
export type Pt = [number, number];
/** Five-tone material ramp: [outline, shadow, base, light, highlight]. */
export type R5 = [string, string, string, string, string];

/** Deterministic noise in [0, 1). */
export const hash = (n: number) => {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

/** Smooth 1-D value noise in [0, 1). */
export function vnoise(x: number, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i * 7919 + seed) * (1 - u) + hash((i + 1) * 7919 + seed) * u;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** 4x4 ordered-dither threshold in (0, 1). */
export const bayer = (x: number, y: number) =>
  (BAYER[(y & 3) * 4 + (x & 3)]! + 0.5) / 16;

export const px = (c: C, col: string, x: number, y: number, w = 1, h = 1) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** Dims colours at night so objects sit in the scene; vivid primaries keep most of their punch. */
export const tone = (p: Pal, col: string, k = 0.34) =>
  p.night ? mix(col, "#1a2766", k) : col;

export const ramp = (base: string): R5 => [
  mix(base, "#0b0e2c", 0.72),
  mix(base, "#1d2160", 0.4),
  base,
  mix(base, "#fff3cf", 0.28),
  mix(base, "#ffffff", 0.6),
];

/** Ramp of `base` already toned for the current time of day. */
export const mat = (p: Pal, base: string, k?: number) => ramp(tone(p, base, k));

export function line(
  c: C,
  col: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w = 1,
) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let i = 0; i <= n; i++)
    px(c, col, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, w, w);
}

export function dotted(
  c: C,
  col: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  every = 5,
) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let i = 0; i <= n; i += every)
    px(c, col, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, 2, 2);
}

/** Point at fraction `u` of the way along a polyline. */
export function along(pts: Pt[], u: number): Pt {
  const lens = pts
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - pts[i]![0], p[1] - pts[i]![1]));
  let d = u * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]!) {
      const k = lens[i]! ? d / lens[i]! : 0;
      return [
        pts[i]![0] + (pts[i + 1]![0] - pts[i]![0]) * k,
        pts[i]![1] + (pts[i + 1]![1] - pts[i]![1]) * k,
      ];
    }
    d -= lens[i]!;
  }
  return pts[pts.length - 1]!;
}

/** Box with a lit top-left edge and a shaded bottom-right edge. */
export function slab(
  c: C,
  x: number,
  y: number,
  w: number,
  h: number,
  r: R5,
  bevel = 2,
) {
  px(c, r[2], x, y, w, h);
  px(c, r[3], x, y, w, 1);
  px(c, r[3], x, y, 1, h);
  px(c, r[1], x, y + h - bevel, w, bevel);
  px(c, r[1], x + w - bevel, y, bevel, h);
}

/** Horizontal siding / planks: alternating tones with a shadow line. */
export function planks(
  c: C,
  x: number,
  y: number,
  w: number,
  h: number,
  r: R5,
  pitch = 5,
) {
  px(c, r[2], x, y, w, h);
  for (let yy = 0; yy < h; yy += pitch) {
    px(c, r[3], x, y + yy, w, 1);
    px(c, r[1], x, y + yy + pitch - 1, w, 1);
  }
  px(c, r[1], x + w - 3, y, 3, h);
  px(c, r[3], x, y, 1, h);
}

/** Vertical cylinder shaded across its width. */
export function cyl(c: C, x: number, y: number, w: number, h: number, r: R5) {
  for (let i = 0; i < w; i++) {
    const u = i / Math.max(1, w - 1);
    const idx =
      u < 0.18
        ? 2
        : u < 0.4
          ? 3
          : u < 0.55
            ? 4
            : u < 0.72
              ? 3
              : u < 0.88
                ? 2
                : 1;
    px(c, r[idx]!, x + i, y, 1, h);
  }
}

/** Lit sphere / blob: pixels shaded by a light from the upper left, dithered between tones. */
export function ball(
  c: C,
  cx: number,
  cy: number,
  rad: number,
  r: R5,
  rx = rad,
  lx = -0.55,
  ly = -0.65,
) {
  for (let dy = -rad; dy <= rad; dy++)
    for (let dx = -rx; dx <= rx; dx++) {
      const nx = dx / rx;
      const ny = dy / rad;
      const d2 = nx * nx + ny * ny;
      if (d2 > 1) continue;
      const nz = Math.sqrt(1 - d2);
      const l = Math.max(0, nx * lx + ny * ly + nz * 0.55);
      const lvl = Math.floor(l * 3.6 + (bayer(cx + dx, cy + dy) - 0.5) * 0.9);
      px(c, r[Math.max(1, Math.min(4, lvl + 1))]!, cx + dx, cy + dy);
    }
}

/** Soft ground shadow under an object. */
export function shadow(
  c: C,
  p: Pal,
  x: number,
  y: number,
  rx: number,
  ry = Math.max(2, rx / 5),
) {
  c.save();
  c.globalAlpha = p.night ? 0.32 : 0.22;
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry + 0.01)));
    px(c, "#05081c", x - w, y + dy, w * 2, 1);
  }
  c.restore();
}

/** Stepped light pool; night only. */
export function glow(
  c: C,
  p: Pal,
  x: number,
  y: number,
  rad: number,
  col = p.glow,
  alpha = 0.05,
) {
  if (!p.night) return;
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = col;
  for (let k = rad; k > 4; k -= 4) {
    c.beginPath();
    c.arc(Math.round(x), Math.round(y), k, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/* ---------- pre-rendered sprites ---------- */

export interface Sprite {
  cv: HTMLCanvasElement;
  /** top-left of the bitmap in the space it was drawn in */
  ox: number;
  oy: number;
}

function outline(cv: HTMLCanvasElement) {
  const c = cv.getContext("2d")!;
  const { width: w, height: h } = cv;
  const img = c.getImageData(0, 0, w, h);
  const d = img.data;
  const out = new Uint8ClampedArray(d);
  const A = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]!;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (A(x, y) >= 128) continue;
      for (const [dx, dy] of [
        [0, 1],
        [1, 0],
        [-1, 0],
        [0, -1],
      ] as const) {
        if (A(x + dx, y + dy) < 128) continue;
        const k = ((y + dy) * w + (x + dx)) * 4;
        const o = (y * w + x) * 4;
        out[o] = d[k]! * 0.3 + 6;
        out[o + 1] = d[k + 1]! * 0.3 + 8;
        out[o + 2] = d[k + 2]! * 0.32 + 34;
        out[o + 3] = 255;
        break;
      }
    }
  img.data.set(out);
  c.putImageData(img, 0, 0);
}

/** Draws `fn` (in the coordinate space [x0,x1]x[y0,y1]) once into a bitmap, with a coloured silhouette outline. */
export function bake(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fn: (c: C) => void,
  edge = true,
): Sprite {
  const pad = edge ? 1 : 0;
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(x1 - x0) + pad * 2;
  cv.height = Math.ceil(y1 - y0) + pad * 2;
  const c = cv.getContext("2d")!;
  c.translate(pad - x0, pad - y0);
  fn(c);
  if (edge) outline(cv);
  return { cv, ox: x0 - pad, oy: y0 - pad };
}

export const blit = (c: C, s: Sprite, x: number, y: number, flip = false) => {
  if (!flip) {
    c.drawImage(s.cv, Math.round(x + s.ox), Math.round(y + s.oy));
    return;
  }
  c.save();
  c.translate(Math.round(x), 0);
  c.scale(-1, 1);
  c.drawImage(s.cv, Math.round(s.ox), Math.round(y + s.oy));
  c.restore();
};
