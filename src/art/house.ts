import type { Pal } from "../palette";
import { polyPts, sagPts, type Pix } from "../pix";
import type { SceneDef } from "../types";
import { envelope, key, label, landscape, pole } from "./common";

export const cabinetOutside = (g: Pix, p: Pal, x: number, y: number) => {
  g.fill(x, y, 48, 27, p.metal, p.outline);
  g.fill(x + 4, y + 3, 20, 21, p.metalDark, p.outline);
  g.fill(x + 6, y + 5, 16, 17, p.white, p.outline);
  g.fill(x + 8, y + 7, 12, 5, p.green, p.outline);
  g.r(x + 9, y + 15, 3, 2, p.data);
  g.r(x + 14, y + 15, 3, 2, p.power);
  g.fill(x + 28, y + 5, 16, 16, p.metal2, p.outline);
  g.p(x + 31, y + 8, p.data);
  g.p(x + 34, y + 8, p.power);
  g.p(x + 37, y + 8, p.green);
  g.fill(x + 31, y + 12, 8, 6, p.metalDark, p.outline);
  g.r(x + 42, y + 1, 1, 5, p.outline);
};

const grid = (g: Pix, p: Pal) => {
  pole(g, p, 20, 2, 58);
  g.r(12, 4, 20, 2, p.wood);
  for (const x of [13, 21, 30]) g.r(x, 2, 1, 2, p.concrete);
  g.r(14, 60, 14, 1, p.outline);
  label(g, p, 44, 62, "CONNECTION");
};

const cabinet = (g: Pix, p: Pal) => {
  cabinetOutside(g, p, 4, 0);
  label(g, p, 56, 30, "METER CABINET");
};

const pv = (g: Pix, p: Pal) => {
  for (let x = 8; x < 60; x++) {
    const top = Math.round((x + 2) / 2.75) + 1;
    for (let y = top; y < Math.min(top + 6, 25); y++)
      g.p(x, y, (x + y) % 4 ? p.pv : p.pv2);
    g.p(x, top - 1, p.outline);
  }
  label(g, p, 66, 28, "ROOF PV");
};

const hems = (g: Pix, p: Pal) => {
  g.fill(10, 2, 26, 16, p.metalDark, p.outline);
  const bars = [6, 10, 8, 12, 7];
  bars.forEach((b, i) =>
    g.r(13 + i * 5, 16 - b, 3, b, i % 2 ? p.power : p.green),
  );
  g.r(22, 18, 2, 4, p.metal2);
  g.fill(42, 10, 8, 12, p.green2, p.outline);
  g.fill(44, 14, 4, 8, p.wood, p.outline);
  label(g, p, 56, 26, "HEMS");
};

const wallbox = (g: Pix, p: Pal) => {
  g.fill(6, 30, 8, 14, p.metalDark, p.outline);
  g.r(8, 33, 4, 2, p.green);
  g.p(10, 38, p.yellow);
  // EV
  g.fill(22, 38, 52, 12, p.white, p.outline);
  g.fill(32, 32, 28, 7, p.white, p.outline);
  g.fill(35, 34, 10, 4, p.glass, p.outline);
  g.fill(47, 34, 10, 4, p.glass, p.outline);
  for (const x of [32, 62]) {
    g.disc(x, 51, 3, p.outline);
    g.disc(x, 51, 1, p.metal);
  }
  g.r(21, 42, 2, 3, p.yellow);
  for (const [x, y] of sagPts(14, 38, 22, 44, 5)) g.p(x, y, p.cable);
  label(g, p, 84, 14, "WALLBOX + EV");
};

const pki = (g: Pix, p: Pal) => {
  g.fill(6, 2, 34, 24, p.white, p.outline);
  for (const y of [6, 9, 12, 15]) g.r(10, y, y === 15 ? 12 : 22, 1, p.metal);
  g.disc(34, 21, 4, p.outline);
  g.disc(34, 21, 3, p.red);
  g.r(31, 25, 2, 4, p.red);
  g.r(35, 25, 2, 4, p.red);
  key(g, p, 6, 28);
  label(g, p, 48, 34, "TRUST CHAIN");
};

const master = (g: Pix, p: Pal) => {
  g.fill(4, 7, 30, 22, p.yellow, p.outline);
  g.fill(4, 4, 12, 4, p.yellow, p.outline);
  g.fill(16, 12, 26, 18, p.white, p.outline);
  g.disc(23, 19, 3, p.outline);
  g.disc(23, 19, 2, p.wall);
  g.r(23, 26, 0, 0, p.outline);
  g.r(30, 17, 9, 1, p.metal);
  g.r(30, 21, 9, 1, p.metal);
  g.r(30, 25, 6, 1, p.metal);
  label(g, p, 48, 34, "MASTER DATA");
};

const msgs = (g: Pix, p: Pal) => {
  envelope(g, p, 8, 8);
  envelope(g, p, 28, 14, p.yellow);
  envelope(g, p, 48, 8, p.glass);
  for (let x = 20; x < 28; x += 2) g.p(x, 12, p.data);
  for (let x = 40; x < 48; x += 2) g.p(x, 14, p.data);
  g.line(60, 12, 68, 12, p.data);
  g.line(65, 9, 68, 12, p.data);
  g.line(65, 15, 68, 12, p.data);
  label(g, p, 80, 34, "MARKET MESSAGES");
};

const backend = (g: Pix, p: Pal) => {
  for (const [x, y, r] of [
    [16, 14, 6],
    [27, 11, 8],
    [38, 15, 6],
  ] as const)
    g.disc(x, y, r, p.outline);
  for (const [x, y, r] of [
    [16, 14, 5],
    [27, 11, 7],
    [38, 15, 5],
  ] as const)
    g.disc(x, y, r, p.white);
  g.r(14, 16, 26, 5, p.white);
  g.fill(21, 8, 14, 24, p.metalDark, p.outline);
  for (const y of [11, 17, 23]) {
    g.r(23, y, 10, 3, p.panel2);
    g.p(24, y + 1, p.green);
    g.p(26, y + 1, p.data);
  }
  label(g, p, 56, 34, "GATEWAY ADMIN");
};

export const house: SceneDef = {
  id: "house",
  name: "Metering Point",
  hint: "One household. The meter cabinet is where the physical connection meets the data layer. Dive into it.",
  bg(g, p) {
    landscape(g, p, { road: true, seed: 5 });
    // house shell
    for (let j = 0; j < 26; j++) {
      const half = Math.round((j + 1) * 2.75);
      g.r(132 - half, 78 + j, half * 2, 1, j % 3 ? p.roof : p.roof2);
      g.p(132 - half, 78 + j, p.outline);
      g.p(132 + half - 1, 78 + j, p.outline);
    }
    g.r(58, 104, 148, 2, p.outline);
    g.fill(64, 106, 136, 60, p.wall, p.outline);
    g.r(66, 108, 132, 52, p.wall2);
    g.r(64, 160, 136, 6, p.wood);
    g.fill(106, 124, 10, 14, p.glass, p.outline);
    // garage
    g.fill(202, 112, 104, 54, p.wall, p.outline);
    g.r(204, 120, 100, 44, p.wall2);
    g.fill(200, 108, 108, 6, p.roof2, p.outline);
    g.r(202, 160, 104, 6, p.concrete);
  },
  objects: [
    {
      id: "grid",
      layer: "p",
      x: 6,
      y: 96,
      w: 44,
      h: 70,
      name: "Connection",
      paint: grid,
      links: [],
      text: "The service cable from the street pole into the building.",
    },
    {
      id: "cabinet",
      layer: "p",
      x: 68,
      y: 108,
      w: 56,
      h: 38,
      name: "Meter cabinet",
      paint: cabinet,
      links: [],
      portal: { dx: 4, dy: 0 },
      text: "Smart meter plus communication gateway. Click to zoom inside.",
    },
    {
      id: "pv",
      layer: "p",
      x: 134,
      y: 78,
      w: 66,
      h: 34,
      name: "Roof PV",
      paint: pv,
      links: [],
      text: "Generation behind the meter, reported as a separate energy flow.",
    },
    {
      id: "hems",
      layer: "p",
      x: 126,
      y: 128,
      w: 56,
      h: 30,
      name: "HEMS",
      paint: hems,
      links: [],
      text: "Reads consumption through the gateway and steers flexible devices.",
    },
    {
      id: "wallbox",
      layer: "p",
      x: 208,
      y: 112,
      w: 84,
      h: 56,
      name: "Wallbox + EV",
      paint: wallbox,
      links: [],
      text: "A large flexible load that can be scheduled or throttled on a signal.",
    },
    {
      id: "pki",
      layer: "d",
      x: 8,
      y: 12,
      w: 48,
      h: 38,
      name: "Trust chain",
      paint: pki,
      links: ["cabinet"],
      text: "Certificates prove that gateway, operator and market parties are who they claim to be.",
    },
    {
      id: "master",
      layer: "d",
      x: 66,
      y: 12,
      w: 48,
      h: 38,
      name: "Master data",
      paint: master,
      links: ["grid", "cabinet"],
      text: "The metering point identity, its owner, supplier and assigned roles.",
    },
    {
      id: "msgs",
      layer: "d",
      x: 126,
      y: 12,
      w: 80,
      h: 38,
      name: "Market messages",
      paint: msgs,
      links: ["cabinet", "pv"],
      text: "Standardised files carry master data, meter readings and orders between market parties.",
    },
    {
      id: "backend",
      layer: "d",
      x: 218,
      y: 12,
      w: 56,
      h: 38,
      name: "Gateway admin",
      paint: backend,
      links: ["cabinet", "hems", "wallbox"],
      text: "Configures, updates and monitors gateways over an encrypted wide-area link.",
    },
  ],
  wires: [
    { kind: "p", pts: sagPts(30, 102, 76, 109, 8) },
    {
      kind: "p",
      pts: polyPts([
        [120, 152],
        [214, 152],
      ]),
    },
    {
      kind: "d",
      pts: polyPts([
        [100, 106],
        [100, 52],
        [246, 52],
      ]),
    },
    { kind: "d", pts: sagPts(20, 64, 300, 64, 0) },
  ],
};
