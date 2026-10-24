import type { Pal, Ramp } from "../palette";
import { Iso } from "../iso";
import { sagPts, type Pix } from "../pix";
import type { Obj, SceneDef } from "../types";
import {
  deck,
  envelope,
  fitBox,
  island,
  isoAnim,
  label,
  lock,
  place,
  sky,
  strip,
} from "./kit";
import { clouds } from "./common";
import { gwDrawShared } from "./shared";

const ISL = new Iso(undefined as unknown as Pix, 300, 290);
const DEC = new Iso(undefined as unknown as Pix, 300, 90);
const NX = 34,
  NY = 18;
const LAB = (I: Iso, p: Pal, sx: number, sy: number, text: string, dz = 0) =>
  label(
    I.g,
    p,
    I.ox + (((sx - sy) * 8) / 2) * 1,
    I.oy + (sx + sy) * 4 + 8 + dz,
    text,
  );

interface CellDef {
  id: string;
  len: number;
  color: keyof Pal;
  title: string;
  lines: string[];
  name: string;
  text: string;
  links: string[];
}
const CELLS: CellDef[] = [
  {
    id: "start",
    len: 5,
    color: "metal",
    title: "START",
    lines: ["7E"],
    name: "Start flag",
    links: ["gw"],
    text: "A fixed marker that tells the receiver where a frame begins.",
  },
  {
    id: "addr",
    len: 7,
    color: "purple",
    title: "ADDR",
    lines: ["0003", "0021"],
    name: "Addresses",
    links: ["gw", "rx"],
    text: "Who is talking to whom: the client and the meter logical device.",
  },
  {
    id: "ctrl",
    len: 5.5,
    color: "leaf",
    title: "CTRL",
    lines: ["C401"],
    name: "Control",
    links: ["rx"],
    text: "Request or response, plus a sequence number so replies match questions.",
  },
  {
    id: "obis",
    len: 9,
    color: "cyan",
    title: "OBJECT",
    lines: ["010001", "0800FF"],
    name: "Object code",
    links: ["reading"],
    text: "An OBIS identifier naming the register, here 1-0:1.8.0, total active energy imported.",
  },
  {
    id: "value",
    len: 9,
    color: "yellow",
    title: "VALUE",
    lines: ["0001E240", "123456 WH"],
    name: "Value",
    links: ["reading"],
    text: "The reading itself. 0x0001E240 is 123456 watt-hours.",
  },
  {
    id: "sign",
    len: 11,
    color: "red",
    title: "SIGNATURE",
    lines: ["A91F 62C4", "7D03 E85B"],
    name: "Signature",
    links: ["gw"],
    text: "Made with the gateway key so nobody can forge or alter the value on the way.",
  },
  {
    id: "crc",
    len: 5,
    color: "concrete",
    title: "CRC",
    lines: ["5B2E"],
    name: "Checksum",
    links: ["rx"],
    text: "Lets the receiver detect any bit flipped in transit.",
  },
];

const cellDraw = (c: CellDef) => (I: Iso, p: Pal) => {
  const R = p[c.color] as Ramp;
  I.shadow(0.2, 0.2, c.len, 3, 0.18);
  I.box(0, 0, 0, c.len, 3, 1.6, R);
  // byte slots on the left face
  for (let k = 0; k < Math.floor(c.len); k++)
    I.qL(3, 0.25 + k, 0.25 + k + 0.5, 0.35, 1.2, R[1]);
  // billboard card above
  const w = Math.max(
    54,
    c.title.length * 6 + 12,
    ...c.lines.map((l) => l.length * 6 + 12),
  );
  const [cx, cy] = I.p(c.len / 2, 1.5, 1.6);
  const x = cx - w / 2,
    y = cy - 64;
  I.g.slab(x, y, w, 18 + c.lines.length * 11, R);
  I.g.r(x + 3, y + 3, w - 6, 9, R[3]);
  const ink =
    c.color === "yellow" || c.color === "concrete" || c.color === "metal"
      ? p.outline
      : p.white;
  I.g.textC(cx, y + 4, c.title, ink);
  c.lines.forEach((l, i) => I.g.textC(cx, y + 18 + i * 11, l, ink));
  I.g.r(
    cx - 1,
    y + 18 + c.lines.length * 11,
    2,
    64 - 18 - c.lines.length * 11 - 4,
    R[1],
  );
};
const cellObjs = (): Obj[] => {
  let x = 1;
  return CELLS.map((c) => {
    const box = fitBox(c.len, 3, 1.6, { top: 80, left: 20, right: 20 });
    const o: Obj = {
      id: c.id,
      layer: "d",
      ...place(DEC, [x, 6, 0], box, cellDraw(c)),
      name: c.name,
      text: c.text,
      links: c.links,
    };
    x += c.len + 0.4;
    return o;
  });
};

// ---- physical ----
const gwBox = fitBox(9, 5, 7, { bottom: 24 });
const gwDraw = (I: Iso, p: Pal) => gwDrawShared(I, p);
const gwAnim = isoAnim(gwBox, (I, t, p) => {
  for (let k = 0; k < 3; k++) {
    const [x, y] = I.p(0.8 + k * 0.7, 3.1, 5.4);
    const on =
      k === 0 || (k === 1 ? Math.sin(t * 5) > -0.3 : Math.sin(t * 7 + 1) > 0);
    I.g.r(x, y, 3, 3, on ? [p.data, p.leaf[4], p.amber[3]][k]! : p.dark[1]);
  }
});

const readBox = fitBox(9, 5, 5, { bottom: 24 });
const readDraw = (I: Iso, p: Pal) => {
  I.shadow(0.2, 0.2, 9, 5, 0.25);
  I.box(0, 0.6, 0, 8.4, 4, 2.6, p.concrete);
  I.qL(4.6, 0.5, 7.9, 1.2, 2.3, p.leaf[0]);
  const [x, y] = I.p(0.9, 4.6, 2.2);
  I.g.text(x, y + 2, "123456", p.leaf[4], 2);
  I.g.text(x + 78, y + 12, "WH", p.leaf[3]);
  I.qT(2.6, 0.4, 8.0, 0.7, 4.5, p.concrete[4]);
  I.box(1, 1.5, 2.6, 3, 1.4, 0.35, p.metal);
  I.g.ball(...I.p(6.4, 2.6, 2.9), 5, p.cyan);
  I.g.ball(...I.p(5.5, 2.6, 2.9), 5, p.amber);
  LAB(I, p, 8.4, 4.6, "METER READING", 14);
};

const rxBox = fitBox(7, 5, 7, { bottom: 24 });
const rxDraw = (I: Iso, p: Pal) => {
  I.shadow(0.2, 0.2, 7, 5, 0.25);
  I.box(0.6, 0.6, 0, 5.6, 3.6, 0.4, p.concrete);
  I.box(2.5, 1.5, 0.4, 1.6, 1.4, 1.2, p.metal);
  I.box(0.9, 1.8, 1.6, 4.2, 0.5, 3.2, p.dark);
  I.qL(2.3, 1.0, 5.0, 1.8, 4.6, p.cyan[1]);
  const [cx, cy] = I.p(3.0, 2.3, 3.2);
  I.g.line(cx - 14, cy, cx - 6, cy + 8, p.leaf[4]);
  I.g.line(cx - 6, cy + 8, cx + 12, cy - 12, p.leaf[4]);
  I.g.line(cx - 14, cy + 1, cx - 6, cy + 9, p.leaf[3]);
  I.g.line(cx - 6, cy + 9, cx + 12, cy - 11, p.leaf[3]);
  I.box(1.2, 3.2, 0.4, 3.6, 1.0, 0.25, p.dark);
  LAB(I, p, 7, 5, "RECEIVER", 14);
};

export const frame: SceneDef = {
  id: "frame",
  name: "Protocol Frame",
  hint: "One reading as a protocol frame: every field has a job. Hover a field to see what it carries and who handles it.",
  bg(g, p) {
    sky(g, p, 33);
    const I = new Iso(g, ISL.ox, ISL.oy);
    const D = new Iso(g, DEC.ox, DEC.oy);
    island(I, p, NX, NY, 3, 33);
    strip(I, p, "x", 14.4, 2.6, NX, true);
    deck(D, p, 58, 14, 0.6, 33);
    g.textS(
      30,
      24,
      "A SIMPLIFIED METER-READING FRAME",
      p.ink,
      p.night ? p.outline : p.white,
      2,
    );
    g.textS(
      30,
      48,
      "READS LEFT TO RIGHT",
      p.inkDim,
      p.night ? p.outline : p.white,
    );
  },
  anim(g, t, p) {
    clouds(g, p, t, 3, 2);
    const D = new Iso(g, DEC.ox, DEC.oy);
    for (let k = 0; k < 4; k++) {
      const u = (t * 0.12 + k / 4) % 1;
      const [x, y] = D.p(1 + u * 54, 8.2, 0.6);
      envelope(g, p, x - 7, y - 10, k % 2 ? p.cyan : p.paper);
    }
  },
  objects: [
    ...cellObjs(),
    {
      id: "gw",
      layer: "p",
      ...place(ISL, [3, 4, 0], gwBox, gwDraw),
      name: "Gateway",
      anim: gwAnim,
      links: [],
      lights: [{ x: 30, y: 70, r: 36, color: "#2ad4ff" }],
      text: "Builds the frame, signs the reading and sends it on.",
    },
    {
      id: "reading",
      layer: "p",
      ...place(ISL, [13, 6, 0], readBox, readDraw),
      name: "Meter reading",
      links: [],
      text: "The register value the frame is carrying.",
    },
    {
      id: "rx",
      layer: "p",
      ...place(ISL, [23, 4, 0], rxBox, rxDraw),
      name: "Receiver",
      links: [],
      text: "Checks checksum and signature before trusting the value.",
    },
  ],
  wires: [
    { kind: "d", pts: sagPts(...ISL.p(8, 8, 3), ...ISL.p(27, 8, 3), 12) },
  ],
};
void lock;
