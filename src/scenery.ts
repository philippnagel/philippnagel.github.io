import {
  type C,
  type R5,
  type Sprite,
  bake,
  blit,
  block,
  cubeChain,
  glow,
  hash,
  line,
  mat,
  px,
  ramp,
  shade,
  vnoise,
  vox,
  voxBall,
} from "@philippnagel/design/gfx";
import { mix, rgb, type Pal } from "@philippnagel/design/palette";
import { drawBird } from "./skylife";
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
  sun: Sprite;
  moon: Sprite;
  /** six wires between two pylons, by span in px */
  wires: Map<number, Sprite>;
  sky?: { key: string; cv: HTMLCanvasElement };
  tiles?: { key: string; grass: HTMLCanvasElement; path: HTMLCanvasElement };
}
const sets = new WeakMap<Pal, Set>();

/** Ramps for one green, from shadow to sunlit, so a voxel canopy can be lit cube by cube. */
const lit = (g: R5): R5[] =>
  [1, 1, 2, 3, 4].map((k) => [
    g[0],
    g[Math.max(0, k - 1)]!,
    g[k]!,
    g[Math.min(4, k + 1)]!,
    g[4],
  ]) as R5[];

/** A canopy of cubes: the union of `blobs` [x, y, r] (in cells), each cube lit by the canopy's normal. */
function canopy(
  c: C,
  g: R5,
  cell: number,
  blobs: number[][],
  cx: number,
  cy: number,
  seed: number,
) {
  const tones = lit(g);
  const n = 12;
  const R = Math.max(...blobs.map(([x, y, r]) => Math.hypot(x!, y!) + r!));
  vox(c, cx - n * cell, cy - n * cell, n * 2, n * 2, cell, (i, j) => {
    const x = i - n + 0.5;
    const y = j - n + 0.5;
    if (
      !blobs.some(([bx, by, r]) => (x - bx!) ** 2 + (y - by!) ** 2 <= r! * r!)
    )
      return null;
    const k = shade(
      Math.max(-0.95, Math.min(0.95, x / R)),
      Math.max(-0.95, Math.min(0.95, y / R)),
    );
    // a few leaves catch more or less light than their neighbours
    const jit = hash(seed * 977 + i * 31 + j * 7);
    return tones[
      Math.max(1, Math.min(4, k + (jit > 0.88 ? 1 : jit < 0.1 ? -1 : 0)))
    ];
  });
}

function oak(p: Pal, size: number, seed: number): Sprite {
  const g = ramp(mix(mat(p, p.green)[2]!, p.hill, 0.15));
  const trunk = mat(p, "#8a5a36");
  const cell = size > 30 ? 5 : 4;
  const u = size / cell;
  return bake(-size - 6, -size * 2.4, size + 8, 4, (c) => {
    block(c, -3, -size * 0.75, 6, size * 0.75 + 2, trunk, 3);
    block(c, -9, -size * 0.95, 6, 4, trunk, 2);
    canopy(
      c,
      g,
      cell,
      [
        [0, -0.2, u * 0.62],
        [-u * 0.5, u * 0.25, u * 0.48],
        [u * 0.5, u * 0.2, u * 0.5],
        [-u * 0.15, -u * 0.45, u * 0.46],
        [u * 0.3, -u * 0.3, u * 0.4],
      ],
      0,
      Math.round(-size * 1.3),
      seed,
    );
  });
}

function pine(p: Pal, size: number): Sprite {
  const g = ramp(mix(mat(p, "#2f7d43")[2]!, p.hill, 0.15));
  const tones = lit(g);
  const trunk = mat(p, "#6e4a2c");
  const cell = 4;
  const rows = Math.round((size * 2.1) / cell);
  const cols = Math.round(size / cell) * 2 + 1;
  return bake(-size - 4, -size * 2.5 - 6, size + 8, 4, (c) => {
    block(c, -2, -size * 0.45, 4, size * 0.45 + 2, trunk, 2);
    const mid = (cols - 1) / 2;
    vox(
      c,
      -mid * cell - cell / 2,
      -size * 0.35 - rows * cell,
      cols,
      rows,
      cell,
      (i, j) => {
        // three tiers, each a stepped triangle wider than the one above
        const tier = Math.min(2, Math.floor((j / rows) * 3));
        const inTier = j - (tier * rows) / 3;
        const half = (inTier / (rows / 3)) * (mid * (0.45 + tier * 0.28)) + 0.6;
        const dx = i - mid;
        if (Math.abs(dx) > half) return null;
        const edge = inTier > rows / 3 - 1.2;
        return tones[
          edge ? 1 : dx < -half * 0.35 ? 3 : dx > half * 0.4 ? 1 : 2
        ];
      },
      2,
    );
  });
}

function bush(p: Pal, w: number): Sprite {
  const g = ramp(mat(p, "#3f9d3c")[2]!);
  const u = w / 4;
  return bake(-w - 4, -w - 6, w + 6, 3, (c) => {
    canopy(
      c,
      g,
      4,
      [
        [-u * 0.4, 0.2 * u, u * 0.5],
        [u * 0.4, 0.25 * u, u * 0.45],
        [0, -0.15 * u, u * 0.52],
      ],
      0,
      Math.round(-w * 0.55),
      w,
    );
  });
}

/** A lattice tower in thin bricks: stepped legs, cross bars, cube braces and stacked insulators. */
function pylonSprite(p: Pal): Sprite {
  const m = mat(p, "#8d97a8", 0.2);
  const col = mix(m[2], p.hill, 0.35);
  const r = ramp(col);
  const half = (y: number) => Math.round(3 + 13 * (1 + y / 138));
  return bake(-28, -152, 30, 2, (c) => {
    for (let y = 0; y > -138; y -= 20) {
      const y1 = Math.max(-138, y - 20);
      const hb = half(y);
      const ht = half(y1);
      // braces behind the legs
      cubeChain(
        c,
        r,
        -hb + 2,
        y - 2,
        Math.atan2(y1 - y + 4, ht + hb - 4),
        Math.hypot(ht + hb - 4, y1 - y + 4),
        2,
      );
      cubeChain(
        c,
        r,
        hb - 2,
        y - 2,
        Math.atan2(y1 - y + 4, -(ht + hb - 4)),
        Math.hypot(ht + hb - 4, y1 - y + 4),
        2,
      );
      // each leg steps inward one brick at a time
      const hm = half((y + y1) / 2);
      block(c, -hm - 2, y1, 3, y - y1, r, 2);
      block(c, hm - 1, y1, 3, y - y1, r, 2);
      block(c, -ht - 1, y1 - 1, ht * 2 + 3, 2, r, 1);
    }
    block(c, -3, -146, 6, 8, r, 2);
    block(c, -24, -140, 49, 3, r, 2);
    block(c, -16, -114, 33, 3, r, 2);
    block(c, -9, -90, 19, 3, r, 2);
    // three phases per side: one insulator string per arm end
    const ins = mat(p, "#e8dcc0");
    for (const [x, y] of [
      [-22, -137],
      [22, -137],
      [-14, -111],
      [14, -111],
      [-7, -87],
      [7, -87],
    ] as const)
      for (let k = 0; k < 3; k++) block(c, x - 2, y + k * 2, 4, 2, ins, 1);
  });
}

/** A cloud built from white cubes: a stepped dome on a flat base, shaded darker underneath. */
function cloudSprite(p: Pal, seed: number): Sprite {
  const r: R5 = p.night
    ? ["#0c1030", "#1a2152", "#2a336c", "#3d4884", "#5561a0"]
    : ["#7f9cc4", "#b7cde8", "#e9f2fb", "#ffffff", "#ffffff"];
  const under: R5 = p.night
    ? ["#0c1030", "#141a44", "#20285c", "#2a336c", "#3d4884"]
    : ["#7f9cc4", "#9fb9dc", "#c9dbef", "#e9f2fb", "#ffffff"];
  const cell = 6;
  const cols = 18 + Math.floor(hash(seed) * 12);
  const rows = 7;
  const bumps = 3 + Math.floor(hash(seed + 1) * 3);
  const height = (i: number) => {
    let h = 1.6;
    for (let k = 0; k < bumps; k++) {
      const bx = ((k + 0.5) / bumps) * cols + (hash(seed + 10 + k) - 0.5) * 3;
      const br =
        2.5 +
        Math.sin(((k + 0.5) / bumps) * Math.PI) * 3.2 +
        hash(seed + 20 + k);
      const dx = (i + 0.5 - bx) / br;
      if (dx * dx < 1)
        h = Math.max(h, 1.4 + br * Math.sqrt(1 - dx * dx) * 0.95);
    }
    return Math.min(rows, Math.round(h));
  };
  const hs = Array.from({ length: cols }, (_, i) => height(i));
  const w = cols * cell;
  return bake(
    -w / 2 - 2,
    -rows * cell - cell,
    w / 2 + cell,
    2,
    (c) =>
      vox(c, -w / 2, -rows * cell, cols, rows, cell, (i, j) => {
        // round the two ends off
        const h = i === 0 || i === cols - 1 ? Math.min(hs[i]!, 1) : hs[i]!;
        if (rows - j > h) return null;
        return j === rows - 1 ? under : r;
      }),
    false,
  );
}

/** Three stems with a single-stud flower head each. */
function flower(p: Pal, seed: number): Sprite {
  const petal = [p.red, p.blue, p.yellow, "#f4f4f4", "#e56fb0"][seed % 5]!;
  const stem = mat(p, "#3d8a35");
  const pc = mat(p, petal, 0.2);
  return bake(-12, -26, 12, 2, (c) => {
    for (let k = 0; k < 3; k++) {
      const x = (k - 1) * 7 + Math.round((hash(seed + k) - 0.5) * 3);
      const h = 8 + Math.floor(hash(seed * 3 + k) * 9);
      px(c, stem[1], x, -h, 2, h);
      px(c, stem[3], x, -h, 1, h);
      block(c, x + 2, -h * 0.5, 3, 2, stem, 1);
      block(c, x - 2, -h - 4, 5, 4, pc, 2);
      px(c, mat(p, p.yellow)[4], x, -h - 3, 1, 1);
    }
  });
}

/** A rounded grey lump, two or three cubes high. */
function rock(p: Pal, seed: number): Sprite {
  const m = mat(p, "#8d949f", 0.2);
  const tones = lit(m);
  const cols = 3 + (seed % 3);
  return bake(-14, -16, 18, 2, (c) =>
    vox(
      c,
      -(cols * 4) / 2,
      -8,
      cols,
      2,
      4,
      (i, j) =>
        j === 0 && (i === 0 || i === cols - 1)
          ? null
          : tones[j === 0 ? 3 : i < cols / 2 ? 2 : 1],
      2,
    ),
  );
}

function lampPost(p: Pal): Sprite {
  const m = mat(p, "#4a5368", 0.1);
  return bake(-12, -70, 16, 2, (c) => {
    block(c, -2, -60, 4, 60, m, 2);
    block(c, -6, -6, 12, 6, m, 3);
    block(c, -2, -63, 14, 3, m, 2);
    block(c, 7, -60, 6, 4, ramp(p.glow), 1);
    px(c, "#fffbe0", 8, -59, 4, 2);
  });
}

function sunSprite(): Sprite {
  return bake(-24, -26, 26, 24, (c) =>
    voxBall(c, 0, 0, 20, 4, [
      "#b8641a",
      "#f0a830",
      "#ffd23f",
      "#ffe98a",
      "#fffbe0",
    ]),
  );
}

/** The moon: pale cubes with a few darker ones for the maria. */
function moonSprite(): Sprite {
  const r: R5 = ["#4a4a5e", "#9a96a0", "#cfcab4", "#e9e4cc", "#fffbea"];
  const sea: R5 = ["#4a4a5e", "#8a8696", "#a8a496", "#bdb8a4", "#d4cfb8"];
  const n = 5;
  const cell = 4;
  return bake(-24, -26, 26, 24, (c) =>
    vox(
      c,
      -n * cell,
      -n * cell,
      n * 2,
      n * 2,
      cell,
      (i, j) => {
        const nx = (i + 0.5 - n) / n;
        const ny = (j + 0.5 - n) / n;
        if (nx * nx + ny * ny > 1) return null;
        const maria =
          (i === 3 && j >= 3 && j <= 4) ||
          (i === 4 && j === 3) ||
          (i === 6 && j === 6) ||
          (i === 5 && j === 6) ||
          (i === 6 && j === 2);
        const k = shade(nx, ny);
        const base = maria ? sea : r;
        return [
          base[0],
          base[Math.max(0, k - 1)]!,
          base[k]!,
          base[Math.min(4, k + 1)]!,
          base[4],
        ];
      },
      2,
    ),
  );
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
    sun: sunSprite(),
    moon: moonSprite(),
    wires: new Map(),
  };
}

const WIRES = [
  [-22, -134],
  [22, -134],
  [-14, -109],
  [14, -109],
  [-7, -85],
  [7, -85],
] as const;
const SAG = 30 * 4;

/** The wires from one pylon to the next, drawn once per span (they never change). */
function wireSprite(col: string, span: number): Sprite {
  return bake(
    -22,
    -134,
    22 + span,
    -85 + SAG / 4,
    (c) => {
      for (const [dx, dy] of WIRES) {
        let px0: number = dx;
        let py0: number = dy;
        for (let k = 1; k <= 70; k++) {
          const u = k / 70;
          const [x1, y1] = [dx + u * span, dy + SAG * u * (1 - u)];
          line(c, col, px0, py0, x1, y1, 1);
          px0 = x1;
          py0 = y1;
        }
      }
    },
    false,
  );
}

/** Foreground plants, close to the lens: blades of stacked dark cubes. */
const TUFTS = [
  [
    "....#....",
    "..#.#..#.",
    "..#.#..#.",
    "#.#.##.#.",
    "#.##.#.##",
    "##.#.###.",
    ".###.###.",
    ".#######.",
    "..#####..",
  ],
  [
    "......#..",
    ".#....#..",
    ".#..#.#.#",
    ".##.#.#.#",
    "..#.###.#",
    "#.#.##.##",
    "#####.##.",
    ".#######.",
    "..######.",
  ],
];

function tuft(p: Pal, seed: number): Sprite {
  const r = ramp(p.fg);
  const flat: R5 = [
    r[0],
    r[1],
    r[2],
    mix(r[2], r[3], 0.3),
    mix(r[2], r[3], 0.5),
  ];
  const rows = TUFTS[seed & 1]!;
  const flip = seed & 2;
  const cell = 5;
  return bake(
    -24,
    -rows.length * cell - 4,
    30,
    2,
    (c) =>
      vox(
        c,
        -22,
        -rows.length * cell,
        9,
        rows.length,
        cell,
        (i, j) => (rows[j]![flip ? 8 - i : i] === "#" ? flat : null),
        2,
        false,
      ),
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

/**
 * Sky in a few flat bands, like stacked plates, each edge stepped in a
 * two-row checker. A faint stud grid over all of it: the baseplate the world
 * is built on.
 */
function skyBitmap(p: Pal, W: number, gy: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = gy;
  const c = cv.getContext("2d")!;
  const img = c.createImageData(W, gy);
  const bands = 9;
  const dotK = p.night ? 0.07 : 0.06;
  for (let y = 0; y < gy; y++) {
    const u = (y / gy) * bands;
    const lo = Math.min(bands - 1, Math.floor(u));
    const f = u - lo;
    const a = gradient(p.sky, lo / (bands - 1));
    const b = gradient(p.sky, Math.min(bands - 1, lo + 1) / (bands - 1));
    for (let x = 0; x < W; x++) {
      // the next band reaches up two rows in a checker
      const step = f > 1 - 2 / (gy / bands) && ((x >> 1) + y) % 2 === 0;
      const q = step ? b : a;
      const dot = (x & 3) === 1 && (y & 3) === 1;
      const o = (y * W + x) * 4;
      for (let k = 0; k < 3; k++)
        img.data[o + k] = dot ? q[k]! + (255 - q[k]!) * dotK : q[k]!;
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

  // far right, clear of the station clouds and their labels (they sit nearer the middle)
  const sx = Math.round(v.W * (v.W < 500 ? 0.84 : 0.92) - v.camX * 0.002);
  const sy = Math.round(v.gy * 0.2);
  if (p.night) {
    for (let k = 9; k > 0; k--) ring(c, "#9fb0ff", sx, sy, 16 + k * 7, 0.03);
    blit(c, set.moon, sx, sy);
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
    blit(c, set.sun, sx, sy);
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
      if (h < 0.55) return;
      const cx = x + h * 120 + ((v.t * 2) % 520);
      const wx = ((cx + 200) % (v.W + 400)) - 200;
      c.globalAlpha = 0.4;
      blit(
        c,
        setFor(p).clouds[Math.floor(h * 3) % 3]!,
        wx,
        40 + hash(i + 800) * v.gy * 0.35,
      );
      c.globalAlpha = 1;
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
  // stepped into brick columns: each has a lit top face and, where the next
  // one is lower, a shaded side
  const cell = Math.max(6, Math.round(amp / 8));
  const step = Math.max(3, Math.round(cell / 2));
  const d = Math.max(2, step - 1);
  const o = v.camX * f;
  const i0 = Math.floor(o / cell) - 1;
  const i1 = Math.floor((o + v.W) / cell) + 1;
  const q = (i: number) => Math.round(h(i * cell - o + cell / 2) / step) * step;
  const top = mix(lit, "#ffffff", 0.15);
  const seam = mix(col, dark, 0.35);
  for (let i = i0; i <= i1; i++) {
    const x = Math.round(i * cell - o);
    const hh = q(i);
    const next = q(i + 1);
    px(c, col, x, v.gy - hh, cell, hh);
    // a course line every step down the face, offset so it reads as stacked bricks
    for (let y = v.gy - hh + step * 2; y < v.gy; y += step * 2)
      px(c, seam, x, y, cell, 1);
    px(c, seam, x + ((hh / step) & 1 ? cell >> 1 : 0), v.gy - hh, 1, hh);
    for (let k = 1; k <= d; k++)
      px(c, k === d ? top : lit, x + k, v.gy - hh - k, cell, 1);
    if (next < hh)
      for (let k = 1; k <= d; k++)
        px(c, dark, x + cell - 1 + k, v.gy - hh - k + 1, 1, hh - next);
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
  const r = ramp(col);
  // flat haze tones: far away, only the shape and a lit edge are left
  const far: R5 = [
    r[1],
    mix(col, r[1], 0.5),
    col,
    mix(col, r[3], 0.5),
    mix(col, r[3], 0.7),
  ];
  for (let k = 0; k < 4; k++) {
    const w = k < 2 ? 4 : 3;
    block(c, x - (w >> 1), gy - ((k + 1) * h) / 4, w, h / 4, far, 1);
  }
  for (let b = 0; b < 3; b++)
    cubeChain(
      c,
      far,
      x,
      gy - h,
      t * 0.9 + phase + (b * Math.PI * 2) / 3,
      len,
      3,
      2,
    );
  block(c, x - 3, gy - h - 3, 6, 5, far, 1);
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
  const r: R5 = [
    dark,
    dark,
    body,
    lit,
    mix(lit, "#ffffff", p.night ? 0.05 : 0.3),
  ];
  const pane = mix(body, "#1a2766", p.night ? 0.3 : 0.12);
  const shine = mix(body, "#ffffff", 0.4);
  cells(v, 0.26, 52, (i, x) => {
    // whole studs tall, so the skyline steps like stacked bricks
    const h = 24 + Math.floor(hash(i + 5) * 9) * 8;
    const w = 28 + Math.floor(hash(i + 9) * 3) * 8;
    const y0 = v.gy - h - 6;
    const kind = hash(i + 13);
    if (kind > 0.6) {
      // a mast with a warning light
      block(c, x + (w >> 1) - 2, y0 - 14, 4, 14, r, 2);
      px(
        c,
        Math.floor(v.t + i) & 1 ? p.red : mix(p.red, body, 0.5),
        x + (w >> 1) - 2,
        y0 - 16,
        4,
        2,
      );
    } else if (hash(i + 14) > 0.6) {
      // a stepped crown, two bricks narrower
      block(c, x + 8, y0 - 8, w - 16, 8, r, 3);
    }
    block(c, x, y0, w, h + 6, r, 3);
    for (let ry = 6; ry < h; ry += 8)
      for (let rx = 4; rx < w - 6; rx += 6) {
        const on = hash(i * 131 + ry * 7 + rx) > (p.night ? 0.55 : 0.6);
        px(
          c,
          p.night ? (on ? p.glow : pane) : on ? shine : pane,
          x + rx,
          y0 + ry,
          3,
          4,
        );
        if (p.night && on) px(c, "#fff6c8", x + rx, y0 + ry, 1, 1);
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
  // pylons fade out near a station instead of popping, so they never clash with its art
  const gap = (x: number) => {
    let d = Infinity;
    for (const st of STATIONS)
      d = Math.min(d, Math.abs(x - (st + ART_AHEAD - v.camX)));
    return d;
  };
  cells(v, 0.55, 420, (i, x) => {
    // span to the next pylon's rounded position so wire ends never drift off it
    const span = Math.round((i + 1) * 420 - v.camX * 0.55) - x;
    const a = Math.max(
      0,
      Math.min(1, (Math.min(gap(x), gap(x + span)) - 130) / 160),
    );
    if (a <= 0) return;
    c.save();
    c.globalAlpha = a;
    blit(c, set.pylon, x, v.gy);
    let wires = set.wires.get(span);
    if (!wires) set.wires.set(span, (wires = wireSprite(wireCol, span)));
    blit(c, wires, x, v.gy);
    // a spark of power travelling along the top wire
    const f = (v.t * 0.18 + hash(i) * 3) % 1;
    const u = Math.floor(f * 70) / 70;
    const qx = x - 22 + u * span;
    const qy = v.gy - 134 + SAG * u * (1 - u);
    px(c, p.yellow, qx - 2, qy - 2, 5, 5);
    px(c, "#fff6c0", qx - 1, qy - 1, 3, 3);
    if (p.night) owl(c, v, i, x);
    else perched(c, v, i, x, span);
    c.restore();
  });
}

/** Some pylons have an owl on the top arm at night: it blinks and glances about. */
function owl(c: C, v: View, i: number, x: number) {
  if (hash(i + 41) < 0.55) return;
  const ox = x + (hash(i + 42) < 0.5 ? -17 : 15);
  const oy = v.gy - 139;
  const body = "#6b5a48";
  px(c, body, ox - 2, oy - 7, 5, 7);
  px(c, body, ox - 2, oy - 9, 1, 2);
  px(c, body, ox + 2, oy - 9, 1, 2);
  px(c, "#8a7660", ox - 1, oy - 4, 3, 3);
  const blink = (v.t * 0.5 + hash(i) * 9) % 1 < 0.05;
  const look = Math.floor(v.t * 0.35 + hash(i + 7) * 5) % 3 === 0 ? 1 : 0;
  if (!blink) {
    px(c, "#ffd84a", ox - 2 + look, oy - 7, 1, 1);
    px(c, "#ffd84a", ox + 1 + look, oy - 7, 1, 1);
  }
}

/** By day, starlings sit on the top wire and now and then all take off together. */
function perched(c: C, v: View, i: number, x: number, span: number) {
  const n = Math.floor(hash(i + 31) * 5);
  if (!n) return;
  const period = 26 + hash(i + 32) * 12;
  const ph = (v.t + hash(i + 33) * period) % period;
  const away = Math.max(0, ph - (period - 5)) / 5; // 0 perched, then 0..1 flying off
  const dir =
    hash(Math.floor((v.t + hash(i + 33) * period) / period) + i) < 0.5 ? 1 : -1;
  for (let k = 0; k < n; k++) {
    const u = 0.18 + 0.64 * hash(i * 9 + k);
    const bx = x - 22 + u * span;
    const by = v.gy - 134 + 120 * u * (1 - u) - 1;
    if (away > 0) {
      const lag = Math.max(0, away - k * 0.04);
      c.globalAlpha *= 1 - lag * 0.8;
      drawBird(c, "#2d3548", bx + dir * lag * 90, by - lag * 40, v.t * 12 + k);
      c.globalAlpha /= 1 - lag * 0.8;
    } else {
      px(c, "#2d3548", bx - 1, by - 2, 3, 2);
      px(c, "#2d3548", bx + (k & 1 ? 2 : -2), by - 1, 1, 1);
      px(c, "#3d4a68", bx, by - 3, 1, 1);
    }
  }
}

/* ---------- ground ---------- */

function groundTiles(p: Pal, h: number) {
  const g = document.createElement("canvas");
  g.width = 256;
  g.height = h;
  const gc = g.getContext("2d")!;
  // a green baseplate: flat bands that darken toward the viewer, studded on a grid
  const fade = (y: number) => 1 - Math.floor((y / h) * 4) * 0.07;
  for (let y = 0; y < h; y++)
    px(gc, mix(p.ground, "#0b1a10", 1 - fade(y)), 0, y, 256, 1);
  const g5 = ramp(p.ground);
  for (let y = 9; y < h - 2; y += 8)
    for (let x = (y >> 3) & 1 ? 2 : 6; x < 256; x += 8) {
      const k = 1 - fade(y);
      const top = mix(g5[3], "#0b1a10", k);
      px(gc, mix(g5[1], "#0b1a10", k), x + 1, y + 1, 4, 2);
      px(gc, mix(g5[2], "#0b1a10", k), x, y, 4, 2);
      px(gc, top, x, y - 1, 4, 1);
      px(gc, mix(g5[4], "#0b1a10", k), x, y - 1, 2, 1);
    }
  // a few blades poking up between the studs
  for (let k = 0; k < 40; k++) {
    const x = Math.floor(hash(k * 7) * 254);
    const y = 6 + Math.floor(hash(k * 13) * (h - 12));
    px(gc, p.dot, x, y, 1, 2);
    px(gc, p.grass2, x + 1, y + 1, 1, 2);
  }
  // lit rim along the horizon edge: the top face of the plate
  px(gc, mix(p.dot, "#ffffff", p.night ? 0.05 : 0.2), 0, 0, 256, 1);
  px(gc, p.dot, 0, 1, 256, 1);
  px(gc, p.line, 0, 2, 256, 1);

  // the path: flat tan plates in running bond, each with its own lit edge
  const pa = document.createElement("canvas");
  pa.width = 192;
  pa.height = 26;
  const pc = pa.getContext("2d")!;
  const pbase = p.path;
  const pr = ramp(pbase);
  px(pc, mix(pbase, p.ground, 0.5), 0, 0, 192, 26);
  px(pc, pr[3], 0, 2, 192, 2);
  px(pc, pr[4], 0, 2, 192, 1);
  for (const [y0, off] of [
    [4, 0],
    [13, 12],
  ] as const)
    for (let x0 = -off; x0 < 192; x0 += 24) {
      const tint = hash(x0 * 7 + y0) * 0.12 - 0.06;
      const base =
        tint > 0 ? mix(pbase, "#ffffff", tint) : mix(pbase, "#1a2766", -tint);
      px(pc, base, x0, y0, 24, 9);
      px(pc, mix(base, "#ffffff", 0.22), x0 + 1, y0, 22, 1);
      px(pc, mix(base, "#ffffff", 0.12), x0, y0, 1, 8);
      px(pc, mix(pbase, "#1a2766", 0.28), x0 + 23, y0, 1, 9);
      px(pc, mix(pbase, "#1a2766", 0.2), x0, y0 + 8, 24, 1);
    }
  px(pc, mix(pbase, "#1a2766", 0.3), 0, 22, 192, 1);
  px(pc, mix(pbase, "#1a2766", 0.42), 0, 23, 192, 2);
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
