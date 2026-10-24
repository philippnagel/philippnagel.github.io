import type { Pal, Ramp } from "../palette";
import { mix } from "../palette";
import { rng, type Pix } from "../pix";
import { BAND_Y, SH, SW } from "../geometry";

const shadowOf = (p: Pal) => (p.night ? p.outline : p.white);

/** Centred label with a hard shadow, readable on any background. */
export const label = (g: Pix, p: Pal, w: number, y: number, s: string) =>
  g.textCS(Math.round(w / 2), y, s, p.ink, shadowOf(p));

/** Translucent rounded card behind data-layer objects. */
export function plate(g: Pix, p: Pal, w: number, h: number) {
  const fill = p.night ? "rgba(8,22,46,.62)" : "rgba(255,255,255,.55)";
  const edge = p.night ? "rgba(42,212,255,.55)" : "rgba(11,159,196,.6)";
  g.r(2, 0, w - 4, h, fill);
  g.r(0, 2, w, h - 4, fill);
  g.r(1, 1, w - 2, h - 2, fill);
  g.r(3, 0, w - 6, 1, edge);
  g.r(3, h - 1, w - 6, 1, edge);
  g.r(0, 3, 1, h - 6, edge);
  g.r(w - 1, 3, 1, h - 6, edge);
  for (const [x, y] of [
    [1, 1],
    [w - 2, 1],
    [1, h - 2],
    [w - 2, h - 2],
  ] as const)
    g.p(x, y, edge);
}

/** Data band: dusk-to-day sky with faint circuit traces. */
export function dataSky(g: Pix, p: Pal, seed = 3) {
  g.gradV(0, 0, SW, BAND_Y, p.sky);
  const r = rng(seed);
  const trace = p.night ? "rgba(42,212,255,.16)" : "rgba(11,120,170,.14)";
  for (let i = 0; i < 26; i++) {
    let x = Math.floor(r() * SW),
      y = 10 + Math.floor(r() * (BAND_Y - 20));
    const n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const horiz = k % 2 === 0;
      const len = 14 + Math.floor(r() * 50);
      const dir = r() < 0.5 ? -1 : 1;
      if (horiz) g.r(Math.min(x, x + dir * len), y, len, 1, trace);
      else g.r(x, Math.min(y, y + dir * len), 1, len, trace);
      x += horiz ? dir * len : 0;
      y += horiz ? 0 : dir * len;
      g.r(x - 1, y - 1, 3, 3, trace);
    }
  }
  for (let y = 12; y < BAND_Y; y += 16)
    for (let x = (y / 16) % 2 ? 8 : 0; x < SW; x += 16) g.p(x, y, p.dot);
  if (p.night) {
    const s = rng(seed + 9);
    for (let i = 0; i < 70; i++)
      g.p(
        Math.floor(s() * SW),
        Math.floor(s() * (BAND_Y - 6)),
        s() < 0.2 ? "#ffffff" : "#8fb2e8",
      );
  }
}

/** Meadow with hills, tufts, flowers and optional road. */
export function meadow(
  g: Pix,
  p: Pal,
  o: { road?: boolean; seed?: number; hills?: boolean } = {},
) {
  const r = rng(o.seed ?? 7);
  const top = BAND_Y;
  g.r(0, top, SW, SH - top, p.grass[2]);
  if (o.hills !== false) {
    // two parallax ridges
    const far = mix(p.leaf[1], p.sky[4]!, p.night ? 0.2 : 0.5);
    const mid = mix(p.leaf[2], p.sky[4]!, p.night ? 0.1 : 0.22);
    for (let x = 0; x < SW; x++) {
      const h1 = 24 + Math.sin(x * 0.011 + 1) * 10 + Math.sin(x * 0.031) * 5;
      g.r(x, top + 22 - h1 + 12, 1, h1, far);
      const h2 = 14 + Math.sin(x * 0.017 + 4) * 7 + Math.sin(x * 0.05) * 3;
      g.r(x, top + 40 - h2 + 8, 1, h2 + 6, mid);
    }
  }
  g.gradV(0, top + 44, SW, SH - top - 44, [
    p.grass[3],
    p.grass[2],
    p.grass[2],
    p.grass[1],
    p.leaf[2],
  ]);
  for (let i = 0; i < 700; i++) {
    const x = Math.floor(r() * SW),
      y = top + 48 + Math.floor(r() * (SH - top - 48));
    const t = r();
    g.p(x, y, t < 0.5 ? p.grass[3] : t < 0.85 ? p.leaf[2] : p.grass[1]);
    if (t > 0.6) g.p(x, y - 1, p.grass[3]);
  }
  const petals = [p.white, p.yellow[2], p.red[2], p.purple[3]];
  for (let i = 0; i < 44; i++) {
    const x = Math.floor(r() * SW),
      y = top + 70 + Math.floor(r() * (SH - top - 110));
    g.p(x, y, petals[i % 4]!);
    g.p(x, y + 1, p.leaf[1]);
  }
  if (o.road) {
    g.r(0, 322, SW, 38, p.road[2]);
    g.r(0, 322, SW, 3, p.concrete[3]);
    g.r(0, 325, SW, 1, p.concrete[1]);
    g.r(0, 352, SW, 8, p.road[1]);
    for (let x = 4; x < SW; x += 40) g.r(x, 338, 22, 2, p.yellow[3]);
    for (let i = 0; i < 160; i++)
      g.p(
        Math.floor(r() * SW),
        327 + Math.floor(r() * 24),
        r() < 0.5 ? p.road[3] : p.road[1],
      );
  }
  g.textS(8, BAND_Y + 8, "POWER LAYER", p.inkDim, shadowOf(p));
  g.textS(8, 6, "DATA LAYER", p.inkDim, shadowOf(p));
  g.r(0, BAND_Y - 2, SW, 2, p.data);
  g.r(0, BAND_Y - 1, SW, 1, p.outline);
}

export function tree(
  g: Pix,
  p: Pal,
  x: number,
  y: number,
  s = 1,
  kind: "round" | "pine" = "round",
) {
  g.shadow(x + 2, y + 1, 9 * s, 3, p.outline, 0.4);
  if (kind === "pine") {
    g.cylV(x - 1, y - 8, 4, 9, p.wood);
    for (let i = 0; i < 4; i++) {
      const w = 22 * s - i * 4 * s,
        yy = y - 12 * s - i * 9 * s;
      g.poly(
        [
          [x + 1, yy - 12 * s],
          [x + 1 - w / 2, yy + 4],
          [x + 1 + w / 2, yy + 4],
        ],
        p.leaf[i % 2 ? 1 : 2],
      );
      g.poly(
        [
          [x + 1, yy - 12 * s],
          [x + 1 - w / 2, yy + 4],
          [x + 1 - w / 6, yy + 4],
        ],
        p.leaf[3],
      );
    }
    return;
  }
  g.cylV(x - 1, y - 12 * s, 5, 13 * s, p.wood);
  const blobs: [number, number, number][] = [
    [0, -26, 12],
    [-9, -19, 9],
    [10, -19, 9],
    [2, -14, 8],
  ];
  for (const [dx, dy, r] of blobs)
    g.ball(x + 1 + dx * s, y + dy * s, Math.round(r * s), p.leaf);
}

export function bush(g: Pix, p: Pal, x: number, y: number, s = 1) {
  g.shadow(x, y + 1, 9 * s, 2, p.outline, 0.4);
  for (const [dx, dy, r] of [
    [-5, -4, 5],
    [4, -4, 5],
    [0, -7, 5],
  ] as const)
    g.ball(x + dx * s, y + dy * s, Math.round(r * s), p.leaf);
}

/** Paper envelope sprite, 15x10. */
export function envelope(g: Pix, p: Pal, x: number, y: number, tint?: Ramp) {
  const R = tint ?? p.paper;
  g.slab(x, y, 15, 10, R);
  g.line(x + 1, y + 1, x + 7, y + 6, R[1]);
  g.line(x + 13, y + 1, x + 7, y + 6, R[1]);
  g.p(x + 7, y + 7, p.red[2]);
}

export function lock(g: Pix, p: Pal, x: number, y: number) {
  g.r(x + 2, y, 8, 2, p.metal[0]);
  g.r(x + 2, y + 2, 2, 5, p.metal[0]);
  g.r(x + 8, y + 2, 2, 5, p.metal[0]);
  g.r(x + 3, y + 1, 6, 1, p.metal[3]);
  g.slab(x, y + 6, 12, 10, p.yellow);
  g.disc(x + 6, y + 10, 1, p.outline);
  g.r(x + 6, y + 11, 1, 3, p.outline);
}

export function key(g: Pix, p: Pal, x: number, y: number) {
  g.ball(x + 5, y + 5, 5, p.yellow);
  g.disc(x + 5, y + 5, 2, p.outline);
  g.r(x + 9, y + 4, 16, 3, p.yellow[0]);
  g.r(x + 9, y + 4, 16, 2, p.yellow[2]);
  g.r(x + 9, y + 4, 16, 1, p.yellow[3]);
  g.r(x + 18, y + 7, 3, 4, p.yellow[1]);
  g.r(x + 23, y + 7, 3, 3, p.yellow[1]);
}

export function pole(g: Pix, p: Pal, x: number, y: number, h: number, w = 6) {
  g.shadow(x + w / 2, y + h, 10, 2, p.outline, 0.45);
  g.cylV(x, y, w, h, p.wood);
  for (let j = y + 12; j < y + h - 6; j += 14)
    g.r(x + 1, j, w - 2, 1, p.wood[1]);
}

/** Ceramic insulator string hanging from (x, y). */
export function insulators(g: Pix, p: Pal, x: number, y: number, n = 4) {
  g.r(x, y, 1, 2, p.metal[0]);
  for (let i = 0; i < n; i++) {
    g.slab(x - 2, y + 2 + i * 3, 5, 3, p.concrete);
  }
  g.r(x, y + 2 + n * 3, 1, 2, p.metal[0]);
}

/** Side-view car. */
export function car(
  g: Pix,
  p: Pal,
  x: number,
  y: number,
  body: Ramp,
  flip = false,
) {
  const X = (dx: number, w = 0) => (flip ? x + 44 - dx - w : x + dx);
  g.shadow(x + 22, y + 15, 24, 3, p.outline, 0.5);
  g.poly(
    [
      [X(0), y + 12],
      [X(2), y + 8],
      [X(10), y + 6],
      [X(15), y],
      [X(33), y],
      [X(38), y + 6],
      [X(44), y + 8],
      [X(44), y + 12],
    ],
    body[0],
  );
  g.poly(
    [
      [X(1), y + 12],
      [X(3), y + 8],
      [X(11), y + 7],
      [X(16), y + 1],
      [X(32), y + 1],
      [X(37), y + 7],
      [X(43), y + 9],
      [X(43), y + 12],
    ],
    body[2],
  );
  g.poly(
    [
      [X(16), y + 1],
      [X(32), y + 1],
      [X(30), y + 3],
      [X(18), y + 3],
    ],
    body[3],
  );
  g.poly(
    [
      [X(18), y + 3],
      [X(30), y + 3],
      [X(33), y + 7],
      [X(14), y + 7],
    ],
    p.glass[2],
  );
  g.r(X(23), y + 3, 1, 4, body[0]);
  g.r(X(2), y + 11, 40, 1, body[1]);
  g.r(X(40, 3), y + 8, 3, 2, p.yellow[3]);
  g.r(X(1, 2), y + 8, 2, 2, p.red[2]);
  for (const wx of [10, 34]) {
    g.disc(X(wx), y + 13, 4, p.outline);
    g.disc(X(wx), y + 13, 2, p.metal[3]);
    g.p(X(wx), y + 13, p.metal[1]);
  }
}

/** Drifting translucent clouds across the data band. */
export function clouds(g: Pix, p: Pal, t: number, n = 5, seed = 1) {
  const r = rng(seed);
  const col = p.night ? "rgba(120,160,230,.10)" : "rgba(255,255,255,.55)";
  const hi = p.night ? "rgba(160,200,255,.10)" : "rgba(255,255,255,.7)";
  for (let i = 0; i < n; i++) {
    const speed = 3 + r() * 5;
    const x = ((r() * SW + t * speed) % (SW + 160)) - 80;
    const y = 20 + r() * (BAND_Y - 70);
    const s = 0.8 + r() * 0.8;
    for (const [dx, dy, rad] of [
      [0, 0, 14],
      [16, -6, 17],
      [34, 0, 14],
      [18, 4, 15],
    ] as const) {
      g.ell(
        Math.round(x + dx * s),
        Math.round(y + dy * s),
        Math.round(rad * s),
        Math.round(rad * 0.6 * s),
        col,
      );
    }
    g.ell(
      Math.round(x + 14 * s),
      Math.round(y - 9 * s),
      Math.round(9 * s),
      Math.round(4 * s),
      hi,
    );
  }
}
