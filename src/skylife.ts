import { type C, hash, px } from "./gfx";
import type { Pal } from "./palette";
import type { View } from "./scenery";

/** One crossing of the sky: `u` runs 0..1 over `dur` seconds, once per `period`; `n` numbers the crossing. */
function pass(t: number, period: number, offset: number, dur: number) {
  const k = (t + offset) / period;
  const n = Math.floor(k);
  const u = ((k - n) * period) / dur;
  return u <= 1 ? { u, n } : null;
}

const dirOf = (n: number, salt: number) => (hash(n * 13 + salt) < 0.5 ? 1 : -1);

/** One bird mid-flight: `f` is the wing phase in radians. */
export function drawBird(c: C, col: string, x: number, y: number, f: number) {
  const s = Math.sin(f);
  const up = s > 0.35 ? 1 : s < -0.35 ? -1 : 0;
  const tip = y - (up > 0 ? 2 : up < 0 ? -1 : 0);
  const inner = y - (up > 0 ? 1 : 0);
  px(c, col, x, y);
  px(c, col, x - 1, inner);
  px(c, col, x + 1, inner);
  px(c, col, x - 2, tip);
  px(c, col, x + 2, tip);
}

/** A V of birds crossing, with a wing-flap cycle per bird. */
function birds(
  c: C,
  p: Pal,
  v: View,
  period: number,
  offset: number,
  salt: number,
) {
  const ps = pass(v.t, period, offset, period * 0.75);
  if (!ps) return;
  const dir = dirOf(ps.n, salt);
  const count = 1 + Math.floor(hash(ps.n * 7 + salt) * 7);
  const x0 = dir > 0 ? -20 : v.W + 20;
  const x = x0 + dir * ps.u * (v.W + 40);
  const y =
    v.gy * (0.22 + 0.3 * hash(ps.n * 5 + salt)) + Math.sin(ps.u * 5) * 4;
  const col = p.night ? "#0d1230" : "#2d3548";
  for (let i = 0; i < count; i++) {
    const row = (i + 1) >> 1;
    const side = i & 1 ? 1 : -1;
    const bx = x - dir * row * 7;
    const by = y + (i ? side * row * 3 : 0);
    drawBird(c, col, bx, by, v.t * 9 + i * 1.3);
  }
}

/** A jet at cruising height: white with a contrail by day, blinking lights at night. */
function plane(c: C, p: Pal, v: View) {
  const ps = pass(v.t, p.night ? 61 : 53, 11, 28);
  if (!ps) return;
  const dir = dirOf(ps.n, 3);
  const x = (dir > 0 ? -12 : v.W + 12) + dir * ps.u * (v.W + 24);
  const y = Math.round(v.gy * (0.1 + 0.16 * hash(ps.n * 3 + 1)));
  if (!p.night) {
    c.save();
    for (let k = 0; k < 70; k += 2) {
      c.globalAlpha = 0.55 * (1 - k / 70);
      px(c, "#ffffff", x - dir * (5 + k * 1.5), y, 2, 1);
    }
    c.restore();
    px(c, "#f4f6fa", x - 3, y, 7, 1);
    px(c, "#c8d0dc", x - dir, y + 1, 3, 1);
    px(c, "#c8d0dc", x - dir * 3, y - 1, 1, 1);
    px(c, "#9aa6b8", x + dir * 3, y, 1, 1);
  } else {
    px(c, "#ff3b30", x - dir, y + 1);
    px(c, "#35e07a", x - dir, y - 1);
    if ((v.t * 1.2) % 1 < 0.12) px(c, "#ffffff", x - dir * 3, y, 2, 1);
  }
}

/** A slow steady dot, fading in and out as it crosses the dark sky. */
function satellite(
  c: C,
  v: View,
  period: number,
  offset: number,
  salt: number,
) {
  const ps = pass(v.t, period, offset, 22);
  if (!ps) return;
  const dir = dirOf(ps.n, salt);
  const x = (dir > 0 ? 0 : v.W) + dir * ps.u * v.W;
  const y = v.gy * (0.1 + 0.4 * hash(ps.n * 11 + salt)) + ps.u * 14 * dir;
  c.save();
  c.globalAlpha = Math.min(1, Math.sin(ps.u * Math.PI) * 2.2) * 0.9;
  px(c, "#dfe6ff", x, y);
  c.restore();
}

/** A tidy line of evenly spaced dots, like a freshly launched Starlink batch. */
function starlink(c: C, v: View) {
  const ps = pass(v.t, 74, 29, 17);
  if (!ps) return;
  const dir = dirOf(ps.n, 9);
  const L = v.W + 160;
  const slope = 0.16 * -dir;
  const y0 = v.gy * (0.12 + 0.3 * hash(ps.n * 17));
  c.save();
  for (let i = 0; i < 10; i++) {
    const s = ps.u * (L + 70) - i * 7;
    if (s < 0 || s > L) continue;
    const x = (dir > 0 ? -80 : v.W + 80) + dir * s;
    c.globalAlpha = Math.min(1, Math.sin((s / L) * Math.PI) * 3) * 0.95;
    px(c, "#e8ecff", x, y0 + s * slope);
  }
  c.restore();
}

/** Birds, planes and satellites. All derived from time alone, so there is nothing to keep in sync. */
export function drawSkyLife(c: C, p: Pal, v: View) {
  if (v.t === 0) return; // reduced motion: keep the sky still
  if (p.night) {
    satellite(c, v, 43, 5, 21);
    satellite(c, v, 67, 40, 22);
    starlink(c, v);
  } else {
    birds(c, p, v, 29, 4, 1);
    birds(c, p, v, 47, 21, 2);
  }
  plane(c, p, v);
}
