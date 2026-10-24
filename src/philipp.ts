import {
  type C,
  type Sprite,
  ball,
  bake,
  blit,
  mat,
  px,
  ramp,
  shadow,
  slab,
} from "./gfx";
import { mix, type Pal } from "./palette";

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

/** Walk frames 0..3, then two wave frames. */
const frames = new WeakMap<Pal, Sprite[]>();

/** Philipp: red-blond hair, blue eyes, dark fleece over a blue collar. Shaded in code, about 60 art pixels tall. */
function draw(c: C, p: Pal, f: number, wave: number) {
  const skin = ramp(p.skin);
  const hair = ramp(p.night ? mix(p.hair, "#2a3a8a", 0.15) : p.hair);
  const jacket = mat(p, p.jacket, 0.05);
  const shirt = mat(p, p.shirt, 0.2);
  const pants = mat(p, p.pants, 0.2);
  const shoe = mat(p, p.shoe, 0.2);
  const sole = mat(p, "#4b4f5e", 0.2);

  const bob = f === 1 || f === 3 ? -1 : 0;

  // legs: frames 1 and 3 swing one leg forward and lift it
  const legs = [
    { x: -8, dx: f === 1 ? 4 : f === 3 ? -3 : 0, lift: f === 1 ? 3 : 0 },
    { x: 1, dx: f === 3 ? 4 : f === 1 ? -3 : 0, lift: f === 3 ? 3 : 0 },
  ];
  for (const l of legs) {
    slab(c, l.x + l.dx, -19 - l.lift, 7, 14, pants, 2);
    px(c, pants[3], l.x + l.dx + 2, -19 - l.lift, 1, 14);
    slab(c, l.x + l.dx, -5 - l.lift, 11, 5, shoe, 1);
    px(c, sole[2], l.x + l.dx, -1 - l.lift, 11, 1);
  }

  const sw = f === 1 ? 3 : f === 3 ? -3 : 0;
  const ty = bob;

  // back arm
  slab(c, -13 - sw, -35 + ty, 5, 15, jacket, 1);
  px(c, jacket[1], -13 - sw, -22 + ty, 5, 2);
  slab(c, -13 - sw, -20 + ty, 5, 4, skin, 1);

  // torso
  slab(c, -9, -37 + ty, 18, 19, jacket, 2);
  px(c, jacket[2], -8, -38 + ty, 16, 1);
  px(c, jacket[1], 3, -34 + ty, 1, 15);
  px(c, jacket[4], 4, -34 + ty, 1, 14);
  px(c, jacket[3], -6, -36 + ty, 1, 8);
  px(c, jacket[1], -9, -20 + ty, 18, 2);
  // collar and shirt
  slab(c, -3, -41 + ty, 9, 5, shirt, 1);
  px(c, shirt[4], -2, -41 + ty, 3, 1);
  px(c, jacket[3], -5, -39 + ty, 3, 4);
  px(c, jacket[3], 6, -39 + ty, 3, 4);
  px(c, shirt[1], 2, -37 + ty, 3, 1);

  // front arm
  if (wave) {
    const w = wave === 2 ? 3 : 0;
    slab(c, 8 + w, -48 + ty, 5, 15, jacket, 1);
    slab(c, 8 + w, -52 + ty, 5, 5, skin, 1);
    px(c, skin[4], 9 + w, -52 + ty, 2, 1);
  } else {
    slab(c, 8 + sw * -1, -35 + ty, 5, 15, jacket, 1);
    px(c, jacket[1], 8 - sw, -22 + ty, 5, 2);
    slab(c, 8 - sw, -20 + ty, 5, 4, skin, 1);
  }

  // neck, head, hair
  px(c, skin[1], -2, -42 + ty, 6, 5);
  ball(c, -1, -57 + ty, 11, hair, 10, -0.35, -0.7);
  ball(c, 2, -52 + ty, 9, skin, 8, -0.45, -0.5);
  // ear
  px(c, skin[1], -7, -52 + ty, 3, 5);
  px(c, skin[3], -6, -51 + ty, 1, 3);
  // fringe swept over the forehead
  for (let i = 0; i < 12; i++) {
    const h = i < 4 ? 5 : i < 8 ? 4 : 3;
    px(c, i % 3 === 0 ? hair[3] : hair[2], -4 + i, -62 + ty, 1, h);
  }
  px(c, hair[1], -4, -58 + ty, 12, 1);
  px(c, hair[3], 0, -63 + ty, 3, 2);
  px(c, hair[4], 1, -64 + ty, 2, 1);
  px(c, hair[3], -5, -62 + ty, 2, 3);
  px(c, hair[2], 4, -64 + ty, 2, 2);
  px(c, hair[2], -9, -56 + ty, 3, 8);
  // face
  px(c, hair[1], 2, -56 + ty, 3, 1);
  px(c, hair[1], 6, -56 + ty, 3, 1);
  px(c, "#ffffff", 2, -53 + ty, 3, 3);
  px(c, p.blue, 3, -53 + ty, 2, 3);
  px(c, "#10244a", 4, -52 + ty, 1, 1);
  px(c, "#ffffff", 7, -53 + ty, 3, 3);
  px(c, p.blue, 8, -53 + ty, 2, 3);
  px(c, "#10244a", 9, -52 + ty, 1, 1);
  px(c, skin[1], 9, -50 + ty, 1, 3);
  px(c, skin[4], 10, -50 + ty, 2, 2);
  px(c, "#e58a7c", 3, -48 + ty, 2, 1);
  px(c, "#e58a7c", 8, -48 + ty, 2, 1);
  px(c, "#8a2c24", 4, -46 + ty, 5, 1);
  px(c, "#fff5e0", 5, -47 + ty, 3, 1);
  px(c, "#8a2c24", 3, -47 + ty, 1, 1);
  px(c, "#8a2c24", 9, -47 + ty, 1, 1);
}

function build(p: Pal): Sprite[] {
  const out: Sprite[] = [];
  for (const [f, w] of [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [0, 1],
    [0, 2],
  ] as const)
    out.push(bake(-20, -72, 20, 2, (c) => draw(c, p, f, w)));
  return out;
}

export function drawPhilipp(c: C, p: Pal, o: Pose) {
  let set = frames.get(p);
  if (!set) frames.set(p, (set = build(p)));
  const idx =
    o.wave && !o.moving
      ? 4 + (Math.floor(o.t * 3) & 1)
      : o.moving
        ? o.frame
        : 0;
  shadow(c, p, o.x, o.y, 15, 4);
  blit(c, set[idx]!, o.x, o.y, o.facing === -1);
}
