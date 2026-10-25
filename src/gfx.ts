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
      // hard bands, no dither: reads as moulded plastic
      const lvl = Math.floor(l * 3.4);
      px(c, r[Math.max(1, Math.min(4, lvl + 1))]!, cx + dx, cy + dy);
    }
}

/* ---------- bricks ---------- */

/** How far brick depth recedes (up and to the right, one pixel per pixel). */
export const DEPTH = 4;

/**
 * Extruded brick: the front face fills the rect, the top face and the right
 * side recede `d` px up and to the right, like a toy brick seen from a little
 * above and to the left.
 */
export function block(
  c: C,
  x: number,
  y: number,
  w: number,
  h: number,
  r: R5,
  d = DEPTH,
) {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  for (let k = 1; k <= d; k++) {
    px(c, k === d ? r[4] : r[3], x + k, y - k, w, 1);
    px(c, r[1], x + w - 1 + k, y - k + 1, 1, h);
  }
  px(c, r[2], x, y, w, h);
  px(c, r[4], x, y, w, 1);
  px(c, r[3], x, y + 1, 1, h - 1);
  px(c, mix(r[1], r[0], 0.4), x, y + h - 1, w, 1);
  // a darker crease where the side meets the front
  px(c, mix(r[2], r[1], 0.5), x + w - 1, y + 1, 1, h - 1);
}

/** A row of studs along the top face of a brick whose front starts at (x, y). */
export function studs(
  c: C,
  x: number,
  y: number,
  w: number,
  r: R5,
  pitch = 8,
  d = DEPTH,
) {
  const sy = Math.round(y - Math.ceil(d / 2));
  const n = Math.max(1, Math.floor(w / pitch));
  const off = Math.round((w - n * pitch) / 2) + Math.ceil(d / 2);
  for (let i = 0; i < n; i++) {
    const sx = Math.round(x + off + i * pitch + (pitch - 5) / 2);
    px(c, r[1], sx + 1, sy - 1, 5, 2);
    px(c, r[3], sx, sy - 2, 5, 2);
    px(c, r[4], sx, sy - 3, 4, 1);
    px(c, r[4], sx, sy - 2, 1, 1);
  }
}

/** Staggered mortar lines across a front face: running bond. */
export function courses(
  c: C,
  x: number,
  y: number,
  w: number,
  h: number,
  r: R5,
  bw = 16,
  bh = 6,
) {
  const seam = mix(r[2], r[1], 0.55);
  for (let yy = bh; yy < h - 1; yy += bh) px(c, seam, x + 1, y + yy, w - 2, 1);
  for (let row = 0; row * bh < h - 1; row++) {
    const y0 = y + row * bh + 1;
    const hh = Math.min(bh - 1, h - 2 - row * bh);
    for (let xx = (row & 1) * (bw >> 1) + bw; xx < w - 2; xx += bw)
      px(c, seam, x + xx, y0, 1, hh);
  }
}

/**
 * Voxel picture: a `cols` x `rows` grid of cubes of `cell` px, top-left at
 * (x, y). `at(i, j)` gives each cell's ramp, or null for empty. Hidden faces
 * are skipped, so neighbouring cubes merge into one moulded shape with a
 * faint seam between them.
 */
export function vox(
  c: C,
  x: number,
  y: number,
  cols: number,
  rows: number,
  cell: number,
  at: (i: number, j: number) => R5 | null | undefined,
  d = Math.max(1, Math.round(cell * 0.5)),
  seams = true,
) {
  const g = (i: number, j: number) =>
    i < 0 || j < 0 || i >= cols || j >= rows ? null : at(i, j);
  // back faces first, so every front face sits on top of them
  for (let j = rows - 1; j >= 0; j--)
    for (let i = 0; i < cols; i++) {
      const r = g(i, j);
      if (!r) continue;
      const x0 = x + i * cell;
      const y0 = y + j * cell;
      for (let k = 1; k <= d; k++) {
        if (!g(i, j - 1)) px(c, k === d ? r[4] : r[3], x0 + k, y0 - k, cell, 1);
        if (!g(i + 1, j)) px(c, r[1], x0 + cell - 1 + k, y0 - k + 1, 1, cell);
      }
    }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const r = g(i, j);
      if (!r) continue;
      const x0 = x + i * cell;
      const y0 = y + j * cell;
      px(c, r[2], x0, y0, cell, cell);
      if (!g(i, j - 1)) px(c, r[4], x0, y0, cell, 1);
      else if (seams && g(i, j - 1) !== r)
        px(c, mix(r[2], r[1], 0.6), x0, y0, cell, 1);
      if (!g(i - 1, j)) px(c, r[3], x0, y0 + 1, 1, cell - 1);
      else if (seams) px(c, mix(r[2], r[1], 0.35), x0, y0 + 1, 1, cell - 1);
      if (!g(i, j + 1)) px(c, mix(r[1], r[0], 0.3), x0, y0 + cell - 1, cell, 1);
    }
}

/** Ramp index (1..4) for a cube on a lit sphere or dome, picked by its normal. */
export function shade(nx: number, ny: number, lx = -0.6, ly = -0.7) {
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  const l = Math.max(0, nx * lx + ny * ly + nz * 0.5);
  const k = l > 0.85 ? 4 : l > 0.55 ? 3 : l > 0.25 ? 2 : 1;
  return k;
}

/** Voxel disc (sun, moon, balloon): cubes inside a circle, each lit by its normal. */
export function voxBall(
  c: C,
  cx: number,
  cy: number,
  rad: number,
  cell: number,
  r: R5,
  d = Math.max(1, Math.round(cell / 2)),
) {
  const n = Math.ceil(rad / cell);
  const cols = n * 2;
  const tones = r.map(
    (col, k) => [r[0], r[1], col, r[Math.min(4, k + 1)]!, r[4]] as R5,
  );
  vox(
    c,
    cx - n * cell,
    cy - n * cell,
    cols,
    cols,
    cell,
    (i, j) => {
      const nx = (i + 0.5 - n) / n;
      const ny = (j + 0.5 - n) / n;
      if (nx * nx + ny * ny > 1) return null;
      return tones[shade(nx, ny)]!;
    },
    d,
  );
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

/**
 * A rod of cubes from (x, y) along angle `ang`, tapering from `w0` to `w1` px:
 * turbine blades, braces, anything thin that has to stay blocky while it turns.
 */
export function cubeChain(
  c: C,
  r: R5,
  x: number,
  y: number,
  ang: number,
  len: number,
  w0: number,
  w1 = w0,
) {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= len; i += Math.max(1, Math.round(w1 * 0.75))) {
    const w = Math.max(1, Math.round(w0 + ((w1 - w0) * i) / len));
    pts.push([
      Math.round(x + cos * i - w / 2),
      Math.round(y + sin * i - w / 2),
      w,
    ]);
  }
  // the receding faces of all cubes first, then the fronts on top
  for (const [bx, by, w] of pts) px(c, r[1], bx + 1, by - 1, w, w);
  for (const [bx, by, w] of pts) {
    px(c, r[2], bx, by, w, w);
    if (w > 1) {
      px(c, r[4], bx, by, w - 1, 1);
      px(c, mix(r[1], r[2], 0.4), bx + w - 1, by + 1, 1, w - 1);
    }
  }
}
