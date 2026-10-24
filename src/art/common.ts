import type { Pal } from "../palette";
import { rng, type Pix } from "../pix";
import { SH, SW } from "../geometry";

/** Drifting translucent clouds across the sky. */
export function clouds(g: Pix, p: Pal, t: number, n = 5, seed = 1) {
  const r = rng(seed);
  const col = p.night ? "rgba(120,160,230,.14)" : "rgba(255,255,255,.7)";
  const hi = p.night ? "rgba(160,200,255,.14)" : "rgba(255,255,255,.85)";
  for (let i = 0; i < n; i++) {
    const speed = 3 + r() * 5;
    const x = ((r() * SW + t * speed) % (SW + 240)) - 120;
    const y = 20 + r() * (SH * 0.3);
    const s = 0.9 + r() * 0.9;
    for (const [dx, dy, rad] of [
      [0, 0, 18],
      [22, -8, 22],
      [46, 0, 18],
      [24, 5, 20],
    ] as const)
      g.ell(
        Math.round(x + dx * s),
        Math.round(y + dy * s),
        Math.round(rad * s),
        Math.round(rad * 0.55 * s),
        col,
      );
    g.ell(
      Math.round(x + 18 * s),
      Math.round(y - 12 * s),
      Math.round(12 * s),
      Math.round(5 * s),
      hi,
    );
  }
}
