import type { Pal, Ramp } from "../palette";
import { mix } from "../palette";
import { Iso, TH, TW, ZH, type P3 } from "../iso";
import { rng, type Pix } from "../pix";
import { SH, SW } from "../geometry";
import type { Obj } from "../types";

const shadowOf = (p: Pal) => (p.night ? p.outline : p.white);

/** Centred label with a hard shadow. */
export const label = (g: Pix, p: Pal, cx: number, y: number, s: string) =>
  g.textCS(Math.round(cx), y, s, p.ink, shadowOf(p));

/** Places an iso-drawn object: local origin (ax, ay) is the projection of `at` in the scene. */
export function place(
  scene: Iso,
  at: P3,
  box: { w: number; h: number; ax: number; ay: number },
  draw: (I: Iso, p: Pal) => void,
): Pick<Obj, "x" | "y" | "w" | "h" | "paint"> {
  const [sx, sy] = scene.p(...at);
  return {
    x: sx - box.ax,
    y: sy - box.ay,
    w: box.w,
    h: box.h,
    paint: (g, p) => draw(new Iso(g, box.ax, box.ay), p),
  };
}

/** Same placement for live animation drawn in object-local coordinates. */
export const isoAnim =
  (box: { ax: number; ay: number }, fn: (I: Iso, t: number, p: Pal) => void) =>
  (g: Pix, t: number, p: Pal) =>
    fn(new Iso(g, box.ax, box.ay), t, p);

/** Sky backdrop: gradient, sun or moon, distant skyline, haze. */
export function sky(g: Pix, p: Pal, seed = 3) {
  g.gradV(
    0,
    0,
    SW,
    SH,
    p.sky.length
      ? [p.sky[0]!, p.sky[1]!, p.sky[2]!, p.sky[3]!, p.sky[4]!]
      : [p.sky[0]!],
  );
  const r = rng(seed);
  if (p.night) {
    for (let i = 0; i < 160; i++)
      g.p(
        Math.floor(r() * SW),
        Math.floor(r() * SH * 0.6),
        r() < 0.15 ? "#ffffff" : r() < 0.5 ? "#9bb8ee" : "#5f7fc0",
      );
    g.disc(130, 100, 26, "rgba(200,220,255,.12)");
    g.disc(130, 100, 18, "#e8f0ff");
    g.disc(123, 94, 15, "#f6f9ff");
    for (const [x, y, rr] of [
      [126, 104, 4],
      [136, 92, 3],
    ] as const)
      g.disc(x, y, rr, "#c8d6f0");
  } else {
    g.disc(130, 100, 44, "rgba(255,246,200,.22)");
    g.disc(130, 100, 32, "rgba(255,246,200,.35)");
    g.disc(130, 100, 22, "#fff2b0");
    g.disc(124, 94, 16, "#fffbe0");
  }
  // distant skyline of tiny towers, hazed into the sky
  const haze = mix(
    p.sky[3]!,
    p.night ? "#0a1830" : "#7090b0",
    p.night ? 0.5 : 0.35,
  );
  const haze2 = mix(
    p.sky[4]!,
    p.night ? "#0a1830" : "#7090b0",
    p.night ? 0.35 : 0.22,
  );
  let x = -10;
  while (x < SW) {
    const w = 10 + Math.floor(r() * 18);
    const h = 18 + Math.floor(r() * 60);
    g.r(x, 330 - h, w, h, haze);
    if (p.night)
      for (let k = 0; k < 4; k++)
        g.p(
          x + 2 + Math.floor(r() * (w - 4)),
          330 - h + 3 + Math.floor(r() * (h - 6)),
          "#ffd98a",
        );
    x += w + Math.floor(r() * 6);
  }
  x = -20;
  while (x < SW) {
    const w = 14 + Math.floor(r() * 22);
    const h = 8 + Math.floor(r() * 30);
    g.r(x, 350 - h, w, h, haze2);
    x += w + Math.floor(r() * 4);
  }
  g.gradV(0, 330, SW, SH - 330, [haze, haze2, p.sky[4]!, p.sky[4]!, p.sky[4]!]);
}

/** Ordered-dither helper for soil sides. */
function strata(
  g: Pix,
  p: Pal,
  pts: [number, number][],
  topY: (x: number) => number,
  seed: number,
  dark: boolean,
) {
  const r = rng(seed);
  const bands = [
    p.soil[3],
    p.soil[2],
    p.soil[2],
    p.soil[1],
    p.soil[2],
    p.soil[1],
  ];
  g.polyFn(pts, (x, y) => {
    const v = y - topY(x);
    if (v < 2) return p.leaf[dark ? 1 : 2];
    if (v < 4) return p.leaf[dark ? 0 : 1];
    const b = bands[Math.min(bands.length - 1, Math.floor((v - 4) / 5))]!;
    const n = r();
    if (n < 0.06) return p.concrete[dark ? 1 : 2];
    if (n < 0.1) return p.soil[0];
    return dark ? mix(b, p.soil[0], 0.35) : b;
  });
}

/** Floating terrain slab with grass top, strata sides and a rocky taper beneath. */
export function island(
  I: Iso,
  p: Pal,
  nx: number,
  ny: number,
  d: number,
  seed = 1,
  skip?: (i: number, j: number) => boolean,
) {
  const { g } = I;
  const r = rng(seed);
  // underside taper
  const tip = I.p(nx * 0.5, ny * 0.5, -d - Math.min(nx, ny) * 0.42);
  const bl = I.p(0, ny, -d);
  const bm = I.p(nx, ny, -d);
  const br = I.p(nx, 0, -d);
  const rock = (pts: [number, number][], a: string, b: string, c: string) =>
    g.polyFn(pts, (x, y) =>
      (x + y) % 7 === 0 ? c : (x * 3 + y) % 5 === 0 ? b : a,
    );
  rock([bl, bm, tip], p.soil[1], p.soil[0], p.soil[2]);
  rock([bm, br, tip], mix(p.soil[1], p.soil[0], 0.5), p.soil[0], p.soil[1]);
  // side walls
  const lt = I.p(0, ny, 0);
  const rt = I.p(nx, ny, 0);
  const rr = I.p(nx, 0, 0);
  const ldn = I.p(0, ny, -d);
  strata(
    g,
    p,
    [lt, rt, I.p(nx, ny, -d), ldn],
    (x) => lt[1] + (x - lt[0]) * 0.5,
    seed + 1,
    false,
  );
  strata(
    g,
    p,
    [rt, rr, I.p(nx, 0, -d), I.p(nx, ny, -d)],
    (x) => rt[1] - (x - rt[0]) * 0.5,
    seed + 2,
    true,
  );
  // grass top, per-tile checker and noise
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      if (skip?.(i, j)) continue;
      const tone = (i + j) % 2 ? p.grass[2] : mix(p.grass[2], p.grass[3], 0.35);
      I.qT(0, i, i + 1, j, j + 1, tone);
    }
  for (let k = 0; k < nx * ny * 2.4; k++) {
    const [x, y] = I.p(r() * nx, r() * ny, 0);
    const t = r();
    g.p(x, y, t < 0.45 ? p.grass[4] : t < 0.8 ? p.leaf[2] : p.grass[1]);
    if (t > 0.7) g.p(x, y - 1, p.grass[4]);
  }
  const petals = [p.white, p.yellow[3], p.red[3], p.purple[3]];
  for (let k = 0; k < nx * ny * 0.12; k++) {
    const [x, y] = I.p(r() * nx, r() * ny, 0);
    g.p(x, y, petals[k % 4]!);
  }
  // rim highlight
  I.line3([0, 0, 0], [nx, 0, 0], p.grass[4]);
  I.line3([0, 0, 0], [0, ny, 0], p.grass[4]);
  I.line3([0, ny, 0], [nx, ny, 0], p.leaf[0]);
  I.line3([nx, 0, 0], [nx, ny, 0], p.leaf[0]);
}

/** Paved strip across the island (road/path). */
export function strip(
  I: Iso,
  p: Pal,
  axis: "x" | "y",
  at: number,
  width: number,
  len: number,
  mark = true,
) {
  const R = p.road;
  if (axis === "x") {
    I.qT(0.02, 0, len, at, at + width, R[2]);
    I.qT(0.02, 0, len, at, at + 0.3, p.concrete[3]);
    I.qT(0.02, 0, len, at + width - 0.3, at + width, p.concrete[2]);
    if (mark)
      for (let x = 0.6; x < len - 1; x += 2)
        I.qT(
          0.03,
          x,
          x + 1.1,
          at + width / 2 - 0.08,
          at + width / 2 + 0.08,
          p.yellow[3],
        );
  } else {
    I.qT(0.02, at, at + width, 0, len, R[2]);
    I.qT(0.02, at, at + 0.3, 0, len, p.concrete[3]);
    I.qT(0.02, at + width - 0.3, at + width, 0, len, p.concrete[2]);
    if (mark)
      for (let y = 0.6; y < len - 1; y += 2)
        I.qT(
          0.03,
          at + width / 2 - 0.08,
          at + width / 2 + 0.08,
          y,
          y + 1.1,
          p.yellow[3],
        );
  }
}

/** Glass data deck: translucent slab with a glowing grid and circuit traces. */
export function deck(
  I: Iso,
  p: Pal,
  nx: number,
  ny: number,
  d = 0.5,
  seed = 5,
) {
  const { g } = I;
  const top = p.night ? "rgba(20,70,120,.62)" : "rgba(210,240,255,.7)";
  const left = p.night ? "rgba(10,40,80,.8)" : "rgba(150,205,235,.85)";
  const right = p.night ? "rgba(6,28,60,.88)" : "rgba(110,170,205,.9)";
  const edge = p.night ? "#2ad4ff" : "#0b9fc4";
  I.qL(ny, 0, nx, -d, 0, left);
  I.qR(nx, 0, ny, -d, 0, right);
  I.qT(0, 0, nx, 0, ny, top);
  const line = p.night ? "rgba(42,212,255,.28)" : "rgba(11,159,196,.28)";
  for (let i = 0; i <= nx; i += 2) I.line3([i, 0, 0], [i, ny, 0], line);
  for (let j = 0; j <= ny; j += 2) I.line3([0, j, 0], [nx, j, 0], line);
  const r = rng(seed);
  const trace = p.night ? "rgba(42,212,255,.55)" : "rgba(11,130,170,.55)";
  for (let k = 0; k < nx * 0.9; k++) {
    let x = Math.floor(r() * nx),
      y = Math.floor(r() * ny);
    for (let s = 0; s < 3; s++) {
      const nxp = Math.min(
        nx,
        Math.max(
          0,
          x + (s % 2 ? 0 : (r() < 0.5 ? -1 : 1) * (1 + Math.floor(r() * 4))),
        ),
      );
      const nyp = Math.min(
        ny,
        Math.max(
          0,
          y + (s % 2 ? (r() < 0.5 ? -1 : 1) * (1 + Math.floor(r() * 3)) : 0),
        ),
      );
      I.line3([x, y, 0.01], [nxp, nyp, 0.01], trace);
      x = nxp;
      y = nyp;
    }
    const [sx, sy] = I.p(x, y, 0.01);
    g.r(sx - 1, sy - 1, 3, 2, edge);
  }
  I.line3([0, 0, 0], [nx, 0, 0], edge);
  I.line3([0, 0, 0], [0, ny, 0], edge);
  I.line3([0, ny, 0], [nx, ny, 0], edge);
  I.line3([nx, 0, 0], [nx, ny, 0], edge);
  I.line3([0, ny, -d], [nx, ny, -d], edge);
  I.line3([nx, 0, -d], [nx, ny, -d], edge);
  I.line3([0, ny, 0], [0, ny, -d], edge);
  I.line3([nx, ny, 0], [nx, ny, -d], edge);
  I.line3([nx, 0, 0], [nx, 0, -d], edge);
  // glow below
  const [cx, cy] = I.p(nx / 2, ny / 2, -d);
  g.ell(
    cx,
    cy + 10,
    Math.round(((nx + ny) * TW) / 5),
    Math.round(((nx + ny) * TH) / 9),
    p.night ? "rgba(42,212,255,.07)" : "rgba(11,159,196,.05)",
  );
}

export function tree(
  I: Iso,
  p: Pal,
  x: number,
  y: number,
  s = 1,
  kind: "round" | "pine" | "tall" = "round",
) {
  I.shadow(x - 0.8 * s, y - 0.8 * s, 1.8 * s, 1.8 * s, 0.28);
  if (kind === "pine") {
    I.cyl(x, y, 0, 0.16 * s, 1.0 * s, p.wood);
    for (let i = 0; i < 4; i++)
      cone(
        I,
        p,
        x,
        y,
        (0.7 + i * 0.95) * s,
        (1.25 - i * 0.2) * s,
        1.5 * s,
        i % 2 ? p.leaf : p.grass,
      );
    return;
  }
  I.cyl(x, y, 0, 0.2 * s, 1.8 * s, p.wood);
  const blobs: [number, number, number, number][] = [
    [0, 0, 3.0, 1.2],
    [-0.4, 0.3, 2.5, 0.95],
    [0.5, -0.2, 2.6, 0.95],
    [0.1, 0.1, 3.7, 0.9],
  ];
  for (const [dx, dy, z, rr] of blobs) {
    const [bx, by] = I.p(x + dx * s, y + dy * s, z * s);
    I.g.ball(bx, by, Math.round(rr * s * 9), p.leaf);
  }
}

/** Iso cone: apex above, elliptical base, left half lit. */
export function cone(
  I: Iso,
  p: Pal,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  R: Ramp,
) {
  const [cx, cy] = I.p(x, y, z);
  const rx = Math.round(r * 11.3),
    ry = Math.round(r * 5.66),
    hp = Math.round(h * ZH);
  const arc: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI;
    arc.push([
      cx - Math.round(Math.cos(a) * rx),
      cy + Math.round(Math.sin(a) * ry),
    ]);
  }
  I.g.poly([[cx, cy - hp], ...arc], R[0]);
  I.g.poly(
    [
      [cx, cy - hp + 1],
      ...arc.map(
        ([ax, ay]) => [ax + (ax < cx ? 1 : -1), ay - 1] as [number, number],
      ),
    ],
    R[2],
  );
  I.g.poly(
    [
      [cx, cy - hp + 1],
      [cx - rx + 1, cy],
      ...arc
        .slice(0, 7)
        .map(([ax, ay]) => [ax + 1, ay - 1] as [number, number]),
      [cx, cy + ry - 1],
    ],
    R[3],
  );
  I.g.poly(
    [
      [cx, cy - hp + 1],
      [cx, cy + ry - 1],
      ...arc.slice(7).map(([ax, ay]) => [ax - 1, ay - 1] as [number, number]),
      [cx + rx - 1, cy],
    ],
    R[1],
  );
  I.g.p(cx, cy - hp, R[4]);
}

export function bush(I: Iso, p: Pal, x: number, y: number, s = 1) {
  I.shadow(x - 0.4, y - 0.4, 1.2 * s, 1.2 * s, 0.25);
  for (const [dx, dy, rr] of [
    [-0.3, 0, 5],
    [0.3, 0.1, 5],
    [0, -0.2, 6],
  ] as const) {
    const [bx, by] = I.p(x + dx, y + dy, 0.5 * s);
    I.g.ball(bx, by, Math.round(rr * s), p.leaf);
  }
}

/** Picket / mesh fence along an axis. */
export function fence(
  I: Iso,
  p: Pal,
  x: number,
  y: number,
  len: number,
  axis: "x" | "y",
  h = 0.9,
  mesh = false,
) {
  for (let i = 0; i <= len; i += 1) {
    const px = axis === "x" ? x + i : x;
    const py = axis === "y" ? y + i : y;
    I.line3([px, py, 0], [px, py, h], p.wood[2]);
    I.line3([px, py, h], [px, py, h], p.wood[4]);
  }
  const a: P3 = [x, y, h * 0.8];
  const b: P3 = axis === "x" ? [x + len, y, h * 0.8] : [x, y + len, h * 0.8];
  I.line3(a, b, p.wood[3]);
  I.line3([a[0], a[1], h * 0.35], [b[0], b[1], h * 0.35], p.wood[3]);
  if (mesh)
    for (let i = 0; i < len; i += 0.5)
      I.line3(
        [axis === "x" ? x + i : x, axis === "y" ? y + i : y, 0],
        [axis === "x" ? x + i + 0.5 : x, axis === "y" ? y + i + 0.5 : y, h],
        p.metal[2],
      );
}

/** Street lamp. */
export function lamp(I: Iso, p: Pal, x: number, y: number, h = 3) {
  I.cyl(x, y, 0, 0.1, h, p.dark);
  I.box(x - 0.25, y - 0.25, h, 0.5, 0.5, 0.25, p.metal);
  const [sx, sy] = I.p(x, y, h);
  I.g.r(sx - 2, sy + 2, 5, 2, p.yellow[4]);
}

/** Tiny person sprite, ~7x14 px. */
export function person(
  g: Pix,
  p: Pal,
  x: number,
  y: number,
  shirt: Ramp,
  hat?: Ramp,
) {
  g.r(x + 1, y + 11, 2, 4, p.dark[1]);
  g.r(x + 4, y + 11, 2, 4, p.dark[1]);
  g.slab(x, y + 4, 7, 8, shirt);
  g.r(x - 1, y + 5, 2, 5, shirt[1]);
  g.r(x + 6, y + 5, 2, 5, shirt[1]);
  g.ball(x + 3, y + 2, 3, p.skin);
  if (hat) g.r(x, y - 1, 7, 2, hat[2]);
}

/** Iso car built from boxes. Faces +x. */
export function car(I: Iso, p: Pal, x: number, y: number, body: Ramp) {
  I.shadow(x - 0.2, y - 0.2, 3.2, 1.8, 0.32);
  I.box(x, y, 0.3, 3, 1.4, 0.7, body);
  I.box(x + 0.7, y + 0.1, 1.0, 1.7, 1.2, 0.6, body);
  I.qL(y + 1.3, x + 0.8, x + 2.4, 1.05, 1.5, p.glass[2]);
  I.qR(x + 2.4, y + 0.2, y + 1.3, 1.05, 1.5, p.glass[1]);
  I.qL(y + 1.4, x + 0.35, x + 0.75, 0.55, 0.9, p.glass[2]);
  for (const wx of [0.6, 2.4]) {
    const [sx, sy] = I.p(x + wx, y + 1.45, 0.3);
    I.g.ball(sx, sy, 3, p.dark);
  }
  const [hx, hy] = I.p(x + 3, y + 0.3, 0.6);
  I.g.r(hx - 1, hy, 2, 2, p.yellow[4]);
}
export { TW, TH, ZH };
void SH;

/** Bitmap box that tightly holds a footprint of sx x sy grid cells and height z. */
export function fitBox(
  sx: number,
  sy: number,
  z: number,
  e: { top?: number; bottom?: number; left?: number; right?: number } = {},
) {
  const left = sy * (TW / 2) + (e.left ?? 6);
  const right = sx * (TW / 2) + (e.right ?? 6);
  const top = z * ZH + (e.top ?? 6);
  const bottom = (sx + sy) * (TH / 2) + (e.bottom ?? 16);
  return {
    w: Math.round(left + right),
    h: Math.round(top + bottom),
    ax: Math.round(left),
    ay: Math.round(top),
  };
}

/** Scaled little person. */
export function personS(
  g: Pix,
  p: Pal,
  x: number,
  y: number,
  s: number,
  shirt: Ramp,
  hat?: Ramp,
) {
  const r = (dx: number, dy: number, w: number, h: number, c: string) =>
    g.r(x + dx * s, y + dy * s, w * s, h * s, c);
  r(1, 11, 2, 4, p.dark[1]);
  r(4, 11, 2, 4, p.dark[1]);
  r(0, 4, 7, 8, shirt[2]);
  r(0, 4, 2, 8, shirt[3]);
  r(5, 4, 2, 8, shirt[1]);
  r(-1, 5, 1, 5, shirt[1]);
  r(7, 5, 1, 5, shirt[1]);
  r(1, 0, 5, 4, p.skin[2]);
  r(1, 0, 2, 3, p.skin[3]);
  if (hat) {
    r(0, -1, 7, 2, hat[2]);
    r(1, -2, 5, 1, hat[3]);
  }
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
  g.r(x + 5, y + 9, 2, 4, p.outline);
}

export function key(g: Pix, p: Pal, x: number, y: number) {
  g.ball(x + 5, y + 5, 5, p.yellow);
  g.disc(x + 5, y + 5, 2, p.outline);
  g.r(x + 9, y + 4, 16, 3, p.yellow[0]);
  g.r(x + 9, y + 4, 16, 2, p.yellow[2]);
  g.r(x + 18, y + 7, 3, 4, p.yellow[1]);
  g.r(x + 23, y + 7, 3, 3, p.yellow[1]);
}
