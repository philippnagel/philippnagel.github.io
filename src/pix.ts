/** Tiny pixel painter: every call lands on whole art pixels of a 1:1 canvas. */

// 3x5 bitmap font, upper-case only. Each glyph is 5 rows of 3 bits.
const G: Record<string, string> = {
  A: "010101111101101",
  B: "110101110101110",
  C: "011100100100011",
  D: "110101101101110",
  E: "111100110100111",
  F: "111100110100100",
  G: "011100101101011",
  H: "101101111101101",
  I: "111010010010111",
  J: "001001001101010",
  K: "101101110101101",
  L: "100100100100111",
  M: "101111111101101",
  N: "110101101101101",
  O: "010101101101010",
  P: "110101110100100",
  Q: "010101101111011",
  R: "110101110101101",
  S: "011100010001110",
  T: "111010010010010",
  U: "101101101101111",
  V: "101101101101010",
  W: "101101111111101",
  X: "101101010101101",
  Y: "101101010010010",
  Z: "111001010100111",
  "0": "111101101101111",
  "1": "010110010010111",
  "2": "110001010100111",
  "3": "110001010001110",
  "4": "101101111001001",
  "5": "111100110001110",
  "6": "011100111101111",
  "7": "111001010010010",
  "8": "111101111101111",
  "9": "111101111001110",
  ".": "000000000000010",
  ",": "000000000010100",
  ":": "000010000010000",
  "-": "000000111000000",
  "+": "000010111010000",
  "/": "001001010100100",
  "(": "010100100100010",
  ")": "010001001001010",
  "'": "010010000000000",
  "%": "101001010100101",
  ">": "100010001010100",
  "<": "001010100010001",
  "=": "000111000111000",
  "*": "000101010101000",
  "&": "010101010101011",
  "?": "110001010000010",
  "!": "010010010000010",
  "#": "101111101111101",
  _: "000000000000111",
  " ": "000000000000000",
};

export const GLYPH_W = 4;
export const textWidth = (s: string) => Math.max(0, s.length * GLYPH_W - 1);
export const hasGlyph = (ch: string) => ch.toUpperCase() in G;

export class Pix {
  constructor(readonly ctx: CanvasRenderingContext2D) {}

  r(x: number, y: number, w: number, h: number, c: string) {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  p(x: number, y: number, c: string) {
    this.r(x, y, 1, 1, c);
  }

  /** Bresenham line, 1px wide. */
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

  /** Filled pixel disc. */
  disc(cx: number, cy: number, rad: number, c: string) {
    for (let y = -rad; y <= rad; y++)
      for (let x = -rad; x <= rad; x++)
        if (x * x + y * y <= rad * rad + rad * 0.6) this.p(cx + x, cy + y, c);
  }

  /** 1px frame. */
  box(x: number, y: number, w: number, h: number, c: string) {
    this.r(x, y, w, 1, c);
    this.r(x, y + h - 1, w, 1, c);
    this.r(x, y, 1, h, c);
    this.r(x + w - 1, y, 1, h, c);
  }

  /** Filled rectangle with outline. */
  fill(x: number, y: number, w: number, h: number, c: string, o: string) {
    this.r(x, y, w, h, o);
    this.r(x + 1, y + 1, w - 2, h - 2, c);
  }

  /** Checkerboard dither between two colours. */
  dither(x: number, y: number, w: number, h: number, a: string, b: string) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) this.p(x + i, y + j, (i + j) % 2 ? a : b);
  }

  text(x: number, y: number, s: string, c: string, scale = 1) {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      const g = G[ch] ?? G["?"]!;
      for (let i = 0; i < 15; i++)
        if (g[i] === "1")
          this.r(
            cx + (i % 3) * scale,
            y + ((i / 3) | 0) * scale,
            scale,
            scale,
            c,
          );
      cx += GLYPH_W * scale;
    }
  }

  /** Text centred on x. */
  textC(cx: number, y: number, s: string, c: string) {
    this.text(Math.round(cx - textWidth(s) / 2), y, s, c);
  }

  /** Sprite from character rows; '.' is transparent. */
  spr(x: number, y: number, rows: string[], map: Record<string, string>) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const col = map[row[i]!];
        if (col) this.p(x + i, y + j, col);
      }
    });
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
  const out: [number, number][] = [];
  const seg = (ax: number, ay: number, bx: number, by: number) => {
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let i = 0; i < n; i++)
      out.push([
        ax + Math.sign(bx - ax) * Math.min(i, Math.abs(bx - ax)),
        ay + Math.sign(by - ay) * Math.min(i, Math.abs(by - ay)),
      ]);
  };
  seg(x0, y0, x0, my);
  seg(x0, my, x1, my);
  seg(x1, my, x1, y1);
  out.push([x1, y1]);
  return out;
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
