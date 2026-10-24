import type { Pal } from "../palette";
import { Iso } from "../iso";
import { rng, sagPts, type Pix } from "../pix";
import type { SceneDef } from "../types";
import {
  deck,
  envelope,
  fitBox,
  isoAnim,
  label,
  lock,
  key,
  place,
  sky,
} from "./kit";
import { clouds } from "./common";

const ISL = new Iso(undefined as unknown as Pix, 330, 200);
const DEC = new Iso(undefined as unknown as Pix, 640, 70);
const NX = 31,
  NY = 15;
const WALL = 10.5;
const LAB = (I: Iso, p: Pal, sx: number, sy: number, text: string, dz = 0) =>
  label(
    I.g,
    p,
    I.ox + (((sx - sy) * 8) / 2) * 1,
    I.oy + (sx + sy) * 4 + 8 + dz,
    text,
  );

// wall devices are drawn flat against the back wall; local origin = wall face at (0, 0, 0) with +y protrusion
const meterBox = fitBox(8, 2, 9, { bottom: 24 });
const meterDraw = (I: Iso, p: Pal) => {
  I.box(0, 0, 0, 7.4, 1.4, 8.6, p.concrete);
  I.qL(1.4, 0.4, 7.0, 6.0, 8.2, p.paper[2]);
  I.qL(1.4, 0.6, 6.8, 6.2, 8.0, p.leaf[0]);
  I.qL(1.4, 0.7, 6.7, 6.3, 7.9, p.leaf[1]);
  // 7-seg style digits "0012345"
  const digits = "0012345";
  for (let k = 0; k < digits.length; k++) {
    const [x, y] = I.p(0.85 + k * 0.82, 1.4, 7.9);
    I.g.text(x, y + 1, digits[k]!, p.leaf[4]);
  }
  const [ux, uy] = I.p(6.2, 1.4, 6.8);
  I.g.text(ux - 10, uy + 6, "KWH", p.leaf[3]);
  I.qL(1.4, 0.5, 2.1, 3.8, 5.6, p.dark[1]);
  I.qL(1.4, 2.5, 3.6, 4.2, 5.4, p.metal[2]);
  I.qL(1.4, 3.9, 5.0, 4.2, 5.4, p.metal[2]);
  I.qL(1.4, 0.7, 1.9, 3.9, 5.5, p.metal[3]);
  const [px, py] = I.p(6.1, 1.4, 4.6);
  I.g.ball(px, py, 4, p.metal);
  I.qL(1.4, 0.3, 7.1, 0.5, 2.8, p.dark[2]);
  for (let k = 0; k < 4; k++) {
    const [tx, ty] = I.p(0.9 + k * 1.6, 1.4, 1.7);
    I.g.ball(tx, ty, 3, p.metal);
  }
  I.qL(1.4, 0.3, 7.1, 2.5, 2.8, p.red[2]);
  const [sx, sy] = I.p(3.7, 1.4, 2.65);
  I.g.ball(sx, sy, 2, p.red);
  for (let k = 0; k < 4; k++)
    I.line3(
      [0.9 + k * 1.6, 1.4, 0.5],
      [0.9 + k * 1.6, 1.4, -0.4],
      [p.red[2], p.dark[1], p.cyan[2], p.leaf[2]][k]!,
    );
  label(I.g, p, I.p(3.7, 1.4, 0)[0], I.p(3.7, 1.4, -0.6)[1], "SMART METER");
};
const meterAnim = isoAnim(meterBox, (I, t, p) => {
  const [x, y] = I.p(6.4, 1.4, 5.4);
  I.g.r(x, y, 3, 3, Math.sin(t * 6) > 0 ? p.red[3] : p.red[0]);
});

const gwBox = fitBox(9, 4, 10, { bottom: 24 });
const gwDraw = (I: Iso, p: Pal) => {
  I.cyl(7.2, 0.8, 7.2, 0.2, 2.6, p.dark);
  I.g.ball(...I.p(7.2, 0.8, 9.9), 5, p.cyan);
  I.box(0, 0, 0, 8.6, 2.2, 7.2, p.dark);
  I.qL(2.2, 0.3, 8.3, 6.4, 6.9, p.dark[3]);
  for (let k = 0; k < 8; k++)
    I.qL(2.2, 0.5 + k * 0.28, 0.5 + k * 0.28 + 0.14, 4.3, 6.1, p.dark[0]);
  I.qL(2.2, 3.3, 6.2, 3.0, 5.9, p.paper[2]);
  const r = rng(4);
  for (let j = 0; j < 8; j++)
    for (let i = 0; i < 8; i++)
      if (r() > 0.45)
        I.qL(
          2.2,
          3.5 + i * 0.1,
          3.5 + i * 0.1 + 0.1,
          3.1 + j * 0.3,
          3.1 + j * 0.3 + 0.28,
          p.outline,
        );
  for (let k = 0; k < 3; k++) {
    I.qL(2.2, 0.5 + k * 1.2, 1.4 + k * 1.2, 0.5, 1.7, p.metal[2]);
    I.qL(2.2, 0.65 + k * 1.2, 1.25 + k * 1.2, 0.7, 1.4, p.dark[0]);
  }
  I.qL(2.2, 6.8, 8.2, 0.6, 1.6, p.metal[2]);
  label(I.g, p, I.p(4.3, 2.2, 0)[0], I.p(4.3, 2.2, -0.6)[1], "GATEWAY");
};
const gwAnim = isoAnim(gwBox, (I, t, p) => {
  for (let k = 0; k < 3; k++) {
    const [x, y] = I.p(0.7 + k * 0.7, 2.2, 6.4);
    const on =
      k === 0 || (k === 1 ? Math.sin(t * 5) > -0.3 : Math.sin(t * 7 + 1) > 0);
    I.g.r(x, y, 3, 3, on ? [p.data, p.leaf[4], p.amber[3]][k]! : p.dark[1]);
  }
});

const subBox = fitBox(6, 2, 7, { bottom: 24 });
const subDraw = (I: Iso, p: Pal) => {
  I.box(0, 0, 0, 5.6, 1.2, 6.2, p.concrete);
  I.qL(1.2, 0.4, 5.2, 4.4, 5.8, p.leaf[0]);
  const [x, y] = I.p(0.8, 1.2, 5.7);
  I.g.text(x, y + 1, "0042", p.leaf[4], 2);
  I.qL(1.2, 0.5, 2.4, 2.4, 3.8, p.metal[2]);
  I.qL(1.2, 3.0, 5.0, 2.4, 3.6, p.dark[1]);
  I.qL(1.2, 0.4, 5.2, 0.4, 1.8, p.dark[2]);
  label(I.g, p, I.p(2.8, 1.2, 0)[0], I.p(2.8, 1.2, -0.6)[1], "SUB-METER");
};

const devBox = fitBox(10, 6, 5, { bottom: 24 });
const devDraw = (I: Iso, p: Pal) => {
  I.shadow(0.2, 0.2, 10, 6, 0.25);
  // inverter
  I.box(0.4, 0.8, 0, 2.6, 1.0, 2.6, p.metal);
  I.qL(1.8, 0.7, 2.7, 0.4, 2.2, p.metal[3]);
  I.g.ball(...I.p(1.7, 1.8, 1.5), 7, p.yellow);
  // wallbox post
  I.box(4.2, 1.2, 0, 1.0, 0.8, 4.0, p.dark);
  I.qL(2.0, 4.3, 5.1, 2.5, 3.8, p.leaf[2]);
  // heat pump
  I.box(6.6, 0.8, 0, 3.0, 2.6, 2.4, p.wall);
  I.cyl(8.1, 3.4, 1.2, 1.0, 0.1, p.dark);
  LAB(I, p, 10, 6, "LOCAL DEVICES");
};
const devAnim = isoAnim(devBox, (I, t, p) => {
  const [cx, cy] = I.p(8.1, 3.4, 1.3);
  for (let i = 0; i < 4; i++) {
    const a = t * 7 + (i * Math.PI) / 2;
    I.g.line(
      cx,
      cy,
      Math.round(cx + Math.cos(a) * 10),
      Math.round(cy + Math.sin(a) * 5),
      p.metal[3],
    );
  }
});

// ---- data deck ----
const tube =
  (title: string, sub: string, a: Pal["metal"] | null) => (I: Iso, p: Pal) => {
    I.shadow(0.2, 0.2, 7, 3, 0.18);
    I.box(0, 0.6, 0, 1.4, 1.4, 1.4, a ?? p.concrete);
    I.box(6.2, 0.6, 0, 1.4, 1.4, 1.4, p.dark);
    I.qL(2.0, 0.4, 1.0, 0.5, 0.9, p.data);
    const glass = p.night ? "rgba(60,170,230,.45)" : "rgba(160,225,250,.65)";
    I.qT(1.1, 1.4, 6.2, 0.9, 1.7, glass);
    I.qL(1.7, 1.4, 6.2, 0.7, 1.1, glass);
    I.line3([1.4, 1.7, 1.1], [6.2, 1.7, 1.1], p.cyan[4]);
    LAB(I, p, 7.6, 2.0, title, 0);
    const [x, y] = I.p(3.8, 2.0, 0);
    I.g.textC(x, y + 20, sub, p.inkDim);
  };
const tubeAnim = (box: { ax: number; ay: number }) =>
  isoAnim(box, (I, t, p) => {
    for (let k = 0; k < 3; k++) {
      const u = (t * 0.3 + k / 3) % 1;
      const [x, y] = I.p(1.6 + u * 4.4, 1.3, 1.0);
      envelope(I.g, p, x - 7, y - 10, p.cyan);
    }
  });
const lmnBox = fitBox(8, 3, 3, { bottom: 52 });
const hanBox = fitBox(8, 3, 3, { bottom: 52 });

const wanBox = fitBox(6, 6, 2, { top: 12 });
const wanDraw = (I: Iso, p: Pal) => {
  I.shadow(0.4, 0.4, 4, 4, 0.2);
  I.box(0.5, 0.5, 0, 3.6, 3.6, 1.2, p.cyan);
  for (const [a, c] of [
    [0.7, p.white],
    [1.6, p.yellow[2]],
    [2.5, p.dark[2]],
    [3.4, p.red[2]],
  ] as const)
    I.qL(4.1, a, a + 0.8, 0.2, 1.0, c);
  for (let k = 0; k < 4; k++)
    I.line3(
      [2.2 + k * 0.2, 4.1, 0.4 + k * 0.15],
      [3.0, 4.1, 0.4 + k * 0.15],
      p.white,
    );
  LAB(I, p, 4.6, 4.6, "WAN PACKET", 14);
};

const secBox = fitBox(5, 5, 4);
const secDraw = (I: Iso, p: Pal) => {
  I.shadow(0.3, 0.3, 5, 5, 0.2);
  I.box(0.8, 0.8, 0, 3.4, 3.4, 0.9, p.dark);
  for (let k = 0; k < 8; k++) {
    I.line3([1 + k * 0.4, 4.2, 0.3], [1 + k * 0.4, 4.6, 0.3], p.metal[3]);
    I.line3([4.2, 1 + k * 0.4, 0.3], [4.6, 1 + k * 0.4, 0.3], p.metal[3]);
  }
  const [lx, ly] = I.p(2.5, 2.5, 1.0);
  lock(I.g, p, lx - 14, ly - 18);
  key(I.g, p, lx - 2, ly - 12);
  LAB(I, p, 5, 5, "TLS + PKI");
};

function cabinetShell(I: Iso, p: Pal) {
  I.shadow(-0.5, -0.5, NX + 1, NY + 1, 0.0);
  // floor plate
  I.box(0, 0, -0.4, NX, NY, 0.4, p.steel, { tex: true });
  for (let i = 0; i < NX; i += 2)
    I.line3([i, 0, 0.01], [i, NY, 0.01], p.steel[1]);
  for (let j = 0; j < NY; j += 2)
    I.line3([0, j, 0.01], [NX, j, 0.01], p.steel[1]);
  for (let k = 0; k < NX; k += 4)
    for (let j = 2; j < NY; j += 4) {
      const [x, y] = I.p(k + 1, j, 0);
      I.g.r(x, y, 2, 1, p.dark[1]);
    }
  // back walls
  I.box(0, 0, 0, NX, 0.6, WALL, p.metal, { tex: true });
  I.box(0, 0, 0, 0.6, NY, WALL, p.metal, { tex: true });
  // mounting plate on the back wall with perforations, rails and ducts
  I.qL(0.6, 1, NX - 1, 1.2, WALL - 0.8, p.steel[3]);
  const r = rng(9);
  for (let k = 0; k < 300; k++) {
    const [x, y] = I.p(1.2 + r() * (NX - 2.4), 0.6, 1.4 + r() * (WALL - 2.4));
    I.g.p(x, y, p.steel[1]);
  }
  for (const z of [3.0, 9.4]) {
    I.qL(0.7, 1, NX - 1, z, z + 0.5, p.metal[3]);
    for (let x = 1.3; x < NX - 1; x += 1.0)
      I.qL(0.7, x, x + 0.5, z + 0.12, z + 0.38, p.dark[1]);
  }
  I.qL(0.7, 1, NX - 1, WALL - 1.6, WALL - 0.9, p.paper[2]);
  for (let x = 1.2; x < NX - 1; x += 0.8)
    I.qL(0.7, x, x + 0.45, WALL - 1.5, WALL - 1.0, p.paper[1]);
  // cable glands on the floor edge
  for (let k = 0; k < 8; k++) I.cyl(3 + k * 4, 1.3, 0, 0.35, 0.4, p.dark);
  // top rim highlights
  I.line3([0, 0, WALL], [NX, 0, WALL], p.metal[4]);
  I.line3([0, 0, WALL], [0, NY, WALL], p.metal[4]);
  void p;
}

export const cabinet: SceneDef = {
  id: "cabinet",
  name: "Meter Cabinet",
  hint: "Inside the cabinet: meter, gateway and local devices on the panel; the links that connect them hover above. Dive into the WAN packet.",
  bg(g, p) {
    sky(g, p, 21);
    const I = new Iso(g, ISL.ox, ISL.oy);
    const D = new Iso(g, DEC.ox, DEC.oy);
    cabinetShell(I, p);
    deck(D, p, 36, 16, 0.6, 21);
  },
  anim(g, t, p) {
    clouds(g, p, t, 3, 3);
  },
  objects: [
    {
      id: "meter",
      layer: "p",
      ...place(ISL, [1.2, 0.6, 2.3], meterBox, meterDraw),
      name: "Smart meter",
      anim: meterAnim,
      links: [],
      text: "Measures energy and exposes registers such as total import. It never talks to the market directly.",
    },
    {
      id: "gateway",
      layer: "p",
      ...place(ISL, [10.5, 0.6, 2.8], gwBox, gwDraw),
      name: "Gateway",
      anim: gwAnim,
      links: [],
      lights: [{ x: 30, y: 70, r: 36, color: "#2ad4ff" }],
      text: "The trust anchor. It collects meter data, signs it and forwards it to authorised parties.",
    },
    {
      id: "submeter",
      layer: "p",
      ...place(ISL, [21, 0.6, 2.8], subBox, subDraw),
      name: "Sub-meter",
      links: [],
      text: "Measures one circuit or device behind the main meter, for example a heat pump.",
    },
    {
      id: "devices",
      layer: "p",
      ...place(ISL, [18, 6, 0], devBox, devDraw),
      name: "Local devices",
      anim: devAnim,
      links: [],
      text: "Inverter, wallbox and heat pump reached through a controlled local interface.",
    },
    {
      id: "lmn",
      layer: "d",
      ...place(DEC, [1, 3, 0], lmnBox, tube("LMN", "METER > GATEWAY", null)),
      name: "LMN",
      anim: tubeAnim(lmnBox),
      links: ["meter", "gateway", "submeter"],
      text: "Local metrological network: meters report to the gateway over a short wired or wireless link.",
    },
    {
      id: "wan",
      layer: "d",
      ...place(DEC, [11, 4, 0], wanBox, wanDraw),
      name: "WAN packet",
      links: ["gateway"],
      portal: { x: 790, y: 16 },
      text: "Wide-area link to the backend. Each reading travels as a signed packet. Click to open one.",
    },
    {
      id: "han",
      layer: "d",
      ...place(DEC, [16, 9, 0], hanBox, tube("HAN", "GATEWAY > DEVICES", null)),
      name: "HAN",
      anim: tubeAnim(hanBox),
      links: ["gateway", "devices"],
      text: "Home area network: authorised energy services read data and send control signals through the gateway.",
    },
    {
      id: "sec",
      layer: "d",
      ...place(DEC, [28, 4, 0], secBox, secDraw),
      name: "Security module",
      links: ["gateway"],
      text: "Holds keys, mutually authenticates every link with TLS and signs readings.",
    },
  ],
  wires: [
    { kind: "p", pts: sagPts(...ISL.p(5.5, 1, 0.2), ...ISL.p(14, 1, 0.2), 0) },
    {
      kind: "p",
      pts: sagPts(...ISL.p(14, 1.4, 0.1), ...ISL.p(24, 1.4, 0.1), 0),
    },
  ],
};
