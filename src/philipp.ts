import type { Pal } from "./palette";

export interface Pose {
  /** screen x of the centre, y of the feet */
  x: number;
  y: number;
  /** walk cycle frame 0..3 */
  frame: number;
  moving: boolean;
  facing: 1 | -1;
  /** raise an arm and wave */
  wave: boolean;
  t: number;
}

/** Philipp: red-blond hair, blue eyes, dark fleece over a blue collar. Drawn in code, 12x31 art pixels. */
export function drawPhilipp(c: CanvasRenderingContext2D, p: Pal, o: Pose) {
  const f = o.moving ? o.frame : 0;
  const bob = f & 1;
  const fy = o.y;
  c.save();
  c.translate(Math.round(o.x), 0);
  c.scale(o.facing, 1);
  const r = (col: string, x: number, y: number, w: number, h: number) => {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  };

  r(p.shadow, -7, fy, 14, 1);

  // legs: frames 1 and 3 swing one leg forward and lift it
  const legA = f === 1 ? [2, 1] : f === 3 ? [-1, 0] : [0, 0];
  const legB = f === 3 ? [2, 1] : f === 1 ? [-1, 0] : [0, 0];
  for (const [x0, [dx, lift]] of [
    [-3, legA],
    [0, legB],
  ] as const) {
    r(p.pants, x0 + dx!, fy - 9 - lift!, 3, 8);
    r(p.shoe, x0 + dx!, fy - 2 - lift!, 4, 2);
  }

  // torso, collar, arms
  r(p.jacket, -4, fy - 18 - bob, 8, 9);
  r(p.shirt, -2, fy - 18 - bob, 4, 2);
  const sw = f === 1 ? 1 : f === 3 ? -1 : 0;
  r(p.jacket, -6 - sw, fy - 17 - bob, 2, 7);
  r(p.skin, -6 - sw, fy - 10 - bob, 2, 1);
  if (o.wave) {
    const w = Math.floor(o.t * 4) & 1;
    r(p.jacket, 4 + w, fy - 25, 2, 8);
    r(p.skin, 4 + w, fy - 26, 2, 2);
  } else {
    r(p.jacket, 4 + sw, fy - 17 - bob, 2, 7);
    r(p.skin, 4 + sw, fy - 10 - bob, 2, 1);
  }

  // head
  r(p.skin, -4, fy - 27 - bob, 8, 9);
  r(p.hair, -5, fy - 30 - bob, 10, 4);
  r(p.hair, -5, fy - 27 - bob, 2, 4);
  r(p.hair, 0, fy - 32 - bob, 3, 2);
  r(p.hair, -3, fy - 31 - bob, 1, 1);
  r(p.hair, 4, fy - 29 - bob, 1, 2);
  r(p.shirt, 0, fy - 25 - bob, 1, 2);
  r(p.shirt, 3, fy - 25 - bob, 1, 2);
  r(p.red, 1, fy - 21 - bob, 3, 1);
  r(mixSkin(p), 4, fy - 23 - bob, 1, 1);
  c.restore();
}

const mixSkin = (p: Pal) => (p.night ? "#d9a07a" : "#e0a982");
