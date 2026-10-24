import type { Pal } from "../palette";
import { Iso } from "../iso";
import { rng } from "../pix";
import { label } from "./kit";

/** Gateway box used by the cabinet and frame scenes (local origin = box base corner, protrudes +y). */
export function gwDrawShared(I: Iso, p: Pal) {
  I.shadow(0.2, 0.2, 9, 5, 0.25);
  I.cyl(7.2, 1.2, 7.2, 0.2, 2.2, p.dark);
  I.g.ball(...I.p(7.2, 1.2, 9.4), 5, p.cyan);
  I.box(0, 0.6, 0, 8.6, 3.2, 7.2, p.dark);
  I.qL(3.8, 0.3, 8.3, 6.4, 6.9, p.dark[3]);
  for (let k = 0; k < 8; k++)
    I.qL(3.8, 0.5 + k * 0.28, 0.5 + k * 0.28 + 0.14, 4.3, 6.1, p.dark[0]);
  I.qL(3.8, 3.3, 6.2, 3.0, 5.9, p.paper[2]);
  const r = rng(4);
  for (let j = 0; j < 8; j++)
    for (let i = 0; i < 8; i++)
      if (r() > 0.45)
        I.qL(
          3.8,
          3.5 + i * 0.1,
          3.5 + i * 0.1 + 0.1,
          3.1 + j * 0.3,
          3.1 + j * 0.3 + 0.28,
          p.outline,
        );
  for (let k = 0; k < 3; k++) {
    I.qL(3.8, 0.5 + k * 1.2, 1.4 + k * 1.2, 0.5, 1.7, p.metal[2]);
    I.qL(3.8, 0.65 + k * 1.2, 1.25 + k * 1.2, 0.7, 1.4, p.dark[0]);
  }
  label(I.g, p, I.ox + 16, I.oy + (8.6 + 3.8) * 4 + 8 + 14, "GATEWAY");
}
