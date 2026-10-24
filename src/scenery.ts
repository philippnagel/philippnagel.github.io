import {
  type C,
  type Sprite,
  ball,
  bake,
  bayer,
  blit,
  cyl,
  glow,
  hash,
  line,
  mat,
  px,
  ramp,
  slab,
  vnoise,
} from "./gfx";
import { mix, rgb, type Pal } from "./palette";
import { ART_AHEAD, STATIONS } from "./walk";

export interface View {
  /** world x of the left screen edge */
  camX: number;
  W: number;
  H: number;
  /** y of the ground line */
  gy: number;
  t: number;
  /** text scale: 1 on large screens, 2 where art pixels are shown 1:1 */
  tk: number;
}

const cycle = (p: Pal, i: number) => [p.red, p.blue, p.green, p.yellow][i & 3]!;

/** Calls `fn(cell, screenX)` for each cell of width `cell` visible on a layer moving at `f` x camera speed. */
export function cells(
  v: View,
  f: number,
  cell: number,
  fn: (i: number, x: number) => void,
) {
  const o = v.camX * f;
  const i0 = Math.floor(o / cell) - 2;
  const i1 = Math.floor((o + v.W) / cell) + 1;
  for (let i = i0; i <= i1; i++) fn(i, Math.round(i * cell - o));
}

export const nearStation = (wx: number, d: number) =>
  STATIONS.some((s) => Math.abs(s + ART_AHEAD - wx) < d);

/* ---------- baked sprite sets, one per time of day ---------- */

interface Set {
  trees: Sprite[];
  pylon: Sprite;
  clouds: Sprite[];
  decor: Sprite[];
  tufts: Sprite[];
  lamp: Sprite;
  sky?: { key: string; cv: HTMLCanvasElement };
  tiles?: { key: string; grass: HTMLCanvasElement; path: HTMLCanvasElement };
}
const sets = new WeakMap<Pal, Set>();

function oak(p: Pal, size: number, seed: number): Sprite {
  const g = ramp(mix(mat(p, p.green)[2]!, p.hill, 0.25));
  const trunk = mat(p, "#8a5a36");
  return bake(-size, -size * 2, size, 4, (c) => {
    slab(c, -3, -size * 0.7, 6, size * 0.7 + 3, trunk);
    const blobs = [
      [0, -size * 1.35, size * 0.62],
      [-size * 0.5, -size * 1.0, size * 0.5],
      [size * 0.5, -size * 1.05, size * 0.5],
      [-size * 0.15, -size * 1.65, size * 0.46],
      [size * 0.3, -size * 1.5, size * 0.4],
    ];
    blobs.forEach(([x, y, r], i) =>
      ball(
        c,
        Math.round(x! + (hash(seed + i) - 0.5) * 4),
        Math.round(y!),
        Math.round(r!),
        g,
      ),
    );
  });
}

function pine(p: Pal, size: number): Sprite {
  const g = ramp(mix(mat(p, "#2f7d43")[2]!, p.hill, 0.2));
  const trunk = mat(p, "#6e4a2c");
  return bake(-size, -size * 2.4, size, 4, (c) => {
    slab(c, -2, -size * 0.45, 4, size * 0.45 + 3, trunk);
    for (let k = 0; k < 4; k++) {
      const top = -size * 2.3 + k * size * 0.5;
      const half = Math.round(size * (0.38 + k * 0.17));
      for (let r = 0; r < size * 0.8; r++) {
        const w = Math.round((r / (size * 0.8)) * half);
        const y = top + r;
        px(c, g[2], -w, y, w * 2 + 1, 1);
        px(c, g[3], -w, y, Math.max(1, Math.round(w * 0.5)), 1);
        px(
          c,
          g[1],
          Math.round(w * 0.45),
          y,
          Math.max(1, Math.round(w * 0.55)) + 1,
          1,
        );
        if (r > size * 0.7) px(c, g[1], -w, y, w * 2 + 1, 1);
      }
    }
  });
}

function bush(p: Pal, w: number): Sprite {
  const g = ramp(mat(p, "#3f9d3c")[2]!);
  return bake(-w, -w, w, 3, (c) => {
    ball(c, -w * 0.4, -w * 0.45, Math.round(w * 0.45), g);
    ball(c, w * 0.35, -w * 0.4, Math.round(w * 0.42), g);
    ball(c, 0, -w * 0.62, Math.round(w * 0.5), g);
  });
}

function pylonSprite(p: Pal): Sprite {
  const m = mat(p, "#8d97a8", 0.2);
  const col = mix(m[2], p.hill, 0.35);
  return bake(-26, -150, 26, 2, (c) => {
    line(c, col, -16, 0, -3, -138, 2);
    line(c, col, 16, 0, 3, -138, 2);
    for (let y = -10; y > -132; y -= 20) {
      const k = (y + 138) / 138;
      const hw = 3 + 13 * (1 - k) * 1.0;
      line(c, col, -hw, y, hw - 4 * k, y - 20, 1);
      line(c, col, hw, y, -hw + 4 * k, y - 20, 1);
      px(c, col, -hw, y, hw * 2 + 1, 1);
    }
    px(c, col, -24, -138, 49, 3);
    px(c, col, -16, -112, 33, 3);
    px(c, col, -9, -88, 19, 2);
    for (const x of [-22, 22, -14, 14])
      px(c, mat(p, "#e8dcc0")[3], x - 1, x < -18 || x > 18 ? -134 : -108, 3, 6);
  });
}

function cloudSprite(p: Pal, seed: number): Sprite {
  const r: [string, string, string, string, string] = p.night
    ? ["#16205a", "#26327a", "#3a4694", "#5360a6", "#6c78b8"]
    : ["#9fb9d6", "#c4d8ec", "#e6f1fa", "#ffffff", "#ffffff"];
  const w = 70 + Math.floor(hash(seed) * 60);
  return bake(
    -w,
    -34,
    w,
    20,
    (c) => {
      const n = 5 + Math.floor(hash(seed + 1) * 3);
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n;
        const x = Math.round((u - 0.5) * 2 * w * 0.8);
        const lift = Math.sin(u * Math.PI);
        const rad = Math.round(11 + lift * 12 + hash(seed + 10 + i) * 5);
        ball(
          c,
          x,
          Math.round(-lift * 12 - hash(seed + 20 + i) * 4),
          rad,
          r,
          Math.round(rad * 1.5),
          -0.3,
          -0.85,
        );
      }
      // flat base
      c.clearRect(-w - 1, 6, w * 2 + 2, 40);
    },
    false,
  );
}

function flower(p: Pal, seed: number): Sprite {
  const petal = [p.red, p.blue, p.yellow, "#f4f4f4", "#e56fb0"][seed % 5]!;
  const stem = mat(p, "#3d8a35");
  return bake(-10, -22, 10, 2, (c) => {
    for (let k = 0; k < 3; k++) {
      const x = (k - 1) * 6 + Math.round((hash(seed + k) - 0.5) * 3);
      const h = 8 + Math.floor(hash(seed * 3 + k) * 9);
      px(c, stem[1], x, -h, 1, h);
      px(c, stem[3], x - 2, -h * 0.5, 2, 1);
      const pc = mat(p, petal, 0.2);
      px(c, pc[3], x - 2, -h - 2, 5, 3);
      px(c, pc[2], x - 1, -h - 3, 3, 5);
      px(c, p.yellow, x, -h - 1, 1, 1);
    }
  });
}

function rock(p: Pal, seed: number): Sprite {
  const m = mat(p, "#8d949f", 0.2);
  const w = 8 + (seed % 3) * 4;
  return bake(-w, -w, w, 2, (c) => {
    ball(c, 0, -Math.round(w * 0.45), Math.round(w * 0.5), m, w);
  });
}

function lampPost(p: Pal): Sprite {
  const m = mat(p, "#4a5368", 0.1);
  return bake(-12, -66, 12, 2, (c) => {
    slab(c, -2, -60, 4, 62, m);
    slab(c, -6, 0 - 6, 12, 6, m);
    px(c, m[2], -2, -62, 14, 3);
    px(c, p.glow, 7, -59, 5, 4);
    px(c, "#fffbe0", 8, -58, 3, 2);
  });
}

function buildSet(p: Pal): Set {
  return {
    trees: [
      oak(p, 26, 1),
      oak(p, 34, 7),
      pine(p, 24),
      pine(p, 32),
      bush(p, 18),
    ],
    pylon: pylonSprite(p),
    clouds: [cloudSprite(p, 3), cloudSprite(p, 11), cloudSprite(p, 29)],
    decor: [
      flower(p, 0),
      flower(p, 1),
      flower(p, 2),
      flower(p, 3),
      flower(p, 4),
      bush(p, 14),
      rock(p, 0),
      rock(p, 1),
    ],
    tufts: [0, 1, 2, 3].map((i) => tuft(p, i)),
    lamp: lampPost(p),
  };
}

function tuft(p: Pal, seed: number): Sprite {
  const col = p.fg;
  return bake(
    -24,
    -42,
    24,
    8,
    (c) => {
      for (let k = 0; k < 9; k++) {
        const x = (k - 4) * 5 + Math.round((hash(seed * 9 + k) - 0.5) * 4);
        const h = 14 + Math.floor(hash(seed * 31 + k) * 26);
        const lean = Math.round((hash(seed * 17 + k) - 0.5) * 8);
        for (let y = 0; y < h; y++)
          px(
            c,
            col,
            x + Math.round((lean * y) / h),
            -y,
            Math.max(1, 3 - Math.floor((y * 3) / h)),
            1,
          );
      }
    },
    false,
  );
}

export const setFor = (p: Pal): Set => {
  let s = sets.get(p);
  if (!s) sets.set(p, (s = buildSet(p)));
  return s;
};

/* ---------- sky ---------- */

function gradient(stops: string[], t: number): [number, number, number] {
  const x = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(x);
  const a = rgb(stops[i]!);
  const b = rgb(stops[i + 1]!);
  const f = x - i;
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ];
}

/** Sky quantised to bands with ordered dithering between them. */
function skyBitmap(p: Pal, W: number, gy: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = gy;
  const c = cv.getContext("2d")!;
  const img = c.createImageData(W, gy);
  const bands = 22;
  for (let y = 0; y < gy; y++) {
    const u = (y / gy) * (bands - 1);
    const lo = Math.floor(u);
    const f = u - lo;
    const a = gradient(p.sky, lo / (bands - 1));
    const b = gradient(p.sky, Math.min(bands - 1, lo + 1) / (bands - 1));
    for (let x = 0; x < W; x++) {
      const q = bayer(x, y) < f ? b : a;
      const o = (y * W + x) * 4;
      img.data[o] = q[0];
      img.data[o + 1] = q[1];
      img.data[o + 2] = q[2];
      img.data[o + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  return cv;
}

function ring(c: C, col: string, x: number, y: number, r: number, a: number) {
  c.save();
  c.globalAlpha = a;
  c.fillStyle = col;
  c.beginPath();
  c.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export function drawSky(c: C, p: Pal, v: View) {
  const set = setFor(p);
  const key = `${v.W}x${v.gy}`;
  if (set.sky?.key !== key) set.sky = { key, cv: skyBitmap(p, v.W, v.gy) };
  c.drawImage(set.sky.cv, 0, 0);

  const sx = Math.round(v.W * 0.84 - v.camX * 0.02);
  const sy = Math.round(v.gy * 0.2);
  if (p.night) {
    for (let k = 9; k > 0; k--) ring(c, "#9fb0ff", sx, sy, 16 + k * 7, 0.035);
    ball(c, sx, sy, 17, ramp("#ece6c0"), 17, -0.4, -0.5);
    for (const [dx, dy, r] of [
      [-5, -3, 4],
      [4, 5, 3],
      [3, -7, 2],
      [-7, 6, 2],
    ] as const)
      ball(c, sx + dx, sy + dy, r, [
        "#8c8a78",
        "#aaa68e",
        "#bfbaa0",
        "#d4cfae",
        "#e6e0bd",
      ]);
    // stars
    cells(v, 0.08, 70, (i, x) => {
      for (let k = 0; k < 4; k++) {
        const h = hash(i * 31 + k);
        const tw = (v.t * 1.1 + h * 9) % 3;
        if (tw > 2.5) continue;
        const col =
          h > 0.86
            ? cycle(p, Math.floor(h * 90))
            : h > 0.5
              ? "#dfe6ff"
              : "#9ba9e0";
        const sxx = x + hash(i * 31 + k + 100) * 70;
        const syy = 6 + hash(i * 31 + k + 200) * (v.gy * 0.72);
        const big = h > 0.8;
        px(c, col, sxx, syy, big ? 2 : 1, big ? 2 : 1);
        if (big && tw < 1.2) {
          px(c, col, sxx - 2, syy, 6, 1);
          px(c, col, sxx, syy - 2, 1, 6);
        }
      }
    });
    // an occasional shooting star
    const ph = (v.t % 13) / 0.9;
    if (ph < 1) {
      const x0 = v.W * 0.25 + (Math.floor(v.t / 13) % 3) * 90;
      const x = x0 + ph * 80;
      const y = 30 + ph * 40;
      for (let k = 0; k < 14; k++)
        px(c, mix("#ffffff", "#223", k / 14), x - k * 1.4, y - k * 0.8, 2, 1);
    }
  } else {
    for (let k = 8; k > 0; k--) ring(c, "#fff4c0", sx, sy, 14 + k * 8, 0.05);
    ball(
      c,
      sx,
      sy,
      17,
      ["#f0a830", "#f7c948", "#ffe27a", "#fff2b0", "#ffffff"],
      17,
      -0.2,
      -0.3,
    );
    cells(v, 0.1, 190, (i, x) => {
      const h = hash(i + 700);
      const set2 = setFor(p).clouds[i & 1 ? 0 : Math.floor(h * 3)]!;
      const cx = x + h * 120 + ((v.t * 3) % 380);
      const wx = ((cx + 200) % (v.W + 400)) - 200;
      blit(c, set2, wx, 24 + hash(i + 800) * v.gy * 0.4);
    });
  }
  if (p.night)
    cells(v, 0.1, 260, (i, x) => {
      const h = hash(i + 700);
      if (h < 0.4) return;
      const cx = x + h * 120 + ((v.t * 2) % 520);
      const wx = ((cx + 200) % (v.W + 400)) - 200;
      blit(
        c,
        setFor(p).clouds[Math.floor(h * 3) % 3]!,
        wx,
        40 + hash(i + 800) * v.gy * 0.35,
      );
    });
}

/* ---------- far layers ---------- */

function ridge(
  c: C,
  v: View,
  f: number,
  seed: number,
  amp: number,
  base: number,
  col: string,
  lit: string,
  dark: string,
) {
  const h = (x: number) => {
    const wx = x + v.camX * f;
    return (
      base +
      amp *
        (vnoise(wx / 110, seed) * 0.62 +
          vnoise(wx / 41, seed + 9) * 0.28 +
          vnoise(wx / 15, seed + 4) * 0.1)
    );
  };
  for (let x = 0; x < v.W; x++) {
    const hh = Math.round(h(x));
    px(c, col, x, v.gy - hh, 1, hh);
    const rock = Math.min(hh, 16 + Math.round(amp * 0.2));
    const slopeRight = h(x + 3) < h(x);
    px(
      c,
      slopeRight ? dark : lit,
      x,
      v.gy - hh,
      1,
      Math.round(rock * (slopeRight ? 0.8 : 0.55)),
    );
    px(c, lit, x, v.gy - hh, 1, 1);
  }
}

function turbineFar(
  c: C,
  col: string,
  x: number,
  gy: number,
  h: number,
  t: number,
  phase: number,
  len: number,
) {
  px(c, col, x - 1, gy - h, 3, h);
  for (let b = 0; b < 3; b++) {
    const a = t * 0.9 + phase + (b * Math.PI * 2) / 3;
    line(
      c,
      col,
      x,
      gy - h,
      x + Math.cos(a) * len,
      gy - h + Math.sin(a) * len,
      2,
    );
  }
  px(c, col, x - 2, gy - h - 2, 5, 5);
}

export function drawFar(c: C, p: Pal, v: View) {
  const horizon = p.sky[p.sky.length - 1]!;
  const r1 = mix(horizon, p.far, p.night ? 0.8 : 0.55);
  const r2 = mix(horizon, p.hill, p.night ? 0.7 : 0.6);
  ridge(
    c,
    v,
    0.08,
    3,
    80,
    36,
    r1,
    mix(r1, "#ffffff", p.night ? 0.08 : 0.35),
    mix(r1, "#1a2766", 0.18),
  );
  ridge(
    c,
    v,
    0.16,
    17,
    54,
    22,
    r2,
    mix(r2, "#ffffff", p.night ? 0.06 : 0.25),
    mix(r2, "#1a2766", 0.22),
  );
  const turb = mix(r2, p.white, p.night ? 0.2 : 0.55);
  cells(v, 0.16, 300, (i, x) => {
    if (hash(i + 77) > 0.7) return;
    turbineFar(c, turb, x + 60, v.gy - 18, 84, v.t, hash(i) * 6, 26);
  });
  skyline(c, p, v);
  const hillCol = mix(p.hill, p.ground, p.night ? 0.3 : 0.4);
  ridge(
    c,
    v,
    0.34,
    41,
    30,
    10,
    hillCol,
    mix(hillCol, "#ffffff", p.night ? 0.07 : 0.22),
    mix(hillCol, "#0b1a3a", 0.22),
  );
}

function skyline(c: C, p: Pal, v: View) {
  const m = mat(p, p.night ? "#2a3a7a" : "#9fb8d0", 0);
  const body = mix(m[2], p.sky[p.sky.length - 1]!, 0.35);
  const lit = mix(body, "#ffffff", p.night ? 0.06 : 0.25);
  const dark = mix(body, "#1a2766", 0.22);
  cells(v, 0.26, 52, (i, x) => {
    const h = 24 + Math.floor(hash(i + 5) * 70);
    const w = 28 + Math.floor(hash(i + 9) * 18);
    const y0 = v.gy - h - 6;
    px(c, body, x, y0, w, h + 6);
    px(c, lit, x, y0, w, 2);
    px(c, lit, x, y0, 2, h + 6);
    px(c, dark, x + w - 5, y0, 5, h + 6);
    if (hash(i + 13) > 0.6) {
      px(c, body, x + (w >> 1) - 1, y0 - 12, 3, 12);
      px(c, p.red, x + (w >> 1) - 1, y0 - 13, 3, 2);
    } else if (hash(i + 14) > 0.7) {
      px(c, dark, x + 4, y0 - 8, w - 12, 8);
    }
    for (let ry = 6; ry < h; ry += 9)
      for (let rx = 5; rx < w - 8; rx += 7) {
        const on = hash(i * 131 + ry * 7 + rx) > 0.5;
        if (p.night) px(c, on ? p.glow : dark, x + rx, y0 + ry, 3, 4);
        else
          px(
            c,
            on ? mix(body, "#ffffff", 0.4) : mix(body, "#1a2766", 0.1),
            x + rx,
            y0 + ry,
            3,
            4,
          );
      }
  });
}

/* ---------- mid layer: trees and pylons ---------- */

export function drawMid(c: C, p: Pal, v: View) {
  const set = setFor(p);
  const hazeCol = p.sky[p.sky.length - 1]!;
  cells(v, 0.55, 86, (i, x) => {
    const r = hash(i + 50);
    if (r > 0.72) return;
    blit(c, set.trees[Math.floor(r * 40) % 5]!, x + r * 50, v.gy - 2);
  });
  // faint haze over the distance
  c.save();
  c.globalAlpha = 0.12;
  c.fillStyle = hazeCol;
  c.fillRect(0, v.gy - 90, v.W, 90);
  c.restore();

  const wireCol = mix(mat(p, "#8d97a8", 0.2)[2], p.hill, 0.35);
  const nearArt = (x: number) =>
    STATIONS.some((st) => Math.abs(x - (st + ART_AHEAD - v.camX)) < 250);
  cells(v, 0.55, 420, (i, x) => {
    if (nearArt(x) || nearArt(x + 420)) return;
    blit(c, set.pylon, x, v.gy);
    const next = x + 420;
    for (const [dx, dy] of [
      [-22, -134],
      [22, -134],
      [-14, -109],
      [14, -109],
    ] as const) {
      const pts: [number, number][] = [];
      for (let s = 0; s <= 420; s += 6) {
        const u = s / 420;
        pts.push([x + dx + s, v.gy + dy + 30 * 4 * u * (1 - u)]);
      }
      for (let k = 1; k < pts.length; k++)
        line(
          c,
          wireCol,
          pts[k - 1]![0],
          pts[k - 1]![1],
          pts[k]![0],
          pts[k]![1],
          1,
        );
      if (dx === -22 && dy === -134) {
        const q =
          pts[Math.floor(((v.t * 0.18 + hash(i) * 3) % 1) * (pts.length - 1))]!;
        px(c, p.yellow, q[0] - 2, q[1] - 2, 5, 5);
        px(c, "#fff6c0", q[0] - 1, q[1] - 1, 3, 3);
      }
    }
    void next;
  });
}

/* ---------- ground ---------- */

function groundTiles(p: Pal, h: number) {
  const g = document.createElement("canvas");
  g.width = 256;
  g.height = h;
  const gc = g.getContext("2d")!;
  const img = gc.createImageData(256, h);
  const base = rgb(p.ground);
  const dark = rgb(p.grass2);
  const light = rgb(p.dot);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < 256; x++) {
      const n = hash(x * 131 + y * 17);
      const fade = 1 - (y / h) * 0.28;
      let col = base;
      if (n < 0.1) col = dark;
      else if (n > 0.94) col = light;
      else if (hash((x >> 1) * 73 + (y >> 1) * 29) < 0.08) col = dark;
      const o = (y * 256 + x) * 4;
      img.data[o] = col[0] * fade;
      img.data[o + 1] = col[1] * fade;
      img.data[o + 2] = col[2] * fade;
      img.data[o + 3] = 255;
    }
  gc.putImageData(img, 0, 0);
  // blade strokes
  for (let k = 0; k < 90; k++) {
    const x = Math.floor(hash(k * 7) * 250);
    const y = 6 + Math.floor(hash(k * 13) * (h - 12));
    px(gc, p.dot, x, y, 1, 3);
    px(gc, p.dot, x + 1, y - 1, 1, 2);
    px(gc, p.grass2, x + 2, y + 1, 1, 2);
  }
  // lit rim along the horizon edge
  px(gc, p.dot, 0, 0, 256, 2);
  px(gc, p.line, 0, 2, 256, 1);

  const pa = document.createElement("canvas");
  pa.width = 192;
  pa.height = 26;
  const pc = pa.getContext("2d")!;
  const pbase = p.path;
  px(pc, mix(pbase, p.ground, 0.5), 0, 0, 192, 26);
  px(pc, mix(pbase, "#ffffff", 0.2), 0, 2, 192, 3);
  px(pc, pbase, 0, 5, 192, 17);
  px(pc, mix(pbase, "#1a2766", 0.22), 0, 22, 192, 3);
  for (let k = 0; k < 120; k++) {
    const x = Math.floor(hash(k * 5 + 1) * 190);
    const y = 6 + Math.floor(hash(k * 11 + 3) * 15);
    const lit = hash(k * 19) > 0.5;
    px(
      pc,
      lit ? mix(pbase, "#ffffff", 0.3) : mix(pbase, "#1a2766", 0.25),
      x,
      y,
      1 + (k & 1),
      1,
    );
  }
  for (let k = 0; k < 7; k++) {
    const x = Math.floor(hash(k * 41 + 5) * 184);
    const y = 8 + Math.floor(hash(k * 43 + 2) * 11);
    px(pc, mix(pbase, "#1a2766", 0.35), x + 1, y + 1, 4, 3);
    px(pc, mix(pbase, "#ffffff", 0.35), x, y, 4, 2);
  }
  for (const y of [9, 17])
    for (let x = 0; x < 192; x += 3)
      if (hash(x * 3 + y) > 0.2)
        px(pc, mix(pbase, "#1a2766", 0.12), x, y, 3, 1);
  return { grass: g, path: pa };
}

export function drawGround(c: C, p: Pal, v: View) {
  const set = setFor(p);
  const h = v.H - v.gy;
  const key = `${h}`;
  if (set.tiles?.key !== key) set.tiles = { key, ...groundTiles(p, h) };
  const gx = -(((Math.floor(v.camX) % 256) + 256) % 256);
  for (let x = gx; x < v.W; x += 256) c.drawImage(set.tiles.grass, x, v.gy);
  const px0 = -(((Math.floor(v.camX) % 192) + 192) % 192);
  for (let x = px0; x < v.W; x += 192) c.drawImage(set.tiles.path, x, v.gy + 6);

  cells(v, 1, 110, (i, x) => {
    const r = hash(i + 900);
    const wx = i * 110 + r * 70;
    if (r < 0.1 || nearStation(wx, 260)) return;
    const sx = x + r * 70;
    const k = Math.floor(r * 100) % set.decor.length;
    const onPath = hash(i + 3) > 0.5;
    blit(
      c,
      set.decor[k]!,
      sx,
      v.gy + (onPath ? 36 + ((r * 40) % 26) : 2 + ((r * 90) % 4)),
    );
    if (r > 0.82)
      blit(c, set.trees[Math.floor(r * 77) % 4]!, sx + 40, v.gy + 4);
  });

  if (p.night) {
    for (let k = 0; k < 16; k++) {
      const bx =
        (hash(k) * (v.W + 200) -
          100 +
          v.camX * -0.02 +
          Math.sin(v.t * 0.6 + k) * 22 +
          v.W) %
        (v.W + 100);
      const by =
        v.gy - 10 + hash(k + 40) * 80 + Math.sin(v.t * 0.9 + k * 2) * 8;
      const on = (Math.sin(v.t * 2 + k * 3.1) + 1) / 2;
      glow(c, p, bx, by, 9, "#d8ff7a", 0.05 + on * 0.06);
      px(c, mix("#7a8a30", "#e8ff9a", on), bx - 1, by - 1, 2, 2);
    }
  }
}

export function drawForeground(c: C, p: Pal, v: View) {
  const set = setFor(p);
  cells(v, 1.6, 150, (i, x) => {
    const r = hash(i + 1300);
    blit(c, set.tufts[Math.floor(r * 4)]!, x + r * 90, v.H + 2);
    if (r > 0.86) blit(c, set.tufts[(i + 2) & 3]!, x + 60 + r * 40, v.H + 2);
  });
}

/** A lamp post whose light pools at night. */
export function drawLamp(c: C, p: Pal, x: number, gy: number) {
  blit(c, setFor(p).lamp, x, gy);
  glow(c, p, x + 9, gy - 56, 36);
  glow(c, p, x + 9, gy - 20, 30, p.glow, 0.03);
}
