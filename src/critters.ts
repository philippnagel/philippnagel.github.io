import { type C, hash, px, tone } from "./gfx";
import type { Pal } from "./palette";
import { cells, nearStation, type View } from "./scenery";

type Kind = "cat" | "rabbit" | "hedgehog" | "fox";
type Pace = ReturnType<typeof pace> & { startled: number };
const REACH: Record<Kind, number> = {
  cat: 70,
  rabbit: 90,
  hedgehog: 34,
  fox: 110,
};

/** Each animal paces a short stretch of path: walk, rest, walk back, rest. A pure function of time. */
function pace(t: number, i: number, reach: number) {
  const period = 18 + hash(i + 5) * 8;
  const s = ((t + hash(i + 6) * period) % period) / period;
  const live = t > 0; // reduced motion: everyone rests
  if (s < 0.22) return { x: reach * (s / 0.22 - 0.5), dir: 1, moving: live };
  if (s < 0.5) return { x: reach / 2, dir: 1, moving: false };
  if (s < 0.72)
    return { x: reach * (0.5 - (s - 0.5) / 0.22), dir: -1, moving: live };
  return { x: -reach / 2, dir: -1, moving: false };
}

/** Draws in a local frame facing right; `dir` mirrors it. `put` takes right-facing pixel boxes. */
function frame(c: C, p: Pal, ox: number, oy: number, dir: number) {
  return (col: string, x: number, y: number, w = 1, h = 1) =>
    px(c, tone(p, col, 0.3), ox + (dir > 0 ? x : -x - w + 1), oy + y, w, h);
}

const CAT = ["#d98a3a", "#2b2b34", "#8e96a3", "#eeeae0"];

function cat(
  c: C,
  p: Pal,
  v: View,
  i: number,
  ox: number,
  oy: number,
  a: Pace,
) {
  const { dir, moving } = a;
  const put = frame(c, p, ox, oy, dir);
  const fur = CAT[Math.floor(hash(i + 8) * CAT.length)]!;
  const dark = "#1a1a22";
  if (moving) {
    const f = Math.floor(v.t * 8) & 1;
    put(fur, -5, -6, 10, 3);
    put(fur, 4, -8, 4, 4);
    put(fur, 4, -9);
    put(fur, 7, -9);
    put(dark, 7, -7);
    put(fur, -7, -9, 1, 4);
    put(fur, -6, -10, 1, 1);
    put(fur, f ? -4 : -3, -3, 1, 3);
    put(fur, f ? 3 : 2, -3, 1, 3);
    put(fur, f ? -2 : -5, -3, 1, 3);
    put(fur, f ? 1 : 4, -3, 1, 3);
  } else {
    const sw = Math.round(Math.sin(v.t * 2.5 + i));
    put(fur, -2, -7, 5, 7);
    put(fur, -2, -11, 5, 4);
    put(fur, -2, -12);
    put(fur, 2, -12);
    put(dark, -1, -10);
    put(dark, 1, -10);
    put(fur, 3, -1, 4, 1);
    put(fur, 6, -2 + sw, 1, 1);
  }
}

function rabbit(
  c: C,
  p: Pal,
  v: View,
  i: number,
  ox: number,
  oy: number,
  a: Pace,
) {
  const { dir, moving } = a;
  const lift = moving ? Math.round(5 * Math.abs(Math.sin(v.t * 6 + i))) : 0;
  const put = frame(c, p, ox, oy - lift, dir);
  const fur = "#b59a7c";
  put(fur, -3, -4, 6, 4);
  put(fur, 2, -6, 3, 3);
  put(fur, 2, -10, 1, 4);
  put(fur, 4, -9, 1, 3);
  put("#1a1a22", 4, -5);
  put("#f2eee6", -4, -3, 2, 2);
  put(fur, moving && lift > 2 ? -4 : -3, -1, 3, 1);
}

function hedgehog(
  c: C,
  p: Pal,
  v: View,
  i: number,
  ox: number,
  oy: number,
  a: Pace,
) {
  const { dir, moving } = a;
  const put = frame(c, p, ox, oy, dir);
  put("#5a4630", -4, -5, 9, 4);
  for (let k = -4; k <= 4; k += 2) put("#3a2c1c", k, -6);
  for (let k = -3; k <= 3; k += 2) put("#8a6c48", k, -4);
  put("#d9b88a", 5, -3, 3, 2);
  put("#1a1a22", 7, -3);
  const f = moving ? Math.floor(v.t * 6) & 1 : 0;
  put("#d9b88a", f ? -2 : -1, -1, 1, 1);
  put("#d9b88a", f ? 2 : 3, -1, 1, 1);
}

function fox(
  c: C,
  p: Pal,
  v: View,
  i: number,
  ox: number,
  oy: number,
  a: Pace,
) {
  const { dir, moving } = a;
  const put = frame(c, p, ox, oy, dir);
  const f = moving ? Math.floor(v.t * 8) & 1 : 0;
  const red = "#d8682a";
  const leg = "#3a2418";
  put(red, -7, -7, 11, 4);
  put("#f1d9bc", -5, -4, 8, 1);
  put(red, 4, -9, 5, 4);
  put(red, 9, -7, 2, 2);
  put(leg, 10, -7);
  put(red, 4, -11, 1, 2);
  put(red, 7, -11, 1, 2);
  put(red, -12, -7, 5, 3);
  put("#f4f0e6", -13, -7, 1, 2);
  put(leg, f ? -6 : -5, -3, 1, 3);
  put(leg, f ? -3 : -2, -3, 1, 3);
  put(leg, f ? 1 : 0, -3, 1, 3);
  put(leg, f ? 3 : 2, -3, 1, 3);
}

/** Screen-space boxes of the animals drawn last frame, for clicks. */
const hits: {
  x: number;
  y: number;
  w: number;
  h: number;
  i: number;
  kind: Kind;
}[] = [];
/** When each animal was last poked (animation clock), by cell index. */
const startled = new Map<number, number>();

/** The animal under canvas point (x, y), if any. */
export function critterAt(x: number, y: number) {
  return hits.find(
    (h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h,
  );
}

export function startle(i: number, t: number) {
  startled.set(i, t);
}

/** A small EV pottering along the far edge of the path, lights on at night. */
function car(c: C, p: Pal, v: View) {
  const period = 52;
  const k = (v.t + 17) / period;
  const n = Math.floor(k);
  const u = ((k - n) * period) / 20;
  if (u > 1) return;
  const dir = hash(n + 90) < 0.5 ? 1 : -1;
  const x = Math.round((dir > 0 ? -30 : v.W + 30) + dir * u * (v.W + 60));
  const y = v.gy + 12;
  const put = frame(c, p, x, y, dir);
  const body = ["#d82d17", "#3f7fb8", "#eeeae0", "#47a639"][n & 3]!;
  put(body, -9, -5, 18, 4);
  put(body, -5, -8, 10, 3);
  put(p.night ? "#1b2a5a" : "#9fd0f0", -4, -8, 3, 2);
  put(p.night ? "#1b2a5a" : "#9fd0f0", 0, -8, 4, 2);
  put("#1a1f33", -7, -2, 3, 2);
  put("#1a1f33", 4, -2, 3, 2);
  put("#47e08a", 0, -9, 2, 1); // charging-port green: it is an EV
  if (p.night) {
    put("#fff3b0", 9, -4, 2, 2);
    put("#ff3b30", -10, -4, 1, 2);
    c.save();
    c.globalAlpha = 0.14;
    c.fillStyle = "#fff3b0";
    for (let j = 0; j < 14; j++)
      c.fillRect(
        x + dir * (11 + j * 2) - (dir < 0 ? 1 : 0),
        y - 5 - (j >> 2),
        2,
        4 + (j >> 1),
      );
    c.restore();
  }
}

/** Butterflies and bees over the flowers by day. */
function bugs(c: C, p: Pal, v: View) {
  if (p.night) return;
  cells(v, 1, 260, (i, x) => {
    const r = hash(i + 6100);
    if (r > 0.55) return;
    const bee = r < 0.2;
    const cx = x + r * 180 + 30;
    const cy = v.gy + 14 + hash(i + 6101) * 40;
    const sp = bee ? 3.4 : 1.3;
    const bx = cx + Math.sin(v.t * sp + i) * (bee ? 14 : 24);
    const by = cy + Math.sin(v.t * sp * 1.7 + i * 2) * (bee ? 7 : 12);
    const flap = Math.floor(v.t * (bee ? 24 : 9)) & 1;
    if (bee) {
      px(c, "#f1c40f", bx, by, 2, 1);
      px(c, "#2b2b34", bx + 1, by, 1, 1);
      px(c, "#ffffffcc", bx, by - 1 - flap, 1, 1);
    } else {
      const col = ["#e86a9a", "#6aa9e8", "#f7c948", "#ffffff"][
        Math.floor(r * 40) & 3
      ]!;
      px(c, "#2b2b34", bx, by, 1, 2);
      px(c, col, bx - 2, by - (flap ? 1 : 0), 2, flap ? 2 : 1);
      px(c, col, bx + 1, by - (flap ? 1 : 0), 2, flap ? 2 : 1);
    }
  });
}

/** Small animals wandering the path: cats and rabbits by day, hedgehogs by day and foxes by night. Also the car and the bugs. */
export function drawCritters(c: C, p: Pal, v: View) {
  hits.length = 0;
  car(c, p, v);
  bugs(c, p, v);
  cells(v, 1, 520, (i, x) => {
    const r = hash(i + 4200);
    if (r > 0.78) return;
    const wx = i * 520 + r * 300;
    if (nearStation(wx, 300)) return;
    const k = r / 0.78;
    const kind: Kind =
      k < 0.4 ? "cat" : k < 0.7 ? "rabbit" : p.night ? "fox" : "hedgehog";
    const base = v.gy + 30 + hash(i + 4300) * 34;
    const pc = pace(v.t, i, REACH[kind]);
    const poked = v.t - (startled.get(i) ?? -99);
    const hop =
      poked < 0.6 ? Math.round(9 * Math.sin((poked / 0.6) * Math.PI)) : 0;
    const a: Pace = { ...pc, startled: poked };
    const ox = x + r * 300 + a.x;
    c.save();
    c.globalAlpha = 0.25;
    px(c, "#000", ox - 6, base, 12, 1);
    c.restore();
    ({ cat, rabbit, hedgehog, fox })[kind](c, p, v, i, ox, base - hop, a);
    if (poked < 1.1) {
      px(c, "#ff3b30", ox, base - hop - 20, 1, 3);
      px(c, "#ff3b30", ox, base - hop - 16, 1, 1);
    }
    hits.push({ x: ox - 9, y: base - 14, w: 18, h: 16, i, kind });
  });
}
