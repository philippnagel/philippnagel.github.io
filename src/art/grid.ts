import type { Pal } from "../palette";
import { sagPts, type Pix } from "../pix";
import type { SceneDef } from "../types";
import { label, landscape, lock, tree } from "./common";

function turbine(
  g: Pix,
  p: Pal,
  x: number,
  hy: number,
  len: number,
  gy: number,
) {
  g.r(x - 1, hy, 4, gy - hy, p.outline);
  g.r(x, hy, 2, gy - hy, p.white);
  const hx = x + 1;
  for (const [dx, dy] of [
    [0, -1],
    [0.87, 0.5],
    [-0.87, 0.5],
  ] as const)
    g.line(
      hx,
      hy,
      hx + Math.round(dx * len),
      hy + Math.round(dy * len),
      p.metalDark,
    );
  g.disc(hx, hy, 1, p.outline);
}

const gen = (g: Pix, p: Pal) => {
  turbine(g, p, 14, 14, 10, 44);
  turbine(g, p, 40, 20, 8, 44);
  for (let i = 0; i < 4; i++) {
    const x = 2 + i * 15;
    g.fill(x, 46, 13, 7, p.pv, p.outline);
    g.line(x + 4, 47, x + 4, 51, p.pv2);
    g.line(x + 8, 47, x + 8, 51, p.pv2);
    g.r(x + 6, 53, 1, 3, p.metalDark);
  }
  g.r(61, 24, 1, 22, p.outline);
  g.r(62, 24, 2, 22, p.wood);
  g.r(59, 24, 8, 2, p.wood);
  label(g, p, 66, 58, "GENERATION");
};

const tso = (g: Pix, p: Pal) => {
  // lattice tower
  g.line(21, 62, 29, 8, p.metalDark);
  g.line(39, 62, 31, 8, p.metalDark);
  g.line(22, 62, 30, 8, p.metal2);
  g.line(38, 62, 30, 8, p.metal2);
  for (const y of [22, 34, 46, 58]) {
    const half = Math.round(1 + (y - 8) * 0.17);
    g.r(30 - half - 1, y, half * 2 + 2, 1, p.metalDark);
  }
  g.line(24, 46, 36, 34, p.metal2);
  g.line(36, 46, 24, 34, p.metal2);
  g.line(26, 34, 34, 22, p.metal2);
  g.line(34, 34, 26, 22, p.metal2);
  g.r(4, 12, 52, 2, p.metalDark);
  g.r(10, 24, 40, 2, p.metalDark);
  for (const x of [5, 29, 54]) g.r(x, 14, 1, 3, p.concrete);
  for (const x of [11, 49]) g.r(x, 26, 1, 3, p.concrete);
  g.r(21, 62, 18, 2, p.outline);
  label(g, p, 60, 66, "TRANSMISSION");
};

const dso = (g: Pix, p: Pal) => {
  g.r(4, 3, 2, 15, p.metal2);
  g.r(46, 3, 2, 15, p.metal2);
  g.r(4, 3, 44, 2, p.metalDark);
  for (const x of [11, 25, 38]) g.r(x, 5, 1, 3, p.concrete);
  g.fill(2, 18, 48, 18, p.concrete, p.outline);
  for (const x of [6, 29]) {
    g.fill(x, 21, 16, 12, p.metal, p.outline);
    for (let i = 3; i < 15; i += 3) g.r(x + i, 22, 1, 10, p.metal2);
    g.r(x + 3, 17, 2, 4, p.roof2);
    g.r(x + 10, 17, 2, 4, p.roof2);
  }
  for (let x = 2; x < 50; x += 3) g.r(x, 36, 1, 3, p.outline);
  label(g, p, 52, 40, "SUBSTATION");
};

const trafo = (g: Pix, p: Pal) => {
  g.r(10, 2, 1, 33, p.outline);
  g.r(11, 2, 3, 33, p.wood);
  g.r(14, 2, 1, 33, p.outline);
  g.r(4, 3, 18, 2, p.wood);
  for (const x of [5, 20]) g.r(x, 1, 1, 2, p.concrete);
  g.fill(14, 10, 8, 12, p.metal, p.outline);
  g.r(16, 8, 4, 2, p.metalDark);
  g.r(8, 35, 10, 1, p.outline);
  label(g, p, 26, 36, "TRAFO");
};

const house = (g: Pix, p: Pal) => {
  for (let j = 0; j < 10; j++) {
    const half = Math.round((j + 1) * 2.4);
    g.r(28 - half, j, half * 2, 1, j % 2 ? p.roof2 : p.roof);
    g.p(28 - half, j, p.outline);
    g.p(28 + half - 1, j, p.outline);
  }
  for (let j = 4; j < 8; j++) {
    const right = 28 + Math.round((j + 1) * 2.4) - 3;
    for (let x = 32; x < right; x++) g.p(x, j, (x + j) % 2 ? p.pv : p.pv2);
  }
  g.fill(8, 10, 40, 17, p.wall, p.outline);
  g.fill(11, 14, 7, 7, p.glass, p.outline);
  g.fill(38, 14, 7, 7, p.glass, p.outline);
  g.fill(26, 16, 7, 11, p.wood, p.outline);
  g.fill(19, 14, 5, 8, p.metal, p.outline);
  g.p(21, 17, p.glass);
  g.p(21, 19, p.data);
  label(g, p, 56, 29, "METERING POINT");
};

const reg = (g: Pix, p: Pal) => {
  for (let j = 0; j < 6; j++) {
    const half = Math.round((j + 1) * 3.5);
    g.r(22 - half, 6 + j, half * 2, 1, p.concrete);
    g.p(22 - half, 6 + j, p.outline);
    g.p(22 + half - 1, 6 + j, p.outline);
  }
  g.r(2, 12, 40, 2, p.metal2);
  for (const x of [5, 13, 21, 29, 37]) {
    g.r(x, 14, 3, 13, p.white);
    g.r(x, 14, 1, 13, p.wall2);
  }
  g.r(1, 27, 42, 2, p.concrete);
  g.r(0, 29, 44, 2, p.metal);
  g.r(22, 0, 1, 6, p.outline);
  g.r(23, 0, 5, 3, p.red);
  label(g, p, 44, 33, "REGULATOR");
};

const std = (g: Pix, p: Pal) => {
  g.fill(4, 2, 16, 22, p.white, p.outline);
  for (let y = 6; y < 20; y += 3) g.r(7, y, y === 18 ? 6 : 10, 1, p.metal);
  g.disc(30, 14, 6, p.outline);
  g.disc(30, 14, 5, p.metal2);
  g.disc(30, 14, 2, p.bandA);
  for (let a = 0; a < 8; a++) {
    const t = (a * Math.PI) / 4;
    g.r(
      30 + Math.round(Math.cos(t) * 7) - 1,
      14 + Math.round(Math.sin(t) * 7) - 1,
      2,
      2,
      p.metal2,
    );
  }
  label(g, p, 40, 29, "STANDARDS");
};

const sec = (g: Pix, p: Pal) => {
  for (let j = 0; j < 24; j++) {
    const half = j < 14 ? 11 : 11 - Math.round((j - 13) * 1.1);
    g.r(18 - half, 2 + j, half * 2, 1, p.outline);
    g.r(
      18 - half + 1,
      2 + j,
      Math.max(0, half * 2 - 2),
      1,
      j < 4 ? p.green : p.green2,
    );
  }
  lock(g, p, 15, 10);
  label(g, p, 36, 29, "SECURITY");
};

const roles = (g: Pix, p: Pal) => {
  const nodes = [
    { cx: 17, c: p.purple, n: "OPERATOR" },
    { cx: 52, c: p.data, n: "SUPPLIER" },
    { cx: 87, c: p.power, n: "METERING" },
  ];
  for (let x = 24; x < 46; x += 2) g.p(x, 16, p.data);
  for (let x = 59; x < 81; x += 2) g.p(x, 16, p.data);
  for (const { cx, c, n } of nodes) {
    g.disc(cx, 6, 3, p.outline);
    g.disc(cx, 6, 2, p.wall);
    g.fill(cx - 6, 11, 13, 10, c, p.outline);
    g.textC(cx, 24, n, p.inkDim);
  }
  label(g, p, 104, 32, "MARKET ROLES");
};

export const grid: SceneDef = {
  id: "grid",
  name: "Grid",
  hint: "Hover or click anything. Power flows through the ground layer, rules and messages through the data layer. Dive into the house.",
  bg(g, p) {
    landscape(g, p, { road: true, seed: 11 });
    for (const [x, y] of [
      [232, 150],
      [304, 148],
    ] as const) {
      g.fill(x, y + 4, 12, 8, p.wall, p.outline);
      g.fill(x - 1, y, 14, 4, p.roof, p.outline);
      g.p(x + 5, y + 8, p.wood);
    }
    for (const x of [8, 78, 138, 196, 232, 292]) tree(g, p, x, 161);
  },
  objects: [
    {
      id: "gen",
      layer: "p",
      x: 2,
      y: 96,
      w: 66,
      h: 64,
      name: "Generation",
      paint: gen,
      links: [],
      text: "Wind, solar and other plants feed power into the high-voltage grid.",
    },
    {
      id: "tso",
      layer: "p",
      x: 74,
      y: 90,
      w: 60,
      h: 72,
      name: "Transmission",
      paint: tso,
      links: [],
      text: "The TSO moves bulk power over long distances and keeps the whole system balanced.",
    },
    {
      id: "dso",
      layer: "p",
      x: 140,
      y: 112,
      w: 52,
      h: 46,
      name: "Substation",
      paint: dso,
      links: [],
      text: "The DSO steps voltage down for local distribution.",
    },
    {
      id: "trafo",
      layer: "p",
      x: 200,
      y: 118,
      w: 26,
      h: 40,
      name: "Trafo",
      paint: trafo,
      links: [],
      text: "The last step down to household voltage.",
    },
    {
      id: "house",
      layer: "p",
      x: 246,
      y: 124,
      w: 56,
      h: 36,
      name: "Metering point",
      paint: house,
      links: [],
      portal: { dx: 4, dy: 0 },
      text: "Where energy is measured and where market roles attach. Click to zoom in.",
    },
    {
      id: "reg",
      layer: "d",
      x: 14,
      y: 12,
      w: 44,
      h: 38,
      name: "Regulator",
      paint: reg,
      links: ["tso", "dso", "gen", "trafo"],
      text: "Sets binding rules for market processes and who may do what.",
    },
    {
      id: "std",
      layer: "d",
      x: 70,
      y: 12,
      w: 40,
      h: 36,
      name: "Standards",
      paint: std,
      links: ["house", "dso"],
      text: "Specify message formats and device protocols so everyone interoperates.",
    },
    {
      id: "sec",
      layer: "d",
      x: 122,
      y: 12,
      w: 36,
      h: 36,
      name: "Security",
      paint: sec,
      links: ["house", "dso"],
      text: "Certification and encryption rules for gateways and data exchange.",
    },
    {
      id: "roles",
      layer: "d",
      x: 170,
      y: 12,
      w: 104,
      h: 38,
      name: "Market roles",
      paint: roles,
      links: ["gen", "dso", "house"],
      text: "Network operator, supplier and metering party exchange standardised messages. No central hub needed.",
    },
  ],
  wires: [
    { kind: "p", pts: sagPts(64, 118, 84, 114, 2) },
    { kind: "p", pts: sagPts(130, 102, 144, 114, 3) },
    { kind: "p", pts: sagPts(124, 114, 146, 116, 2) },
    { kind: "p", pts: sagPts(188, 115, 207, 120, 2) },
    { kind: "p", pts: sagPts(219, 120, 264, 136, 6) },
    { kind: "d", pts: sagPts(30, 62, 290, 62, 0) },
    { kind: "d", pts: sagPts(290, 70, 40, 70, 0) },
  ],
};
