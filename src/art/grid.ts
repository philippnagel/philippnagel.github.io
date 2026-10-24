import type { Pal } from "../palette";
import { Iso } from "../iso";
import { sagPts, type Pix } from "../pix";
import type { SceneDef } from "../types";
import {
  bush,
  car,
  deck,
  fence,
  fitBox,
  island,
  isoAnim,
  label,
  lamp,
  person,
  personS,
  place,
  sky,
  strip,
  tree,
} from "./kit";
import { clouds } from "./common";

const ISL = new Iso(undefined as unknown as Pix, 300, 170);
const DEC = new Iso(undefined as unknown as Pix, 640, 80);
const NX = 56,
  NY = 22;
const LAB = (I: Iso, p: Pal, sx: number, sy: number, text: string) =>
  label(
    I.g,
    p,
    I.ox + (((sx - sy) * 8) / 2) * 1,
    I.oy + (sx + sy) * 4 + 8,
    text,
  );

// ---- generation: wind + solar ----
const genBox = fitBox(11, 9, 11);
const genDraw = (I: Iso, p: Pal) => {
  I.shadow(0.5, 0.5, 10, 8, 0.2);
  for (const [x, y, h] of [
    [3, 2.5, 10],
    [8, 5, 8.5],
  ] as const) {
    I.shadow(x - 0.5, y - 0.5, 1.4, 1.4, 0.35);
    I.cyl(x, y, 0, 0.42, h * 0.55, p.metal);
    I.cyl(x, y, h * 0.55, 0.3, h * 0.45, p.metal);
    I.box(x - 0.5, y - 0.45, h - 0.1, 1.1, 0.9, 0.7, p.concrete);
  }
  // solar field, tilted panels in rows
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 4; i++) {
      const x = 0.4 + i * 2.5,
        y = 5.6 + row * 1.35;
      I.line3([x + 0.3, y + 0.6, 0], [x + 0.3, y + 0.6, 0.55], p.metal[1]);
      I.line3([x + 2.0, y + 0.6, 0], [x + 2.0, y + 0.6, 0.55], p.metal[1]);
      const A: [number, number, number] = [x, y + 1.1, 0.35],
        B: [number, number, number] = [x + 2.3, y + 1.1, 0.35],
        C: [number, number, number] = [x + 2.3, y + 0.1, 1.0],
        D: [number, number, number] = [x, y + 0.1, 1.0];
      I.poly3([A, B, C, D], p.pv[0]);
      const m = 0.08;
      I.poly3(
        [
          [x + m, y + 1.05, 0.38],
          [x + 2.3 - m, y + 1.05, 0.38],
          [x + 2.3 - m, y + 0.15, 0.97],
          [x + m, y + 0.15, 0.97],
        ],
        p.pv[2],
      );
      for (let k = 1; k < 5; k++)
        I.line3(
          [x + k * 0.46, y + 1.05, 0.38],
          [x + k * 0.46, y + 0.15, 0.97],
          p.pv[1],
        );
      I.line3([x + m, y + 0.6, 0.67], [x + 2.3 - m, y + 0.6, 0.67], p.pv[1]);
      I.line3([x, y + 0.1, 1.0], [x + 2.3, y + 0.1, 1.0], p.pv[4]);
      const [gx, gy] = I.p(x + 1.2, y + 0.45, 0.8);
      I.g.p(gx, gy, p.white);
    }
  // battery container + outlet pole
  I.box(6.2, 0.4, 0, 3.6, 1.8, 1.7, p.steel);
  for (let k = 0; k < 6; k++)
    I.qL(2.2, 6.4 + k * 0.55, 6.4 + k * 0.55 + 0.3, 0.3, 1.4, p.steel[1]);
  I.qL(2.2, 9.2, 9.7, 0.2, 1.3, p.leaf[2]);
  I.cyl(10.5, 3, 0, 0.14, 4.5, p.wood);
  I.box(10.1, 1.7, 4.2, 0.4, 2.6, 0.2, p.wood);
  LAB(I, p, 11, 9, "GENERATION");
};
const genAnim = isoAnim(genBox, (I, t, p) => {
  for (const [x, y, h, L, ph] of [
    [3, 2.5, 10, 4.6, 0],
    [8, 5, 8.5, 3.9, 1.3],
  ] as const) {
    const hub: [number, number, number] = [x + 0.1, y + 0.55, h + 0.25];
    for (let i = 0; i < 3; i++) {
      const a = t * (0.8 + ph * 0.1) + ph + (i * Math.PI * 2) / 3;
      const dx = Math.cos(a),
        dz = Math.sin(a);
      const tip: [number, number, number] = [
        hub[0] + dx * L,
        hub[1],
        hub[2] + dz * L,
      ];
      const w = 0.28;
      const r1: [number, number, number] = [
        hub[0] - dz * w,
        hub[1],
        hub[2] + dx * w,
      ];
      const r2: [number, number, number] = [
        hub[0] + dz * w,
        hub[1],
        hub[2] - dx * w,
      ];
      const m: [number, number, number] = [
        hub[0] + dx * L * 0.4 - dz * w * 1.3,
        hub[1],
        hub[2] + dz * L * 0.4 + dx * w * 1.3,
      ];
      I.poly3([r1, m, tip, r2], p.white);
      I.line3(hub, tip, p.metal[2]);
    }
    const [hx, hy] = I.p(...hub);
    I.g.ball(hx, hy, 3, p.concrete);
  }
});

// ---- transmission pylon ----
const tsoBox = fitBox(2, 5, 12, { left: 40, right: 40 });
const tsoDraw = (I: Iso, p: Pal) => {
  const c = 1;
  I.shadow(-1, 0.5, 3.4, 3.4, 0.28);
  const corners = (z: number, h: number): [number, number][] => [
    [c - h, 2.5 - h],
    [c + h, 2.5 - h],
    [c + h, 2.5 + h],
    [c - h, 2.5 + h],
  ];
  const zs = [0, 3, 6, 9, 12];
  const half = (z: number) => 1.0 - (z / 12) * 0.75;
  for (let k = 0; k < 4; k++) {
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      const a: [number, number, number] = [
        c + sx * half(zs[k]!),
        2.5 + sy * half(zs[k]!),
        zs[k]!,
      ];
      const b: [number, number, number] = [
        c + sx * half(zs[k + 1]!),
        2.5 + sy * half(zs[k + 1]!),
        zs[k + 1]!,
      ];
      I.line3(a, b, sx > 0 || sy > 0 ? p.steel[1] : p.steel[2]);
    }
  }
  for (let k = 0; k < zs.length; k++) {
    const h = half(zs[k]!);
    const pts = corners(zs[k]!, h);
    for (let i = 0; i < 4; i++) {
      const a = pts[i]!,
        b = pts[(i + 1) % 4]!;
      I.line3([a[0], a[1], zs[k]!], [b[0], b[1], zs[k]!], p.steel[3]);
    }
    if (k < zs.length - 1) {
      const h2 = half(zs[k + 1]!);
      // X braces on the +y and +x faces
      I.line3(
        [c - h, 2.5 + h, zs[k]!],
        [c + h2, 2.5 + h2, zs[k + 1]!],
        p.steel[2],
      );
      I.line3(
        [c + h, 2.5 + h, zs[k]!],
        [c - h2, 2.5 + h2, zs[k + 1]!],
        p.steel[2],
      );
      I.line3(
        [c + h, 2.5 - h, zs[k]!],
        [c + h2, 2.5 + h2, zs[k + 1]!],
        p.steel[2],
      );
      I.line3(
        [c + h, 2.5 + h, zs[k]!],
        [c + h2, 2.5 - h2, zs[k + 1]!],
        p.steel[2],
      );
    }
  }
  for (const [z, len] of [
    [5.2, 2.0],
    [8.0, 2.5],
    [10.8, 2.0],
  ] as const) {
    I.box(c - 0.13, 2.5 - len, z, 0.26, len * 2, 0.26, p.steel);
    I.line3([c, 2.5 - len + 0.3, z], [c, 2.5, z + 0.9], p.steel[2]);
    I.line3([c, 2.5 + len - 0.3, z], [c, 2.5, z + 0.9], p.steel[2]);
    for (const y of [2.5 - len + 0.1, 2.5 + len - 0.1]) {
      for (let i = 0; i < 4; i++)
        I.box(
          c - 0.1,
          y - 0.1,
          z - 0.22 - i * 0.2,
          0.2,
          0.2,
          0.15,
          p.concrete,
          { edges: false },
        );
    }
  }
  I.cyl(c, 2.5, 12, 0.12, 0.6, p.steel);
};
const tsoAnim = isoAnim(tsoBox, (I, t, p) => {
  if (Math.sin(t * 3) > 0.2) {
    const [x, y] = I.p(1, 2.5, 13);
    I.g.r(x - 1, y - 1, 3, 3, p.red[3]);
  }
});

// ---- substation ----
const dsoBox = fitBox(9, 6, 7);
const dsoDraw = (I: Iso, p: Pal) => {
  I.shadow(0.4, 0.4, 9, 6, 0.2);
  I.box(0, 0, 0, 9, 6, 0.2, p.concrete, { tex: true });
  fence(I, p, 0, 6, 9, "x", 1.1, true);
  fence(I, p, 9, 0, 6, "y", 1.1, true);
  fence(I, p, 0, 0, 6, "y", 1.1, true);
  // gantry
  for (const [x, y] of [
    [1, 1],
    [1, 5],
    [7.5, 1],
    [7.5, 5],
  ] as const)
    I.cyl(x, y, 0.2, 0.12, 5, p.steel);
  I.box(0.9, 0.9, 5.2, 0.2, 4.2, 0.2, p.steel);
  I.box(7.4, 0.9, 5.2, 0.2, 4.2, 0.2, p.steel);
  I.box(0.9, 0.9, 4.6, 6.7, 0.2, 0.2, p.steel);
  for (const [x, y] of [
    [2, 1],
    [4, 1],
    [6, 1],
  ] as const)
    for (let i = 0; i < 3; i++)
      I.box(x - 0.08, y - 0.08, 4.4 - i * 0.2, 0.16, 0.16, 0.12, p.concrete, {
        edges: false,
      });
  // transformers
  for (const x of [1.6, 5.2]) {
    I.box(x, 2.2, 0.2, 2.2, 1.6, 1.6, p.metal);
    for (let k = 0; k < 6; k++)
      I.qL(
        3.8,
        x + 0.2 + k * 0.33,
        x + 0.2 + k * 0.33 + 0.18,
        0.35,
        1.45,
        p.metal[1],
      );
    I.box(x + 0.2, 2.4, 1.8, 1.8, 1.2, 0.35, p.steel);
    for (let k = 0; k < 3; k++)
      I.cyl(x + 0.55 + k * 0.55, 2.8, 2.15, 0.12, 0.9, p.wood, p.wood[4]);
    I.box(x + 2.2, 2.4, 0.5, 0.35, 1.2, 1.1, p.metal);
  }
  // control hut
  I.box(6.6, 4.4, 0.2, 2.0, 1.3, 1.8, p.wall, { tex: true });
  I.gable(6.5, 4.3, 2.0, 2.2, 1.5, 0.7, p.roof, p.wall, "x");
  I.qL(5.7, 7.0, 7.7, 0.2, 1.4, p.wood[2]);
  I.qL(5.7, 7.9, 8.4, 0.9, 1.5, p.glass[2]);
  const [sx, sy] = I.p(0.2, 6, 0.9);
  I.g.poly(
    [
      [sx, sy - 7],
      [sx + 6, sy + 3],
      [sx - 6, sy + 3],
    ],
    p.yellow[2],
  );
  I.g.r(sx, sy - 3, 1, 4, p.outline);
  LAB(I, p, 9, 6, "SUBSTATION");
};

// ---- pole transformer ----
const trafoBox = fitBox(3, 3, 8);
const trafoDraw = (I: Iso, p: Pal) => {
  I.shadow(0.4, 0.4, 2, 2, 0.28);
  I.cyl(1.5, 1.5, 0, 0.17, 7.6, p.wood);
  I.box(0.5, 1.35, 6.8, 2, 0.3, 0.25, p.wood);
  for (let k = 0; k < 3; k++)
    I.cyl(0.7 + k * 0.75, 1.5, 7.05, 0.07, 0.5, p.concrete, p.concrete[4]);
  I.cyl(2.1, 1.8, 3.6, 0.5, 1.5, p.steel);
  I.cyl(2.1, 1.8, 5.1, 0.12, 0.5, p.wood, p.wood[4]);
  I.box(0.75, 1.5, 3.4, 0.5, 0.35, 0.8, p.metal);
  I.line3([1.5, 1.5, 3.6], [1.5, 1.5, 0.3], p.dark[2]);
  I.line3([1.5, 1.5, 6.6], [2.1, 1.8, 5.1], p.dark[2]);
  LAB(I, p, 3, 3, "TRAFO");
};

// ---- house (portal) ----
const HX = 7.5,
  HY = 5.2;
const houseBox = (() => {
  const b = fitBox(HX + 2, HY + 3, 7, { top: 30 });
  return b;
})();
const houseDraw = (I: Iso, p: Pal) => {
  const x0 = 1,
    y0 = 1,
    z0 = 0.2;
  I.shadow(x0 - 0.2, y0 - 0.2, HX + 1, HY + 1, 0.3);
  // garden plot
  I.box(0, 0, 0, HX + 2, HY + 3, 0.2, p.grass, { tex: true });
  for (let k = 0; k < HX; k++)
    I.qT(
      0.21,
      x0 + 3.2,
      x0 + 4.2,
      y0 + HY,
      y0 + HY + 1.8,
      p.concrete[k % 2 ? 2 : 3],
    );
  // walls
  I.box(x0, y0, z0, HX, HY, 3.2, p.wall, { tex: true });
  for (let z = 0.9; z < 3.2; z += 0.55)
    I.line3([x0, y0 + HY, z0 + z], [x0 + HX, y0 + HY, z0 + z], p.wall[1]);
  // left face (+y): two windows + door
  const win = (xs: number, ys: number, zl: number) => {
    I.qL(ys, xs - 0.12, xs + 1.5, zl - 0.12, zl + 1.4, p.paper[3]);
    I.qL(ys, xs, xs + 1.38, zl, zl + 1.28, p.glass[2]);
    I.qL(ys, xs, xs + 1.38, zl + 0.85, zl + 1.28, p.glass[3]);
    I.line3([xs + 0.69, ys, zl], [xs + 0.69, ys, zl + 1.28], p.paper[2]);
    I.line3([xs, ys, zl + 0.64], [xs + 1.38, ys, zl + 0.64], p.paper[2]);
    I.box(xs - 0.15, ys, zl - 0.35, 1.7, 0.3, 0.25, p.wood);
    for (let k = 0; k < 4; k++) {
      const [fx, fy] = I.p(xs + 0.1 + k * 0.42, ys + 0.2, zl - 0.05);
      I.g.p(fx, fy, k % 2 ? p.red[3] : p.yellow[3]);
    }
  };
  win(x0 + 0.6, y0 + HY, z0 + 1.0);
  win(x0 + 5.3, y0 + HY, z0 + 1.0);
  I.qL(y0 + HY, x0 + 3.3, x0 + 4.6, z0, z0 + 2.4, p.paper[3]);
  I.qL(y0 + HY, x0 + 3.4, x0 + 4.5, z0, z0 + 2.3, p.wood[2]);
  I.qL(y0 + HY, x0 + 3.6, x0 + 4.3, z0 + 1.2, z0 + 2.1, p.glass[2]);
  const [kx, ky] = I.p(x0 + 4.3, y0 + HY, z0 + 1.1);
  I.g.p(kx, ky, p.yellow[4]);
  I.box(x0 + 3.1, y0 + HY, z0, 1.7, 0.7, 0.18, p.concrete);
  // right face (+x): window + meter box
  I.qR(x0 + HX, y0 + 1.1, y0 + 2.5, z0 + 1.0, z0 + 2.3, p.paper[2]);
  I.qR(x0 + HX, y0 + 1.2, y0 + 2.4, z0 + 1.1, z0 + 2.2, p.glass[1]);
  I.box(x0 + HX, y0 + 3.4, z0 + 1.0, 0.25, 0.8, 1.2, p.metal);
  I.qR(x0 + HX + 0.25, y0 + 3.5, y0 + 4.1, z0 + 1.9, z0 + 2.1, p.leaf[2]);
  // roof + PV on the +y slope
  I.gable(
    x0 - 0.5,
    y0 - 0.5,
    z0 + 3.2,
    HX + 1,
    HY + 1,
    2.4,
    p.roof,
    p.wall,
    "x",
  );
  const sy = HY + 1,
    my = sy / 2,
    zz = (yy: number) => z0 + 3.2 + ((y0 - 0.5 + sy - yy) / my) * 2.4;
  for (let i = 0; i < 3; i++) {
    const xa = x0 + 0.4 + i * 2.1,
      xb = xa + 1.9,
      ya = y0 - 0.5 + sy - 0.4,
      yb = y0 - 0.5 + my + 0.3;
    I.poly3(
      [
        [xa, ya, zz(ya)],
        [xb, ya, zz(ya)],
        [xb, yb, zz(yb)],
        [xa, yb, zz(yb)],
      ],
      p.pv[0],
    );
    I.poly3(
      [
        [xa + 0.07, ya - 0.06, zz(ya - 0.06)],
        [xb - 0.07, ya - 0.06, zz(ya - 0.06)],
        [xb - 0.07, yb + 0.06, zz(yb + 0.06)],
        [xa + 0.07, yb + 0.06, zz(yb + 0.06)],
      ],
      p.pv[2],
    );
    for (let k = 1; k < 4; k++)
      I.line3(
        [xa + k * 0.47, ya, zz(ya)],
        [xa + k * 0.47, yb, zz(yb)],
        p.pv[1],
      );
    const [gx, gy] = I.p(xa + 0.35, ya - 0.5, zz(ya - 0.5));
    I.g.p(gx, gy, p.white);
  }
  // chimney
  I.box(x0 + 5.6, y0 + 1.1, z0 + 3.6, 0.8, 0.8, 2.4, p.roof, { tex: true });
  I.box(x0 + 5.5, y0 + 1.0, z0 + 6.0, 1.0, 1.0, 0.2, p.concrete);
  // garden
  fence(I, p, 0.2, y0 + HY + 2.6, HX + 1.4, "x", 0.8);
  fence(I, p, 0.2, y0 + HY + 2.6 - 0 - 2.4, 2.4, "y", 0.8);
  bush(I, p, x0 + 0.2, y0 + HY + 0.9, 1.1);
  bush(I, p, x0 + HX - 0.8, y0 + HY + 0.9, 1.1);
  LAB(I, p, HX + 2, HY + 3, "METERING POINT");
};
const houseAnim = isoAnim(houseBox, (I, t, p) => {
  for (let i = 0; i < 6; i++) {
    const u = (t * 0.4 + i / 6) % 1;
    const [x, y] = I.p(6.8, 2.1, 6.3);
    I.g.ell(
      Math.round(x + Math.sin(u * 7 + i) * 3 + u * 14),
      Math.round(y - u * 28),
      2 + Math.round(u * 4),
      2 + Math.round(u * 3),
      p.night
        ? `rgba(170,180,200,${0.3 * (1 - u)})`
        : `rgba(240,242,248,${0.85 * (1 - u)})`,
    );
  }
  const [mx, my] = I.p(1 + 7.5 + 0.25, 1 + 3.7, 2.8);
  if (Math.sin(t * 4) > 0) I.g.p(mx, my, p.data);
});

// ---- data deck objects ----
const regBox = fitBox(8, 5, 8);
const regDraw = (I: Iso, p: Pal) => {
  I.shadow(0.2, 0.2, 8, 5, 0.2);
  I.box(0, 0, 0, 8, 5, 0.3, p.concrete);
  I.box(0.4, 0.4, 0.3, 7.2, 4.2, 0.3, p.concrete);
  I.box(0.8, 0.8, 0.6, 6.4, 3.4, 3.2, p.wall, { tex: true });
  I.qL(4.2, 3.3, 4.7, 0.6, 2.4, p.dark[1]);
  for (const [a, b] of [
    [1.4, 2.2],
    [5.4, 6.2],
  ] as const)
    I.qL(4.2, a, b, 1.6, 2.8, p.glass[2]);
  I.qR(7.2, 1.6, 2.4, 1.6, 2.8, p.glass[1]);
  I.qR(7.2, 2.8, 3.6, 1.6, 2.8, p.glass[1]);
  for (let i = 0; i < 6; i++)
    I.cyl(1.2 + i * 1.12, 4.5, 0.6, 0.22, 3.4, p.concrete, p.concrete[4]);
  I.box(0.6, 0.8, 4.0, 6.8, 4.0, 0.4, p.concrete);
  I.gable(0.6, 0.8, 4.4, 6.8, 4.0, 1.5, p.concrete, p.concrete, "y", false);
  const [fx, fy] = I.p(4, 4.6, 6.5);
  I.g.ball(fx, fy + 3, 3, p.yellow);
  I.cyl(4, 2.8, 5.9, 0.05, 1.6, p.metal);
  label(I.g, p, I.ox + 0, I.oy + 9 * 4 + 6, "REGULATOR");
};
const regAnim = isoAnim(regBox, (I, t, p) => {
  const [x, y] = I.p(4, 2.8, 7.5);
  for (let i = 0; i < 18; i++) {
    const yo = Math.round(Math.sin(t * 5 + i * 0.5) * 1.6);
    I.g.r(x + 1 + i, y + yo, 1, 6, i % 5 < 3 ? p.red[2] : p.red[3]);
  }
});

const stdBox = fitBox(5, 4, 6);
const stdDraw = (I: Iso, p: Pal) => {
  I.shadow(0.3, 0.3, 5, 4, 0.25);
  for (let k = 0; k < 4; k++) {
    I.box(0.3 + k * 0.12, 0.3, k * 0.5, 3.8, 3, 0.4, p.paper, { edges: true });
    for (let l = 0; l < 4; l++)
      I.line3(
        [0.6 + k * 0.12, 3.3, k * 0.5 + 0.2],
        [3.4 - (l % 2) * 0.9 + k * 0.12, 3.3, k * 0.5 + 0.2],
        p.metal[2],
      );
    I.qL(
      3.3,
      0.5 + k * 0.12,
      1.8 + k * 0.12,
      k * 0.5 + 0.08,
      k * 0.5 + 0.3,
      p.cyan[2],
    );
  }
  I.cyl(4.1, 1.5, 0, 0.5, 1.4, p.concrete);
  const [bx, by] = I.p(1.9, 1.7, 3.6);
  I.g.ball(bx, by, 8, p.leaf);
  I.g.line(bx - 4, by, bx - 1, by + 3, p.white);
  I.g.line(bx - 1, by + 3, bx + 4, by - 3, p.white);
  I.g.line(bx - 4, by + 1, bx - 1, by + 4, p.white);
  I.g.line(bx - 1, by + 4, bx + 4, by - 2, p.white);
  label(I.g, p, I.ox + 8, I.oy + 9 * 4 + 6, "STANDARDS");
};
const stdAnim = isoAnim(stdBox, (I, t, p) => {
  const cx = 4.1,
    cy = 1.5,
    cz = 1.45;
  for (let i = 0; i < 10; i++) {
    const a = t * 0.8 + (i * Math.PI * 2) / 10;
    const [x, y] = I.p(cx + Math.cos(a) * 0.85, cy + Math.sin(a) * 0.85, cz);
    I.g.r(x - 1, y - 1, 3, 3, p.metal[3]);
  }
  I.disc(cx, cy, cz, 0.65, p.metal[2]);
  I.disc(cx, cy, cz, 0.22, p.dark[2]);
});

const secBox = fitBox(4, 4, 8);
const secDraw = (I: Iso, p: Pal) => {
  I.shadow(0.2, 0.2, 4, 4, 0.25);
  I.cyl(2, 2, 0, 1.5, 0.5, p.steel);
  I.cyl(2, 2, 0.5, 1.2, 0.2, p.concrete);
  const sh: [number, number][] = [
    [0.3, 6.2],
    [2, 7.2],
    [3.7, 6.2],
    [3.7, 3.4],
    [2, 1.2],
    [0.3, 3.4],
  ];
  const y = 2.4;
  I.poly3(
    sh.map(([u, v]) => [u + 0, y + 0.45, v + 0.8] as [number, number, number]),
    p.cyan[0],
  );
  I.poly3(
    sh.map(([u, v]) => [u, y, v + 0.8] as [number, number, number]),
    p.cyan[2],
  );
  I.poly3(
    [
      [0.3, y, 7.0],
      [2, y, 8.0],
      [2, y, 4.5],
      [0.3, y, 4.2],
    ],
    p.cyan[3],
  );
  I.poly3(
    [
      [2, y, 8.0],
      [3.7, y, 7.0],
      [3.7, y, 4.2],
      [2, y, 4.5],
    ],
    p.cyan[1],
  );
  const [lx, ly] = I.p(2, y, 5.1);
  I.g.slab(lx - 6, ly - 2, 12, 11, p.yellow);
  I.g.r(lx - 3, ly - 8, 2, 7, p.metal[0]);
  I.g.r(lx + 2, ly - 8, 2, 7, p.metal[0]);
  I.g.r(lx - 3, ly - 8, 7, 2, p.metal[0]);
  I.g.r(lx, ly + 2, 1, 4, p.outline);
  label(I.g, p, I.ox + 0, I.oy + 8 * 4 + 6, "SECURITY");
};
const secAnim = isoAnim(secBox, (I, t, p) => {
  const [cx, cy] = I.p(2, 2.4, 4.8);
  I.g.ell(cx, cy, 36, 14, "rgba(0,0,0,0)");
  for (let i = 0; i < 16; i++) {
    const a = t * 1.2 + (i * Math.PI * 2) / 16;
    const x = cx + Math.cos(a) * 34,
      y = cy + Math.sin(a) * 14;
    I.g.r(Math.round(x), Math.round(y), 2, 2, i % 4 ? p.data : p.white);
  }
});

const rolesBox = fitBox(11, 5, 6);
const rolesDraw = (I: Iso, p: Pal) => {
  I.shadow(0.2, 0.2, 11, 5, 0.2);
  const cols = [p.purple, p.cyan, p.amber] as const;
  const names = ["OPERATOR", "SUPPLIER", "METERING"];
  for (let k = 0; k < 3; k++) {
    const x = 1.6 + k * 3.7;
    I.cyl(x + 0.4, 2.2, 0, 1.0, 0.7, cols[k]!, cols[k]![4]);
    I.cyl(x + 0.4, 2.2, 0.7, 0.75, 0.15, p.concrete);
    const [px, py] = I.p(x + 0.4, 2.2, 0.85);
    personS(
      I.g,
      p,
      px - 7,
      py - 36,
      2,
      cols[k]!,
      k === 0 ? p.yellow : undefined,
    );
    const [lx, ly] = I.p(x + 0.4, 2.2, 6);
    if (k === 0) {
      I.g.line(lx, ly - 26, lx - 5, ly - 8, p.steel[3]);
      I.g.line(lx, ly - 26, lx + 5, ly - 8, p.steel[3]);
      I.g.r(lx - 7, ly - 21, 15, 2, p.steel[3]);
      I.g.r(lx - 5, ly - 14, 11, 1, p.steel[3]);
    } else if (k === 1) {
      I.g.ball(lx, ly - 16, 7, p.yellow);
      I.g.slab(lx - 3, ly - 9, 7, 5, p.metal);
    } else {
      I.g.slab(lx - 8, ly - 28, 17, 18, p.paper);
      I.g.r(lx - 6, ly - 26, 13, 5, p.leaf[2]);
      I.g.disc(lx, ly - 15, 3, p.metal[2]);
    }
    label(
      I.g,
      p,
      I.ox + (x + 0.4 - 2.2) * 8,
      I.oy + (x + 0.4 + 2.2) * 4 + 6,
      names[k]!,
    );
  }
  for (let i = 0; i < 28; i++) {
    const a = 3.0 + i * 0.13;
    const [x, y] = I.p(a, 2.2, 0.8);
    if (i % 2 === 0 && (a < 4.2 || (a > 4.6 && a < 7.4) || a > 8.0))
      I.g.r(x, y, 2, 2, p.data);
  }
  label(I.g, p, I.ox + (11 - 5) * 4, I.oy + 16 * 4 + 6, "MARKET ROLES");
};

export const grid: SceneDef = {
  id: "grid",
  name: "Grid",
  hint: "Hover or click anything. Power flows through the ground layer, rules and messages through the data layer. Dive into the house.",
  bg(g, p) {
    sky(g, p, 11);
    const I = new Iso(g, ISL.ox, ISL.oy);
    const D = new Iso(g, DEC.ox, DEC.oy);
    island(I, p, NX, NY, 3, 11);
    strip(I, p, "x", 16.2, 2.6, NX);
    for (const [x, y, s, k] of [
      [2, 13, 1, "round"],
      [5, 19, 1, "pine"],
      [14, 12.5, 1.1, "pine"],
      [22, 12, 1, "round"],
      [34, 14, 1, "round"],
      [38, 3, 1.1, "pine"],
      [8, 20, 1, "round"],
      [29, 20, 1.1, "pine"],
      [47, 12, 0.9, "round"],
      [52, 18.5, 1, "pine"],
      [24, 3, 1, "round"],
      [3, 8, 1, "round"],
    ] as const)
      tree(I, p, x, y, s, k);
    for (const x of [12, 24, 36, 48]) lamp(I, p, x, 15.4, 3);
    fence(I, p, 14, 1, 10, "x", 0.8);
    deck(D, p, 36, 16, 0.6, 5);
    // ground shadows of the deck on the island
    I.shadow(26, 0, 22, 2, 0.0);
  },
  anim(g, t, p) {
    clouds(g, p, t, 4, 4);
    const I = new Iso(g, ISL.ox, ISL.oy);
    const cx = (t * 2.2) % 60;
    if (cx < NX - 4) car(I, p, cx, 16.5, p.red);
    const cy = 58 - ((t * 1.6 + 20) % 62);
    if (cy > 0 && cy < NX - 4) car(I, p, cy, 18.0, p.cyan);
  },
  objects: [
    {
      id: "gen",
      layer: "p",
      ...place(ISL, [2, 7, 0], genBox, genDraw),
      name: "Generation",
      anim: genAnim,
      links: [],
      text: "Wind, solar and other plants feed power into the high-voltage grid.",
    },
    {
      id: "tso",
      layer: "p",
      ...place(ISL, [17, 7.5, 0], tsoBox, tsoDraw),
      name: "Transmission",
      anim: tsoAnim,
      links: [],
      text: "The TSO moves bulk power over long distances and keeps the whole system balanced.",
    },
    {
      id: "dso",
      layer: "p",
      ...place(ISL, [25, 5, 0], dsoBox, dsoDraw),
      name: "Substation",
      links: [],
      lights: [{ x: 60, y: 90, r: 50, color: "#ffd98a" }],
      text: "The DSO steps voltage down for local distribution.",
    },
    {
      id: "trafo",
      layer: "p",
      ...place(ISL, [38, 9, 0], trafoBox, trafoDraw),
      name: "Trafo",
      links: [],
      text: "The last step down to household voltage.",
    },
    {
      id: "house",
      layer: "p",
      ...place(ISL, [44, 4, 0], houseBox, houseDraw),
      name: "Metering point",
      anim: houseAnim,
      links: [],
      portal: { x: 790, y: 330 },
      lights: [
        { x: 90, y: 130, r: 44, color: "#ffc866" },
        { x: 160, y: 120, r: 44, color: "#ffc866" },
      ],
      text: "Where energy is measured and where market roles attach. Click to zoom in.",
    },
    {
      id: "reg",
      layer: "d",
      ...place(DEC, [1, 1.5, 0], regBox, regDraw),
      name: "Regulator",
      anim: regAnim,
      links: ["tso", "dso", "gen", "trafo"],
      text: "Sets binding rules for market processes and who may do what.",
    },
    {
      id: "std",
      layer: "d",
      ...place(DEC, [12, 1.5, 0], stdBox, stdDraw),
      name: "Standards",
      anim: stdAnim,
      links: ["house", "dso"],
      text: "Standards bodies specify message formats and device protocols so everyone interoperates.",
    },
    {
      id: "sec",
      layer: "d",
      ...place(DEC, [21, 1.5, 0], secBox, secDraw),
      name: "Security",
      anim: secAnim,
      links: ["house", "dso"],
      text: "Certification and encryption rules for gateways and data exchange.",
    },
    {
      id: "roles",
      layer: "d",
      ...place(DEC, [10, 9, 0], rolesBox, rolesDraw),
      name: "Market roles",
      links: ["gen", "dso", "house"],
      text: "Network operator, supplier and metering party exchange standardised messages. No central hub needed.",
    },
  ],
  wires: [
    {
      kind: "p",
      pts: sagPts(
        ISL.p(12.5, 10, 4.5)[0],
        ISL.p(12.5, 10, 4.5)[1],
        ISL.p(17, 5.4, 8.5)[0],
        ISL.p(17, 5.4, 8.5)[1],
        14,
      ),
    },
    {
      kind: "p",
      pts: sagPts(
        ISL.p(18, 10, 8.5)[0],
        ISL.p(18, 10, 8.5)[1],
        ISL.p(27, 6, 4.8)[0],
        ISL.p(27, 6, 4.8)[1],
        14,
      ),
    },
    {
      kind: "p",
      pts: sagPts(
        ISL.p(33.5, 6, 4.4)[0],
        ISL.p(33.5, 6, 4.4)[1],
        ISL.p(38.5, 10.5, 7)[0],
        ISL.p(38.5, 10.5, 7)[1],
        12,
      ),
    },
    {
      kind: "p",
      pts: sagPts(
        ISL.p(40, 10.5, 7)[0],
        ISL.p(40, 10.5, 7)[1],
        ISL.p(46, 9, 3.5)[0],
        ISL.p(46, 9, 3.5)[1],
        12,
      ),
    },
  ],
};
void bush;
void person;
void Iso;
