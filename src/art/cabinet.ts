import type { Pal } from "../palette";
import { polyPts, type Pix } from "../pix";
import type { SceneDef } from "../types";
import { key, label, landscape, lock } from "./common";

export const gatewayBox = (g: Pix, p: Pal, x: number, y: number) => {
  g.r(x + 44, y, 2, 10, p.outline);
  g.disc(x + 45, y, 2, p.data);
  g.fill(x, y + 10, 52, 38, p.metal2, p.outline);
  g.r(x + 6, y + 15, 3, 3, p.data);
  g.r(x + 12, y + 15, 3, 3, p.power);
  g.r(x + 18, y + 15, 3, 3, p.green);
  g.fill(x + 8, y + 24, 16, 16, p.metalDark, p.outline);
  for (let i = 0; i < 4; i++) {
    g.r(x + 6, y + 26 + i * 4, 2, 1, p.concrete);
    g.r(x + 24, y + 26 + i * 4, 2, 1, p.concrete);
  }
  g.p(x + 15, y + 31, p.yellow);
  g.r(x + 32, y + 24, 14, 1, p.metal);
  g.r(x + 32, y + 28, 14, 1, p.metal);
  g.r(x + 32, y + 32, 9, 1, p.metal);
};

const meter = (g: Pix, p: Pal) => {
  g.fill(8, 0, 40, 46, p.wall, p.outline);
  g.fill(12, 4, 32, 10, p.green, p.outline);
  g.text(15, 7, "001234", p.outline);
  g.r(14, 20, 3, 3, p.data);
  g.r(20, 20, 3, 3, p.power);
  g.fill(14, 28, 10, 6, p.metal, p.outline);
  g.fill(28, 28, 14, 10, p.wall2, p.outline);
  g.disc(35, 33, 3, p.white);
  g.r(10, 46, 36, 4, p.metalDark);
  g.r(14, 50, 2, 8, p.cable);
  g.r(40, 50, 2, 8, p.power);
  label(g, p, 56, 56, "SMART METER");
};

const gateway = (g: Pix, p: Pal) => {
  gatewayBox(g, p, 4, 0);
  label(g, p, 60, 54, "GATEWAY");
};

const submeter = (g: Pix, p: Pal) => {
  g.fill(6, 0, 32, 32, p.wall, p.outline);
  g.fill(9, 3, 26, 9, p.green, p.outline);
  g.text(12, 5, "0042", p.outline);
  g.r(10, 17, 3, 3, p.data);
  g.fill(10, 23, 10, 5, p.metal, p.outline);
  g.r(10, 32, 24, 3, p.metalDark);
  label(g, p, 50, 38, "SUB-METER");
};

const devices = (g: Pix, p: Pal) => {
  g.fill(2, 0, 22, 16, p.metal, p.outline);
  g.disc(13, 8, 3, p.yellow);
  for (const [dx, dy] of [
    [-5, 0],
    [5, 0],
    [0, -5],
    [0, 5],
  ] as const)
    g.p(13 + dx, 8 + dy, p.yellow);
  g.fill(30, 0, 10, 22, p.metalDark, p.outline);
  g.r(33, 3, 4, 2, p.green);
  g.p(35, 9, p.yellow);
  g.fill(46, 2, 26, 16, p.wall, p.outline);
  g.disc(59, 10, 5, p.metal2);
  g.disc(59, 10, 1, p.outline);
  g.line(54, 10, 64, 10, p.outline);
  g.line(59, 5, 59, 15, p.outline);
  label(g, p, 76, 28, "LOCAL DEVICES");
};

const link =
  (
    title: string,
    sub: string,
    a: "meter" | "gateway",
    b: "gateway" | "devices",
  ) =>
  (g: Pix, p: Pal) => {
    const chip = (x: number, kind: string) => {
      g.fill(
        x,
        10,
        10,
        10,
        kind === "meter" ? p.wall : kind === "gateway" ? p.metal2 : p.metal,
        p.outline,
      );
      g.p(x + 4, 14, p.data);
    };
    chip(2, a);
    chip(64, b);
    for (let x = 13; x < 63; x += 2) g.p(x, 15, p.data);
    for (const x of [26, 42]) {
      g.fill(x, 12, 8, 6, p.data, p.outline);
      g.r(x + 2, 14, 4, 2, p.white);
    }
    g.textC(38, 26, title, p.ink);
    g.textC(38, 33, sub, p.inkDim);
  };

const wan = (g: Pix, p: Pal) => {
  g.fill(4, 0, 48, 27, p.data, p.outline);
  g.r(6, 2, 5, 23, p.white);
  g.r(13, 2, 10, 23, p.yellow);
  g.r(25, 2, 14, 23, p.panel2);
  g.r(41, 2, 9, 23, p.red);
  for (let y = 6; y < 22; y += 4) g.r(27, y, 10, 1, p.white);
  label(g, p, 56, 30, "WAN PACKET");
};

const sec = (g: Pix, p: Pal) => {
  g.fill(14, 4, 28, 22, p.metalDark, p.outline);
  for (let i = 0; i < 5; i++) {
    g.r(16 + i * 5, 1, 1, 3, p.concrete);
    g.r(16 + i * 5, 26, 1, 3, p.concrete);
  }
  lock(g, p, 17, 9);
  key(g, p, 25, 12);
  label(g, p, 56, 34, "TLS + PKI");
};

export const cabinet: SceneDef = {
  id: "cabinet",
  name: "Meter Cabinet",
  hint: "Inside the cabinet: meter, gateway and local devices below; the links that connect them above. Dive into the WAN packet.",
  bg(g, p) {
    landscape(g, p, { seed: 21 });
    g.r(0, 81, 320, 99, p.panel);
    g.dither(0, 81, 320, 99, p.panel, p.panel2);
    g.r(0, 156, 320, 4, p.metal);
    g.r(0, 160, 320, 1, p.outline);
    for (const [x, y] of [
      [4, 86],
      [314, 86],
      [4, 174],
      [314, 174],
    ] as const) {
      g.disc(x, y, 2, p.outline);
      g.p(x, y, p.metal);
    }
    g.text(3, 83, "POWER LAYER", p.white);
  },
  objects: [
    {
      id: "meter",
      layer: "p",
      x: 8,
      y: 94,
      w: 56,
      h: 62,
      name: "Smart meter",
      paint: meter,
      links: [],
      text: "Measures energy and exposes registers such as total import. It never talks to the market directly.",
    },
    {
      id: "gateway",
      layer: "p",
      x: 86,
      y: 92,
      w: 60,
      h: 60,
      name: "Gateway",
      paint: gateway,
      links: [],
      text: "The trust anchor. It collects meter data, signs it and forwards it to authorised parties.",
    },
    {
      id: "submeter",
      layer: "p",
      x: 166,
      y: 106,
      w: 50,
      h: 44,
      name: "Sub-meter",
      paint: submeter,
      links: [],
      text: "Measures one circuit or device behind the main meter, for example a heat pump.",
    },
    {
      id: "devices",
      layer: "p",
      x: 234,
      y: 100,
      w: 76,
      h: 36,
      name: "Local devices",
      paint: devices,
      links: [],
      text: "Inverter, wallbox and heat pump reached through a controlled local interface.",
    },
    {
      id: "lmn",
      layer: "d",
      x: 14,
      y: 24,
      w: 76,
      h: 40,
      name: "LMN",
      paint: link("LMN", "METER > GATEWAY", "meter", "gateway"),
      links: ["meter", "gateway", "submeter"],
      text: "Meters report to the gateway over a short wired or wireless link.",
    },
    {
      id: "wan",
      layer: "d",
      x: 96,
      y: 10,
      w: 56,
      h: 36,
      name: "WAN packet",
      paint: wan,
      links: ["gateway"],
      portal: { dx: 4, dy: 0 },
      text: "Wide-area link to the backend. Each reading travels as a signed packet. Click to open one.",
    },
    {
      id: "han",
      layer: "d",
      x: 170,
      y: 24,
      w: 76,
      h: 40,
      name: "HAN",
      paint: link("HAN", "GATEWAY > DEVICES", "gateway", "devices"),
      links: ["gateway", "devices"],
      text: "Authorised energy services read data and send control signals through the gateway.",
    },
    {
      id: "sec",
      layer: "d",
      x: 252,
      y: 12,
      w: 56,
      h: 38,
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
        [36, 154],
        [36, 164],
        [114, 164],
        [114, 152],
      ]),
    },
    {
      kind: "p",
      pts: polyPts([
        [114, 164],
        [190, 164],
        [190, 150],
      ]),
    },
    {
      kind: "p",
      pts: polyPts([
        [190, 164],
        [270, 164],
        [270, 136],
      ]),
    },
    {
      kind: "d",
      pts: polyPts([
        [20, 70],
        [300, 70],
      ]),
    },
  ],
};
