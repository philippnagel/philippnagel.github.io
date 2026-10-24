import type { Pal } from "../palette";
import { rng, type Pix } from "../pix";
import { BAND_Y, SH, SW } from "../geometry";

/** Data band on top, power band below, with a divider and layer captions. */
export function landscape(
  g: Pix,
  p: Pal,
  opts: { road?: boolean; seed?: number } = {},
) {
  for (let y = 0; y < BAND_Y; y += 4)
    g.r(0, y, SW, 4, (y / 4) % 2 ? p.bandB : p.bandA);
  for (let y = 4; y < BAND_Y; y += 8)
    for (let x = (y / 8) % 2 ? 4 : 0; x < SW; x += 8) g.p(x, y, p.dot);
  g.r(0, BAND_Y, SW, SH - BAND_Y, p.ground);
  const r = rng(opts.seed ?? 7);
  for (let i = 0; i < 260; i++)
    g.p(
      Math.floor(r() * SW),
      BAND_Y + 2 + Math.floor(r() * (SH - BAND_Y - 2)),
      p.ground2,
    );
  g.r(0, BAND_Y - 1, SW, 1, p.dot);
  g.r(0, BAND_Y, SW, 1, p.outline);
  if (opts.road) {
    g.r(0, 170, SW, 10, p.road);
    for (let x = 4; x < SW; x += 16) g.r(x, 175, 8, 1, p.white);
  }
  g.text(3, 2, "DATA LAYER", p.inkDim);
  g.text(3, BAND_Y + 3, "POWER LAYER", p.inkDim);
}

export function tree(g: Pix, p: Pal, x: number, y: number) {
  g.r(x, y + 6, 2, 4, p.wood);
  g.disc(x + 1, y + 3, 4, p.outline);
  g.disc(x + 1, y + 3, 3, p.green);
  g.p(x, y + 2, p.green2);
  g.p(x + 2, y + 4, p.green2);
}

export function envelope(g: Pix, p: Pal, x: number, y: number, tint?: string) {
  g.fill(x, y, 9, 6, tint ?? p.white, p.outline);
  g.line(x + 1, y + 1, x + 4, y + 3, p.outline);
  g.line(x + 7, y + 1, x + 4, y + 3, p.outline);
}

export function lock(g: Pix, p: Pal, x: number, y: number) {
  g.r(x + 1, y, 3, 1, p.outline);
  g.r(x + 1, y + 1, 1, 2, p.outline);
  g.r(x + 3, y + 1, 1, 2, p.outline);
  g.fill(x, y + 3, 5, 4, p.yellow, p.outline);
  g.p(x + 2, y + 4, p.outline);
}

export function key(g: Pix, p: Pal, x: number, y: number) {
  g.disc(x + 2, y + 2, 2, p.outline);
  g.disc(x + 2, y + 2, 1, p.yellow);
  g.r(x + 4, y + 2, 7, 1, p.outline);
  g.r(x + 8, y + 3, 1, 2, p.outline);
  g.r(x + 10, y + 3, 1, 2, p.outline);
}

/** Centred label under an object. */
export const label = (g: Pix, p: Pal, w: number, y: number, s: string) =>
  g.textC(w / 2, y, s, p.ink);

export function pole(g: Pix, p: Pal, x: number, y: number, h: number) {
  g.r(x - 1, y, 1, h, p.outline);
  g.r(x, y, 2, h, p.wood);
  g.r(x + 2, y, 1, h, p.outline);
}
