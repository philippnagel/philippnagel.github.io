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
  personS,
  place,
  sky,
  strip,
  tree,
  envelope,
} from "./kit";
import { clouds } from "./common";

const ISL = new Iso(undefined as unknown as Pix, 330, 190);
const DEC = new Iso(undefined as unknown as Pix, 640, 80);
const NX = 48,
  NY = 30;
const LAB = (I: Iso, p: Pal, sx: number, sy: number, text: string) =>
  label(
    I.g,
    p,
    I.ox + (((sx - sy) * 8) / 2) * 1,
    I.oy + (sx + sy) * 4 + 8,
    text,
  );

// ---- grid connection pole ----
const poleBox = fitBox(5, 4, 9);
const poleDraw = (I: Iso, p: Pal) => {
  I.shadow(0.3, 0.3, 4, 3, 0.3);
  I.cyl(2, 2, 0, 0.2, 8.4, p.wood);
  I.box(0.6, 1.85, 7.4, 2.8, 0.3, 0.25, p.wood);
  for (let k = 0; k < 3; k++)
    I.cyl(1 + k * 1.0, 2, 7.65, 0.07, 0.5, p.concrete, p.concrete[4]);
  I.cyl(3, 2.4, 4.4, 0.5, 1.6, p.steel);
  I.box(0.9, 2.1, 4.6, 0.5, 0.3, 0.9, p.metal);
  I.line3([2, 2, 4.5], [2, 2, 0.4], p.dark[2]);
  LAB(I, p, 5, 4, "CONNECTION");
};

// ---- meter cabinet (portal) ----
const cabBox = fitBox(4, 3, 4, { top: 30, left: 60 });
const cabDraw = (I: Iso, p: Pal) => {
  I.shadow(0.2, 0.2, 3.4, 2.6, 0.3);
  I.box(0, 0, 0, 3.4, 2.2, 0.35, p.concrete, { tex: true });
  I.box(0.3, 0.2, 0.35, 2.8, 1.8, 3.4, p.metal);
  // interior (front +y face): meter + gateway
  I.qL(2.0, 0.45, 2.95, 0.55, 3.55, p.dark[1]);
  I.qL(2.0, 0.6, 1.6, 2.1, 3.4, p.paper[2]);
  I.qL(2.0, 0.7, 1.5, 2.8, 3.3, p.leaf[2]);
  I.qL(2.0, 0.7, 1.5, 2.2, 2.6, p.metal[2]);
  I.qL(2.0, 1.8, 2.8, 1.5, 3.4, p.dark[2]);
  for (let k = 0; k < 5; k++)
    I.line3([1.9, 2.0, 1.7 + k * 0.28], [2.7, 2.0, 1.7 + k * 0.28], p.dark[3]);
  for (let k = 0; k < 3; k++) {
    const [lx, ly] = I.p(2.0 + k * 0.25, 2.0, 3.1);
    I.g.r(lx, ly, 2, 2, [p.data, p.power, p.leaf[4]][k]!);
  }
  I.qL(2.0, 0.6, 2.8, 0.7, 1.2, p.dark[2]);
  // open door
  I.poly3(
    [
      [0.3, 2.2, 0.4],
      [-1.1, 3.4, 0.4],
      [-1.1, 3.4, 3.7],
      [0.3, 2.2, 3.7],
    ],
    p.metal[2],
  );
  I.poly3(
    [
      [0.3, 2.2, 0.4],
      [-1.1, 3.4, 0.4],
      [-1.1, 3.4, 3.7],
      [0.3, 2.2, 3.7],
    ].map(([a, b, c]) => [a! + 0, b! + 0, c!] as [number, number, number]),
    p.metal[2],
  );
  I.line3([-1.1, 3.4, 3.7], [0.3, 2.2, 3.7], p.metal[4]);
  I.cyl(1.7, 1.1, 3.75, 0.5, 0.15, p.metal);
  const [wx, wy] = I.p(1.3, 2.0, 0.2);
  I.g.slab(wx - 6, wy - 2, 12, 9, p.yellow);
  // cable into the ground and hologram beam
  I.line3([1.7, 2.2, 0.35], [1.7, 6.5, 0.0], p.dark[2]);
  LAB(I, p, 3.4, 2.2, "METER CABINET");
};
const cabAnim = isoAnim(cabBox, (I, t, p) => {
  const [lx, ly] = I.p(2.0, 2.0, 3.1);
  if (Math.sin(t * 3) > 0) I.g.r(lx + 9, ly, 2, 2, p.white);
  const [x, y] = I.p(1, 2, 3.0);
  I.g.r(x, y + Math.round(Math.sin(t * 4) * 1), 2, 1, p.leaf[4]);
});

// ---- roof with PV (floating) ----
const roofBox = fitBox(14, 10, 4, { top: 30 });
const roofDraw = (I: Iso, p: Pal) => {
  I.shadow(0.4, 0.4, 13, 9, 0.12);
  I.gable(0, 0, 0, 13, 9, 3.2, p.roof, p.wall, "x");
  const my = 4.5,
    zz = (yy: number) => ((9 - yy) / my) * 3.2;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 2; j++) {
      const xa = 1 + i * 3.8,
        xb = xa + 3.4,
        ya = 8.5 - j * 1.9,
        yb = ya - 1.7;
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
      for (let k = 1; k < 5; k++)
        I.line3(
          [xa + k * 0.68, ya, zz(ya)],
          [xa + k * 0.68, yb, zz(yb)],
          p.pv[1],
        );
      I.line3(
        [xa, (ya + yb) / 2, zz((ya + yb) / 2)],
        [xb, (ya + yb) / 2, zz((ya + yb) / 2)],
        p.pv[1],
      );
      const [gx, gy] = I.p(xa + 0.5, ya - 0.3, zz(ya - 0.3));
      I.g.p(gx, gy, p.white);
    }
  I.box(10.4, 1.2, 2.3, 0.9, 0.9, 2.2, p.roof, { tex: true });
  I.box(10.3, 1.1, 4.5, 1.1, 1.1, 0.2, p.concrete);
  label(I.g, p, I.ox + 52, I.oy - 6, "ROOF PV");
};
const roofAnim = isoAnim(roofBox, (I, t, p) => {
  for (let i = 0; i < 5; i++) {
    const u = (t * 0.4 + i / 5) % 1;
    const [x, y] = I.p(10.8, 1.6, 4.8);
    I.g.ell(
      Math.round(x + Math.sin(u * 7 + i) * 3 + u * 14),
      Math.round(y - u * 26),
      2 + Math.round(u * 3),
      2 + Math.round(u * 3),
      p.night
        ? `rgba(170,180,200,${0.3 * (1 - u)})`
        : `rgba(240,242,248,${0.85 * (1 - u)})`,
    );
  }
});

// ---- HEMS on the back wall ----
const hemsBox = fitBox(4, 1, 4);
const hemsDraw = (I: Iso, p: Pal) => {
  I.box(0, 0, 0.6, 3.6, 0.3, 2.6, p.dark);
  I.qL(0.3, 0.2, 3.4, 0.8, 3.0, p.dark[1]);
  const bars = [0.8, 1.4, 1.0, 1.7, 1.2, 1.5];
  bars.forEach((b, i) =>
    I.qL(
      0.3,
      0.4 + i * 0.5,
      0.75 + i * 0.5,
      0.9,
      0.9 + b,
      i % 2 ? p.amber[2] : p.leaf[3],
    ),
  );
  I.line3([0.3, 0.3, 2.3], [3.3, 0.3, 2.7], p.cyan[3]);
  LAB(I, p, 4, 1, "HEMS");
};
const hemsAnim = isoAnim(hemsBox, (I, t, p) => {
  const k = Math.floor(t * 2) % 6;
  const [x, y] = I.p(0.4 + k * 0.5, 0.3, 2.4);
  I.g.r(x, y, 3, 2, p.white);
});

// ---- carport: wallbox + EV ----
const evBox = fitBox(12, 8, 4);
const evDraw = (I: Iso, p: Pal) => {
  I.shadow(0.3, 0.3, 12, 8, 0.2);
  I.box(0, 0, 0, 12, 8, 0.25, p.concrete, { tex: true });
  for (const [x, y] of [
    [0.4, 0.4],
    [11.2, 0.4],
    [0.4, 7.2],
    [11.2, 7.2],
  ] as const)
    I.cyl(x, y, 0.25, 0.18, 3.6, p.steel);
  // EV
  I.box(3, 2.4, 0.6, 6.0, 3.0, 1.2, p.cyan);
  I.box(4.2, 2.6, 1.8, 3.4, 2.6, 1.0, p.cyan);
  I.qL(5.4, 4.3, 7.5, 1.9, 2.7, p.glass[2]);
  I.qR(7.6, 2.7, 5.3, 1.9, 2.7, p.glass[1]);
  I.qL(5.4, 3.1, 3.9, 1.05, 1.5, p.glass[2]);
  for (const [wx, wy] of [
    [4.0, 5.45],
    [7.6, 5.45],
    [4.0, 2.45],
    [7.6, 2.45],
  ] as const) {
    const [sx, sy] = I.p(wx, wy, 0.6);
    I.g.ball(sx, sy, 6, p.dark);
    I.g.disc(sx, sy, 2, p.metal[3]);
  }
  const [hx, hy] = I.p(9.0, 3.6, 1.2);
  I.g.r(hx - 2, hy, 4, 3, p.yellow[4]);
  // wallbox post
  I.box(1.2, 5.6, 0.25, 0.8, 0.7, 2.6, p.dark);
  I.qL(6.3, 1.3, 1.9, 1.8, 2.6, p.leaf[2]);
  I.box(1.3, 5.7, 2.9, 0.6, 0.5, 0.3, p.metal);
  const cable = sagPts(...I.p(1.6, 6.3, 1.2), ...I.p(3.2, 5.3, 1.4), 10);
  for (const [x, y] of cable) I.g.r(x, y, 2, 2, p.dark[1]);
  LAB(I, p, 12, 8, "WALLBOX + EV");
};
const evAnim = isoAnim(evBox, (I, t, p) => {
  const [x, y] = I.p(1.3, 6.3, 2.0);
  const k = (Math.sin(t * 3) + 1) / 2;
  I.g.r(x, y, Math.round(8 * k) + 2, 2, p.leaf[4]);
});

// ---- data deck objects ----
const pkiBox = fitBox(5, 3, 6);
const pkiDraw = (I: Iso, p: Pal) => {
  I.shadow(0.3, 0.3, 5, 3, 0.2);
  I.box(0.3, 0.6, 0, 3.8, 0.5, 4.6, p.paper);
  I.qL(1.1, 0.6, 3.8, 0.4, 4.4, p.yellow[2]);
  I.qL(1.1, 0.8, 3.6, 0.6, 4.2, p.paper[3]);
  for (let k = 0; k < 5; k++)
    I.line3(
      [1.1, 1.1, 3.8 - k * 0.5],
      [3.4 - (k % 2) * 0.9, 1.1, 3.8 - k * 0.5],
      p.metal[3],
    );
  const [sx, sy] = I.p(2.9, 1.1, 1.4);
  I.g.ball(sx, sy, 7, p.red);
  I.g.poly(
    [
      [sx - 5, sy + 4],
      [sx - 8, sy + 16],
      [sx - 3, sy + 11],
      [sx, sy + 17],
      [sx, sy + 5],
    ],
    p.red[1],
  );
  I.g.poly(
    [
      [sx + 2, sy + 5],
      [sx + 3, sy + 17],
      [sx + 8, sy + 11],
      [sx + 11, sy + 15],
      [sx + 7, sy + 4],
    ],
    p.red[2],
  );
  const [kx, ky] = I.p(3.6, 2.2, 3.4);
  I.g.ball(kx, ky, 4, p.yellow);
  I.g.r(kx + 3, ky - 1, 14, 3, p.yellow[2]);
  I.g.r(kx + 11, ky + 2, 3, 4, p.yellow[1]);
  LAB(I, p, 5, 3, "TRUST CHAIN");
};

const masterBox = fitBox(5, 3, 5);
const masterDraw = (I: Iso, p: Pal) => {
  I.shadow(0.3, 0.3, 5, 3, 0.2);
  I.box(0.4, 0.5, 0, 2.6, 2.0, 3.0, p.yellow);
  for (let k = 0; k < 3; k++) {
    I.qL(2.5, 0.6, 2.8, 0.2 + k * 1.0, 0.2 + k * 1.0 + 0.8, p.yellow[3]);
    I.qL(2.5, 1.3, 2.1, 0.4 + k * 1.0, 0.5 + k * 1.0, p.dark[1]);
  }
  const [cx, cy] = I.p(3.7, 1.6, 2.4);
  I.g.slab(cx - 12, cy - 8, 26, 18, p.paper);
  I.g.slab(cx - 9, cy - 5, 9, 11, p.skin);
  I.g.r(cx + 2, cy - 4, 10, 2, p.metal[2]);
  I.g.r(cx + 2, cy, 10, 2, p.metal[2]);
  for (let k = 0; k < 8; k++)
    I.g.r(cx - 9 + k * 3, cy + 7, k % 3 ? 1 : 2, 3, p.outline);
  LAB(I, p, 5, 3, "MASTER DATA");
};

const msgsBox = fitBox(9, 3, 3);
const msgsDraw = (I: Iso, p: Pal) => {
  I.shadow(0.3, 0.3, 9, 3, 0.2);
  I.box(0.2, 0.8, 0, 8, 1.4, 0.35, p.dark);
  for (let k = 0; k < 8; k++)
    I.qT(0.36, 0.5 + k, 1.0 + k, 1.1, 1.9, k % 2 ? p.dark[2] : p.dark[1]);
  const [ax, ay] = I.p(8.2, 1.5, 0.6);
  I.g.poly(
    [
      [ax, ay - 7],
      [ax + 12, ay],
      [ax, ay + 7],
    ],
    p.data,
  );
  LAB(I, p, 9, 3, "MARKET MESSAGES");
};
const msgsAnim = isoAnim(msgsBox, (I, t, p) => {
  for (let k = 0; k < 3; k++) {
    const u = (t * 0.22 + k / 3) % 1;
    const [x, y] = I.p(0.6 + u * 7, 1.5, 0.5);
    envelope(I.g, p, x - 7, y - 10, [p.paper, p.yellow, p.cyan][k]);
  }
});

const backBox = fitBox(4, 4, 9);
const backDraw = (I: Iso, p: Pal) => {
  I.shadow(0.3, 0.3, 4, 4, 0.25);
  for (const [x, y, z, r] of [
    [1.5, 1.5, 6.5, 14],
    [3, 1, 7.2, 17],
    [2.5, 2.6, 6.8, 15],
    [0.8, 2.4, 6.6, 12],
  ] as const) {
    const [bx, by] = I.p(x, y, z);
    I.g.ball(bx, by, r, p.paper);
  }
  I.box(0.9, 0.9, 0, 2.2, 2.2, 5.6, p.dark);
  for (let k = 0; k < 6; k++) {
    I.qL(3.1, 1.0, 3.0, 0.2 + k * 0.9, 0.2 + k * 0.9 + 0.7, p.dark[2]);
    I.qL(3.1, 1.15, 1.9, 0.4 + k * 0.9, 0.5 + k * 0.9, p.dark[3]);
  }
  LAB(I, p, 4, 4, "GATEWAY ADMIN");
};
const backAnim = isoAnim(backBox, (I, t, p) => {
  for (let k = 0; k < 6; k++) {
    const [x, y] = I.p(2.2, 3.1, 0.3 + k * 0.9);
    I.g.r(
      x,
      y - 5,
      3,
      2,
      Math.sin(t * 4 + k * 1.7) > 0 ? p.leaf[4] : p.leaf[1],
    );
    I.g.r(x + 5, y - 5, 3, 2, Math.sin(t * 3 + k) > 0.3 ? p.data : p.cyan[1]);
  }
});

/** Interior of the cutaway house, drawn into the background. */
function houseShell(I: Iso, p: Pal) {
  const x0 = 14,
    y0 = 6,
    sx = 12,
    sy = 8,
    H = 4.6;
  I.shadow(x0 - 0.2, y0 - 0.2, sx + 1, sy + 1, 0.3);
  I.box(x0 - 0.3, y0 - 0.3, 0, sx + 0.6, sy + 0.6, 0.3, p.concrete, {
    tex: true,
  });
  for (let k = 0; k < sy; k++)
    I.qT(0.31, x0, x0 + sx, y0 + k, y0 + k + 1, k % 2 ? p.wood[2] : p.wood[3]);
  // rug
  I.qT(0.33, x0 + 3, x0 + 8, y0 + 3.2, y0 + 6.2, p.red[2]);
  I.qT(0.34, x0 + 3.3, x0 + 7.7, y0 + 3.5, y0 + 5.9, p.red[3]);
  // back walls
  I.box(x0, y0, 0.3, sx, 0.4, H, p.wall, { tex: true });
  I.box(x0, y0, 0.3, 0.4, sy, H, p.wall, { tex: true });
  for (let k = 0; k < sx; k += 1)
    I.line3([x0 + k, y0 + 0.4, 0.3], [x0 + k, y0 + 0.4, 0.3 + H], p.wall[3]);
  I.box(x0, y0, 0.3 + H, sx, 0.4, 0.3, p.wood);
  I.box(x0, y0, 0.3 + H, 0.4, sy, 0.3, p.wood);
  // baseboards
  I.qL(y0 + 0.4, x0, x0 + sx, 0.3, 0.7, p.wood[3]);
  I.qR(x0 + 0.4, y0, y0 + sy, 0.3, 0.7, p.wood[2]);
  // windows on back wall A
  for (const wx of [x0 + 1.5, x0 + 8.0]) {
    I.qL(y0 + 0.4, wx - 0.15, wx + 2.45, 1.6, 4.45, p.paper[3]);
    I.qL(y0 + 0.4, wx, wx + 2.3, 1.75, 4.3, p.glass[2]);
    I.qL(y0 + 0.4, wx, wx + 2.3, 3.3, 4.3, p.glass[3]);
    I.line3(
      [wx + 1.15, y0 + 0.4, 1.75],
      [wx + 1.15, y0 + 0.4, 4.3],
      p.paper[2],
    );
    I.line3([wx, y0 + 0.4, 3.0], [wx + 2.3, y0 + 0.4, 3.0], p.paper[2]);
    I.poly3(
      [
        [wx - 0.1, y0 + 0.45, 4.5],
        [wx + 0.5, y0 + 0.45, 4.5],
        [wx + 0.2, y0 + 0.45, 1.8],
        [wx - 0.1, y0 + 0.45, 1.8],
      ],
      p.red[2],
    );
    I.poly3(
      [
        [wx + 2.4, y0 + 0.45, 4.5],
        [wx + 1.8, y0 + 0.45, 4.5],
        [wx + 2.1, y0 + 0.45, 1.8],
        [wx + 2.4, y0 + 0.45, 1.8],
      ],
      p.red[2],
    );
  }
  // pictures
  I.qL(y0 + 0.4, x0 + 5.1, x0 + 6.7, 2.4, 3.6, p.wood[1]);
  I.qL(y0 + 0.4, x0 + 5.25, x0 + 6.55, 2.55, 3.45, p.cyan[2]);
  I.qL(y0 + 0.4, x0 + 5.25, x0 + 6.55, 2.55, 2.9, p.leaf[2]);
  // door and shelf on the right wall B
  I.qR(x0 + 0.4, y0 + 1.0, y0 + 2.6, 0.3, 3.7, p.wood[1]);
  I.qR(x0 + 0.4, y0 + 1.1, y0 + 2.5, 0.3, 3.6, p.wood[2]);
  for (let k = 0; k < 3; k++)
    I.qR(x0 + 0.4, y0 + 4.2, y0 + 7, 1.3 + k * 1.1, 1.4 + k * 1.1, p.wood[3]);
  for (let k = 0; k < 3; k++)
    for (let j = 0; j < 7; j++)
      I.qR(
        x0 + 0.4,
        y0 + 4.3 + j * 0.38,
        y0 + 4.3 + j * 0.38 + 0.28,
        1.4 + k * 1.1,
        2.0 + k * 1.1 - (j % 3) * 0.1,
        [p.red[2], p.cyan[2], p.yellow[2], p.purple[2]][(j + k) % 4]!,
      );
  // sofa
  I.box(x0 + 3.2, y0 + 5.8, 0.3, 4.6, 1.6, 0.8, p.purple);
  I.box(x0 + 3.2, y0 + 7.0, 0.3, 4.6, 0.6, 1.9, p.purple);
  I.box(x0 + 3.0, y0 + 5.8, 0.3, 0.5, 1.8, 1.4, p.purple);
  I.box(x0 + 7.9, y0 + 5.8, 0.3, 0.5, 1.8, 1.4, p.purple);
  // coffee table + items
  I.box(x0 + 4.2, y0 + 3.6, 0.3, 2.4, 1.2, 0.8, p.wood);
  I.box(x0 + 4.5, y0 + 3.9, 1.1, 0.6, 0.5, 0.3, p.paper);
  // TV unit against the right wall
  I.box(x0 + 0.6, y0 + 4.2, 0.3, 0.9, 2.8, 0.9, p.wood);
  I.box(x0 + 0.7, y0 + 4.6, 1.2, 0.2, 2.0, 1.3, p.dark);
  I.qR(x0 + 0.9, y0 + 4.7, y0 + 6.5, 1.3, 2.4, p.cyan[1]);
  // plant and floor lamp
  I.cyl(x0 + 11, y0 + 1.2, 0.3, 0.45, 0.9, p.red);
  const [px, py] = I.p(x0 + 11, y0 + 1.2, 1.4);
  I.g.ball(px, py - 8, 11, p.leaf);
  I.cyl(x0 + 11, y0 + 6.5, 0.3, 0.08, 3.3, p.dark);
  I.cyl(x0 + 11, y0 + 6.5, 3.6, 0.55, 0.7, p.yellow, p.yellow[4]);
  // people
  const [qx, qy] = I.p(x0 + 5, y0 + 6.4, 1.2);
  personS(I.g, p, qx - 6, qy - 28, 2, p.cyan, undefined);
  const [rx, ry] = I.p(x0 + 9, y0 + 2.4, 0.3);
  personS(I.g, p, rx - 6, ry - 30, 2, p.amber, p.red);
}

export const house: SceneDef = {
  id: "house",
  name: "Metering Point",
  hint: "One household with its roof lifted off. The meter cabinet is where the physical connection meets the data layer. Dive into it.",
  bg(g, p) {
    sky(g, p, 5);
    const I = new Iso(g, ISL.ox, ISL.oy);
    const D = new Iso(g, DEC.ox, DEC.oy);
    island(I, p, NX, NY, 3, 5);
    strip(I, p, "x", 25.2, 2.6, NX);
    houseShell(I, p);
    for (const [x, y, s, k] of [
      [3, 3, 1.1, "round"],
      [8, 9, 1, "pine"],
      [4, 14, 1, "pine"],
      [30, 3, 1, "round"],
      [44, 4, 1.1, "pine"],
      [45, 20, 1, "round"],
      [10, 22, 1, "round"],
      [36, 21, 1, "pine"],
      [28, 19, 1, "round"],
      [2, 26, 1, "pine"],
    ] as const)
      tree(I, p, x, y, s, k);
    for (const x of [8, 20, 32, 44]) lamp(I, p, x, 24.6, 3);
    fence(I, p, 12, 19.5, 18, "x", 0.8);
    for (const [x, y] of [
      [16, 15.5],
      [22, 16],
      [36, 17],
    ] as const)
      bush(I, p, x, y, 1.1);
    deck(D, p, 36, 16, 0.6, 9);
  },
  anim(g, t, p) {
    clouds(g, p, t, 4, 8);
    const I = new Iso(g, ISL.ox, ISL.oy);
    const cx = (t * 2.0) % 60;
    if (cx < NX - 4) car(I, p, cx, 25.5, p.amber);
  },
  objects: [
    {
      id: "grid",
      layer: "p",
      ...place(ISL, [3, 17, 0], poleBox, poleDraw),
      name: "Connection",
      links: [],
      text: "The service cable from the street pole into the building.",
    },
    {
      id: "roof",
      layer: "p",
      ...place(ISL, [13.5, 5.5, 10.5], roofBox, roofDraw),
      name: "Roof PV",
      anim: roofAnim,
      links: [],
      text: "Rooftop solar: generation behind the meter, reported as a separate energy flow.",
    },
    {
      id: "hems",
      layer: "p",
      ...place(ISL, [20, 6.4, 0.9], hemsBox, hemsDraw),
      name: "HEMS",
      anim: hemsAnim,
      links: [],
      text: "Home energy management: reads consumption through the gateway and steers flexible devices.",
    },
    {
      id: "cabinet",
      layer: "p",
      ...place(ISL, [18, 19, 0], cabBox, cabDraw),
      name: "Meter cabinet",
      anim: cabAnim,
      links: [],
      portal: { x: 770, y: 330 },
      text: "Smart meter plus communication gateway. Click to zoom inside.",
    },
    {
      id: "wallbox",
      layer: "p",
      ...place(ISL, [30, 8, 0], evBox, evDraw),
      name: "Wallbox + EV",
      anim: evAnim,
      links: [],
      lights: [{ x: 60, y: 120, r: 30, color: "#58e090" }],
      text: "A large flexible load that can be scheduled or throttled on a signal.",
    },
    {
      id: "pki",
      layer: "d",
      ...place(DEC, [2, 3, 0], pkiBox, pkiDraw),
      name: "Trust chain",
      links: ["cabinet"],
      text: "Certificates prove that gateway, operator and market parties are who they claim to be.",
    },
    {
      id: "master",
      layer: "d",
      ...place(DEC, [10, 2, 0], masterBox, masterDraw),
      name: "Master data",
      links: ["grid", "cabinet"],
      text: "The metering point identity, its owner, supplier and assigned roles.",
    },
    {
      id: "msgs",
      layer: "d",
      ...place(DEC, [12, 9, 0], msgsBox, msgsDraw),
      name: "Market messages",
      anim: msgsAnim,
      links: ["cabinet", "roof"],
      text: "Standardised files carry master data, meter readings and orders between market parties.",
    },
    {
      id: "backend",
      layer: "d",
      ...place(DEC, [24, 3, 0], backBox, backDraw),
      name: "Gateway admin",
      anim: backAnim,
      links: ["cabinet", "hems", "wallbox"],
      text: "Configures, updates and monitors gateways over an encrypted wide-area link.",
    },
  ],
  wires: [
    {
      kind: "p",
      pts: sagPts(...ISL.p(5, 19, 7.8), ...ISL.p(19, 20.4, 3.6), 22),
    },
    {
      kind: "p",
      pts: sagPts(...ISL.p(19.5, 21, 0.2), ...ISL.p(22, 14.2, 0.2), 0),
    },
  ],
};
void bush;
