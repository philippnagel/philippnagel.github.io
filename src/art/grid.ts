import type { Pal } from "../palette";
import { sagPts, type Pix } from "../pix";
import type { SceneDef } from "../types";
import { BAND_Y } from "../geometry";
import {
  bush,
  car,
  clouds,
  dataSky,
  insulators,
  label,
  lock,
  meadow,
  plate,
  pole,
  tree,
} from "./common";

function blade(g: Pix, p: Pal, hx: number, hy: number, len: number, a: number) {
  const ca = Math.cos(a),
    sa = Math.sin(a);
  const px = -sa,
    py = ca;
  const pt = (d: number, w: number): [number, number] => [
    hx + ca * d + px * w,
    hy + sa * d + py * w,
  ];
  g.poly(
    [
      pt(3, -2.6),
      pt(len * 0.35, -3.2),
      pt(len, -0.6),
      pt(len, 0.6),
      pt(3, 2.6),
    ],
    p.metal[1],
  );
  g.poly(
    [
      pt(3, -2.2),
      pt(len * 0.35, -2.6),
      pt(len, -0.2),
      pt(len, 0.4),
      pt(3, 0.2),
    ],
    p.white,
  );
}

function turbine(
  g: Pix,
  p: Pal,
  x: number,
  hy: number,
  base: number,
  len: number,
  w: number,
) {
  g.poly(
    [
      [x - w, base],
      [x - 2, hy],
      [x + 2, hy],
      [x + w, base],
    ],
    p.metal[1],
  );
  g.poly(
    [
      [x - w, base],
      [x - 2, hy],
      [x, hy],
      [x, base],
    ],
    p.white,
  );
  g.poly(
    [
      [x, base],
      [x, hy],
      [x + 2, hy],
      [x + w, base],
    ],
    p.metal[3],
  );
  g.slab(x - 5, hy - 4, 12, 8, p.concrete);
}

const gen = (g: Pix, p: Pal) => {
  g.shadow(80, 126, 70, 5, p.outline, 0.5);
  turbine(g, p, 44, 34, 108, 34, 5);
  turbine(g, p, 108, 52, 108, 28, 4);
  // solar rows
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      const x = 8 + i * 29 - row * 4,
        y = 96 + row * 14;
      g.r(x + 12, y + 11, 3, 5, p.metal[1]);
      g.poly(
        [
          [x, y + 11],
          [x + 5, y],
          [x + 28, y],
          [x + 24, y + 11],
        ],
        p.pv[0],
      );
      g.poly(
        [
          [x + 1, y + 10],
          [x + 6, y + 1],
          [x + 27, y + 1],
          [x + 23, y + 10],
        ],
        p.pv[2],
      );
      for (let k = 1; k < 5; k++)
        g.line(x + 1 + k * 5 - 1, y + 10, x + 6 + k * 4.2, y + 1, p.pv[1]);
      g.line(x + 3, y + 5, x + 25, y + 5, p.pv[1]);
      g.line(x + 6, y + 2, x + 12, y + 2, p.pv[4]);
      g.p(x + 8, y + 3, p.white);
    }
  }
  // outlet pole
  g.cylV(150, 66, 5, 62, p.wood);
  g.slab(142, 70, 22, 4, p.wood);
  for (const x of [144, 152, 161]) g.r(x, 66, 2, 5, p.concrete[3]);
  label(g, p, 164, 132, "GENERATION");
};
const genAnim = (g: Pix, t: number, p: Pal) => {
  blade_set(g, p, 44, 34, 34, t * 0.9);
  blade_set(g, p, 108, 52, 28, t * 1.1 + 1);
};
function blade_set(
  g: Pix,
  p: Pal,
  hx: number,
  hy: number,
  len: number,
  a: number,
) {
  for (let i = 0; i < 3; i++)
    blade(g, p, hx, hy, len, a + (i * Math.PI * 2) / 3);
  g.ball(hx, hy, 4, p.concrete);
}

const tso = (g: Pix, p: Pal) => {
  g.shadow(65, 132, 44, 5, p.outline, 0.5);
  const cx = 65;
  // legs
  const L = (xt: number, xb: number, c: string) => {
    g.line(xt, 12, xb, 130, c);
    g.line(xt + 1, 12, xb + 1, 130, c);
  };
  L(cx - 3, cx - 30, p.steel[1]);
  L(cx + 2, cx + 29, p.steel[1]);
  // lattice bracing: four sections
  const ys = [12, 44, 76, 104, 130];
  const hw = (y: number) => 3 + ((y - 12) / 118) * 27;
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i]!;
    g.r(cx - hw(y), y, hw(y) * 2 + 2, 2, p.steel[2]);
    if (i + 1 < ys.length) {
      const y2 = ys[i + 1]!;
      g.line(cx - hw(y), y, cx + hw(y2), y2, p.steel[3]);
      g.line(cx + hw(y) + 1, y, cx - hw(y2) + 1, y2, p.steel[3]);
    }
  }
  // crossarms with truss
  const arms: [number, number][] = [
    [16, 34],
    [44, 42],
    [72, 34],
  ];
  for (const [y, half] of arms) {
    g.line(cx - half + 4, y + 4, cx - 4, y + 16, p.steel[2]);
    g.line(cx + half - 1, y + 4, cx + 5, y + 16, p.steel[2]);
    g.line(cx - half + 12, y + 4, cx - 4, y + 12, p.steel[1]);
    g.line(cx + half - 9, y + 4, cx + 5, y + 12, p.steel[1]);
    g.slab(cx - half, y, half * 2 + 3, 5, p.steel);
    for (const x of [cx - half + 2, cx + half]) insulators(g, p, x, y + 5, 4);
  }
  g.r(cx - 1, 4, 4, 9, p.steel[2]);
  g.p(cx, 3, p.red[3]);
  label(g, p, 130, 136, "TRANSMISSION");
};
const tsoAnim = (g: Pix, t: number, p: Pal) => {
  if (Math.sin(t * 3) > 0.2) g.r(64, 2, 3, 3, p.red[3]);
};

const dso = (g: Pix, p: Pal) => {
  g.shadow(56, 86, 58, 5, p.outline, 0.45);
  g.r(0, 62, 112, 22, p.concrete[2]);
  g.dither(0, 62, 112, 22, p.concrete[1], 0.2);
  // fence at back
  for (let x = 0; x < 112; x += 8) g.r(x, 52, 2, 14, p.metal[1]);
  for (let y = 54; y < 66; y += 3) g.r(0, y, 112, 1, p.metal[3]);
  g.r(0, 52, 112, 2, p.metal[2]);
  // gantry
  for (const x of [4, 104]) {
    g.cylV(x, 6, 5, 56, p.steel);
    for (let y = 14; y < 56; y += 10) g.line(x, y, x + 4, y + 10, p.steel[3]);
  }
  g.slab(2, 6, 108, 5, p.steel);
  for (const x of [22, 60, 98]) insulators(g, p, x, 11, 4);
  // transformers
  for (const x of [12, 62]) {
    g.slab(x + 8, 40, 30, 22, p.metal);
    for (let i = 0; i < 6; i++) g.slab(x - 1 + i * 2, 42, 2, 18, p.metal);
    g.cylH(x + 8, 32, 30, 8, p.steel);
    for (const bx of [x + 14, x + 23, x + 32]) {
      g.cylV(bx, 24, 4, 16, p.wood);
      g.r(bx - 1, 28, 6, 1, p.wood[1]);
      g.r(bx - 1, 33, 6, 1, p.wood[1]);
    }
    g.r(x + 10, 44, 26, 2, p.metal[3]);
  }
  // sign
  g.poly(
    [
      [8, 70],
      [14, 80],
      [2, 80],
    ],
    p.yellow[0],
  );
  g.poly(
    [
      [8, 72],
      [12, 79],
      [4, 79],
    ],
    p.yellow[3],
  );
  g.r(8, 75, 1, 2, p.outline);
  label(g, p, 112, 92, "SUBSTATION");
};

const trafo = (g: Pix, p: Pal) => {
  g.cylV(28, 2, 7, 78, p.wood);
  for (let y = 16; y < 76; y += 12) g.r(29, y, 5, 1, p.wood[1]);
  g.slab(8, 6, 48, 5, p.wood);
  for (const x of [10, 30, 52]) g.cylV(x, 0, 3, 6, p.concrete);
  g.cylV(38, 24, 13, 22, p.steel);
  g.slab(37, 22, 15, 3, p.metal);
  for (const x of [40, 46]) g.cylV(x, 14, 3, 9, p.wood);
  g.slab(20, 28, 7, 10, p.metal);
  g.p(23, 32, p.red[3]);
  g.r(31, 46, 2, 32, p.dark[2]);
  g.shadow(32, 82, 14, 3, p.outline, 0.5);
  label(g, p, 64, 88, "TRAFO");
};

// 96x54 house at local x=8
const house = (g: Pix, p: Pal) => {
  const ox = 8;
  g.shadow(ox + 48, 56, 50, 3, p.outline, 0.5);
  // walls
  g.slab(ox + 6, 22, 84, 32, p.wall);
  for (let y = 26; y < 52; y += 4) g.r(ox + 7, y, 82, 1, p.wall[1]);
  // roof
  g.poly(
    [
      [ox + 48, 0],
      [ox + 0, 24],
      [ox + 96, 24],
    ],
    p.roof[0],
  );
  g.poly(
    [
      [ox + 48, 2],
      [ox + 3, 23],
      [ox + 93, 23],
    ],
    p.roof[2],
  );
  for (let y = 5; y < 23; y += 3) {
    const half = ((y - 1) / 22) * 46;
    g.r(ox + 48 - half, y, half * 2, 1, p.roof[1]);
    for (
      let x = ox + 48 - half + ((y / 3) % 2 ? 0 : 3);
      x < ox + 48 + half;
      x += 6
    )
      g.p(x, y + 1, p.roof[3]);
  }
  g.r(ox + 0, 23, 96, 2, p.roof[1]);
  // PV on left roof
  g.poly(
    [
      [ox + 44, 6],
      [ox + 14, 20],
      [ox + 40, 20],
      [ox + 46, 8],
    ],
    p.pv[0],
  );
  g.poly(
    [
      [ox + 44, 8],
      [ox + 18, 19],
      [ox + 39, 19],
      [ox + 45, 10],
    ],
    p.pv[2],
  );
  for (let k = 0; k < 4; k++)
    g.line(ox + 40 - k * 6, 9 + k * 3, ox + 36 - k * 6, 19, p.pv[1]);
  g.line(ox + 20, 15, ox + 42, 14, p.pv[1]);
  g.line(ox + 38, 10, ox + 42, 11, p.pv[4]);
  // chimney
  g.slab(ox + 66, 4, 9, 14, p.roof);
  g.r(ox + 65, 3, 11, 2, p.concrete[2]);
  // windows with shutters
  for (const wx of [12, 66]) {
    g.slab(ox + wx - 5, 28, 5, 16, p.leaf);
    g.slab(ox + wx + 16, 28, 5, 16, p.leaf);
    g.slab(ox + wx, 28, 16, 16, p.white === p.white ? p.paper : p.paper);
    g.r(ox + wx + 2, 30, 12, 12, p.glass[2]);
    g.r(ox + wx + 2, 30, 12, 3, p.glass[3]);
    g.r(ox + wx + 7, 30, 2, 12, p.paper[2]);
    g.r(ox + wx + 2, 35, 12, 1, p.paper[2]);
    g.slab(ox + wx - 1, 44, 18, 3, p.concrete);
  }
  // door
  g.slab(ox + 38, 30, 18, 24, p.paper);
  g.slab(ox + 40, 32, 14, 22, p.wood);
  g.r(ox + 42, 34, 10, 8, p.glass[2]);
  g.p(ox + 51, 46, p.yellow[3]);
  g.slab(ox + 36, 52, 22, 3, p.concrete);
  // meter box
  g.slab(ox + 58, 36, 7, 10, p.metal);
  g.r(ox + 60, 38, 3, 2, p.glass[3]);
  bush(g, p, ox + 6, 54, 1);
  bush(g, p, ox + 84, 54, 1);
  label(g, p, 112, 62, "METERING POINT");
};
const houseAnim = (g: Pix, t: number, p: Pal) => {
  const ox = 8;
  for (let i = 0; i < 5; i++) {
    const u = (t * 0.45 + i / 5) % 1;
    g.ell(
      Math.round(ox + 70 + Math.sin(u * 6 + i) * 3 + u * 8),
      Math.round(2 - u * 10),
      2 + Math.round(u * 3),
      1 + Math.round(u * 2),
      p.night
        ? `rgba(160,170,190,${0.28 * (1 - u)})`
        : `rgba(235,238,245,${0.8 * (1 - u)})`,
    );
  }
  if (Math.sin(t * 4) > 0) g.p(ox + 62, 44, p.data);
};

const reg = (g: Pix, p: Pal) => {
  plate(g, p, 120, 112);
  const ox = 10;
  // pediment
  g.poly(
    [
      [ox + 50, 12],
      [ox + 0, 30],
      [ox + 100, 30],
    ],
    p.concrete[0],
  );
  g.poly(
    [
      [ox + 50, 15],
      [ox + 8, 29],
      [ox + 92, 29],
    ],
    p.concrete[3],
  );
  g.poly(
    [
      [ox + 50, 15],
      [ox + 8, 29],
      [ox + 50, 29],
    ],
    p.concrete[4],
  );
  g.disc(ox + 50, 24, 4, p.yellow[2]);
  g.slab(ox - 2, 30, 104, 6, p.concrete);
  // columns
  for (let i = 0; i < 6; i++) {
    const x = ox + 3 + i * 18;
    g.slab(x - 1, 36, 12, 3, p.concrete);
    g.cylV(x, 39, 10, 36, p.concrete);
    for (let y = 44; y < 72; y += 5) g.r(x + 3, y, 1, 3, p.concrete[1]);
    g.slab(x - 1, 74, 12, 3, p.concrete);
  }
  g.slab(ox + 36, 50, 28, 26, p.dark);
  g.r(ox + 49, 50, 2, 26, p.dark[0]);
  // steps
  g.slab(ox - 6, 77, 112, 4, p.concrete);
  g.slab(ox - 10, 81, 120, 4, p.concrete);
  g.slab(ox - 14, 85, 128, 4, p.concrete);
  label(g, p, 120, 94, "REGULATOR");
};
const regAnim = (g: Pix, t: number, p: Pal) => {
  const ox = 10;
  g.r(ox + 50, 0, 2, 14, p.metal[2]);
  for (let i = 0; i < 16; i++) {
    const yo = Math.round(Math.sin(t * 5 + i * 0.5) * 1.5);
    g.r(ox + 52 + i, 1 + yo, 1, 7, i % 5 < 3 ? p.red[2] : p.red[3]);
  }
};

const std = (g: Pix, p: Pal) => {
  plate(g, p, 110, 104);
  g.slab(12, 22, 56, 66, p.paper);
  g.slab(18, 16, 56, 66, p.paper);
  g.r(24, 24, 28, 5, p.cyan[2]);
  for (let y = 36; y < 72; y += 6) g.r(24, y, y % 12 ? 44 : 36, 2, p.metal[3]);
  g.ball(58, 66, 10, p.leaf);
  g.line(53, 66, 57, 70, p.white);
  g.line(57, 70, 64, 61, p.white);
  g.line(53, 67, 57, 71, p.white);
  g.line(57, 71, 64, 62, p.white);
  label(g, p, 110, 94, "STANDARDS");
};
const stdAnim = (g: Pix, t: number, p: Pal) => {
  const cx = 88,
    cy = 36;
  g.disc(cx, cy, 14, p.metal[0]);
  for (let i = 0; i < 8; i++) {
    const a = t * 0.5 + (i * Math.PI) / 4;
    g.r(
      Math.round(cx + Math.cos(a) * 15 - 2),
      Math.round(cy + Math.sin(a) * 15 - 2),
      5,
      5,
      p.metal[1],
    );
  }
  g.ball(cx, cy, 12, p.metal);
  g.disc(cx, cy, 4, p.sky[3]!);
};

const sec = (g: Pix, p: Pal) => {
  plate(g, p, 92, 108);
  const pts: [number, number][] = [
    [46, 12],
    [78, 22],
    [78, 54],
    [46, 90],
    [14, 54],
    [14, 22],
  ];
  g.poly(pts, p.steel[0]);
  g.poly(
    [
      [46, 16],
      [74, 25],
      [74, 54],
      [46, 85],
      [18, 54],
      [18, 25],
    ],
    p.cyan[2],
  );
  g.poly(
    [
      [46, 16],
      [18, 25],
      [18, 54],
      [46, 85],
    ],
    p.cyan[3],
  );
  g.poly(
    [
      [46, 16],
      [74, 25],
      [74, 54],
      [46, 85],
    ],
    p.cyan[1],
  );
  g.poly(
    [
      [46, 20],
      [22, 27],
      [22, 40],
      [46, 36],
    ],
    p.cyan[4],
  );
  lock(g, p, 40, 38);
  label(g, p, 92, 94, "SECURITY");
};

const roles = (g: Pix, p: Pal) => {
  plate(g, p, 230, 108);
  const badge = (
    cx: number,
    R: typeof p.cyan,
    draw: () => void,
    name: string,
  ) => {
    g.ball(cx, 34, 24, R);
    draw();
    g.textCS(cx, 66, name, p.ink, p.night ? p.outline : p.white);
  };
  for (let x = 66; x < 86; x += 3) g.r(x, 34, 2, 2, p.data);
  for (let x = 144; x < 164; x += 3) g.r(x, 34, 2, 2, p.data);
  badge(
    40,
    p.purple,
    () => {
      g.line(40, 20, 33, 48, p.white);
      g.line(40, 20, 47, 48, p.white);
      g.line(35, 38, 45, 38, p.white);
      g.line(37, 30, 43, 30, p.white);
      g.r(30, 24, 20, 2, p.white);
    },
    "OPERATOR",
  );
  badge(
    115,
    p.cyan,
    () => {
      g.ball(115, 30, 9, p.yellow);
      g.slab(111, 38, 8, 8, p.metal);
      g.r(112, 46, 6, 2, p.metal[1]);
    },
    "SUPPLIER",
  );
  badge(
    190,
    p.amber,
    () => {
      g.slab(179, 22, 22, 24, p.paper);
      g.r(182, 25, 16, 6, p.leaf[2]);
      g.disc(190, 39, 4, p.metal[2]);
      g.line(190, 39, 193, 36, p.outline);
    },
    "METERING",
  );
  label(g, p, 230, 88, "MARKET ROLES");
};

export const grid: SceneDef = {
  id: "grid",
  name: "Grid",
  hint: "Hover or click anything. Power flows through the ground layer, rules and messages through the data layer. Dive into the house.",
  bg(g, p) {
    dataSky(g, p, 11);
    meadow(g, p, { road: true, seed: 11 });
    for (const [x, y, s, k] of [
      [18, 318, 1, "round"],
      [172, 316, 1, "pine"],
      [318, 318, 1, "round"],
      [452, 316, 1, "pine"],
      [598, 318, 1, "round"],
      [236, 318, 0.9, "round"],
    ] as const)
      tree(g, p, x, y, s, k);
  },
  anim(g, t, p) {
    clouds(g, p, t, 5, 4);
    const x1 = ((t * 22) % 760) - 60;
    car(g, p, x1, 326, p.red, false);
    const x2 = 700 - ((t * 16 + 300) % 760);
    car(g, p, x2, 341, p.cyan, true);
  },
  objects: [
    {
      id: "gen",
      layer: "p",
      x: 6,
      y: 176,
      w: 164,
      h: 144,
      name: "Generation",
      paint: gen,
      anim: genAnim,
      links: [],
      text: "Wind, solar and other plants feed power into the high-voltage grid.",
    },
    {
      id: "tso",
      layer: "p",
      x: 176,
      y: 168,
      w: 130,
      h: 150,
      name: "Transmission",
      paint: tso,
      anim: tsoAnim,
      links: [],
      text: "The TSO moves bulk power over long distances and keeps the whole system balanced.",
    },
    {
      id: "dso",
      layer: "p",
      x: 322,
      y: 216,
      w: 112,
      h: 104,
      name: "Substation",
      paint: dso,
      links: [],
      lights: [{ x: 6, y: 56, r: 40, color: "#ffd98a" }],
      text: "The DSO steps voltage down for local distribution.",
    },
    {
      id: "trafo",
      layer: "p",
      x: 448,
      y: 222,
      w: 64,
      h: 98,
      name: "Trafo",
      paint: trafo,
      links: [],
      text: "The last step down to household voltage.",
    },
    {
      id: "house",
      layer: "p",
      x: 524,
      y: 246,
      w: 112,
      h: 74,
      name: "Metering point",
      paint: house,
      anim: houseAnim,
      links: [],
      portal: { dx: 8, dy: 0 },
      lights: [
        { x: 28, y: 36, r: 34, color: "#ffc866" },
        { x: 82, y: 36, r: 34, color: "#ffc866" },
      ],
      text: "Where energy is measured and where market roles attach. Click to zoom in.",
    },
    {
      id: "reg",
      layer: "d",
      x: 24,
      y: 22,
      w: 120,
      h: 112,
      name: "Regulator",
      paint: reg,
      anim: regAnim,
      links: ["tso", "dso", "gen", "trafo"],
      text: "Sets binding rules for market processes and who may do what.",
    },
    {
      id: "std",
      layer: "d",
      x: 156,
      y: 26,
      w: 110,
      h: 108,
      name: "Standards",
      paint: std,
      anim: stdAnim,
      links: ["house", "dso"],
      text: "Standards bodies specify message formats and device protocols so everyone interoperates.",
    },
    {
      id: "sec",
      layer: "d",
      x: 278,
      y: 24,
      w: 92,
      h: 110,
      name: "Security",
      paint: sec,
      links: ["house", "dso"],
      text: "Certification and encryption rules for gateways and data exchange.",
    },
    {
      id: "roles",
      layer: "d",
      x: 388,
      y: 24,
      w: 230,
      h: 108,
      name: "Market roles",
      paint: roles,
      links: ["gen", "dso", "house"],
      text: "Network operator, supplier and metering party exchange standardised messages. No central hub needed.",
    },
  ],
  wires: [
    { kind: "p", pts: sagPts(156, 262, 206, 196, 10) },
    { kind: "p", pts: sagPts(158, 266, 196, 220, 8) },
    { kind: "p", pts: sagPts(160, 270, 204, 244, 6) },
    { kind: "p", pts: sagPts(276, 196, 344, 232, 12) },
    { kind: "p", pts: sagPts(286, 220, 382, 232, 10) },
    { kind: "p", pts: sagPts(278, 244, 420, 232, 8) },
    { kind: "p", pts: sagPts(436, 232, 458, 232, 3) },
    { kind: "p", pts: sagPts(462, 228, 540, 272, 16) },
    { kind: "d", pts: sagPts(60, 124, 600, 124, 0) },
    { kind: "d", pts: sagPts(580, 140, 80, 140, 0) },
  ],
};
void BAND_Y;
