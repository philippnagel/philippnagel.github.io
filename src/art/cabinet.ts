import type { Pal } from "../palette";
import { polyPts, rng, type Pix } from "../pix";
import type { SceneDef } from "../types";
import { BAND_Y, SH, SW } from "../geometry";
import { dataSky, envelope, key, label, lock, plate } from "./common";

export const gatewayBox = (g: Pix, p: Pal, x: number, y: number) => {
  g.shadow(x + 62, y + 110, 62, 4, p.outline, 0.5);
  g.cylV(x + 100, y, 6, 22, p.dark);
  g.ball(x + 103, y, 5, p.cyan);
  g.slab(x, y + 20, 124, 90, p.dark);
  g.r(x + 4, y + 24, 116, 3, p.dark[3]);
  for (let i = 0; i < 6; i++) g.r(x + 10 + i * 5, y + 34, 3, 24, p.dark[0]);
  // sticker with QR
  g.slab(x + 44, y + 32, 40, 36, p.paper);
  const r = rng(4);
  for (let j = 0; j < 7; j++)
    for (let i = 0; i < 7; i++)
      if (r() > 0.45) g.r(x + 48 + i * 3, y + 36 + j * 3, 3, 3, p.outline);
  g.r(x + 48, y + 36, 8, 8, p.outline);
  g.r(x + 50, y + 38, 4, 4, p.paper[2]);
  for (let i = 0; i < 3; i++) g.r(x + 90, y + 34 + i * 8, 24, 2, p.dark[3]);
  // ports
  for (let i = 0; i < 3; i++) {
    g.slab(x + 12 + i * 20, y + 84, 16, 14, p.metal);
    g.r(x + 15 + i * 20, y + 88, 10, 8, p.dark[0]);
  }
  g.slab(x + 80, y + 84, 28, 14, p.metal);
};
const gatewayLeds = (g: Pix, t: number, p: Pal, x: number, y: number) => {
  g.r(x + 8, y + 26, 5, 5, p.data);
  g.r(x + 16, y + 26, 5, 5, Math.sin(t * 5) > -0.3 ? p.leaf[4] : p.leaf[1]);
  g.r(x + 24, y + 26, 5, 5, Math.sin(t * 7 + 1) > 0 ? p.amber[3] : p.amber[0]);
};

const meter = (g: Pix, p: Pal) => {
  g.shadow(60, 134, 56, 4, p.outline, 0.5);
  g.slab(10, 4, 100, 120, p.concrete);
  g.slab(18, 12, 84, 24, p.paper);
  g.slab(22, 16, 76, 16, p.leaf);
  g.r(24, 18, 72, 12, p.leaf[1]);
  g.text(28, 19, "001234.5", p.leaf[4], 1);
  g.text(28, 19, "", p.leaf[4]);
  g.text(80, 24, "KWH", p.leaf[3]);
  g.disc(34, 50, 6, p.dark[0]);
  g.disc(34, 50, 4, p.dark[2]);
  g.ball(60, 50, 5, p.metal);
  g.slab(74, 44, 14, 12, p.metal);
  g.slab(90, 44, 14, 12, p.metal);
  g.slab(22, 62, 76, 44, p.dark);
  for (let i = 0; i < 4; i++) {
    g.slab(26 + i * 18, 70, 12, 12, p.metal);
    g.disc(32 + i * 18, 76, 3, p.metal[0]);
  }
  g.r(26, 90, 68, 2, p.red[1]);
  g.ball(60, 98, 3, p.red);
  g.r(34, 108, 3, 18, p.red[2]);
  g.r(52, 108, 3, 18, p.dark[0]);
  g.r(70, 108, 3, 18, p.cyan[2]);
  g.r(88, 108, 3, 18, p.leaf[2]);
  label(g, p, 120, 130, "SMART METER");
};
const meterAnim = (g: Pix, t: number, p: Pal) => {
  g.r(98, 18, 5, 5, Math.sin(t * 6) > 0 ? p.red[3] : p.red[0]);
  g.r(28 + 45, 19, 0, 0, p.white);
};

const gateway = (g: Pix, p: Pal) => {
  gatewayBox(g, p, 8, 4);
  label(g, p, 140, 122, "GATEWAY");
};
const gatewayAnim = (g: Pix, t: number, p: Pal) => gatewayLeds(g, t, p, 8, 4);

const submeter = (g: Pix, p: Pal) => {
  g.shadow(48, 98, 40, 3, p.outline, 0.5);
  g.slab(14, 4, 68, 80, p.concrete);
  g.slab(20, 10, 56, 20, p.leaf);
  g.r(22, 12, 52, 16, p.leaf[1]);
  g.text(26, 16, "0042", p.leaf[4], 2);
  g.disc(34, 46, 5, p.dark[1]);
  g.slab(48, 40, 20, 12, p.metal);
  g.slab(20, 60, 56, 16, p.dark);
  g.r(28, 84, 3, 12, p.dark[0]);
  g.r(64, 84, 3, 12, p.red[2]);
  label(g, p, 96, 100, "SUB-METER");
};

const devices = (g: Pix, p: Pal) => {
  g.slab(6, 6, 50, 52, p.concrete);
  g.ball(31, 30, 11, p.yellow);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.r(
      Math.round(31 + Math.cos(a) * 16) - 1,
      Math.round(30 + Math.sin(a) * 16) - 1,
      3,
      3,
      p.yellow[3],
    );
  }
  g.slab(64, 6, 36, 52, p.dark);
  g.slab(70, 12, 24, 14, p.dark);
  g.r(72, 14, 20, 10, p.leaf[2]);
  g.cylV(76, 34, 12, 16, p.metal);
  g.slab(108, 6, 62, 52, p.wall);
  g.disc(139, 32, 20, p.outline);
  g.disc(139, 32, 18, p.metal[1]);
  g.disc(139, 32, 3, p.dark[0]);
  label(g, p, 178, 70, "LOCAL DEVICES");
};
const devicesAnim = (g: Pix, t: number, p: Pal) => {
  for (let i = 0; i < 4; i++) {
    const a = t * 6 + (i * Math.PI) / 2;
    g.line(
      139,
      32,
      Math.round(139 + Math.cos(a) * 16),
      Math.round(32 + Math.sin(a) * 16),
      p.metal[4],
    );
    g.line(
      140,
      32,
      Math.round(140 + Math.cos(a) * 16),
      Math.round(32 + Math.sin(a) * 16),
      p.metal[3],
    );
  }
  g.disc(139, 32, 3, p.dark[0]);
};

const chip = (g: Pix, p: Pal, x: number, y: number, R: typeof p.metal) => {
  g.slab(x, y, 24, 24, R);
  g.r(x + 9, y + 9, 6, 6, p.data);
};
const link =
  (
    title: string,
    sub: string,
    a: "meter" | "gateway",
    b: "gateway" | "devices",
  ) =>
  (g: Pix, p: Pal) => {
    plate(g, p, 152, 88);
    chip(g, p, 10, 14, a === "meter" ? p.concrete : p.dark);
    chip(g, p, 118, 14, b === "gateway" ? p.dark : p.wall);
    // glass tube
    g.slab(36, 20, 80, 12, p.glass);
    g.r(38, 22, 76, 3, p.glass[4]);
    for (let x = 40; x < 112; x += 24) envelope(g, p, x, 15, p.cyan);
    g.textCS(76, 52, title, p.ink, p.night ? p.outline : p.white, 2);
    g.textC(76, 70, sub, p.inkDim);
  };
const linkAnim = (g: Pix, t: number, p: Pal) => {
  const u = (t * 0.4) % 1;
  g.r(Math.round(40 + u * 66), 24, 6, 4, p.yellow[3]);
};

const wan = (g: Pix, p: Pal) => {
  g.shadow(56, 62, 52, 3, p.outline, 0.45);
  g.slab(8, 0, 96, 54, p.cyan);
  g.r(12, 4, 12, 46, p.white);
  g.r(26, 4, 26, 46, p.yellow[2]);
  g.r(54, 4, 28, 46, p.dark[2]);
  g.r(84, 4, 16, 46, p.red[2]);
  for (let y = 10; y < 46; y += 7) g.r(58, y, 20, 2, p.white);
  g.r(8, 0, 96, 3, p.cyan[4]);
  label(g, p, 112, 62, "WAN PACKET");
};

const sec = (g: Pix, p: Pal) => {
  plate(g, p, 108, 106);
  g.slab(26, 20, 56, 46, p.dark);
  for (let i = 0; i < 7; i++) {
    g.r(30 + i * 7, 12, 3, 8, p.metal[3]);
    g.r(30 + i * 7, 66, 3, 8, p.metal[3]);
  }
  for (let i = 0; i < 5; i++) {
    g.r(18, 26 + i * 8, 8, 3, p.metal[3]);
    g.r(82, 26 + i * 8, 8, 3, p.metal[3]);
  }
  lock(g, p, 34, 28);
  key(g, p, 50, 32);
  label(g, p, 108, 84, "TLS + PKI");
};

export const cabinet: SceneDef = {
  id: "cabinet",
  name: "Meter Cabinet",
  hint: "Inside the cabinet: meter, gateway and local devices below; the links that connect them above. Dive into the WAN packet.",
  bg(g, p) {
    dataSky(g, p, 21);
    g.gradV(0, BAND_Y, SW, SH - BAND_Y, [
      p.steel[3],
      p.steel[2],
      p.steel[2],
      p.steel[1],
      p.steel[1],
    ]);
    const r = rng(6);
    for (let y = BAND_Y + 8; y < SH - 6; y += 10)
      for (let x = 6; x < SW; x += 10) if (r() > 0.8) g.p(x, y, p.steel[1]);
    // cable duct and DIN rails
    g.slab(0, BAND_Y + 6, SW, 18, p.paper);
    for (let x = 6; x < SW; x += 14) g.r(x, BAND_Y + 10, 8, 10, p.paper[1]);
    for (const y of [BAND_Y + 36, 322]) {
      g.slab(0, y, SW, 12, p.metal);
      for (let x = 6; x < SW; x += 16) g.r(x, y + 4, 8, 4, p.dark[1]);
    }
    for (const [x, y] of [
      [10, BAND_Y + 34],
      [SW - 10, BAND_Y + 34],
      [10, SH - 12],
      [SW - 10, SH - 12],
    ] as const) {
      g.ball(x, y, 5, p.metal);
      g.line(x - 3, y, x + 3, y, p.dark[0]);
    }
    g.textS(8, BAND_Y + 8, "POWER LAYER", p.dark[0], p.paper[3]);
    g.r(0, BAND_Y - 2, SW, 2, p.data);
  },
  anim(g, t, p) {
    // wiring harness pulses
    void t;
    void p;
    void g;
  },
  objects: [
    {
      id: "meter",
      layer: "p",
      x: 10,
      y: 180,
      w: 130,
      h: 136,
      name: "Smart meter",
      paint: meter,
      anim: meterAnim,
      links: [],
      text: "Measures energy and exposes registers such as total import. It never talks to the market directly.",
    },
    {
      id: "gateway",
      layer: "p",
      x: 168,
      y: 184,
      w: 140,
      h: 130,
      name: "Gateway",
      paint: gateway,
      anim: gatewayAnim,
      links: [],
      lights: [{ x: 28, y: 36, r: 36, color: "#2ad4ff" }],
      text: "The trust anchor. It collects meter data, signs it and forwards it to authorised parties.",
    },
    {
      id: "submeter",
      layer: "p",
      x: 332,
      y: 210,
      w: 104,
      h: 112,
      name: "Sub-meter",
      paint: submeter,
      links: [],
      text: "Measures one circuit or device behind the main meter, for example a heat pump.",
    },
    {
      id: "devices",
      layer: "p",
      x: 450,
      y: 216,
      w: 180,
      h: 84,
      name: "Local devices",
      paint: devices,
      anim: devicesAnim,
      links: [],
      text: "Inverter, wallbox and heat pump reached through a controlled local interface.",
    },
    {
      id: "lmn",
      layer: "d",
      x: 20,
      y: 28,
      w: 152,
      h: 88,
      name: "LMN",
      paint: link("LMN", "METER > GATEWAY", "meter", "gateway"),
      anim: linkAnim,
      links: ["meter", "gateway", "submeter"],
      text: "Local metrological network: meters report to the gateway over a short wired or wireless link.",
    },
    {
      id: "wan",
      layer: "d",
      x: 192,
      y: 22,
      w: 112,
      h: 76,
      name: "WAN packet",
      paint: wan,
      links: ["gateway"],
      portal: { dx: 8, dy: 0 },
      text: "Wide-area link to the backend. Each reading travels as a signed packet. Click to open one.",
    },
    {
      id: "han",
      layer: "d",
      x: 332,
      y: 28,
      w: 152,
      h: 88,
      name: "HAN",
      paint: link("HAN", "GATEWAY > DEVICES", "gateway", "devices"),
      anim: linkAnim,
      links: ["gateway", "devices"],
      text: "Home area network: authorised energy services read data and send control signals through the gateway.",
    },
    {
      id: "sec",
      layer: "d",
      x: 508,
      y: 24,
      w: 108,
      h: 106,
      name: "Security module",
      paint: sec,
      links: ["gateway"],
      text: "Holds keys, mutually authenticates every link with TLS and signs readings.",
    },
  ],
  wires: [
    {
      kind: "p",
      pts: polyPts([
        [80, 318],
        [80, 340],
        [236, 340],
        [236, 316],
      ]),
    },
    {
      kind: "p",
      pts: polyPts([
        [236, 340],
        [380, 340],
        [380, 320],
      ]),
    },
    {
      kind: "p",
      pts: polyPts([
        [380, 340],
        [540, 340],
        [540, 300],
      ]),
    },
    {
      kind: "d",
      pts: polyPts([
        [30, 140],
        [610, 140],
      ]),
    },
  ],
};
void envelope;
