import type { Pal } from "../palette";
import { polyPts, sagPts, type Pix } from "../pix";
import type { SceneDef } from "../types";
import {
  bush,
  clouds,
  dataSky,
  envelope,
  key,
  label,
  meadow,
  plate,
  pole,
  tree,
} from "./common";

export const cabinetOutside = (g: Pix, p: Pal, x: number, y: number) => {
  g.shadow(x + 50, y + 56, 52, 3, p.outline, 0.5);
  g.slab(x, y, 96, 54, p.metal);
  g.slab(x + 6, y + 6, 54, 42, p.steel);
  g.slab(x + 10, y + 10, 46, 34, p.paper);
  // meter inside the window
  g.slab(x + 14, y + 13, 38, 28, p.concrete);
  g.slab(x + 17, y + 16, 32, 10, p.leaf);
  g.r(x + 19, y + 18, 5, 6, p.leaf[3]);
  g.r(x + 26, y + 18, 5, 6, p.leaf[3]);
  g.r(x + 33, y + 18, 5, 6, p.leaf[3]);
  g.r(x + 40, y + 18, 5, 6, p.leaf[3]);
  g.disc(x + 24, y + 33, 3, p.data);
  g.disc(x + 34, y + 33, 3, p.power);
  g.r(x + 14, y + 12, 38, 2, p.glass[4]);
  // gateway compartment
  g.slab(x + 64, y + 6, 26, 42, p.dark);
  for (let i = 0; i < 4; i++) g.r(x + 68, y + 12 + i * 4, 18, 1, p.dark[3]);
  g.r(x + 68, y + 30, 3, 3, p.data);
  g.r(x + 74, y + 30, 3, 3, p.power);
  g.r(x + 80, y + 30, 3, 3, p.leaf[3]);
  g.r(x + 68, y + 38, 18, 5, p.dark[1]);
  // hinges and seal
  for (const hy of [10, 40]) g.slab(x + 1, y + hy, 4, 6, p.dark);
  g.ball(x + 58, y + 49, 2, p.red);
};

const grid = (g: Pix, p: Pal) => {
  pole(g, p, 40, 4, 112, 8);
  g.slab(14, 10, 60, 6, p.wood);
  for (const x of [16, 38, 68]) g.r(x, 4, 3, 7, p.concrete[3]);
  g.cylV(52, 40, 14, 28, p.steel);
  g.slab(51, 36, 16, 4, p.metal);
  g.r(46, 72, 2, 36, p.dark[2]);
  label(g, p, 100, 118, "CONNECTION");
};

const cabinet = (g: Pix, p: Pal) => {
  cabinetOutside(g, p, 8, 0);
  label(g, p, 112, 62, "METER CABINET");
};

const pv = (g: Pix, p: Pal) => {
  const s = (x: number) => 168 + (x - 265) * 0.353 - 170;
  for (let i = 0; i < 5; i++) {
    const x0 = 290 - 278 + i * 25,
      x1 = x0 + 23;
    const wx0 = x0 + 278,
      wx1 = x1 + 278;
    const q: [number, number][] = [
      [x0, s(wx0) + 7],
      [x1, s(wx1) + 7],
      [x1, s(wx1) + 24],
      [x0, s(wx0) + 24],
    ];
    g.poly(q, p.pv[0]);
    g.poly(
      q
        .map(([x, y]) => [x, y] as [number, number])
        .map(
          ([x, y], j) =>
            [x + (j === 0 || j === 3 ? 1 : -1), y + (j < 2 ? 1 : -1)] as [
              number,
              number,
            ],
        ),
      p.pv[2],
    );
    for (let k = 1; k < 4; k++)
      g.line(
        x0 + k * 6,
        s(wx0 + k * 6) + 8,
        x0 + k * 6,
        s(wx0 + k * 6) + 23,
        p.pv[1],
      );
    g.line(
      x0 + 2,
      (s(wx0) + s(wx1)) / 2 + 15,
      x1 - 2,
      (s(wx0) + s(wx1)) / 2 + 15,
      p.pv[1],
    );
    g.line(x0 + 3, s(wx0 + 3) + 9, x0 + 9, s(wx0 + 9) + 9, p.pv[4]);
  }
  label(g, p, 134, 66, "ROOF PV");
};

const hems = (g: Pix, p: Pal) => {
  g.slab(8, 4, 66, 40, p.dark);
  g.r(11, 7, 60, 34, p.dark[1]);
  const bars = [10, 18, 14, 24, 16, 20];
  bars.forEach((b, i) =>
    g.r(15 + i * 9, 36 - b, 6, b, i % 2 ? p.amber[2] : p.leaf[3]),
  );
  g.line(14, 20, 70, 14, p.cyan[3]);
  g.r(38, 44, 6, 6, p.metal[2]);
  g.slab(30, 50, 22, 3, p.metal);
  // plant and speaker
  g.slab(86, 30, 14, 20, p.wall);
  g.cylV(88, 34, 10, 16, p.metal);
  g.ball(93, 26, 7, p.leaf);
  label(g, p, 110, 54, "HEMS");
};
const hemsAnim = (g: Pix, t: number, p: Pal) => {
  const k = Math.floor(t * 2) % 6;
  g.r(15 + k * 9, 36 - 8, 6, 2, p.white);
};

const wallbox = (g: Pix, p: Pal) => {
  g.slab(10, 20, 30, 52, p.dark);
  g.slab(14, 26, 22, 16, p.dark);
  g.r(16, 28, 18, 12, p.leaf[2]);
  g.r(20, 46, 10, 3, p.leaf[3]);
  g.disc(25, 58, 4, p.metal[2]);
  g.disc(25, 58, 2, p.dark[0]);
  // EV
  g.shadow(122, 80, 76, 4, p.outline, 0.55);
  g.poly(
    [
      [48, 62],
      [52, 50],
      [76, 46],
      [90, 28],
      [140, 28],
      [160, 46],
      [190, 52],
      [194, 62],
      [194, 74],
      [48, 74],
    ],
    p.cyan[0],
  );
  g.poly(
    [
      [50, 62],
      [54, 52],
      [78, 48],
      [92, 30],
      [138, 30],
      [158, 48],
      [188, 54],
      [192, 62],
      [192, 72],
      [50, 72],
    ],
    p.cyan[2],
  );
  g.poly(
    [
      [92, 30],
      [138, 30],
      [136, 34],
      [94, 34],
    ],
    p.cyan[4],
  );
  g.poly(
    [
      [96, 36],
      [114, 36],
      [114, 48],
      [84, 48],
    ],
    p.glass[2],
  );
  g.poly(
    [
      [118, 36],
      [135, 36],
      [152, 48],
      [118, 48],
    ],
    p.glass[2],
  );
  g.r(115, 36, 2, 12, p.cyan[0]);
  g.r(52, 70, 138, 2, p.cyan[1]);
  g.r(184, 56, 8, 4, p.yellow[3]);
  g.r(50, 56, 4, 4, p.red[2]);
  for (const wx of [78, 160]) {
    g.disc(wx, 74, 11, p.outline);
    g.disc(wx, 74, 9, p.dark[2]);
    g.disc(wx, 74, 5, p.metal[3]);
    g.disc(wx, 74, 2, p.metal[1]);
  }
  for (const [x, y] of sagPts(36, 62, 54, 62, 10)) g.r(x, y, 2, 2, p.dark[1]);
  g.r(46, 60, 8, 4, p.yellow[2]);
  label(g, p, 208, 8, "WALLBOX + EV");
};
const wallboxAnim = (g: Pix, t: number, p: Pal) => {
  const k = (Math.sin(t * 3) + 1) / 2;
  g.r(16, 46, Math.round(14 * k) + 2, 3, p.leaf[4]);
};

const pki = (g: Pix, p: Pal) => {
  plate(g, p, 124, 112);
  g.slab(14, 12, 76, 56, p.paper);
  g.box(18, 16, 68, 48, p.yellow[2]);
  g.r(24, 24, 40, 3, p.metal[2]);
  for (const y of [32, 38, 44]) g.r(24, y, y === 44 ? 34 : 52, 2, p.metal[3]);
  g.ball(76, 56, 11, p.red);
  g.poly(
    [
      [70, 64],
      [66, 82],
      [72, 76],
      [76, 84],
      [76, 66],
    ],
    p.red[1],
  );
  g.poly(
    [
      [78, 66],
      [80, 84],
      [84, 76],
      [90, 82],
      [86, 64],
    ],
    p.red[2],
  );
  key(g, p, 12, 76);
  label(g, p, 124, 94, "TRUST CHAIN");
};

const master = (g: Pix, p: Pal) => {
  plate(g, p, 124, 108);
  g.slab(10, 24, 66, 52, p.yellow);
  g.slab(10, 16, 28, 10, p.yellow);
  g.slab(34, 34, 62, 40, p.paper);
  g.slab(40, 40, 18, 22, p.skin);
  g.ball(49, 48, 5, p.skin);
  g.slab(42, 56, 14, 8, p.cyan);
  for (const y of [42, 49, 56]) g.r(64, y, 26, 2, p.metal[2]);
  for (let i = 0; i < 12; i++) g.r(64 + i * 2, 64, i % 3 ? 1 : 2, 6, p.outline);
  label(g, p, 124, 90, "MASTER DATA");
};

const msgs = (g: Pix, p: Pal) => {
  plate(g, p, 170, 108);
  envelope(g, p, 12, 20);
  envelope(g, p, 56, 42, p.yellow);
  envelope(g, p, 100, 20, p.cyan);
  for (let x = 30; x < 54; x += 4) g.r(x, 36, 2, 2, p.data);
  for (let x = 74; x < 98; x += 4) g.r(x, 40, 2, 2, p.data);
  g.poly(
    [
      [132, 24],
      [152, 36],
      [132, 48],
    ],
    p.data,
  );
  g.r(120, 33, 14, 6, p.data);
  label(g, p, 170, 90, "MARKET MESSAGES");
};
const msgsAnim = (g: Pix, t: number, p: Pal) => {
  const u = (t * 0.35) % 1;
  envelope(
    g,
    p,
    Math.round(12 + u * 110),
    Math.round(60 - Math.sin(u * 3.14) * 8),
    p.paper,
  );
};

const backend = (g: Pix, p: Pal) => {
  plate(g, p, 140, 112);
  for (const [x, y, r] of [
    [40, 40, 16],
    [62, 32, 20],
    [88, 40, 16],
    [64, 44, 18],
  ] as const)
    g.ball(x, y, r, p.paper);
  g.slab(52, 26, 36, 56, p.dark);
  for (let i = 0; i < 4; i++) {
    g.slab(55, 30 + i * 12, 30, 10, p.dark);
    g.r(58, 33 + i * 12, 10, 3, p.dark[3]);
  }
  label(g, p, 140, 94, "GATEWAY ADMIN");
};
const backendAnim = (g: Pix, t: number, p: Pal) => {
  for (let i = 0; i < 4; i++) {
    g.r(
      76,
      34 + i * 12,
      3,
      3,
      Math.sin(t * 4 + i * 1.7) > 0 ? p.leaf[4] : p.leaf[1],
    );
    g.r(80, 34 + i * 12, 3, 3, Math.sin(t * 3 + i) > 0.3 ? p.data : p.cyan[1]);
  }
};

export const house: SceneDef = {
  id: "house",
  name: "Metering Point",
  hint: "One household. The meter cabinet is where the physical connection meets the data layer. Dive into it.",
  bg(g, p) {
    dataSky(g, p, 5);
    meadow(g, p, { road: true, seed: 5 });
    tree(g, p, 606, 316, 1.1, "round");
    // house body (cutaway)
    g.shadow(265, 322, 160, 5, p.outline, 0.5);
    g.slab(124, 220, 284, 100, p.wall);
    g.r(126, 224, 280, 92, p.wall[3]);
    for (let x = 128; x < 404; x += 8) g.r(x, 224, 1, 92, p.wall[2]);
    for (let y = 224; y < 316; y += 46) g.r(126, y, 280, 1, p.wall[2]);
    // wooden floor
    g.r(126, 304, 280, 14, p.wood[2]);
    for (let x = 126; x < 406; x += 22) g.r(x, 304, 1, 14, p.wood[0]);
    g.r(126, 304, 280, 2, p.wood[3]);
    // ceiling beam
    g.slab(124, 218, 284, 8, p.wood);
    // roof
    g.poly(
      [
        [104, 222],
        [265, 166],
        [426, 222],
      ],
      p.roof[0],
    );
    g.poly(
      [
        [110, 220],
        [265, 171],
        [420, 220],
      ],
      p.roof[2],
    );
    for (let y = 176; y < 218; y += 5) {
      const half = ((y - 168) / 54) * 153;
      g.r(265 - half, y, half * 2, 1, p.roof[1]);
      for (let x = 265 - half + ((y / 5) % 2 ? 0 : 6); x < 265 + half; x += 12)
        g.p(x, y + 1, p.roof[3]);
    }
    g.slab(100, 220, 330, 6, p.roof);
    // window with curtains and picture
    g.slab(340, 240, 50, 54, p.paper);
    g.r(344, 244, 42, 46, p.glass[2]);
    g.r(344, 244, 42, 14, p.glass[3]);
    g.r(364, 244, 2, 46, p.paper[2]);
    g.r(344, 266, 42, 2, p.paper[2]);
    g.poly(
      [
        [342, 242],
        [356, 242],
        [348, 292],
        [342, 292],
      ],
      p.red[2],
    );
    g.poly(
      [
        [388, 242],
        [374, 242],
        [382, 292],
        [388, 292],
      ],
      p.red[2],
    );
    g.slab(322, 266, 14, 18, p.wood);
    g.r(325, 269, 8, 12, p.cyan[2]);
    // garage
    g.slab(404, 250, 222, 70, p.wall);
    g.r(407, 258, 216, 56, p.wall[1]);
    g.slab(398, 238, 234, 14, p.concrete);
    g.r(407, 304, 216, 14, p.concrete[2]);
    for (let x = 407; x < 623; x += 12) g.r(x, 304, 1, 14, p.concrete[1]);
    // door opening arch to garage
    g.slab(404, 248, 8, 72, p.wood);
  },
  anim(g, t, p) {
    clouds(g, p, t, 5, 8);
  },
  objects: [
    {
      id: "grid",
      layer: "p",
      x: 10,
      y: 188,
      w: 100,
      h: 126,
      name: "Connection",
      paint: grid,
      links: [],
      text: "The service cable from the street pole into the building.",
    },
    {
      id: "cabinet",
      layer: "p",
      x: 140,
      y: 236,
      w: 112,
      h: 72,
      name: "Meter cabinet",
      paint: cabinet,
      links: [],
      portal: { dx: 8, dy: 0 },
      text: "Smart meter plus communication gateway. Click to zoom inside.",
    },
    {
      id: "pv",
      layer: "p",
      x: 278,
      y: 170,
      w: 138,
      h: 74,
      name: "Roof PV",
      paint: pv,
      links: [],
      text: "Rooftop solar: generation behind the meter, reported as a separate energy flow.",
    },
    {
      id: "hems",
      layer: "p",
      x: 264,
      y: 252,
      w: 112,
      h: 66,
      name: "HEMS",
      paint: hems,
      anim: hemsAnim,
      links: [],
      text: "Home energy management: reads consumption through the gateway and steers flexible devices.",
    },
    {
      id: "wallbox",
      layer: "p",
      x: 418,
      y: 236,
      w: 206,
      h: 88,
      name: "Wallbox + EV",
      paint: wallbox,
      anim: wallboxAnim,
      links: [],
      lights: [{ x: 25, y: 34, r: 30, color: "#58e090" }],
      text: "A large flexible load that can be scheduled or throttled on a signal.",
    },
    {
      id: "pki",
      layer: "d",
      x: 24,
      y: 22,
      w: 124,
      h: 112,
      name: "Trust chain",
      paint: pki,
      links: ["cabinet"],
      text: "Certificates prove that gateway, operator and market parties are who they claim to be.",
    },
    {
      id: "master",
      layer: "d",
      x: 160,
      y: 26,
      w: 124,
      h: 108,
      name: "Master data",
      paint: master,
      links: ["grid", "cabinet"],
      text: "The metering point identity, its owner, supplier and assigned roles.",
    },
    {
      id: "msgs",
      layer: "d",
      x: 296,
      y: 26,
      w: 170,
      h: 108,
      name: "Market messages",
      paint: msgs,
      anim: msgsAnim,
      links: ["cabinet", "pv"],
      text: "Standardised files carry master data, meter readings and orders between market parties.",
    },
    {
      id: "backend",
      layer: "d",
      x: 480,
      y: 22,
      w: 140,
      h: 112,
      name: "Gateway admin",
      paint: backend,
      anim: backendAnim,
      links: ["cabinet", "hems", "wallbox"],
      text: "Configures, updates and monitors gateways over an encrypted wide-area link.",
    },
  ],
  wires: [
    { kind: "p", pts: sagPts(58, 212, 176, 244, 26) },
    {
      kind: "p",
      pts: polyPts([
        [232, 300],
        [440, 300],
      ]),
    },
    {
      kind: "d",
      pts: polyPts([
        [196, 238],
        [196, 150],
        [550, 150],
        [550, 136],
      ]),
    },
    { kind: "d", pts: sagPts(30, 144, 610, 144, 0) },
  ],
};
void bush;
