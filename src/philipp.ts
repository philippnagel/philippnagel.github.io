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
  tone,
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

  // legs: frame 1 steps the right leg forward, frame 3 kicks the left leg back
  const legs = [
    { x: -8, dx: f === 1 ? -2 : f === 3 ? -3 : 0, lift: f === 3 ? 3 : 0 },
    { x: 1, dx: f === 1 ? 3 : f === 3 ? 2 : 0, lift: f === 1 ? 3 : 0 },
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
  const bx = -13 - Math.max(sw, -1);
  slab(c, bx, -35 + ty, 5, 15, jacket, 1);
  px(c, jacket[1], bx, -22 + ty, 5, 2);
  slab(c, bx, -20 + ty, 5, 4, skin, 1);

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
    const w = wave === 2 ? 8 : 5;
    slab(c, 8, -37 + ty, 5 + w, 5, jacket, 1); // shoulder reaching out to the raised arm
    slab(c, 8 + w, -50 + ty, 5, 15, jacket, 1);
    slab(c, 8 + w, -55 + ty, 5, 5, skin, 1);
    px(c, skin[4], 9 + w, -55 + ty, 2, 1);
  } else {
    slab(c, 8 + sw * -1, -35 + ty, 5, 15, jacket, 1);
    px(c, jacket[1], 8 - sw, -22 + ty, 5, 2);
    slab(c, 8 - sw, -20 + ty, 5, 4, skin, 1);
  }

  // neck, head, hair
  // warm skin shadow: the generic ramp goes grey-blue on skin
  const skinSh = mix(tone(p, p.skin), "#a8553f", 0.42);
  const skinDk = mix(skinSh, "#5a2a28", 0.4);
  px(c, skinSh, -2, -43 + ty, 6, 6);
  ball(c, -1, -57 + ty, 11, hair, 10, -0.35, -0.7);
  // face: flat skin with a lit forehead and cheek and a shaded jaw, no dither
  for (let dy = -8; dy <= 8; dy++) {
    const w = Math.round(8 * Math.sqrt(1 - (dy * dy) / 69));
    for (let dx = -w; dx <= w; dx++) {
      const edge = dx <= -w + 1 && dy > -4;
      px(c, edge || dy >= 7 ? skinSh : skin[2], 2 + dx, -52 + dy + ty);
    }
  }
  px(c, skin[3], 0, -57 + ty, 6, 2);
  px(c, skin[3], 6, -50 + ty, 3, 2);
  // ear
  px(c, skin[2], -7, -52 + ty, 3, 5);
  px(c, skinSh, -6, -51 + ty, 1, 3);
  // fringe swept up and to the right, so the forehead shows on that side
  const drop = [6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1];
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < drop[i]!; j++)
      px(c, (i + j) % 3 === 0 ? hair[3] : hair[2], -4 + i, -62 + j + ty);
    px(c, hair[1], -4 + i, -62 + drop[i]! + ty);
  }
  px(c, hair[3], 0, -63 + ty, 3, 2);
  px(c, hair[4], 1, -64 + ty, 2, 1);
  px(c, hair[3], -5, -62 + ty, 2, 3);
  px(c, hair[2], 4, -64 + ty, 2, 2);
  px(c, hair[2], -9, -56 + ty, 3, 8);
  px(c, hair[1], -9, -49 + ty, 3, 1);
  // brows, eyes
  px(c, hair[1], 2, -56 + ty, 3, 1);
  px(c, hair[1], 7, -56 + ty, 3, 1);
  for (const x of [2, 7]) {
    px(c, "#ffffff", x, -54 + ty, 3, 3);
    px(c, p.blue, x + 1, -54 + ty, 2, 3);
    px(c, "#10244a", x + 2, -53 + ty, 1, 1);
  }
  // nose, cheek, mouth
  px(c, skin[3], 9, -51 + ty, 2, 2);
  px(c, skinSh, 9, -49 + ty, 2, 1);
  px(c, mix(skin[2], "#e58a7c", 0.5), 3, -48 + ty, 2, 1);
  px(c, skinDk, 4, -46 + ty, 5, 1);
  px(c, skinDk, 3, -47 + ty, 1, 1);
  px(c, skinDk, 9, -47 + ty, 1, 1);
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
