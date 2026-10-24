import { type C, hash, px } from "./gfx";
import type { Pal } from "./palette";
import type { View } from "./scenery";

const BLOCK = 100;

export type Weather = "clear" | "rain" | "storm" | "snow";

/** The weather for the block containing time `t`, with a fade `k` in 0..1 at its edges. The first block is always clear. */
export function weatherAt(t: number): { kind: Weather; k: number } {
  const b = Math.floor(t / BLOCK);
  const r = hash(b + 777);
  const kind: Weather =
    b === 0 || r < 0.5
      ? "clear"
      : r < 0.75
        ? "rain"
        : r < 0.88
          ? "storm"
          : "snow";
  const into = t - b * BLOCK;
  return { kind, k: Math.max(0, Math.min(1, into / 8, (BLOCK - into) / 8)) };
}

/** Strike times inside a storm block, in seconds into the block. */
const strikeAt = (b: number, j: number) => 6 + j * 9 + hash(b * 31 + j) * 5;

/** Id of the most recent lightning strike, so a caller can tell when a new one lands. */
export function strikeId(t: number): number {
  const { kind } = weatherAt(t);
  if (kind !== "storm") return -1;
  const b = Math.floor(t / BLOCK);
  const into = t - b * BLOCK;
  let id = -1;
  for (let j = 0; j < 10; j++) if (strikeAt(b, j) <= into) id = b * 100 + j;
  return id;
}

/** Seconds since the last strike, or Infinity. */
function sinceStrike(t: number): { dt: number; id: number } {
  const id = strikeId(t);
  if (id < 0) return { dt: Infinity, id };
  const b = Math.floor(id / 100);
  return { dt: t - b * BLOCK - strikeAt(b, id % 100), id };
}

function rain(c: C, v: View, n: number, slant: number) {
  c.save();
  c.globalAlpha = 0.55;
  for (let k = 0; k < n; k++) {
    const fall = 240 + hash(k + 900) * 120;
    const y = (hash(k + 500) * v.H + v.t * fall) % v.H;
    const x = (hash(k) * (v.W + 40) - 20 + y * slant + v.W) % (v.W + 40);
    px(c, "#a8c4e8", x, y, 1, 3);
  }
  c.restore();
}

function snow(c: C, v: View, n: number) {
  c.save();
  c.globalAlpha = 0.9;
  for (let k = 0; k < n; k++) {
    const fall = 22 + hash(k + 900) * 30;
    const y = (hash(k + 500) * v.H + v.t * fall) % v.H;
    const x = hash(k) * v.W + Math.sin(v.t * 0.8 + k) * 8;
    const big = hash(k + 33) > 0.75;
    px(c, "#ffffff", x, y, big ? 2 : 1, big ? 2 : 1);
  }
  c.restore();
}

function lightning(c: C, v: View, dt: number, id: number) {
  // two quick flickers, and the bolt itself during the first one
  const a =
    Math.max(0, 1 - dt / 0.12) * 0.55 +
    Math.max(0, 1 - Math.abs(dt - 0.25) / 0.1) * 0.35;
  if (a <= 0) return;
  if (dt < 0.14) {
    let x = hash(id) * v.W * 0.8 + v.W * 0.1;
    let y = 0;
    const end = v.gy * 0.65;
    while (y < end) {
      const nx = x + (hash(id * 7 + y) - 0.5) * 14;
      const ny = y + 6;
      for (let s = 0; s < 6; s++)
        px(c, "#f4f6ff", x + ((nx - x) * s) / 6, y + s, 2, 1);
      x = nx;
      y = ny;
    }
  }
  c.save();
  c.globalAlpha = a;
  c.fillStyle = "#e8eeff";
  c.fillRect(0, 0, v.W, v.H);
  c.restore();
}

/** Wind-blown seeds and the odd leaf on clear days; fireflies already cover the night. */
function drifters(c: C, p: Pal, v: View, alpha: number) {
  if (p.night || alpha <= 0) return;
  c.save();
  c.globalAlpha = 0.85 * alpha;
  const LEAF = ["#d98a3a", "#c0392b", "#d9b23a"];
  for (let k = 0; k < 12; k++) {
    const sp = 12 + hash(k + 60) * 14;
    const x = ((hash(k) * (v.W + 40) + v.t * sp) % (v.W + 40)) - 20;
    const y =
      v.H * 0.25 +
      hash(k + 20) * v.H * 0.5 +
      Math.sin(v.t * 1.3 + k * 2) * 9 +
      ((v.t * 3 + k * 17) % 20);
    if (k % 3 === 0) {
      px(c, LEAF[k % 3]!, x, y, 2, 2);
    } else {
      px(c, "#ffffff", x, y);
      px(c, "#ffffffaa", x - 1, y - 1);
    }
  }
  c.restore();
}

/** Rain, storms with lightning, snow, and drifting seeds. Drawn over everything but the character's UI. */
export function drawWeather(c: C, p: Pal, v: View) {
  if (v.t === 0) return; // reduced motion: no moving weather
  const { kind, k } = weatherAt(v.t);
  drifters(c, p, v, kind === "clear" ? 1 : 1 - k);
  if (kind === "clear") return;
  const dim = kind === "snow" ? 0.06 : kind === "storm" ? 0.2 : 0.12;
  c.save();
  c.globalAlpha = dim * k;
  c.fillStyle = p.night ? "#02041a" : "#1a2540";
  c.fillRect(0, 0, v.W, v.H);
  c.restore();
  const n = Math.round((v.W / 3) * k);
  if (kind === "snow") snow(c, v, n);
  else
    rain(c, v, kind === "storm" ? n * 1.8 : n, kind === "storm" ? 0.35 : 0.15);
  if (kind === "storm") {
    const { dt, id } = sinceStrike(v.t);
    lightning(c, v, dt, id);
  }
}
