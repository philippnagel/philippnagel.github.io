import type { Pal, Ramp } from "../palette";
import { polyPts, type Pix } from "../pix";
import type { Obj, SceneDef } from "../types";
import { BAND_Y } from "../geometry";
import { clouds, dataSky, label, meadow } from "./common";
import { gatewayBox } from "./cabinet";

const cell =
  (w: number, color: keyof Pal, title: string, lines: string[]) =>
  (g: Pix, p: Pal) => {
    const R = p[color] as Ramp;
    g.slab(0, 0, w, 92, R);
    g.r(2, 2, w - 4, 20, R[3]);
    g.dither(2, 22, w - 4, 4, R[3], 0.4);
    g.r(w - 2, 30, 4, 20, R[2]);
    g.r(-2, 30, 4, 20, R[1]);
    const light =
      color === "yellow" || color === "concrete" || color === "metal";
    const ink = light ? p.outline : p.white;
    g.textC(w / 2, 8, title, ink);
    g.r(6, 26, w - 12, 1, ink);
    lines.forEach((l, i) => g.textC(w / 2, 36 + i * 14, l, ink));
  };

interface CellDef {
  id: string;
  w: number;
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
    w: 64,
    color: "metal",
    title: "START",
    lines: ["7E"],
    name: "Start flag",
    links: ["gw"],
    text: "A fixed marker that tells the receiver where a frame begins.",
  },
  {
    id: "addr",
    w: 76,
    color: "purple",
    title: "ADDR",
    lines: ["0003", "0021"],
    name: "Addresses",
    links: ["gw", "rx"],
    text: "Who is talking to whom: the client and the meter logical device.",
  },
  {
    id: "ctrl",
    w: 68,
    color: "leaf",
    title: "CTRL",
    lines: ["C401"],
    name: "Control",
    links: ["rx"],
    text: "Request or response, plus a sequence number so replies match questions.",
  },
  {
    id: "obis",
    w: 100,
    color: "cyan",
    title: "OBJECT",
    lines: ["010001", "0800FF"],
    name: "Object code",
    links: ["reading"],
    text: "An OBIS identifier naming the register, here 1-0:1.8.0, total active energy imported.",
  },
  {
    id: "value",
    w: 104,
    color: "yellow",
    title: "VALUE",
    lines: ["0001E240", "123456 WH"],
    name: "Value",
    links: ["reading"],
    text: "The reading itself. 0x0001E240 is 123456 watt-hours.",
  },
  {
    id: "sign",
    w: 124,
    color: "red",
    title: "SIGNATURE",
    lines: ["A91F 62C4", "7D03 E85B"],
    name: "Signature",
    links: ["gw"],
    text: "Made with the gateway key so nobody can forge or alter the value on the way.",
  },
  {
    id: "crc",
    w: 64,
    color: "concrete",
    title: "CRC",
    lines: ["5B2E"],
    name: "Checksum",
    links: ["rx"],
    text: "Lets the receiver detect any bit flipped in transit.",
  },
];
const cellObjs = (): Obj[] => {
  let x = 20;
  return CELLS.map((c) => {
    const o: Obj = {
      id: c.id,
      layer: "d",
      x,
      y: 44,
      w: c.w,
      h: 92,
      name: c.name,
      text: c.text,
      links: c.links,
      paint: cell(c.w, c.color, c.title, c.lines),
    };
    x += c.w;
    return o;
  });
};

const gw = (g: Pix, p: Pal) => {
  gatewayBox(g, p, 8, 0);
  label(g, p, 140, 120, "GATEWAY");
};
const gwAnim = (g: Pix, t: number, p: Pal) => {
  g.r(16, 26, 5, 5, p.data);
  g.r(24, 26, 5, 5, Math.sin(t * 5) > -0.3 ? p.leaf[4] : p.leaf[1]);
};

const reading = (g: Pix, p: Pal) => {
  g.shadow(95, 122, 90, 4, p.outline, 0.5);
  g.slab(0, 0, 190, 106, p.concrete);
  g.slab(10, 10, 170, 60, p.leaf);
  g.r(13, 13, 164, 54, p.leaf[0]);
  g.text(26, 24, "123456", p.leaf[4], 4);
  g.text(146, 50, "WH", p.leaf[3], 2);
  g.disc(22, 88, 5, p.data);
  g.disc(40, 88, 5, p.power);
  g.slab(120, 80, 56, 16, p.metal);
  label(g, p, 190, 114, "METER READING");
};

const rx = (g: Pix, p: Pal) => {
  g.shadow(66, 110, 56, 4, p.outline, 0.5);
  g.slab(8, 0, 116, 78, p.dark);
  g.r(14, 6, 104, 62, p.cyan[1]);
  g.line(40, 36, 58, 54, p.leaf[4]);
  g.line(58, 54, 100, 18, p.leaf[4]);
  g.line(40, 37, 58, 55, p.leaf[3]);
  g.line(58, 55, 100, 19, p.leaf[3]);
  g.line(41, 36, 59, 54, p.leaf[3]);
  g.slab(52, 78, 28, 10, p.metal);
  g.slab(30, 88, 72, 6, p.metal);
  g.slab(20, 98, 92, 10, p.dark);
  for (let i = 0; i < 9; i++) g.r(24 + i * 10, 101, 7, 4, p.dark[3]);
  label(g, p, 132, 118, "RECEIVER");
};

export const frame: SceneDef = {
  id: "frame",
  name: "Protocol Frame",
  hint: "One reading as a protocol frame: every field has a job. Hover a field to see what it carries and who handles it.",
  bg(g, p) {
    dataSky(g, p, 33);
    meadow(g, p, { seed: 33, hills: false });
    g.slab(0, BAND_Y + 4, 640, 4, p.dark);
    g.textS(
      20,
      22,
      "A SIMPLIFIED METER-READING FRAME",
      p.ink,
      p.night ? p.outline : p.white,
      2,
    );
    g.textS(
      20,
      142,
      "READS LEFT TO RIGHT",
      p.inkDim,
      p.night ? p.outline : p.white,
    );
  },
  anim(g, t, p) {
    clouds(g, p, t, 3, 2);
  },
  objects: [
    ...cellObjs(),
    {
      id: "gw",
      layer: "p",
      x: 40,
      y: 196,
      w: 148,
      h: 130,
      name: "Gateway",
      paint: gw,
      anim: gwAnim,
      links: [],
      text: "Builds the frame, signs the reading and sends it on.",
    },
    {
      id: "reading",
      layer: "p",
      x: 224,
      y: 192,
      w: 190,
      h: 130,
      name: "Meter reading",
      paint: reading,
      links: [],
      text: "The register value the frame is carrying.",
    },
    {
      id: "rx",
      layer: "p",
      x: 452,
      y: 196,
      w: 150,
      h: 130,
      name: "Receiver",
      paint: rx,
      links: [],
      text: "Checks checksum and signature before trusting the value.",
    },
  ],
  wires: [
    {
      kind: "d",
      pts: polyPts([
        [104, 200],
        [104, 174],
        [524, 174],
        [524, 196],
      ]),
    },
  ],
};
