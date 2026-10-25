import { drawText, eachTextPixel, textWidth } from "./font";
import {
  type C,
  type Pt,
  type R5,
  type Sprite,
  along,
  ball,
  bake,
  blit,
  cyl,
  dotted,
  glow,
  hash,
  line,
  mat,
  planks,
  px,
  ramp,
  shadow,
  slab,
  tone,
} from "./gfx";
import { mix, type Pal } from "./palette";
import { STATIONS } from "./walk";
import { drawLamp, setFor, type View } from "./scenery";

/** One scene along the path, drawn in station space: x = 0 is the middle of the art, y = 0 the ground line. */
interface Station {
  bounds: [number, number, number, number];
  /** pre-rendered with an outline */
  still: (c: C, p: Pal) => void;
  /** animated parts and light, drawn every frame */
  live: (c: C, p: Pal, v: View) => void;
}

const cyc = (p: Pal, i: number) => [p.red, p.blue, p.green, p.yellow][i & 3]!;

function label(c: C, p: Pal, s: string, x: number, y: number, k: number) {
  const w = textWidth(s, k);
  if (y > 0) {
    // ground labels sit on a small plaque so they read on any grass
    const pad = 2 * k;
    const x0 = Math.round(x - w / 2) - pad;
    const w0 = w + 2 * pad;
    const h0 = 7 * k + 2 * pad;
    c.fillStyle = p.ink;
    c.fillRect(x0 - 1, y - pad - 1, w0 + 2, h0 + 2);
    c.fillStyle = p.night ? "#0a1030" : "#fffbe8";
    c.fillRect(x0, y - pad, w0, h0);
    drawText(c, s, x - w / 2, y, p.ink, k);
    return;
  }
  drawText(c, s, x - w / 2 + k, y + k, p.night ? "#02041a" : "#ffffff55", k);
  drawText(c, s, x - w / 2, y, p.ink, k);
}

/** A meter has just sent a reading: a ring grows from it every few seconds. */
function readingPing(c: C, p: Pal, t: number, x: number, y: number) {
  const ph = (t % 5) / 5;
  if (ph > 0.3) return;
  const u = ph / 0.3;
  c.save();
  c.globalAlpha = 0.8 * (1 - u);
  c.strokeStyle = p.blue;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(Math.round(x), Math.round(y), 6 + u * 22, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  if (u < 0.35) px(c, "#ffffff", x - 2, y - 2, 4, 4);
}

function taper(
  c: C,
  cx: number,
  y0: number,
  y1: number,
  w0: number,
  w1: number,
  r: R5,
) {
  const n = y0 - y1;
  for (let i = 0; i < n; i++) {
    const w = Math.round(w0 + ((w1 - w0) * i) / n);
    const x = cx - (w >> 1);
    const q = Math.max(1, w >> 2);
    px(c, r[2], x, y0 - 1 - i, w, 1);
    px(c, r[3], x, y0 - 1 - i, q, 1);
    px(c, r[4], x + q, y0 - 1 - i, 1, 1);
    px(c, r[1], x + w - q, y0 - 1 - i, q, 1);
  }
}

function trapezoid(
  c: C,
  xl0: number,
  xr0: number,
  xl1: number,
  xr1: number,
  yb: number,
  yt: number,
  r: R5,
  pitch = 6,
) {
  for (let y = yb; y > yt; y--) {
    const u = (yb - y) / (yb - yt);
    const l = Math.round(xl0 + (xl1 - xl0) * u);
    const rr = Math.round(xr0 + (xr1 - xr0) * u);
    const band = Math.floor((yb - y) / pitch);
    const top = (yb - y) % pitch === 0;
    px(c, top ? r[1] : r[2], l, y, rr - l, 1);
    if (!top)
      for (let x = l + (band & 1) * 6 + 3; x < rr; x += 12)
        px(c, r[1], x, y, 1, 1);
    px(c, r[3], l, y, 2, 1);
    px(c, r[1], rr - 2, y, 2, 1);
  }
  px(c, r[4], xl1, yt, xr1 - xl1, 1);
}

function window(c: C, p: Pal, x: number, y: number, w: number, h: number) {
  const frame = mat(p, "#f4f1ea", 0.2);
  slab(c, x - 3, y - 3, w + 6, h + 6, frame, 1);
  px(c, p.night ? "#0b1030" : "#7fb9ea", x, y, w, h);
  if (!p.night) {
    for (let i = 0; i < h; i += 2) px(c, "#a8d4f4", x + 2 + i, y + i, 4, 1);
    px(c, "#d4ebfa", x, y, w, 1);
  }
}

function muntins(c: C, p: Pal, x: number, y: number, w: number, h: number) {
  const frame = mat(p, "#f4f1ea", 0.2);
  px(c, frame[2], x + (w >> 1) - 1, y, 3, h);
  px(c, frame[2], x, y + (h >> 1) - 1, w, 3);
}

function panel(
  c: C,
  p: Pal,
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  rows: number,
) {
  const f = mat(p, "#c5ccd8", 0.2);
  const cell = mat(p, "#2a5fb4", 0.2);
  slab(c, x, y, w, h, f, 1);
  const cw = Math.floor((w - 4 - (cols - 1)) / cols);
  const ch = Math.floor((h - 4 - (rows - 1)) / rows);
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) {
      const cx0 = x + 2 + k * (cw + 1);
      const cy0 = y + 2 + r * (ch + 1);
      px(c, cell[2], cx0, cy0, cw, ch);
      px(c, cell[1], cx0, cy0 + ch - 2, cw, 2);
      px(c, cell[3], cx0, cy0, cw, 1);
      px(c, cell[1], cx0 + (cw >> 1), cy0, 1, ch);
      if ((k + r) % 3 === 0) px(c, cell[4], cx0 + 2, cy0 + 2, 4, 1);
    }
}

function cloudData(c: C, p: Pal, x: number, y: number) {
  const r = mat(p, "#4398cd", 0.15);
  ball(c, x - 28, y + 6, 12, r, 18, -0.4, -0.7);
  ball(c, x + 28, y + 6, 12, r, 18, -0.4, -0.7);
  ball(c, x, y, 18, r, 26, -0.4, -0.7);
  ball(c, x + 12, y - 12, 12, r, 14, -0.4, -0.7);
  px(c, r[1], x - 44, y + 12, 90, 4);
  // a tiny server rack
  px(c, "#0b1030", x - 8, y - 4, 16, 14);
  for (let i = 0; i < 3; i++) px(c, "#2b3f7a", x - 6, y - 2 + i * 4, 12, 3);
}

function pulse(
  c: C,
  col: string,
  pts: Pt[],
  t: number,
  n: number,
  speed: number,
  size = 5,
) {
  for (let k = 0; k < n; k++) {
    const [x, y] = along(pts, (t * speed + k / n) % 1);
    px(c, "#0b1030", x - size / 2 - 1, y - size / 2 - 1, size + 2, size + 2);
    px(c, col, x - size / 2, y - size / 2, size, size);
    px(c, "#ffffff", x - size / 2, y - size / 2, 1, 1);
  }
}

function wire(c: C, col: string, pts: Pt[]) {
  for (let i = 1; i < pts.length; i++)
    line(c, col, pts[i - 1]![0], pts[i - 1]![1], pts[i]![0], pts[i]![1]);
}

function blade(
  c: C,
  col: string,
  edge: string,
  x: number,
  y: number,
  ang: number,
  len: number,
) {
  for (let i = 0; i <= len; i++) {
    const w = Math.max(1, Math.round(5 - (i / len) * 4));
    const bx = x + Math.cos(ang) * i;
    const by = y + Math.sin(ang) * i;
    px(c, col, bx - w / 2, by - w / 2, w, w);
    px(c, edge, bx - w / 2, by + w / 2 - 1, w, 1);
  }
}

function turbineLive(
  c: C,
  p: Pal,
  x: number,
  y: number,
  len: number,
  t: number,
  phase: number,
) {
  const m = mat(p, "#f2f4f8", 0.2);
  for (let b = 0; b < 3; b++)
    blade(c, m[3], m[1], x, y, t * 1.1 + phase + (b * Math.PI * 2) / 3, len);
  ball(c, x, y, 6, m);
}

function turbineStill(c: C, p: Pal, x: number, h: number) {
  const m = mat(p, "#f2f4f8", 0.2);
  taper(c, x, 0, -h, 12, 6, m);
  slab(c, x - 10, -h - 6, 22, 10, mat(p, "#d8dde6", 0.2), 2);
  px(c, mat(p, "#c0392b", 0.2)[2], x - 3, -h - 4, 6, 1);
  px(c, mat(p, "#c0392b", 0.2)[2], x - 3, -40, 6, 3);
}

function fence(c: C, p: Pal, x0: number, x1: number, h: number) {
  const m = mat(p, "#8d97a8", 0.2);
  for (let x = x0; x <= x1; x += 22) px(c, m[2], x, -h, 3, h);
  px(c, m[3], x0, -h, x1 - x0 + 3, 2);
  px(c, m[1], x0, -2, x1 - x0 + 3, 2);
  for (let x = x0 + 3; x < x1; x++)
    for (let y = 3; y < h - 2; y += 4)
      if (((x + y) >> 2) % 2 === 0) px(c, m[2], x, -y, 1, 1);
}

/* ---------- 0: hello ---------- */

const TITLE: [string, number][] = [
  ["PHILIPP", -226],
  ["NAGEL", -176],
];
const TK = 6;

const hello: Station = {
  bounds: [-260, -260, 300, 6],
  still(c, p) {
    const base = mat(p, p.night ? "#c9d0e6" : "#39425a", 0);
    for (const [s, y] of TITLE) {
      const w = textWidth(s, TK);
      eachTextPixel(s, (gx, gy) => {
        if (hash(gx * 17 + gy * 5 + s.length * 101) < 0.1) return;
        slab(c, -w / 2 + gx * TK, y + gy * TK, TK, TK, base, 1);
      });
    }
    // trees and a signpost
    const set = setFor(p);
    blit(c, set.trees[1]!, -190, 2);
    blit(c, set.trees[3]!, 230, 2);
    blit(c, set.trees[4]!, 190, 2);
    const wood = mat(p, "#9a6a3e");
    slab(c, 98, -58, 8, 58, wood, 2);
    const board = mat(p, "#d9a21b", 0.2);
    slab(c, 66, -86, 76, 28, board, 2);
    for (let i = 0; i < 12; i++)
      px(
        c,
        board[2],
        142 + i,
        -86 + 14 - Math.round(i * (14 / 12)),
        1,
        Math.round(i * (14 / 12)) * 2 || 1,
      );
    drawText(c, "SCROLL", 74, -76, "#2a1a08", 2);
  },
  live(c, p, v) {
    shadow(c, p, 105, 0, 16);
    const base = p.night ? "#c9d0e6" : "#39425a";
    void base;
    for (const [s, y] of TITLE) {
      const w = textWidth(s, TK);
      eachTextPixel(s, (gx, gy) => {
        const h = hash(gx * 17 + gy * 5 + s.length * 101);
        if (h >= 0.1) return;
        const col = tone(p, cyc(p, Math.floor(v.t * 2 + h * 40)), 0.15);
        slab(c, -w / 2 + gx * TK, y + gy * TK, TK, TK, ramp(col), 1);
      });
    }
    label(c, p, "GRID TO PACKET", 0, -126, 2);
    drawLamp(c, p, -140, 0);
  },
};

/* ---------- 1: grid ---------- */

const A = { x: -170, h: 190, len: 60 };
const B = { x: -92, h: 148, len: 46 };

const grid: Station = {
  bounds: [-250, -270, 330, 8],
  still(c, p) {
    turbineStill(c, p, A.x, A.h);
    turbineStill(c, p, B.x, B.h);
    // substation yard
    const gravel = mix(p.ground, p.path, 0.5);
    px(c, gravel, -34, -6, 214, 8);
    fence(c, p, -34, 180, 30);
    // control building
    const wall = mat(p, "#aab4c6", 0.2);
    planks(c, -20, -66, 64, 66, wall, 6);
    slab(c, -24, -72, 72, 8, mat(p, "#6f7a90", 0.2), 2);
    slab(c, -6, -40, 22, 40, mat(p, "#d9a21b", 0.2), 2);
    px(c, mat(p, "#d9a21b", 0.2)[1], -2, -36, 14, 1);
    px(c, "#c8b45a", 12, -20, 2, 3);
    window(c, p, 24, -52, 14, 14);
    line(c, mat(p, "#8d97a8", 0.2)[2], 36, -72, 36, -92, 2);
    px(c, p.red, 34, -96, 5, 4);
    // transformer
    const tank = mat(p, "#3f7fb8", 0.2);
    slab(c, 80, -48, 62, 48, tank, 2);
    for (let x = 84; x < 138; x += 5) px(c, tank[1], x, -44, 1, 40);
    slab(c, 142, -42, 16, 36, mat(p, "#6f7a90", 0.2), 1);
    for (let y = -38; y < -8; y += 4)
      px(c, mat(p, "#6f7a90", 0.2)[1], 144, y, 12, 1);
    slab(c, 78, -4, 66, 5, mat(p, "#4a5368", 0.2), 1);
    const ins = mat(p, "#c98a3c", 0.2);
    for (const bx of [92, 110, 128]) {
      cyl(c, bx, -66, 7, 20, ins);
      for (let y = -64; y < -48; y += 4) px(c, ins[1], bx - 1, y, 9, 1);
      px(c, mat(p, "#6f7a90", 0.2)[3], bx - 1, -68, 9, 3);
    }
    // gantry
    const steel = mat(p, "#8d97a8", 0.2);
    slab(c, 66, -96, 5, 96, steel, 1);
    slab(c, 150, -96, 5, 96, steel, 1);
    slab(c, 66, -98, 89, 5, steel, 1);
    for (const bx of [78, 110, 142]) {
      px(c, ins[2], bx, -94, 3, 8);
      px(c, ins[3], bx - 1, -94, 5, 2);
    }
    // pole line out
    const wood = mat(p, "#9a6a3e", 0.2);
    slab(c, 220, -120, 6, 120, wood, 1);
    slab(c, 208, -116, 30, 4, wood, 1);
    for (const bx of [210, 221, 233]) px(c, ins[3], bx, -124, 3, 8);
    // the line ends on a pole of its own, so the wires never hang in the air
    slab(c, 300, -106, 6, 106, wood, 1);
    slab(c, 288, -102, 30, 4, wood, 1);
    for (const bx of [290, 301, 313]) px(c, ins[3], bx, -110, 3, 8);
    cloudData(c, p, 50, -215);
  },
  live(c, p, v) {
    const t = v.t;
    shadow(c, p, A.x, 0, 22);
    shadow(c, p, B.x, 0, 18);
    shadow(c, p, 30, 0, 50);
    shadow(c, p, 110, 0, 44);
    turbineLive(c, p, A.x, -A.h - 1, A.len, t, 0);
    turbineLive(c, p, B.x, -B.h - 1, B.len, t, 1.7);
    // power cable underground, shown as a dashed line on the grass
    const cable: Pt[] = [
      [A.x, 4],
      [A.x, 8],
      [-10, 8],
      [-10, 3],
      [30, 3],
    ];
    const cm = mat(p, "#8d97a8", 0.2)[1];
    wire(c, cm, cable);
    wire(c, cm, [
      [B.x, 4],
      [B.x, 8],
      [-10, 8],
    ]);
    pulse(c, p.yellow, cable, t, 4, 0.2, 4);
    // substation to gantry to the pole line
    const out: Pt[] = [
      [110, -88],
      [150, -94],
      [222, -118],
      [302, -104],
    ];
    wire(c, cm, [
      [74, -92],
      [74, -66],
      [92, -66],
    ]);
    wire(c, cm, [
      [74, -92],
      [110, -88],
    ]);
    wire(c, cm, out);
    pulse(c, p.yellow, [[96, -64], [96, -88], ...out], t, 5, 0.22, 5);
    glow(c, p, 30, -34, 40);
    glow(c, p, 31, -45, 20);
    // lit window
    if (p.night) {
      px(c, p.glow, 24, -52, 14, 14);
      px(c, mat(p, "#f4f1ea", 0.2)[2], 30, -52, 2, 14);
    }
    // data layer
    const link: Pt[] = [
      [36, -98],
      [50, -190],
    ];
    dotted(c, p.blue, link[0]![0], link[0]![1], link[1]![0], link[1]![1]);
    pulse(c, p.blue, link, t, 2, 0.35, 6);
    pulse(
      c,
      p.blue,
      [
        [50, -190],
        [36, -98],
      ],
      t + 0.3,
      1,
      0.3,
      6,
    );
    label(c, p, "MARKET", 50, -250, 2 * v.tk);
    label(c, p, "WIND", -130, 38, v.tk);
    label(c, p, "STATION", 20, 38, v.tk);
    label(c, p, "TRAFO", 108, 38, v.tk);
    drawLamp(c, p, 182, 0);
  },
};

/* ---------- 2: battery site (BESS) ---------- */

const UNITS = [-40, 52, 144];

/** Charge cycle: 0..1 over a few seconds; first half charging, second half discharging. */
const cyclePhase = (t: number) => (t * 0.12) % 1;
const soc = (phase: number) => (phase < 0.5 ? phase * 2 : 2 - phase * 2);

const bess: Station = {
  bounds: [-230, -260, 380, 8],
  still(c, p) {
    const gravel = mix(p.ground, p.path, 0.5);
    px(c, gravel, -64, -6, 330, 8);
    fence(c, p, -64, 264, 30);
    const white = mat(p, "#e8ecf2", 0.2);
    const band = mat(p, "#47a639", 0.16);
    UNITS.forEach((x, k) => {
      slab(c, x - 4, -6, 92, 6, mat(p, "#8d949f", 0.2), 1);
      slab(c, x, -62, 84, 56, white, 2);
      for (let rx = x + 3; rx < x + 82; rx += 4)
        px(c, white[1], rx, -58, 1, 48);
      px(c, white[3], x, -62, 84, 3);
      slab(c, x, -36, 84, 8, band, 1);
      // double door on the right half, battery panel on the left
      slab(c, x + 46, -56, 34, 46, mat(p, "#cfd5de", 0.2), 1);
      px(c, white[1], x + 63, -56, 2, 46);
      px(c, mat(p, "#6f7a90", 0.2)[2], x + 59, -34, 2, 10);
      px(c, mat(p, "#6f7a90", 0.2)[2], x + 67, -34, 2, 10);
      slab(c, x + 6, -56, 34, 18, mat(p, "#10131a", 0), 1);
      // roof HVAC unit with a fan grille
      slab(c, x + 8, -76, 34, 14, mat(p, "#aab4c6", 0.2), 1);
      ball(c, x + 25, -69, 5, mat(p, "#4a5368", 0.2));
      px(c, mat(p, "#6f7a90", 0.2)[1], x + 12, -72, 3, 8);
      if (k === 1) {
        line(c, mat(p, "#8d97a8", 0.2)[2], x + 60, -62, x + 60, -96, 2);
        ball(c, x + 60, -98, 3, mat(p, "#d82d17", 0.2));
      }
      // bolt badge
      px(c, mat(p, "#edcb1f", 0.2)[2], x + 18, -30, 3, 4);
      px(c, mat(p, "#edcb1f", 0.2)[2], x + 15, -27, 5, 3);
    });
    // power conversion cabinet
    const pcs = mat(p, "#3f7fb8", 0.2);
    slab(c, 236, -70, 36, 70, pcs, 2);
    for (let y = -64; y < -28; y += 4) px(c, pcs[1], 240, y, 28, 1);
    slab(c, 242, -22, 24, 16, mat(p, "#10131a", 0), 1);
    // medium-voltage transformer
    const tank = mat(p, "#8a8f9c", 0.2);
    slab(c, 292, -46, 48, 46, tank, 2);
    for (let x = 296; x < 336; x += 5) px(c, tank[1], x, -42, 1, 38);
    const ins = mat(p, "#c98a3c", 0.2);
    for (const bx of [298, 314, 330]) {
      cyl(c, bx, -62, 6, 18, ins);
      px(c, mat(p, "#6f7a90", 0.2)[3], bx - 1, -64, 8, 3);
    }
    const wood = mat(p, "#9a6a3e", 0.2);
    slab(c, 360, -112, 6, 112, wood, 1);
    slab(c, 348, -108, 30, 4, wood, 1);
    for (const bx of [350, 361, 373]) px(c, ins[3], bx, -116, 3, 8);
    cloudData(c, p, 110, -190);
  },
  live(c, p, v) {
    const t = v.t;
    const phase = cyclePhase(t);
    const charging = phase < 0.5;
    shadow(c, p, 100, 0, 150, 6);
    shadow(c, p, 254, 0, 24);
    shadow(c, p, 316, 0, 30);
    UNITS.forEach((x, k) => {
      // state-of-charge bars on the panel
      const level = Math.max(0, Math.min(1, soc(phase) + (k - 1) * 0.06));
      for (let i = 0; i < 6; i++) {
        const lit = i < Math.round(level * 6);
        const col = i < 2 ? p.red : i < 4 ? p.yellow : p.green;
        px(c, lit ? col : mix(col, "#10131a", 0.8), x + 9 + i * 5, -52, 4, 10);
        if (lit) px(c, "#ffffff", x + 9 + i * 5, -52, 1, 1);
      }
      px(c, charging ? p.green : p.yellow, x + 9, -40, 3, 2);
      // spinning fan
      const a = t * 9 + k;
      const fx = x + 25;
      for (let b = 0; b < 2; b++)
        line(
          c,
          "#10131a",
          fx + Math.cos(a + b * Math.PI) * 4,
          -69 + Math.sin(a + b * Math.PI) * 4,
          fx,
          -69,
        );
      // status LED
      px(
        c,
        Math.floor(t * 2 + k) & 1 ? p.green : mat(p, "#4a5368")[2],
        x + 74,
        -58,
        3,
        3,
      );
    });
    // power flows in while charging, out while discharging
    const route: Pt[] = [
      [364, -108],
      [322, -64],
      [300, -30],
      [272, -30],
      [254, -6],
      [254, 2],
      [-40, 2],
    ];
    const cm = mat(p, "#8d97a8", 0.2)[1];
    wire(c, cm, route);
    const rev = charging ? route : [...route].reverse();
    pulse(c, p.yellow, rev, t, 6, 0.18, 5);
    glow(c, p, 100, -40, 120, p.glow, 0.02);
    // energy management system and market link
    const link: Pt[] = [
      [112, -98],
      [110, -172],
    ];
    dotted(c, p.blue, link[0]![0], link[0]![1], link[1]![0], link[1]![1]);
    pulse(c, p.blue, link, t, 2, 0.35, 6);
    pulse(
      c,
      p.blue,
      [
        [110, -172],
        [112, -98],
      ],
      t + 0.4,
      1,
      0.3,
      6,
    );
    label(c, p, "EMS", 110, -232, 2 * v.tk);
    label(c, p, "BESS", 100, 38, v.tk);
    label(c, p, "PCS", 254, 38, v.tk);
    label(c, p, "TRAFO", 316 + 20 * (v.tk - 1), 38, v.tk);
    const state = charging ? "CHARGING" : "DISCHARGING";
    drawText(c, state, -64, -92, charging ? p.green : p.yellow, 2);
    drawLamp(c, p, -88, 0);
  },
};

/* ---------- 3: data center ---------- */

/** Coolers on the roof, left edge of each. */
const COOLERS = [4, 56, 108, 160, 212];
/** Grid connection, step-down, then into the hall. */
const DC_FEED: Pt[] = [
  [-177, -106],
  [-117, -60],
  [-67, -60],
  [-14, -60],
  [-14, -30],
  [0, -30],
];

const datacenter: Station = {
  bounds: [-250, -270, 420, 8],
  still(c, p) {
    const gravel = mix(p.ground, p.path, 0.5);
    px(c, gravel, -150, -6, 550, 8);
    fence(c, p, -150, 400, 30);
    // grid connection: a pole and two step-down transformers
    const wood = mat(p, "#9a6a3e", 0.2);
    const ins = mat(p, "#c98a3c", 0.2);
    slab(c, -180, -108, 6, 108, wood, 1);
    slab(c, -192, -104, 30, 4, wood, 1);
    for (const bx of [-190, -179, -167]) px(c, ins[3], bx, -112, 3, 8);
    const tank = mat(p, "#8a8f9c", 0.2);
    for (const tx of [-130, -80]) {
      slab(c, tx, -40, 44, 40, tank, 2);
      for (let x = tx + 4; x < tx + 40; x += 5) px(c, tank[1], x, -36, 1, 32);
      for (const bx of [tx + 10, tx + 30]) {
        cyl(c, bx, -56, 6, 18, ins);
        px(c, mat(p, "#6f7a90", 0.2)[3], bx - 1, -58, 8, 3);
      }
    }
    // the hall: long, windowless and bigger than anything else on the path
    const wall = mat(p, "#7d879a", 0.2);
    planks(c, 0, -88, 260, 88, wall, 8);
    slab(c, -6, -96, 272, 8, mat(p, "#4a5368", 0.2), 2);
    slab(c, 12, -70, 176, 28, mat(p, "#10131a", 0), 1);
    for (let x = 14; x < 186; x += 8) px(c, "#1a2140", x, -68, 6, 24);
    slab(c, 206, -52, 40, 52, mat(p, "#cfd5de", 0.2), 1);
    px(c, wall[1], 225, -52, 2, 52);
    px(c, mat(p, "#6f7a90", 0.2)[2], 220, -28, 3, 8);
    px(c, mat(p, "#6f7a90", 0.2)[2], 229, -28, 3, 8);
    // dry coolers on the roof, their fans spin in the live pass
    const unit = mat(p, "#aab4c6", 0.2);
    for (const x of COOLERS) {
      slab(c, x, -114, 44, 18, unit, 1);
      ball(c, x + 22, -105, 8, mat(p, "#4a5368", 0.2));
    }
    // UPS container and a backup generator
    const white = mat(p, "#e8ecf2", 0.2);
    slab(c, 284, -46, 52, 46, white, 2);
    slab(c, 284, -26, 52, 6, mat(p, "#edcb1f", 0.2), 1);
    slab(c, 290, -42, 18, 12, mat(p, "#10131a", 0), 1);
    px(c, white[1], 318, -40, 2, 38);
    slab(c, 346, -34, 44, 34, mat(p, "#d9a21b", 0.2), 2);
    px(c, mat(p, "#8a6410", 0.2)[1], 352, -28, 24, 3);
    px(c, mat(p, "#8a6410", 0.2)[1], 352, -20, 24, 3);
    slab(c, 378, -58, 6, 26, mat(p, "#4a5368", 0.2), 1);
    cloudData(c, p, 130, -190);
  },
  live(c, p, v) {
    const t = v.t;
    shadow(c, p, 135, 0, 150, 6);
    shadow(c, p, -88, 0, 70, 4);
    shadow(c, p, 310, 0, 30);
    shadow(c, p, 368, 0, 26);
    // racks seen through the glass band: lights flicker with the work
    for (let i = 0; i < 21; i++)
      for (let row = 0; row < 3; row++) {
        const h = hash(i * 7 + row * 31 + Math.floor(t * (1 + hash(i) * 3)));
        if (h > 0.45) continue;
        const col = h < 0.2 ? p.green : h < 0.35 ? p.blue : p.yellow;
        px(c, col, 15 + i * 8, -62 + row * 8, 2, 2);
      }
    // load meter: training jobs make it swing
    const load = 0.62 + 0.28 * Math.sin(t * 0.7) + 0.06 * Math.sin(t * 3.1);
    for (let i = 0; i < 10; i++) {
      const lit = i < Math.round(load * 10);
      const col = i < 5 ? p.green : i < 8 ? p.yellow : p.red;
      px(c, lit ? col : mix(col, "#10131a", 0.8), 14 + i * 6, -82, 5, 6);
    }
    // roof fans, and the heat they carry off
    COOLERS.forEach((x, k) => {
      const fx = x + 22;
      const a = t * 8 + k;
      for (let b = 0; b < 3; b++) {
        const ang = a + (b * Math.PI * 2) / 3;
        line(
          c,
          "#10131a",
          fx + Math.cos(ang) * 7,
          -105 + Math.sin(ang) * 7,
          fx,
          -105,
        );
      }
      c.save();
      for (let j = 0; j < 2; j++) {
        const u = (t * 0.25 + k * 0.37 + j * 0.5) % 1;
        c.globalAlpha = 0.28 * (1 - u);
        px(
          c,
          "#ffb36b",
          fx + Math.sin(t * 2 + k + j * 3) * 4,
          -120 - u * 54,
          4,
          4,
        );
      }
      c.restore();
    });
    // grid power in, hard
    const cm = mat(p, "#8d97a8", 0.2)[1];
    wire(c, cm, DC_FEED);
    wire(c, cm, [
      [260, -24],
      [284, -24],
    ]);
    wire(c, cm, [
      [336, -20],
      [346, -20],
    ]);
    pulse(c, p.yellow, DC_FEED, t, 8, 0.2, 5);
    glow(c, p, 100, -56, 140, p.blue, 0.03);
    // standby lights on the UPS and the generator
    px(c, p.green, 312, -38, 3, 3);
    px(c, Math.floor(t) & 1 ? p.green : mat(p, "#4a5368")[2], 380, -26, 3, 3);
    // data layer
    const link: Pt[] = [
      [130, -116],
      [130, -172],
    ];
    dotted(c, p.blue, 130, -116, 130, -172);
    pulse(c, p.blue, link, t, 3, 0.4, 6);
    pulse(c, p.blue, [link[1]!, link[0]!], t + 0.4, 2, 0.35, 6);
    label(c, p, "CLOUD", 130, -232, 2 * v.tk);
    label(c, p, "DATA CENTER", 130, 38, v.tk);
    label(c, p, "TRAFO", -80, 38, v.tk);
    label(c, p, "UPS", 310, 38, v.tk);
    label(c, p, "GEN", 368 + 10 * (v.tk - 1), 38, v.tk);
    drawLamp(c, p, -215, 0);
  },
};

/* ---------- 4: house ---------- */

const house: Station = {
  bounds: [-230, -260, 330, 8],
  still(c, p) {
    const set = setFor(p);
    blit(c, set.trees[0]!, -150, 2);
    // house
    const wall = mat(p, "#f1ece0", 0.2);
    planks(c, -50, -80, 150, 80, wall, 6);
    slab(c, -54, -8, 158, 8, mat(p, "#8d949f", 0.2), 2);
    const roof = mat(p, "#c0392b", 0.18);
    trapezoid(c, -66, 116, -20, 70, -80, -126, roof, 6);
    slab(c, -70, -84, 190, 6, mat(p, "#8a2c20", 0.18), 2);
    panel(c, p, -26, -122, 86, 36, 6, 2);
    // chimney
    slab(c, 76, -150, 16, 40, mat(p, "#a0614a", 0.2), 2);
    slab(c, 73, -154, 22, 6, mat(p, "#6f7a90", 0.2), 2);
    // door
    const door = mat(p, "#d9a21b", 0.2);
    slab(c, 2, -60, 28, 60, door, 2);
    px(c, door[1], 7, -54, 18, 20);
    slab(c, 7, -54, 18, 20, door, 1);
    slab(c, 7, -30, 18, 24, door, 1);
    px(c, "#fff5c0", 24, -30, 3, 3);
    slab(c, -2, -66, 36, 6, mat(p, "#8a2c20", 0.18), 1);
    slab(c, -4, 0, 40, 4, mat(p, "#8d949f", 0.2), 1);
    // windows, meter box
    window(c, p, -36, -62, 30, 34);
    window(c, p, 64, -62, 30, 34);
    const box = mat(p, "#6f7a90", 0.2);
    slab(c, 40, -52, 18, 28, box, 2);
    px(c, "#0b1030", 43, -48, 12, 8);
    px(c, "#1c2a5a", 43, -37, 12, 3);
    // EV and charger
    const body = mat(p, "#d82d17", 0.14);
    slab(c, 130, -34, 108, 22, body, 2);
    trapezoid(c, 150, 220, 160, 208, -34, -56, body, 30);
    px(c, p.night ? "#1b2a5a" : "#9fd0f0", 164, -52, 20, 16);
    px(c, p.night ? "#1b2a5a" : "#9fd0f0", 188, -52, 18, 16);
    px(c, body[1], 185, -52, 3, 18);
    px(c, "#fff3b0", 230, -30, 8, 5);
    px(c, "#7a1a10", 130, -30, 4, 6);
    for (const wx of [152, 214]) {
      ball(c, wx, -9, 11, mat(p, "#1a1f33", 0.1));
      ball(c, wx, -9, 5, mat(p, "#aab4c6", 0.2));
    }
    const post = mat(p, "#47a639", 0.16);
    slab(c, 262, -76, 14, 76, post, 2);
    px(c, "#0b1030", 265, -68, 8, 12);
    slab(c, 256, -4, 26, 4, mat(p, "#6f7a90", 0.2), 1);
    cloudData(c, p, 76, -215);
  },
  live(c, p, v) {
    const t = v.t;
    shadow(c, p, 25, 0, 90);
    shadow(c, p, 184, 0, 62);
    // chimney smoke
    for (let k = 0; k < 6; k++) {
      const u = (t * 0.3 + k / 6) % 1;
      c.save();
      c.globalAlpha = 0.5 * (1 - u);
      ball(
        c,
        84 + Math.sin(u * 5 + k) * 6 + u * 14,
        -158 - u * 60,
        4 + u * 7,
        ramp(p.night ? "#6a74b0" : "#e8eef4"),
      );
      c.restore();
    }
    // sun glint sweeping across the panels
    c.save();
    c.beginPath();
    c.rect(-26, -122, 86, 36);
    c.clip();
    const gl = ((t * 30) % 140) - 30;
    for (let i = 0; i < 5; i++)
      px(c, "#ffffff", -26 + gl + i * 2, -86 - i * 6, 3, 2);
    c.restore();
    if (p.night) {
      for (const wx of [-36, 64]) {
        px(c, p.glow, wx, -62, 30, 34);
        px(c, p.glow, wx + 3, -59, 6, 28);
        muntins(c, p, wx, -62, 30, 34);
        glow(c, p, wx + 15, -45, 44);
      }
      glow(c, p, 16, -66, 40);
      px(c, p.glow, 8, -68, 20, 2);
    } else {
      for (const wx of [-36, 64]) muntins(c, p, wx, -62, 30, 34);
    }
    // meter display and LED
    drawText(
      c,
      String(1000 + (Math.floor(t * 2) % 1000)).slice(-3),
      44,
      -47,
      p.green,
      1,
    );
    px(c, Math.floor(t * 2) & 1 ? p.red : mat(p, "#4a5368")[2], 53, -38, 3, 3);
    readingPing(c, p, t, 49, -38);
    // charger
    px(c, "#0b1030", 265, -68, 8, 12);
    px(c, p.green, 267, -66, 4, 3);
    px(c, p.yellow, 267, -60, 4, 2);
    const cable: Pt[] = [
      [262, -46],
      [250, -30],
      [240, -26],
    ];
    wire(c, "#10131a", cable);
    pulse(c, p.yellow, cable, t, 2, 0.5, 4);
    glow(c, p, 268, -60, 22, p.green, 0.04);
    // data layer
    const mb: Pt[] = [
      [49, -53],
      [49, -110],
      [76, -190],
    ];
    for (let i = 1; i < mb.length; i++)
      dotted(c, p.blue, mb[i - 1]![0], mb[i - 1]![1], mb[i]![0], mb[i]![1]);
    pulse(c, p.blue, mb, t, 2, 0.3, 6);
    label(c, p, "DSO", 76, -250, 2 * v.tk);
    label(c, p, "HOUSE", 10, 38, v.tk);
    label(c, p, "METER", 49 + 34 * (v.tk - 1), 38, v.tk);
    label(c, p, "EV", 190, 38, v.tk);
  },
};

/* ---------- 4: meter cabinet ---------- */

const cabinet: Station = {
  bounds: [-190, -270, 260, 8],
  still(c, p) {
    const steel = mat(p, "#7d879a", 0.2);
    const inner = mat(p, "#161c34", 0);
    slab(c, -120, -168, 300, 168, steel, 3);
    px(c, inner[2], -110, -158, 280, 148);
    px(c, inner[1], -110, -158, 280, 4);
    px(c, inner[1], -110, -158, 4, 148);
    for (let i = 0; i < 30; i++) {
      px(
        c,
        i & 1 ? mat(p, "#d9a21b", 0.2)[2] : "#10131a",
        -120 + i * 10,
        -168,
        10,
        6,
      );
    }
    for (const [x, y] of [
      [-114, -162],
      [108, -162],
      [-114, -14],
      [108, -14],
    ] as const)
      ball(c, x, y, 3, steel);
    // DIN rail
    slab(c, -108, -54, 276, 8, mat(p, "#aab4c6", 0.2), 1);
    for (let x = -100; x < 164; x += 14) px(c, "#10131a", x, -51, 6, 2);
    // meter
    const white = mat(p, "#f4f1ea", 0.2);
    slab(c, -98, -146, 74, 94, white, 2);
    px(c, white[1], -96, -66, 70, 2);
    slab(c, -92, -140, 62, 38, mat(p, "#2c3a30", 0.1), 1);
    px(c, "#8aa078", -90, -138, 58, 1);
    ball(c, -62, -80, 7, mat(p, "#6f7a90", 0.2));
    ball(c, -62, -80, 3, mat(p, "#10131a", 0));
    for (let i = 0; i < 4; i++) px(c, "#aab4c6", -94 + i * 16, -60, 12, 6);
    for (const [x, y] of [
      [-94, -142],
      [-28, -142],
      [-94, -58],
      [-28, -58],
    ] as const)
      ball(c, x, y, 2, mat(p, "#aab4c6", 0.2));
    // gateway
    const gw = mat(p, "#2c4f8f", 0.2);
    slab(c, -2, -148, 100, 94, gw, 2);
    for (let i = 0; i < 6; i++) px(c, gw[1], 6, -140 + i * 4, 84, 1);
    slab(c, 6, -106, 84, 24, mat(p, "#10244a", 0.1), 1);
    drawText(c, "GW", 34, -100, mat(p, "#ffffff", 0.2)[2], 2);
    for (let i = 0; i < 3; i++) {
      slab(c, 12 + i * 26, -76, 20, 12, mat(p, "#10131a", 0), 1);
      for (let k = 0; k < 6; k++)
        px(c, "#c8b45a", 15 + i * 26 + k * 3, -73, 1, 5);
    }
    line(c, steel[2], 20, -148, 20, -174, 3);
    line(c, steel[2], 78, -148, 78, -174, 3);
    ball(c, 20, -176, 4, mat(p, "#d82d17", 0.2));
    ball(c, 78, -176, 4, mat(p, "#d82d17", 0.2));
    // sub meter
    slab(c, 112, -146, 0, 0, white);
    slab(c, 12, -4, 0, 0, white);
    // breakers
    for (let i = 0; i < 9; i++) {
      const bx = -90 + i * 28;
      slab(c, bx, -40, 20, 30, mat(p, "#e8e4da", 0.2), 1);
      px(c, "#10131a", bx + 6, -36, 8, 14);
      px(
        c,
        i % 3 === 0 ? mat(p, "#d82d17", 0.2)[2] : mat(p, "#47a639", 0.2)[2],
        bx + 6,
        i & 1 ? -36 : -26,
        8,
        4,
      );
    }
    cloudData(c, p, 10, -212);
  },
  live(c, p, v) {
    const t = v.t;
    shadow(c, p, 0, 0, 130, 6);
    // meter LCD
    const kwh = String(123 + Math.floor(t * 1.5)).slice(-3);
    drawText(c, kwh, -86, -134, "#c8e8a8", 3);
    drawText(c, "KWH", -86, -108, "#a8c888", 1);
    px(c, Math.floor(t * 2) & 1 ? p.red : mat(p, "#4a5368")[2], -92, -72, 5, 5);
    readingPing(c, p, t, -61, -100);
    px(c, p.green, -80, -72, 5, 5);
    // gateway LEDs
    for (let i = 0; i < 4; i++)
      px(c, cyc(p, Math.floor(t * 3 + i * 1.7)), 12 + i * 12, -138, 6, 6);
    // sub meter
    const white = mat(p, "#f4f1ea", 0.2);
    slab(c, 112, -146, 54, 94, white, 2);
    slab(c, 118, -140, 42, 22, mat(p, "#2c3a30", 0.1), 1);
    drawText(
      c,
      String(17 + (Math.floor(t * 0.7) % 80)),
      124,
      -136,
      "#c8e8a8",
      2,
    );
    px(c, p.green, 124, -108, 4, 4);
    // wires: power in yellow on the bottom, data in blue between devices
    const pw: Pt[] = [
      [-70, -8],
      [-70, -52],
    ];
    wire(c, "#10131a", pw);
    pulse(
      c,
      p.yellow,
      [
        [-70, 4],
        [-70, -52],
        [-40, -52],
      ],
      t,
      3,
      0.4,
      5,
    );
    pulse(
      c,
      p.yellow,
      [
        [-110, -30],
        [110, -30],
      ],
      t,
      4,
      0.3,
      5,
    );
    const d1: Pt[] = [
      [-24, -100],
      [-14, -100],
      [-14, -120],
      [-2, -120],
    ];
    const d2: Pt[] = [
      [98, -120],
      [104, -120],
      [104, -100],
      [112, -100],
    ];
    for (const d of [d1, d2]) {
      wire(c, mat(p, "#4398cd", 0.15)[2], d);
      pulse(c, p.blue, d, t, 1, 0.5, 4);
    }
    glow(c, p, 0, -96, 120, p.glow, 0.025);
    const wan: Pt[] = [
      [20, -184],
      [20, -222],
      [10, -226],
    ];
    dotted(c, p.blue, 20, -184, 10, -226);
    pulse(c, p.blue, wan, t, 2, 0.35, 6);
    label(c, p, "WAN", 74, -218, 2 * v.tk);
    label(c, p, "METER", -62, 38, v.tk);
    label(c, p, "GATEWAY", 48, 38, v.tk);
    label(c, p, "SUB", 138, 38, v.tk);
  },
};

/* ---------- 5: protocol frame ---------- */

const FIELDS: [
  string,
  number,
  "red" | "blue" | "green" | "yellow" | "steel",
][] = [
  ["HDR", 42, "red"],
  ["ADDR", 58, "blue"],
  ["OBIS", 58, "green"],
  ["VALUE", 96, "yellow"],
  ["CRC", 42, "steel"],
];
const GAP = 4;
const FW = FIELDS.reduce((a, f) => a + f[1] + GAP, GAP);
const FX = -120;

const frame: Station = {
  bounds: [-200, -260, 260, 8],
  still(c, p) {
    const wood = mat(p, "#9a6a3e");
    slab(c, FX + 14, -112, 10, 112, wood, 2);
    slab(c, FX + FW - 24, -112, 10, 112, wood, 2);
    line(c, wood[2], FX + 24, -20, FX + 56, -86, 4);
    line(c, wood[2], FX + FW - 24, -20, FX + FW - 56, -86, 4);
    const bezel = mat(p, "#2b3558", 0.1);
    slab(c, FX - 8, -232, FW + 16, 132, bezel, 3);
    px(c, p.night ? "#080c28" : "#10163a", FX, -224, FW, 116);
    // the meter that sends it
    const white = mat(p, "#f4f1ea", 0.2);
    slab(c, -184, -50, 38, 50, white, 2);
    px(c, "#2c3a30", -179, -44, 28, 16);
    px(c, "#10131a", -179, -22, 28, 3);
    px(c, p.green, -179, -14, 5, 5);
    setFor(p);
  },
  live(c, p, v) {
    const t = v.t;
    shadow(c, p, FX + FW / 2, 0, 140, 5);
    shadow(c, p, -165, 0, 28);
    const active = Math.floor(t * 1.1) % FIELDS.length;
    let x = FX + GAP;
    FIELDS.forEach(([name, w, k], i) => {
      const base = k === "steel" ? "#8d97a8" : p[k];
      const r = mat(p, base, 0.12);
      const on = i === active;
      slab(c, x, -190, w, 44, r, 3);
      if (on) {
        px(c, "#ffffff", x - 2, -192, w + 4, 2);
        px(c, "#ffffff", x - 2, -146, w + 4, 2);
        px(c, "#ffffff", x - 2, -192, 2, 48);
        px(c, "#ffffff", x + w, -192, 2, 48);
        glow(c, p, x + w / 2, -168, 60, base, 0.04);
      }
      drawText(
        c,
        name,
        (x + (w - textWidth(name, 1)) / 2) | 0,
        -208,
        on ? "#ffffff" : "#8b98c0",
        1,
      );
      for (let rr = 0; rr < 3; rr++)
        for (let b = 0; b < (w - 4) >> 3; b++) {
          const bit =
            hash(i * 97 + rr * 13 + b + Math.floor(t * 2) * (on ? 5 : 0)) > 0.5;
          px(
            c,
            bit ? base : mix(base, "#080c28", 0.7),
            x + 4 + b * 8,
            -134 + rr * 8,
            5,
            5,
          );
        }
      x += w + GAP;
    });
    const link: Pt[] = [
      [-165, -52],
      [-165, -120],
      [FX - 8, -160],
    ];
    for (let i = 1; i < link.length; i++)
      dotted(
        c,
        p.blue,
        link[i - 1]![0],
        link[i - 1]![1],
        link[i]![0],
        link[i]![1],
      );
    pulse(c, p.blue, link, t, 2, 0.4, 6);
    readingPing(c, p, t, -165, -25);
    glow(c, p, 20, -170, 150, p.blue, 0.015);
    label(c, p, "ONE READING", 20, 38, v.tk);
    label(c, p, "METER", -165, 38, v.tk);
    drawLamp(c, p, 205, 0);
  },
};

/* ---------- 6: contact ---------- */

/** Signpost boards in station space; the last two are links (see `main.ts`). */
export const BOARDS = (
  [
    ["HELLO", -122, "#edcb1f", ""],
    ["BOOK A CALL", -98, "#4398cd", "https://cal.com/nagel"],
    ["LINKEDIN", -74, "#47a639", "https://www.linkedin.com/in/philippnagel/"],
  ] as const
).map(([text, y, color, href], i) => {
  const w = textWidth(text, 2) + 16;
  return { text, y, color, href, x: 70 - w / 2 + (i - 1) * 6, w, h: 20 };
});

const contact: Station = {
  bounds: [-200, -280, 300, 8],
  still(c, p) {
    const set = setFor(p);
    blit(c, set.trees[2]!, -170, 2);
    blit(c, set.trees[1]!, 250, 2);
    // flag pole
    const m = mat(p, "#d8dde6", 0.2);
    slab(c, -64, -200, 5, 200, m, 1);
    ball(c, -61, -204, 5, mat(p, "#edcb1f", 0.2));
    // signpost with boards
    const wood = mat(p, "#9a6a3e");
    slab(c, 66, -130, 8, 130, wood, 2);
    BOARDS.forEach((b, i) => {
      slab(c, b.x, b.y, b.w, b.h, mat(p, b.color, 0.2), 2);
      drawText(c, b.text, b.x + 8, b.y + 3, i === 0 ? "#2a1a08" : "#ffffff", 2);
    });
    // bench
    slab(c, 120, -22, 70, 8, wood, 1);
    slab(c, 120, -44, 70, 6, wood, 1);
    slab(c, 124, -22, 6, 22, wood, 1);
    slab(c, 180, -22, 6, 22, wood, 1);
    slab(c, 124, -44, 6, 22, wood, 1);
    slab(c, 180, -44, 6, 22, wood, 1);
    // mailbox
    slab(c, 214, -48, 6, 48, wood, 1);
    const mb = mat(p, "#4398cd", 0.2);
    slab(c, 196, -78, 46, 32, mb, 2);
    px(c, mb[1], 196, -62, 46, 3);
    px(c, "#10131a", 232, -70, 8, 14);
    slab(c, 244, -90, 4, 24, mat(p, "#d82d17", 0.2), 1);
    slab(c, 238, -90, 10, 8, mat(p, "#d82d17", 0.2), 1);
  },
  live(c, p, v) {
    const t = v.t;
    shadow(c, p, -61, 0, 14);
    shadow(c, p, 70, 0, 20);
    shadow(c, p, 155, 0, 40, 5);
    // waving flag
    const flag = mat(p, "#d82d17", 0.18);
    for (let x = 0; x < 52; x++) {
      const wv = Math.sin(t * 4 - x * 0.18) * (2 + x * 0.06);
      const y = -196 + wv;
      px(c, x % 8 < 4 ? flag[2] : flag[3], -58 + x, y, 1, 30);
      px(c, flag[1], -58 + x, y + 28, 1, 2);
    }
    if (p.night) {
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.3 + k * 0.33) % 1;
        const bx = [-110, 110, 220][k]!;
        const by = [-210, -240, -200][k]!;
        const col = cyc(p, Math.floor(t * 0.3 + k * 0.33) + k);
        if (u < 0.2) {
          px(c, "#fff6c0", bx, by + (0.2 - u) * 520, 3, 6);
          px(c, col, bx, by + (0.2 - u) * 520 + 6, 2, 8);
        } else {
          const r = (u - 0.2) * 96;
          for (let a = 0; a < 16; a++) {
            const ang = (a / 16) * Math.PI * 2;
            if (u < 0.92)
              px(c, col, bx + Math.cos(ang) * r, by + Math.sin(ang) * r, 3, 3);
            for (let tr = 1; tr < 4; tr++)
              px(
                c,
                mix(col, "#02041a", 0.25 * tr),
                bx + Math.cos(ang) * r * (1 - tr * 0.1),
                by + Math.sin(ang) * r * (1 - tr * 0.1) + tr * 2,
                2,
                2,
              );
          }
          glow(c, p, bx, by, 60 * (1 - u), col, 0.03);
        }
      }
    } else {
      for (let k = 0; k < 4; k++) {
        const x = [-110, 30, 150, 230][k]! + Math.sin(t * 0.8 + k * 2) * 10;
        const y = -90 - ((t * 14 + k * 70) % 220);
        const col = tone(p, cyc(p, k), 0.1);
        line(c, "#4a5368", x, y + 14, x + Math.sin(t + k) * 3, y + 40);
        ball(c, x, y, 13, ramp(col), 10);
        px(c, ramp(col)[1], x - 2, y + 13, 4, 3);
      }
    }
    glow(c, p, 70, -50, 60);
    label(c, p, "SAY HELLO", 130, 38, v.tk);
    drawLamp(c, p, -20, 0);
  },
};

export const STATION_ART: Station[] = [
  hello,
  grid,
  bess,
  datacenter,
  house,
  cabinet,
  frame,
  contact,
];

/** A part of a station that explains itself on hover or tap. Station space, like the art. */
export interface Hotspot {
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  text: string;
}

if (STATION_ART.length !== STATIONS.length)
  throw new Error("one scene per station");

const HOTSPOTS: Hotspot[][] = [
  [],
  [
    {
      x: -24,
      y: -72,
      w: 72,
      h: 72,
      name: "Control building",
      text: "Protection and remote control for the substation.",
    },
    {
      x: 78,
      y: -68,
      w: 80,
      h: 68,
      name: "Transformer (TRAFO)",
      text: "Steps high voltage down for the local network.",
    },
    {
      x: 66,
      y: -98,
      w: 89,
      h: 98,
      name: "Gantry",
      text: "Where the high-voltage lines enter the yard.",
    },
    {
      x: 208,
      y: -124,
      w: 30,
      h: 124,
      name: "Pole line",
      text: "Carries power on to the neighbourhood.",
    },
  ],
  [
    ...UNITS.map((x): Hotspot => ({
      x,
      y: -76,
      w: 84,
      h: 76,
      name: "Battery container",
      text: "Racks of cells that charge at the surplus and discharge at the peak.",
    })),
    {
      x: 236,
      y: -70,
      w: 36,
      h: 70,
      name: "Power conversion (PCS)",
      text: "Converts DC from the battery to AC for the grid, and back.",
    },
    {
      x: 292,
      y: -66,
      w: 48,
      h: 66,
      name: "Transformer (TRAFO)",
      text: "Lifts the site's output to medium voltage.",
    },
  ],
  [
    {
      x: 0,
      y: -96,
      w: 260,
      h: 96,
      name: "Server hall",
      text: "Rows of racks. AI training can pull hundreds of megawatts at once, around the clock.",
    },
    {
      x: 4,
      y: -114,
      w: 252,
      h: 18,
      name: "Cooling",
      text: "Nearly all the power ends up as heat. Roof coolers push it out; it could also warm nearby buildings.",
    },
    {
      x: -130,
      y: -66,
      w: 94,
      h: 66,
      name: "Transformers (TRAFO)",
      text: "Step the grid connection down to what the hall uses.",
    },
    {
      x: 284,
      y: -46,
      w: 52,
      h: 46,
      name: "UPS",
      text: "Batteries that bridge a grid dip until the generators start.",
    },
    {
      x: 346,
      y: -58,
      w: 44,
      h: 58,
      name: "Backup generator (GEN)",
      text: "Starts if the grid fails.",
    },
    {
      x: -192,
      y: -112,
      w: 30,
      h: 112,
      name: "Grid connection",
      text: "New connections can take years, so operators pair data centers with batteries and flexible load.",
    },
  ],
  [
    {
      x: -26,
      y: -122,
      w: 86,
      h: 36,
      name: "Rooftop PV",
      text: "Makes power at home, and sometimes sends it back.",
    },
    {
      x: 40,
      y: -52,
      w: 18,
      h: 28,
      name: "Meter",
      text: "Counts what the house takes and gives. The reading goes out as data.",
    },
    {
      x: 130,
      y: -56,
      w: 108,
      h: 56,
      name: "Electric vehicle (EV)",
      text: "A flexible load: it can charge when power is cheap.",
    },
    {
      x: 262,
      y: -76,
      w: 14,
      h: 76,
      name: "Charger",
      text: "Talks to the car and the home energy manager.",
    },
    {
      x: -70,
      y: -154,
      w: 190,
      h: 154,
      name: "Home",
      text: "One metering point on the distribution network (DSO).",
    },
  ],
  [
    {
      x: -98,
      y: -146,
      w: 74,
      h: 94,
      name: "Smart meter",
      text: "Measures consumption and other metrics and hands the values to the gateway.",
    },
    {
      x: -2,
      y: -148,
      w: 100,
      h: 94,
      name: "Gateway (GW)",
      text: "Signs and encrypts readings, then sends them over the wide-area link.",
    },
    {
      x: -90,
      y: -40,
      w: 252,
      h: 30,
      name: "Breakers",
      text: "Protect each circuit in the cabinet.",
    },
  ],
  [
    {
      x: -184,
      y: -50,
      w: 38,
      h: 50,
      name: "Meter",
      text: "The source of the reading shown in the frame.",
    },
    {
      x: FX - 8,
      y: -232,
      w: FW + 16,
      h: 132,
      name: "Protocol frame",
      text: "One reading, field by field: header, address, OBIS code, value, checksum.",
    },
  ],
  [],
];

/** The explainer under a point in station `i`'s space, if any. Later (smaller, nested) entries win. */
export function hotspotAt(
  i: number,
  x: number,
  y: number,
): Hotspot | undefined {
  const hits = (HOTSPOTS[i] ?? []).filter(
    (h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h,
  );
  return hits.sort((a, b) => a.w * a.h - b.w * b.h)[0];
}

const baked = new WeakMap<Pal, Sprite[]>();

/** Draws station `i` with its middle at screen x `cx` and ground line `gy`. */
export function drawStation(
  c: C,
  p: Pal,
  v: View,
  i: number,
  cx: number,
  gy: number,
) {
  let set = baked.get(p);
  if (!set) baked.set(p, (set = []));
  const st = STATION_ART[i]!;
  const sp = (set[i] ??= bake(...st.bounds, (cc) => st.still(cc, p)));
  c.save();
  c.translate(cx, gy);
  blit(c, sp, 0, 0);
  st.live(c, p, v);
  c.restore();
}
