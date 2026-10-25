import {
  type C,
  type R5,
  type Sprite,
  bake,
  blit,
  block,
  mat,
  px,
  ramp,
  shadow,
  tone,
  vox,
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

/** Hair piece, 3 px cubes from (-10, -66): a cap swept up to the right, longer at the back. */
const HAIR = [
  "..####.",
  ".######",
  "#######",
  "###....",
  "##.....",
  "##.....",
  "#......",
];

/**
 * Philipp as a toy figure: red-blond hair piece, blue eyes, dark fleece over a
 * blue collar. Every part is a brick with a lit top and a shaded side, about
 * 60 art pixels tall.
 */
function draw(c: C, p: Pal, f: number, wave: number) {
  // warm skin shadow: the generic ramp goes grey-blue on skin
  const sk = tone(p, p.skin);
  const skinSh = mix(sk, "#a8553f", 0.42);
  const skinDk = mix(skinSh, "#5a2a28", 0.4);
  const skin: R5 = [
    skinDk,
    skinSh,
    sk,
    mix(sk, "#fff3df", 0.35),
    mix(sk, "#ffffff", 0.6),
  ];
  const hair = ramp(p.night ? mix(p.hair, "#2a3a8a", 0.15) : p.hair);
  const jacket = mat(p, p.jacket, 0.05);
  const shirt = mat(p, p.shirt, 0.2);
  const pants = mat(p, p.pants, 0.2);
  const shoe = mat(p, p.shoe, 0.2);
  const sole = mat(p, "#4b4f5e", 0.2);

  const bob = f === 1 || f === 3 ? -1 : 0;
  const ty = bob;

  // legs: frame 1 steps the front leg forward, frame 3 kicks the back leg back
  const legs = [
    { x: -8, dx: f === 1 ? -2 : f === 3 ? -3 : 0, lift: f === 3 ? 3 : 0 },
    { x: 1, dx: f === 1 ? 3 : f === 3 ? 2 : 0, lift: f === 1 ? 3 : 0 },
  ];
  for (const l of legs) {
    const x = l.x + l.dx;
    const y = -l.lift;
    block(c, x, -19 + y, 7, 14, pants, 2);
    block(c, x, -5 + y, 10, 4, shoe, 2);
    px(c, sole[2], x, -1 + y, 10, 1);
  }
  // hip brick across both legs
  block(c, -9, -22 + ty, 17, 4, pants, 2);

  const sw = f === 1 ? 3 : f === 3 ? -3 : 0;

  // back arm, with a C-shaped hand
  const bx = -13 - Math.max(sw, -1);
  block(c, bx, -36 + ty, 5, 15, jacket, 2);
  hand(c, skin, bx, -21 + ty);

  // torso: a brick that widens toward the hips, like a toy figure's
  for (let i = 0; i < 18; i++) {
    const w = 16 + Math.round((i / 17) * 3);
    const x = -8 - Math.round((i / 17) * 1.5);
    px(c, jacket[1], x + w, -40 + i + ty - 1, 2, 1);
    px(c, i === 0 ? jacket[4] : jacket[2], x, -40 + i + ty, w, 1);
    px(c, jacket[3], x, -40 + i + ty, 1, 1);
  }
  for (let k = 1; k <= 2; k++) px(c, jacket[3], -8 + k, -40 - k + ty, 16, 1);
  // zip and a lit pocket edge
  px(c, jacket[1], 3, -36 + ty, 1, 14);
  px(c, jacket[4], 4, -36 + ty, 1, 13);
  px(c, jacket[3], -6, -28 + ty, 5, 1);
  // collar and shirt
  block(c, -2, -42 + ty, 9, 4, shirt, 1);
  px(c, jacket[3], -5, -40 + ty, 3, 4);
  px(c, jacket[3], 7, -40 + ty, 2, 4);

  // front arm
  if (wave) {
    const w = wave === 2 ? 8 : 5;
    block(c, 8, -38 + ty, 5 + w, 5, jacket, 2); // shoulder reaching out to the raised arm
    block(c, 8 + w, -51 + ty, 5, 15, jacket, 2);
    hand(c, skin, 8 + w, -56 + ty);
  } else {
    block(c, 8 - sw, -36 + ty, 5, 15, jacket, 2);
    hand(c, skin, 8 - sw, -21 + ty);
  }

  // neck stud, then the head: a rounded brick
  block(c, -1, -44 + ty, 6, 3, skin, 1);
  const hx = -6;
  const hy = -60 + ty;
  block(c, hx, hy, 17, 16, skin, 2);
  // rounded corners
  for (const [x, y] of [
    [hx, hy],
    [hx + 16, hy + 15],
    [hx, hy + 15],
  ])
    c.clearRect(x!, y!, 1, 1);
  px(c, skinSh, hx, hy + 13, 17, 2);
  px(c, skin[3], hx + 6, hy + 3, 6, 2);
  // hair piece in cubes
  vox(
    c,
    -10,
    -66 + ty,
    7,
    HAIR.length,
    3,
    (i, j) => (HAIR[j]![i] === "#" ? hair : null),
    2,
  );
  // brows, eyes
  px(c, hair[1], 2, -55 + ty, 3, 1);
  px(c, hair[1], 7, -55 + ty, 3, 1);
  for (const x of [2, 7]) {
    px(c, "#ffffff", x, -53 + ty, 3, 3);
    px(c, p.blue, x + 1, -53 + ty, 2, 3);
    px(c, "#10244a", x + 2, -52 + ty, 1, 1);
  }
  // nose, cheek, smile
  px(c, skin[3], 9, -50 + ty, 2, 2);
  px(c, skinSh, 9, -48 + ty, 2, 1);
  px(c, mix(sk, "#e58a7c", 0.5), 2, -48 + ty, 2, 1);
  px(c, skinDk, 4, -46 + ty, 5, 1);
  px(c, skinDk, 3, -47 + ty, 1, 1);
  px(c, skinDk, 9, -47 + ty, 1, 1);
}

/** A toy figure's C-shaped hand, opening forward. */
function hand(c: C, skin: R5, x: number, y: number) {
  block(c, x, y, 5, 5, skin, 1);
  px(c, skin[1], x + 2, y + 2, 3, 1);
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
    out.push(bake(-22, -74, 24, 2, (c) => draw(c, p, f, w)));
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
