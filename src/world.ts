import { drawText, eachTextPixel, textWidth } from "./font";
import { mix, type Pal } from "./palette";
import { ART_AHEAD, STATIONS } from "./walk";

type C = CanvasRenderingContext2D;

export interface View {
  /** world x of the left screen edge */
  camX: number;
  W: number;
  H: number;
  /** y of the ground line */
  gy: number;
  t: number;
}

/** Text drawn on the canvas, kept here so tests can check the font covers it. */
export const CANVAS_TEXT = [
  "PHILIPP",
  "NAGEL",
  "GRID TO PACKET",
  "WIND",
  "STATION",
  "TRAFO",
  "MARKET",
  "HOUSE",
  "METER",
  "EV",
  "DSO",
  "GATEWAY",
  "SUB",
  "WAN",
  "KWH",
  "GW",
  "HDR",
  "ADDR",
  "OBIS",
  "VALUE",
  "CRC",
  "ONE READING",
  "HELLO",
  "0123456789",
];

/** Deterministic noise in [0, 1). */
export const hash = (n: number) => {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

const px = (c: C, col: string, x: number, y: number, w = 1, h = 1) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function line(
  c: C,
  col: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let i = 0; i <= n; i++)
    px(c, col, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n);
}

function dotted(
  c: C,
  col: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let i = 0; i <= n; i += 3)
    px(c, col, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n);
}

type Pt = [number, number];

/** Point at fraction `u` of the way along a polyline. */
function along(pts: Pt[], u: number): Pt {
  const lens = pts
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - pts[i]![0], p[1] - pts[i]![1]));
  let d = u * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]!) {
      const k = lens[i]! ? d / lens[i]! : 0;
      return [
        pts[i]![0] + (pts[i + 1]![0] - pts[i]![0]) * k,
        pts[i]![1] + (pts[i + 1]![1] - pts[i]![1]) * k,
      ];
    }
    d -= lens[i]!;
  }
  return pts[pts.length - 1]!;
}

/** A wire with squares travelling along it. */
function wire(
  c: C,
  wireCol: string,
  pulseCol: string,
  pts: Pt[],
  t: number,
  n = 2,
  speed = 0.35,
) {
  for (let i = 1; i < pts.length; i++)
    line(c, wireCol, pts[i - 1]![0], pts[i - 1]![1], pts[i]![0], pts[i]![1]);
  for (let k = 0; k < n; k++) {
    const [x, y] = along(pts, (t * speed + k / n) % 1);
    px(c, pulseCol, x - 1, y - 1, 3, 3);
  }
}

function disc(c: C, col: string, x: number, y: number, r: number) {
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.6));
    px(c, col, x - w, y + dy, w * 2 + 1, 1);
  }
}

/** Soft light pool; night only. */
function glow(c: C, p: Pal, x: number, y: number, r: number) {
  if (!p.night) return;
  c.save();
  c.globalAlpha = 0.045;
  for (let k = r; k > 3; k -= 3) disc(c, p.glow, x, y, k);
  c.restore();
}

const cycle = (p: Pal, i: number) => [p.red, p.blue, p.green, p.yellow][i & 3]!;

/** Calls `fn(cell, screenX)` for each cell of width `cell` visible on a layer moving at `f` x camera speed. */
function cells(
  v: View,
  f: number,
  cell: number,
  fn: (i: number, x: number) => void,
) {
  const o = v.camX * f;
  const i0 = Math.floor(o / cell) - 1;
  const i1 = Math.floor((o + v.W) / cell) + 1;
  for (let i = i0; i <= i1; i++) fn(i, Math.round(i * cell - o));
}

/* ---------- sky ---------- */

function sky(c: C, p: Pal, v: View) {
  const n = p.sky.length;
  const bh = Math.ceil(v.gy / n);
  for (let i = 0; i < n; i++) px(c, p.sky[i]!, 0, i * bh, v.W, bh + 1);
  // checker dither on the band seams
  for (let i = 1; i < n; i++)
    for (let x = 0; x < v.W; x += 2) {
      px(c, p.sky[i]!, x, i * bh - 1, 1, 1);
      px(c, p.sky[i - 1]!, x + 1, i * bh, 1, 1);
    }

  // sun or moon, barely moving
  const sx = Math.round(v.W * 0.88 - v.camX * 0.02);
  if (p.night) {
    disc(c, "#f1ecc8", sx, 30, 9);
    disc(c, p.sky[1]!, sx + 5, 27, 8);
    glow(c, { ...p, glow: "#aab8ff" }, sx, 30, 26);
  } else {
    disc(c, "#ffe27a", sx, 30, 11);
    disc(c, "#fff6c2", sx, 30, 8);
    glow(c, p, sx, 30, 0);
  }

  if (p.night) {
    cells(v, 0.1, 44, (i, x) => {
      for (let k = 0; k < 3; k++) {
        const h = hash(i * 31 + k);
        if ((v.t * 1.1 + h * 9) % 3 > 2.4) continue;
        const col = h > 0.8 ? cycle(p, Math.floor(h * 40)) : p.white;
        px(
          c,
          col,
          x + hash(i * 31 + k + 100) * 44,
          4 + hash(i * 31 + k + 200) * (v.gy - 40),
          2,
          2,
        );
      }
    });
  } else {
    cells(v, 0.12, 130, (i, x) => {
      const h = hash(i + 700);
      const cx = x + h * 100 + ((v.t * 2) % 260);
      const cy = 10 + hash(i + 800) * (v.gy * 0.5);
      const wx = ((cx + 130) % (v.W + 260)) - 130;
      cloud(c, p, wx, cy, 0.7 + h * 0.6);
    });
  }
}

function cloud(c: C, p: Pal, x: number, y: number, k: number) {
  const w = Math.round(34 * k);
  px(c, p.white, x + 6, y, w - 12, 5);
  px(c, p.white, x, y + 4, w, 6);
  px(c, p.white, x + 10, y - 4, Math.round(14 * k), 6);
  px(c, mix(p.white, p.sky[3]!, 0.35), x + 1, y + 9, w - 2, 1);
}

/* ---------- far and mid layers ---------- */

function turbine(
  c: C,
  col: string,
  x: number,
  gy: number,
  h: number,
  t: number,
  phase: number,
  len: number,
) {
  px(c, col, x, gy - h, 2, h);
  const hx = x + 1;
  const hy = gy - h;
  for (let b = 0; b < 3; b++) {
    const a = t * 1.1 + phase + (b * Math.PI * 2) / 3;
    line(c, col, hx, hy, hx + Math.cos(a) * len, hy + Math.sin(a) * len);
  }
  px(c, col, hx - 1, hy - 1, 3, 3);
}

function far(c: C, p: Pal, v: View) {
  cells(v, 0.22, 90, (i, x) => {
    const h = 14 + hash(i + 3) * 26;
    px(c, p.hill, x - 20, v.gy - h, 140, h);
    px(c, p.hill, x + 10, v.gy - h - 6, 70, 6);
  });
  cells(v, 0.3, 24, (i, x) => {
    const h = 8 + Math.floor(hash(i + 5) * 30);
    const w = 14 + Math.floor(hash(i + 9) * 9);
    px(c, p.far, x, v.gy - h, w, h);
    if (hash(i + 13) > 0.72) px(c, p.far, x + (w >> 1), v.gy - h - 6, 2, 6);
    if (p.night)
      for (let k = 0; k < 3; k++)
        if (hash(i * 7 + k) > 0.55)
          px(c, p.glow, x + 2 + (k % 2) * 6, v.gy - h + 3 + k * 6, 2, 2);
  });
  cells(v, 0.3, 190, (i, x) => {
    if (hash(i + 77) > 0.6) return;
    turbine(c, p.far, x + 40, v.gy, 44, v.t, hash(i) * 6, 15);
  });
}

function tree(c: C, p: Pal, x: number, gy: number, h: number, col: string) {
  px(c, mix(p.steelDark, p.ground, 0.4), x, gy - h * 0.4, 2, h * 0.4);
  const w = Math.round(h * 0.55);
  px(c, col, x + 1 - (w >> 1), gy - h, w, Math.round(h * 0.65));
  px(c, col, x - (w >> 1), gy - h + 2, w + 2, Math.round(h * 0.5));
}

function pylon(c: C, col: string, x: number, gy: number) {
  line(c, col, x - 6, gy, x - 1, gy - 44);
  line(c, col, x + 6, gy, x + 1, gy - 44);
  line(c, col, x - 5, gy - 8, x + 5, gy - 24);
  line(c, col, x + 5, gy - 8, x - 5, gy - 24);
  px(c, col, x - 8, gy - 44, 18, 2);
  px(c, col, x - 5, gy - 36, 12, 2);
}

function mid(c: C, p: Pal, v: View) {
  const green = mix(p.green, p.hill, p.night ? 0.7 : 0.35);
  cells(v, 0.55, 52, (i, x) => {
    const r = hash(i + 50);
    if (r < 0.6) tree(c, p, x + r * 40, v.gy, 12 + Math.floor(r * 14), green);
  });
  const wireCol = mix(p.steelDark, p.hill, 0.3);
  cells(v, 0.55, 210, (i, x) => {
    pylon(c, wireCol, x, v.gy);
    for (const dy of [0, 12]) {
      const pts: Pt[] = [];
      for (let s = 0; s <= 210; s += 6) {
        const u = s / 210;
        pts.push([x + s, v.gy - 43 + dy * 0.2 + 12 * 4 * u * (1 - u) * 0.6]);
      }
      for (let k = 1; k < pts.length; k++)
        line(
          c,
          wireCol,
          pts[k - 1]![0],
          pts[k - 1]![1],
          pts[k]![0],
          pts[k]![1],
        );
      if (dy === 0) {
        const [qx, qy] = along(pts, (v.t * 0.25 + hash(i) * 3) % 1);
        px(c, p.yellow, qx - 1, qy - 1, 3, 3);
      }
    }
  });
}

/* ---------- ground ---------- */

const nearStation = (wx: number, d: number) =>
  STATIONS.some((s) => Math.abs(s + ART_AHEAD - wx) < d);

function ground(c: C, p: Pal, v: View) {
  px(c, p.ground, 0, v.gy, v.W, v.H - v.gy);
  px(c, p.line, 0, v.gy, v.W, 1);
  for (let y = v.gy + 11; y < v.H; y += 7) {
    const off = Math.floor(y * 13) % 11;
    for (let x = -((v.camX + off) % 11); x < v.W; x += 11)
      px(c, p.dot, x, y, 2, 1);
  }
  // the path Philipp walks on
  px(c, p.path, 0, v.gy + 2, v.W, 7);
  px(c, mix(p.path, p.ground, 0.4), 0, v.gy + 9, v.W, 1);
  for (let x = -(Math.floor(v.camX) % 26); x < v.W; x += 26)
    px(c, mix(p.path, p.ground, 0.25), x, v.gy + 5, 9, 1);

  cells(v, 1, 56, (i, x) => {
    const r = hash(i + 900);
    const wx = i * 56 + r * 40;
    if (r < 0.15 || nearStation(wx, 120)) return;
    const sx = x + r * 40;
    if (r < 0.6) {
      px(c, p.green, sx, v.gy - 4, 1, 4);
      px(c, cycle(p, Math.floor(r * 100)), sx - 1, v.gy - 7, 3, 3);
      px(c, p.yellow, sx, v.gy - 6, 1, 1);
    } else if (r < 0.85)
      tree(c, p, sx, v.gy, 16 + Math.floor((r - 0.6) * 40), p.green);
    else px(c, p.steel, sx, v.gy - 4, 6, 4);
  });
}

function foreground(c: C, p: Pal, v: View) {
  cells(v, 1.6, 64, (i, x) => {
    const r = hash(i + 1300);
    for (let k = 0; k < 3; k++)
      px(c, p.fg, x + r * 40 + k * 3, v.H - 4 - ((k * 5 + i) % 6), 2, 12);
    if (r > 0.8) {
      px(c, p.fg, x + 20, v.H - 26, 3, 30);
      px(c, p.fg, x + 12, v.H - 20, 19, 2);
    }
  });
}

/* ---------- stations ---------- */

const label = (c: C, p: Pal, s: string, x: number, y: number, col = p.ink) =>
  drawText(c, s, x - textWidth(s) / 2, y, col);

function dataCloud(c: C, p: Pal, x: number, y: number, name: string) {
  px(c, p.blue, x - 14, y + 6, 28, 8);
  px(c, p.blue, x - 9, y, 18, 8);
  px(c, p.blue, x + 2, y - 3, 10, 6);
  px(c, mix(p.blue, "#ffffff", 0.35), x - 9, y, 18, 1);
  label(c, p, name, x, y - 12);
}

/** Big grey block title with a few coloured pixels, like a pixel logo. */
function blockText(
  c: C,
  p: Pal,
  s: string,
  x: number,
  y: number,
  k: number,
  t: number,
) {
  const base = p.night ? "#c9d0e6" : "#3a4256";
  const w = textWidth(s, k);
  eachTextPixel(s, (gx, gy) => {
    const h = hash(gx * 17 + gy * 5 + s.length * 101);
    const col = h < 0.1 ? cycle(p, Math.floor(t * 2 + h * 40)) : base;
    px(c, col, x - w / 2 + gx * k, y + gy * k, k, k);
  });
}

function stationHello(c: C, p: Pal, cx: number, gy: number, t: number) {
  blockText(c, p, "PHILIPP", cx, gy - 108, 3, t);
  blockText(c, p, "NAGEL", cx, gy - 82, 3, t);
  label(c, p, "GRID TO PACKET", cx, gy - 52);
}

function stationGrid(c: C, p: Pal, cx: number, gy: number, t: number) {
  const hubs: Pt[] = [
    [cx - 69, gy - 62],
    [cx - 33, gy - 48],
  ];
  turbine(c, p.white, cx - 70, gy, 62, t, 0, 20);
  turbine(c, p.white, cx - 34, gy, 48, t, 1.7, 15);
  const wc = p.steelDark;
  // substation
  px(c, p.steel, cx, gy - 22, 34, 22);
  px(c, p.steelDark, cx, gy - 22, 34, 3);
  for (let i = 0; i < 4; i++) px(c, p.yellow, cx + 3 + i * 8, gy - 9, 4, 3);
  px(c, p.ink, cx + 12, gy - 18, 10, 6);
  // transformer
  px(c, p.steelDark, cx + 44, gy - 4, 22, 4);
  px(c, p.blue, cx + 44, gy - 20, 22, 16);
  for (let k = 0; k < 3; k++) px(c, p.yellow, cx + 47 + k * 7, gy - 27, 3, 7);
  wire(c, wc, p.yellow, [hubs[0]!, [cx + 6, gy - 22]], t, 2, 0.3);
  wire(c, wc, p.yellow, [hubs[1]!, [cx + 12, gy - 22]], t, 2, 0.3);
  wire(
    c,
    wc,
    p.yellow,
    [
      [cx + 34, gy - 15],
      [cx + 44, gy - 15],
    ],
    t,
    1,
  );
  px(c, p.steelDark, cx + 118, gy - 40, 3, 40);
  wire(
    c,
    wc,
    p.yellow,
    [
      [cx + 66, gy - 28],
      [cx + 119, gy - 38],
    ],
    t,
    2,
    0.3,
  );
  glow(c, p, cx + 17, gy - 24, 18);
  // data layer
  dataCloud(c, p, cx + 30, gy - 100, "MARKET");
  dotted(c, p.blue, cx + 17, gy - 22, cx + 30, gy - 86);
  const u = (t * 0.4) % 1;
  px(c, p.blue, cx + 17 + 13 * u - 1, gy - 22 - 64 * u - 1, 3, 3);
  label(c, p, "WIND", cx - 52, gy + 14);
  label(c, p, "STATION", cx + 17, gy + 14);
  label(c, p, "TRAFO", cx + 60, gy + 22);
}

function stationHouse(c: C, p: Pal, cx: number, gy: number, t: number) {
  const hx = cx - 20;
  px(c, p.white, hx, gy - 34, 70, 34);
  px(c, mix(p.white, p.steelDark, 0.25), hx + 56, gy - 34, 14, 34);
  // roof
  for (let r = 0; r < 20; r++)
    px(c, p.red, cx + 15 - (80 - r * 4) / 2, gy - 34 - r, 80 - r * 4, 1);
  px(c, p.blue, cx + 4, gy - 46, 22, 8);
  px(c, p.red, cx + 11, gy - 46, 1, 8);
  px(c, p.red, cx + 18, gy - 46, 1, 8);
  px(c, p.red, cx + 4, gy - 42, 22, 1);
  if (Math.floor(t * 1.5) & 1) px(c, p.yellow, cx + 8, gy - 45, 2, 2);
  // door, window
  px(c, p.yellow, hx + 6, gy - 17, 10, 17);
  px(c, p.steelDark, hx + 13, gy - 9, 2, 2);
  px(c, p.night ? p.glow : p.blue, hx + 26, gy - 25, 14, 11);
  px(c, p.white, hx + 32, gy - 25, 2, 11);
  px(c, p.white, hx + 26, gy - 20, 14, 2);
  glow(c, p, hx + 33, gy - 20, 20);
  glow(c, p, hx + 11, gy - 8, 16);
  // meter box
  const mx = cx + 40;
  px(c, p.steelDark, mx, gy - 21, 9, 12);
  px(c, Math.floor(t * 2) & 1 ? p.green : p.steel, mx + 3, gy - 18, 3, 3);
  px(c, p.ink, mx + 2, gy - 13, 5, 2);
  // EV and charger
  const ex = cx + 72;
  px(c, p.red, ex, gy - 11, 36, 8);
  px(c, p.red, ex + 8, gy - 18, 20, 7);
  px(c, p.blue, ex + 10, gy - 17, 7, 5);
  px(c, p.blue, ex + 19, gy - 17, 7, 5);
  for (const wx of [ex + 4, ex + 24]) {
    px(c, p.ink, wx, gy - 6, 8, 6);
    px(c, p.steel, wx + 3, gy - 4, 2, 2);
  }
  px(c, p.green, ex + 44, gy - 24, 7, 24);
  px(c, p.yellow, ex + 46, gy - 20, 3, 6);
  wire(
    c,
    p.steelDark,
    p.yellow,
    [
      [ex + 36, gy - 8],
      [ex + 44, gy - 12],
    ],
    t,
    1,
  );
  // data layer
  dataCloud(c, p, cx + 52, gy - 96, "DSO");
  const link: Pt[] = [
    [mx + 4, gy - 22],
    [mx + 4, gy - 60],
    [cx + 52, gy - 82],
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
  const [qx, qy] = along(link, (t * 0.35) % 1);
  px(c, p.blue, qx - 1, qy - 1, 3, 3);
  label(c, p, "HOUSE", cx + 5, gy + 14);
  label(c, p, "METER", cx + 48, gy + 22);
  label(c, p, "EV", ex + 30, gy + 14);
}

function stationCabinet(c: C, p: Pal, cx: number, gy: number, t: number) {
  const x0 = cx - 30;
  px(c, p.steelDark, x0, gy - 76, 112, 76);
  px(
    c,
    mix(p.steelDark, p.ink, p.night ? 0.5 : 0.35),
    x0 + 4,
    gy - 68,
    104,
    64,
  );
  for (let i = 0; i < 14; i++)
    px(c, i & 1 ? p.yellow : p.ink, x0 + i * 8, gy - 76, 8, 4);
  // meter
  px(c, p.white, cx - 22, gy - 62, 34, 42);
  px(c, p.ink, cx - 19, gy - 58, 28, 10);
  const kwh = String(1234 + Math.floor(t * 2)).slice(-4);
  drawText(c, kwh, cx - 17, gy - 56, p.green);
  drawText(c, "KWH", cx - 19, gy - 42, p.steelDark);
  px(c, Math.floor(t * 2) & 1 ? p.red : p.steel, cx - 19, gy - 32, 4, 4);
  px(c, p.steelDark, cx - 6, gy - 30, 14, 6);
  // gateway
  px(c, p.blue, cx + 18, gy - 62, 32, 24);
  for (let i = 0; i < 4; i++)
    px(
      c,
      cycle(p, Math.floor(t * 3 + i * 1.7)),
      cx + 21 + i * 6,
      gy - 58,
      3,
      3,
    );
  drawText(c, "GW", cx + 24, gy - 48, p.white);
  line(c, p.steelDark, cx + 34, gy - 62, cx + 34, gy - 82);
  px(c, p.red, cx + 32, gy - 84, 5, 3);
  // sub meter
  px(c, p.white, cx + 58, gy - 62, 24, 24);
  px(c, p.ink, cx + 61, gy - 58, 18, 7);
  drawText(c, "17", cx + 64, gy - 57, p.yellow);
  // links
  wire(
    c,
    p.steelDark,
    p.blue,
    [
      [cx + 12, gy - 46],
      [cx + 18, gy - 46],
    ],
    t,
    1,
  );
  wire(
    c,
    p.steelDark,
    p.blue,
    [
      [cx + 50, gy - 46],
      [cx + 58, gy - 46],
    ],
    t,
    1,
  );
  wire(
    c,
    p.steelDark,
    p.yellow,
    [
      [cx - 26, gy - 12],
      [cx + 78, gy - 12],
    ],
    t,
    3,
    0.4,
  );
  glow(c, p, cx + 30, gy - 40, 40);
  dataCloud(c, p, cx + 34, gy - 118, "WAN");
  dotted(c, p.blue, cx + 34, gy - 84, cx + 34, gy - 104);
  px(c, p.blue, cx + 33, gy - 84 - ((t * 14) % 20), 3, 3);
  label(c, p, "METER", cx - 5, gy + 14);
  label(c, p, "GATEWAY", cx + 34, gy + 22);
  label(c, p, "SUB", cx + 70, gy + 14);
}

const FIELDS: [
  string,
  number,
  "red" | "blue" | "green" | "yellow" | "steel",
][] = [
  ["HDR", 22, "red"],
  ["ADDR", 28, "blue"],
  ["OBIS", 28, "green"],
  ["VALUE", 46, "yellow"],
  ["CRC", 22, "steel"],
];

function stationFrame(c: C, p: Pal, cx: number, gy: number, t: number) {
  const total = FIELDS.reduce((a, f) => a + f[1] + 2, 0);
  const x0 = Math.round(cx - 20);
  const y = gy - 78;
  px(c, p.ink, x0 - 5, y - 15, total + 8, 2);
  px(c, p.ink, x0 - 5, y + 40, total + 8, 2);
  px(c, p.ink, x0 - 5, y - 15, 2, 57);
  px(c, p.ink, x0 + total + 1, y - 15, 2, 57);
  px(c, p.sky[2]!, x0 - 3, y - 13, total + 4, 53);
  const active = Math.floor(t * 1.2) % FIELDS.length;
  let x = x0;
  FIELDS.forEach(([name, w, k], i) => {
    const col = k === "steel" ? p.steel : p[k];
    px(c, col, x, y, w, 18);
    if (i === active) {
      px(c, p.ink, x - 1, y - 1, w + 2, 1);
      px(c, p.ink, x - 1, y + 18, w + 2, 1);
    }
    drawText(c, name, x + 2, y - 10, i === active ? p.ink : p.dim);
    for (let r = 0; r < 3; r++)
      for (let b = 0; b < (w - 2) >> 2; b++) {
        const on =
          hash(
            i * 97 + r * 13 + b + Math.floor(t * 2) * (i === active ? 5 : 0),
          ) > 0.5;
        px(
          c,
          on ? col : mix(col, p.sky[2]!, 0.6),
          x + 2 + b * 4,
          y + 22 + r * 5,
          2,
          2,
        );
      }
    x += w + 2;
  });
  // the meter sends it
  px(c, p.white, cx - 66, gy - 18, 14, 18);
  px(c, p.ink, cx - 63, gy - 15, 8, 5);
  px(c, Math.floor(t * 3) & 1 ? p.green : p.steel, cx - 63, gy - 8, 3, 3);
  const link: Pt[] = [
    [cx - 59, gy - 19],
    [cx - 59, gy - 50],
    [x0 - 4, gy - 60],
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
  const [qx, qy] = along(link, (t * 0.45) % 1);
  px(c, p.blue, qx - 1, qy - 1, 3, 3);
  label(c, p, "ONE READING", cx + 30, gy + 14);
}

function stationContact(c: C, p: Pal, cx: number, gy: number, t: number) {
  for (let k = 0; k < 3; k++) {
    const u = (t * 0.35 + k * 0.33) % 1;
    const bx = cx + [-40, 30, 100][k]!;
    const by = gy - [78, 98, 82][k]!;
    const col = cycle(p, Math.floor(t * 0.35 + k * 0.33) + k);
    if (u < 0.2) px(c, col, bx, by + (0.2 - u) * 220, 2, 3);
    else
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        const r = (u - 0.2) * 40;
        if (u < 0.9)
          px(c, col, bx + Math.cos(ang) * r, by + Math.sin(ang) * r, 2, 2);
        px(
          c,
          mix(col, p.sky[2]!, 0.5),
          bx + Math.cos(ang) * r * 0.7,
          by + Math.sin(ang) * r * 0.7,
          1,
          1,
        );
      }
  }
  // signpost
  px(c, p.steelDark, cx + 22, gy - 34, 3, 34);
  px(c, p.yellow, cx + 4, gy - 46, 38, 13);
  drawText(c, "HELLO", cx + 8, gy - 43, "#10131a");
  // mailbox
  px(c, p.steelDark, cx + 66, gy - 14, 3, 14);
  px(c, p.blue, cx + 58, gy - 26, 18, 12);
  px(c, mix(p.blue, "#000000", 0.25), cx + 58, gy - 16, 18, 2);
  px(c, p.red, cx + 76, gy - 32, 2, 10);
  px(c, p.red, cx + 72, gy - 32, 5, 3);
}

const STATION_ART = [
  stationHello,
  stationGrid,
  stationHouse,
  stationCabinet,
  stationFrame,
  stationContact,
];

/** Draws the whole world for one frame; the character is drawn by the caller on top of the stations. */
export function drawWorld(c: C, p: Pal, v: View) {
  sky(c, p, v);
  far(c, p, v);
  mid(c, p, v);
  ground(c, p, v);
  STATIONS.forEach((s, i) => {
    const cx = Math.round(s + ART_AHEAD - v.camX);
    if (cx < -180 || cx > v.W + 180) return;
    STATION_ART[i]!(c, p, cx, v.gy, v.t);
  });
}

export const drawForeground = foreground;
