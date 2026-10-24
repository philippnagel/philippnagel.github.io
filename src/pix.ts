/** Pixel painter: every call lands on whole art pixels of a 1:1 canvas. */
import type { Ramp } from "./palette";

// 5x7 bitmap font, upper-case only. Each glyph is 7 rows of 5 bits.
const F: Record<string, string> = {
  A: "01110 10001 10001 11111 10001 10001 10001",
  B: "11110 10001 10001 11110 10001 10001 11110",
  C: "01110 10001 10000 10000 10000 10001 01110",
  D: "11100 10010 10001 10001 10001 10010 11100",
  E: "11111 10000 10000 11110 10000 10000 11111",
  F: "11111 10000 10000 11110 10000 10000 10000",
  G: "01110 10001 10000 10111 10001 10001 01111",
  H: "10001 10001 10001 11111 10001 10001 10001",
  I: "01110 00100 00100 00100 00100 00100 01110",
  J: "00111 00010 00010 00010 00010 10010 01100",
  K: "10001 10010 10100 11000 10100 10010 10001",
  L: "10000 10000 10000 10000 10000 10000 11111",
  M: "10001 11011 10101 10101 10001 10001 10001",
  N: "10001 11001 10101 10011 10001 10001 10001",
  O: "01110 10001 10001 10001 10001 10001 01110",
  P: "11110 10001 10001 11110 10000 10000 10000",
  Q: "01110 10001 10001 10001 10101 10010 01101",
  R: "11110 10001 10001 11110 10100 10010 10001",
  S: "01111 10000 10000 01110 00001 00001 11110",
  T: "11111 00100 00100 00100 00100 00100 00100",
  U: "10001 10001 10001 10001 10001 10001 01110",
  V: "10001 10001 10001 10001 10001 01010 00100",
  W: "10001 10001 10001 10101 10101 11011 10001",
  X: "10001 10001 01010 00100 01010 10001 10001",
  Y: "10001 10001 01010 00100 00100 00100 00100",
  Z: "11111 00001 00010 00100 01000 10000 11111",
  "0": "01110 10001 10011 10101 11001 10001 01110",
  "1": "00100 01100 00100 00100 00100 00100 01110",
  "2": "01110 10001 00001 00010 00100 01000 11111",
  "3": "11110 00001 00001 01110 00001 00001 11110",
  "4": "00010 00110 01010 10010 11111 00010 00010",
  "5": "11111 10000 11110 00001 00001 10001 01110",
  "6": "00110 01000 10000 11110 10001 10001 01110",
  "7": "11111 00001 00010 00100 01000 01000 01000",
  "8": "01110 10001 10001 01110 10001 10001 01110",
  "9": "01110 10001 10001 01111 00001 00010 01100",
  ".": "00000 00000 00000 00000 00000 01100 01100",
  ",": "00000 00000 00000 00000 01100 00100 01000",
  ":": "00000 01100 01100 00000 01100 01100 00000",
  "-": "00000 00000 00000 11111 00000 00000 00000",
  "+": "00000 00100 00100 11111 00100 00100 00000",
  "/": "00001 00001 00010 00100 01000 10000 10000",
  "(": "00010 00100 01000 01000 01000 00100 00010",
  ")": "01000 00100 00010 00010 00010 00100 01000",
  "'": "00100 00100 01000 00000 00000 00000 00000",
  "%": "11001 11010 00010 00100 01000 01011 10011",
  ">": "10000 01000 00100 00010 00100 01000 10000",
  "<": "00001 00010 00100 01000 00100 00010 00001",
  "=": "00000 00000 11111 00000 11111 00000 00000",
  "*": "00000 10101 01110 11111 01110 10101 00000",
  "&": "01100 10010 10100 01000 10101 10010 01101",
  "?": "01110 10001 00001 00110 00100 00000 00100",
  "!": "00100 00100 00100 00100 00100 00000 00100",
  "#": "01010 01010 11111 01010 11111 01010 01010",
  _: "00000 00000 00000 00000 00000 00000 11111",
  " ": "00000 00000 00000 00000 00000 00000 00000",
};

export const GLYPH_W = 6;
export const GLYPH_H = 7;
export const textWidth = (s: string) => Math.max(0, s.length * GLYPH_W - 1);
export const hasGlyph = (ch: string) => ch.toUpperCase() in F;

const GLYPHS = new Map<string, string[]>(
  Object.entries(F).map(([k, v]) => [k, v.split(" ")]),
);

/** 4x4 Bayer thresholds for ordered dithering. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export class Pix {
  constructor(readonly ctx: CanvasRenderingContext2D) {}

  r(x: number, y: number, w: number, h: number, c: string) {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  p(x: number, y: number, c: string) {
    this.r(x, y, 1, 1, c);
  }

  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0),
      dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1,
      sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.p(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  box(x: number, y: number, w: number, h: number, c: string) {
    this.r(x, y, w, 1, c);
    this.r(x, y + h - 1, w, 1, c);
    this.r(x, y, 1, h, c);
    this.r(x + w - 1, y, 1, h, c);
  }

  /** Filled ellipse. */
  ell(cx: number, cy: number, rx: number, ry: number, c: string) {
    for (let y = -ry; y <= ry; y++) {
      const half = Math.round(
        rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.0001))),
      );
      this.r(cx - half, cy + y, half * 2 + 1, 1, c);
    }
  }

  disc(cx: number, cy: number, rad: number, c: string) {
    this.ell(cx, cy, rad, rad, c);
  }

  /** Convex or concave polygon via scanline (even-odd). */
  poly(pts: [number, number][], c: string) {
    const ys = pts.map((p) => p[1]);
    const y0 = Math.floor(Math.min(...ys));
    const y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i]!;
        const [bx, by] = pts[(i + 1) % pts.length]!;
        if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5))
          xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2)
        this.r(
          Math.round(xs[i]!),
          y,
          Math.max(1, Math.round(xs[i + 1]!) - Math.round(xs[i]!)),
          1,
          c,
        );
    }
  }

  /** Rectangle shaded from a ramp: dark outline, lit top/left, shadowed bottom/right. */
  slab(x: number, y: number, w: number, h: number, R: Ramp) {
    this.r(x, y, w, h, R[0]);
    this.r(x + 1, y + 1, w - 2, h - 2, R[2]);
    this.r(x + 1, y + 1, w - 2, 1, R[3]);
    this.r(x + 1, y + 1, 1, h - 2, R[3]);
    this.r(x + 1, y + h - 2, w - 2, 1, R[1]);
    this.r(x + w - 2, y + 1, 1, h - 2, R[1]);
  }

  /** Vertical cylinder (columns shade left to right). */
  cylV(x: number, y: number, w: number, h: number, R: Ramp) {
    this.r(x, y, w, h, R[0]);
    const iw = w - 2;
    for (let i = 0; i < iw; i++) {
      const t = iw <= 1 ? 0.3 : i / (iw - 1);
      const tone =
        t < 0.18 ? 3 : t < 0.32 ? 4 : t < 0.55 ? 3 : t < 0.78 ? 2 : 1;
      this.r(x + 1 + i, y + 1, 1, h - 2, R[tone]!);
    }
  }

  /** Horizontal cylinder (rows shade top to bottom). */
  cylH(x: number, y: number, w: number, h: number, R: Ramp) {
    this.r(x, y, w, h, R[0]);
    const ih = h - 2;
    for (let i = 0; i < ih; i++) {
      const t = ih <= 1 ? 0.3 : i / (ih - 1);
      const tone =
        t < 0.18 ? 3 : t < 0.32 ? 4 : t < 0.55 ? 3 : t < 0.78 ? 2 : 1;
      this.r(x + 1, y + 1 + i, w - 2, 1, R[tone]!);
    }
  }

  /** Shaded sphere lit from the upper left. */
  ball(cx: number, cy: number, rad: number, R: Ramp) {
    this.disc(cx, cy, rad, R[0]);
    this.disc(cx, cy, rad - 1, R[1]);
    this.ell(cx - 1, cy - 1, Math.max(1, rad - 2), Math.max(1, rad - 2), R[2]);
    this.ell(
      cx - Math.round(rad * 0.3),
      cy - Math.round(rad * 0.3),
      Math.max(1, Math.round(rad * 0.45)),
      Math.max(1, Math.round(rad * 0.45)),
      R[3],
    );
    this.p(cx - Math.round(rad * 0.4), cy - Math.round(rad * 0.4), R[4]);
  }

  /** Vertical banded gradient with dithered transitions. */
  gradV(x: number, y: number, w: number, h: number, cols: string[]) {
    const n = cols.length;
    const band = h / n;
    for (let j = 0; j < h; j++) {
      const f = j / band;
      const i = Math.min(n - 1, Math.floor(f));
      const frac = f - i;
      for (let k = 0; k < w; k++) {
        const next =
          i + 1 < n &&
          frac > 0.7 &&
          BAYER[(j & 3) * 4 + (k & 3)]! / 16 < (frac - 0.7) / 0.3
            ? i + 1
            : i;
        this.p(x + k, y + j, cols[next]!);
      }
    }
  }

  /** Ordered-dither fill: `density` 0..1 of pixels painted. */
  dither(
    x: number,
    y: number,
    w: number,
    h: number,
    c: string,
    density: number,
  ) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++)
        if (BAYER[((y + j) & 3) * 4 + ((x + i) & 3)]! / 16 < density)
          this.p(x + i, y + j, c);
  }

  /** Dithered ground shadow. */
  shadow(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    c: string,
    density = 0.55,
  ) {
    for (let y = -ry; y <= ry; y++) {
      const half = Math.round(
        rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.0001))),
      );
      this.dither(cx - half, cy + y, half * 2 + 1, 1, c, density);
    }
  }

  text(x: number, y: number, s: string, c: string, scale = 1) {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      const g = GLYPHS.get(ch) ?? GLYPHS.get("?")!;
      for (let j = 0; j < 7; j++)
        for (let i = 0; i < 5; i++)
          if (g[j]![i] === "1")
            this.r(cx + i * scale, y + j * scale, scale, scale, c);
      cx += GLYPH_W * scale;
    }
  }

  /** Text with a hard drop shadow for legibility on busy backgrounds. */
  textS(x: number, y: number, s: string, c: string, shadow: string, scale = 1) {
    this.text(x + scale, y + scale, s, shadow, scale);
    this.text(x, y, s, c, scale);
  }

  textC(cx: number, y: number, s: string, c: string, scale = 1) {
    this.text(Math.round(cx - (textWidth(s) * scale) / 2), y, s, c, scale);
  }

  textCS(
    cx: number,
    y: number,
    s: string,
    c: string,
    shadow: string,
    scale = 1,
  ) {
    this.textS(
      Math.round(cx - (textWidth(s) * scale) / 2),
      y,
      s,
      c,
      shadow,
      scale,
    );
  }
}

/** Points of a sagging wire from (x0,y0) to (x1,y1); `sag` is the extra drop in the middle. */
export function sagPts(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  sag: number,
): [number, number][] {
  const n = Math.max(2, Math.abs(Math.round(x1 - x0)));
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([
      Math.round(x0 + (x1 - x0) * t),
      Math.round(y0 + (y1 - y0) * t + sag * 4 * t * (1 - t)),
    ]);
  }
  return out;
}

/** Expands corner points into a pixel-by-pixel polyline. */
export function polyPts(corners: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 1; i < corners.length; i++) {
    const [ax, ay] = corners[i - 1]!;
    const [bx, by] = corners[i]!;
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let k = 0; k < n; k++)
      out.push([
        ax + Math.round(((bx - ax) * k) / n),
        ay + Math.round(((by - ay) * k) / n),
      ]);
  }
  out.push(corners[corners.length - 1]!);
  return out;
}

/** Axis-aligned route with right angles: vertical, horizontal at midY, vertical. */
export function routePts(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): [number, number][] {
  const my = Math.round((y0 + y1) / 2);
  return polyPts([
    [x0, y0],
    [x0, my],
    [x1, my],
    [x1, y1],
  ]);
}

/** Deterministic RNG for scenery. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
