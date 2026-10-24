import type { Pal } from "../palette";
import { polyPts, type Pix } from "../pix";
import type { Obj, SceneDef } from "../types";
import { label, landscape } from "./common";
import { gatewayBox } from "./cabinet";

const cell =
  (
    w: number,
    color: keyof Pal,
    light: boolean,
    title: string,
    lines: string[],
  ) =>
  (g: Pix, p: Pal) => {
    g.fill(0, 0, w, 44, p[color], p.outline);
    const tc = light ? p.outline : p.white;
    g.textC(w / 2, 4, title, tc);
    g.r(2, 11, w - 4, 1, tc);
    lines.forEach((l, i) => g.textC(w / 2, 16 + i * 7, l, tc));
  };

interface CellDef {
  id: string;
  w: number;
  color: keyof Pal;
  light: boolean;
  title: string;
  lines: string[];
  name: string;
  text: string;
  links: string[];
}
const CELLS: CellDef[] = [
  {
    id: "start",
    w: 28,
    color: "metal",
    light: true,
    title: "START",
    lines: ["7E"],
    name: "Start flag",
    links: ["gw"],
    text: "A fixed marker that tells the receiver where a frame begins.",
  },
  {
    id: "addr",
    w: 40,
    color: "purple",
    light: false,
    title: "ADDR",
    lines: ["0003", "0021"],
    name: "Addresses",
    links: ["gw", "rx"],
    text: "Who is talking to whom, the client and the meter logical device.",
  },
  {
    id: "ctrl",
    w: 32,
    color: "green2",
    light: false,
    title: "CTRL",
    lines: ["C401"],
    name: "Control",
    links: ["rx"],
    text: "Request or response, plus a sequence number so replies match questions.",
  },
  {
    id: "obis",
    w: 56,
    color: "data",
    light: false,
    title: "OBJECT",
    lines: ["010001", "0800FF"],
    name: "Object code",
    links: ["reading"],
    text: "An OBIS identifier naming the register, here 1-0:1.8.0 total active energy imported.",
  },
  {
    id: "value",
    w: 56,
    color: "yellow",
    light: true,
    title: "VALUE",
    lines: ["0001E240", "123456 WH"],
    name: "Value",
    links: ["reading"],
    text: "The reading itself. 0x0001E240 is 123456 watt-hours.",
  },
  {
    id: "sign",
    w: 64,
    color: "red",
    light: false,
    title: "SIGNATURE",
    lines: ["A91F 62C4", "7D03 E85B"],
    name: "Signature",
    links: ["gw"],
    text: "Made with the gateway key so nobody can forge or alter the value on the way.",
  },
  {
    id: "crc",
    w: 24,
    color: "concrete",
    light: true,
    title: "CRC",
    lines: ["5B2E"],
    name: "Checksum",
    links: ["rx"],
    text: "Lets the receiver detect any bit flipped in transit.",
  },
];
const cellObjs = (): Obj[] => {
  let x = 10;
  return CELLS.map((c) => {
    const o: Obj = {
      id: c.id,
      layer: "d",
      x,
      y: 24,
      w: c.w,
      h: 44,
      name: c.name,
      text: c.text,
      links: c.links,
      paint: cell(c.w, c.color, c.light, c.title, c.lines),
    };
    x += c.w;
    return o;
  });
};

const gw = (g: Pix, p: Pal) => {
  gatewayBox(g, p, 4, 0);
  label(g, p, 60, 52, "GATEWAY");
};

const reading = (g: Pix, p: Pal) => {
  g.fill(0, 0, 100, 46, p.wall, p.outline);
  g.fill(6, 5, 88, 24, p.green, p.outline);
  g.text(14, 10, "123456", p.outline, 3);
  g.text(80, 22, "WH", p.outline);
  g.r(8, 34, 3, 3, p.data);
  g.r(14, 34, 3, 3, p.power);
  g.fill(70, 33, 24, 6, p.metal, p.outline);
  label(g, p, 100, 52, "METER READING");
};

const rx = (g: Pix, p: Pal) => {
  g.fill(6, 0, 48, 32, p.metalDark, p.outline);
  g.fill(9, 3, 42, 26, p.bandA, p.outline);
  g.line(18, 16, 24, 22, p.green);
  g.line(24, 22, 40, 8, p.green);
  g.line(18, 15, 24, 21, p.green);
  g.line(24, 21, 40, 7, p.green);
  g.r(26, 32, 8, 4, p.metal2);
  g.r(18, 36, 24, 2, p.metal);
  label(g, p, 60, 46, "RECEIVER");
};

export const frame: SceneDef = {
  id: "frame",
  name: "Protocol Frame",
  hint: "One reading as a protocol frame: every field has a job. Hover a field to see what it carries and who handles it.",
  bg(g, p) {
    landscape(g, p, { seed: 33 });
    g.text(10, 12, "SIMPLIFIED METER-READING FRAME", p.ink);
    g.text(10, 72, "READS LEFT TO RIGHT", p.inkDim);
  },
  objects: [
    ...cellObjs(),
    {
      id: "gw",
      layer: "p",
      x: 22,
      y: 100,
      w: 60,
      h: 58,
      name: "Gateway",
      paint: gw,
      links: [],
      text: "Builds the frame, signs the reading and sends it on.",
    },
    {
      id: "reading",
      layer: "p",
      x: 112,
      y: 96,
      w: 100,
      h: 58,
      name: "Meter reading",
      paint: reading,
      links: [],
      text: "The register value the frame is carrying.",
    },
    {
      id: "rx",
      layer: "p",
      x: 238,
      y: 98,
      w: 60,
      h: 50,
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
        [52, 100],
        [52, 90],
        [268, 90],
        [268, 98],
      ]),
    },
  ],
};
