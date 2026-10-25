import { drawText, textWidth } from "../src/font";
import {
  type C,
  block,
  hash,
  mat,
  px,
  ramp,
  studs,
  vnoise,
  voxBall,
} from "../src/gfx";
import { mix, type Pal } from "../src/palette";
import { drawPhilipp } from "../src/philipp";
import { Raster, useRaster } from "../src/raster";

/** Art pixels per millimetre: one art pixel is a third of a millimetre. */
export const PX_MM = 3;
/** Card trim and bleed in mm (EU business card). */
export const CARD = { w: 85, h: 55, bleed: 3 };
const W = (CARD.w + CARD.bleed * 2) * PX_MM;
const H = (CARD.h + CARD.bleed * 2) * PX_MM;
/** Trim edge inset, in art pixels. */
const B = CARD.bleed * PX_MM;

useRaster();

/** The back: Philipp waving on a baseplate under the sky of `p`, with room on the right for the QR code. */
export function back(p: Pal): Raster {
  const r = new Raster(W, H);
  const c = r.getContext("2d");
  const ground = H - B - 34;

  // sky as flat bands, darkest at the top
  const bands = p.sky.length;
  for (let i = 0; i < bands; i++) {
    const y0 = Math.round((ground * i) / bands);
    px(c, p.sky[i]!, 0, y0, W, ground - y0);
  }
  // a faint stud grid over the sky
  for (let y = 6; y < ground - 30; y += 12)
    for (let x = 6 + ((y / 12) & 1) * 6; x < W; x += 12)
      px(
        c,
        mix(
          p.sky[Math.min(bands - 1, Math.floor((y / ground) * bands))]!,
          "#ffffff",
          0.12,
        ),
        x,
        y,
        2,
        1,
      );

  if (p.night) {
    // stars, two sizes, kept out of the lowest band
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(hash(i * 31 + 7) * W);
      const y = Math.floor(hash(i * 17 + 3) * ground * 0.7);
      const big = hash(i * 5) < 0.15;
      px(c, big ? p.glow : mix(p.white, p.sky[1]!, 0.35), x, y, big ? 2 : 1, 1);
    }
    voxBall(c, W * 0.42, B + 16, 9, 3, ramp("#e9ecf7"));
  } else voxBall(c, W * 0.42, B + 16, 9, 3, ramp(p.yellow));

  // two cloud piles
  for (const [cx, cy, n] of [
    [B + 34, B + 18, 5],
    [W * 0.3, B + 46, 4],
  ] as const) {
    const cl = p.night
      ? ramp(mix(p.sky[2]!, "#ffffff", 0.18))
      : ramp("#ffffff");
    for (let i = 0; i < n; i++)
      block(
        c,
        cx + i * 7 - (i === n - 1 ? 2 : 0),
        cy - (i % 2) * 4,
        9,
        6,
        cl,
        2,
      );
  }

  // stepped hills, brick terraces from value noise
  const hill = ramp(mix(p.hill, p.ground, 0.4));
  for (let x = 0; x < W; x += 6) {
    const h = Math.round(8 + vnoise(x / 40, 3) * 26) & ~1;
    block(c, x, ground - h, 6, h, hill, 2);
  }

  // the baseplate: green top with studs, a plate path, soil below
  const g = mat(p, p.ground);
  block(c, -4, ground, W + 8, H - ground, g, 3);
  studs(c, -4, ground, W + 8, g, 8, 3);
  const path = ramp(p.path);
  block(c, -4, ground + 12, W + 8, 7, path, 2);
  for (let x = 0; x < W; x += 9)
    if (hash(x) < 0.5) px(c, path[1], x, ground + 15, 3, 1);

  // power and data: a yellow and a blue cube hop toward him
  for (const [i, col] of [
    [0, p.yellow],
    [1, p.blue],
    [2, p.yellow],
  ] as const)
    block(c, B + 92 + i * 13, ground - 22 - (i % 2) * 6, 6, 6, ramp(col), 2);

  drawPhilipp(c, p, {
    x: B + 54,
    y: ground + 10,
    frame: 0,
    moving: false,
    facing: 1,
    wave: true,
    t: 0,
  });

  // the address in the 5x7 bitmap font, on the path
  const label = "PHILIPPNAGEL.COM";
  const lx = W - B - 5 * PX_MM - textWidth(label);
  drawText(c, label, lx + 1, ground + 26, path[0]);
  drawText(c, label, lx, ground + 25, p.white);
  return r;
}

/** The front's foot: a course of studded bricks in the four accents along the bottom bleed. */
export function strip(p: Pal): Raster {
  const h = B + 14;
  const r = new Raster(W, h);
  const c: C = r.getContext("2d");
  const cols = [p.red, p.blue, p.yellow, p.green];
  let x = -6;
  for (let i = 0; x < W; i++) {
    const w = 16 + Math.floor(hash(i * 13 + 1) * 3) * 8;
    const col = mat(p, cols[i % cols.length]!, 0.2);
    const top = 6 + (hash(i * 7) < 0.3 ? -3 : 0);
    block(c, x, top, w - 1, h - top, col, 2);
    studs(c, x, top, w - 1, col, 8, 2);
    x += w;
  }
  return r;
}
