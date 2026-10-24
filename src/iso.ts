/** Isometric (2:1) drawing on top of Pix. +x runs down-right, +y down-left, +z up. */
import type { Pal, Ramp } from "./palette";
import { rng, type Pix } from "./pix";

export const TW = 16;
export const TH = 8;
export const ZH = 8;

export type P3 = [number, number, number];

export class Iso {
  constructor(
    readonly g: Pix,
    readonly ox: number,
    readonly oy: number,
  ) {}

  /** Project a grid point to screen pixels. */
  p(x: number, y: number, z: number): [number, number] {
    return [
      Math.round(this.ox + ((x - y) * TW) / 2),
      Math.round(this.oy + ((x + y) * TH) / 2 - z * ZH),
    ];
  }

  private pts(a: P3[]) {
    return a.map(([x, y, z]) => this.p(x, y, z));
  }

  poly3(a: P3[], c: string) {
    this.g.poly(this.pts(a), c);
  }

  line3(a: P3, b: P3, c: string) {
    const [x0, y0] = this.p(...a);
    const [x1, y1] = this.p(...b);
    this.g.line(x0, y0, x1, y1, c);
  }

  /** Quad on a plane facing +y (the left visible face): x in [x0,x1], z in [z0,z1]. */
  qL(y: number, x0: number, x1: number, z0: number, z1: number, c: string) {
    this.poly3(
      [
        [x0, y, z0],
        [x1, y, z0],
        [x1, y, z1],
        [x0, y, z1],
      ],
      c,
    );
  }
  /** Quad on a plane facing +x (the right visible face): y in [y0,y1], z in [z0,z1]. */
  qR(x: number, y0: number, y1: number, z0: number, z1: number, c: string) {
    this.poly3(
      [
        [x, y0, z0],
        [x, y1, z0],
        [x, y1, z1],
        [x, y0, z1],
      ],
      c,
    );
  }
  /** Quad on a horizontal plane. */
  qT(z: number, x0: number, x1: number, y0: number, y1: number, c: string) {
    this.poly3(
      [
        [x0, y0, z],
        [x1, y0, z],
        [x1, y1, z],
        [x0, y1, z],
      ],
      c,
    );
  }

  /** Axis-aligned box with ramp-shaded faces: top light, left mid, right dark. */
  box(
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    R: Ramp,
    o: { edges?: boolean; tex?: boolean } = {},
  ) {
    const { g } = this;
    this.qT(z + sz, x, x + sx, y, y + sy, R[3]);
    this.qL(y + sy, x, x + sx, z, z + sz, R[2]);
    this.qR(x + sx, y, y + sy, z, z + sz, R[1]);
    if (o.tex) {
      const r = rng(Math.round(x * 31 + y * 17 + z * 7 + sx));
      const speck = (pts: [number, number][], c: string, n: number) => {
        const xs = pts.map((q) => q[0]);
        const ys = pts.map((q) => q[1]);
        const x0 = Math.min(...xs),
          x1 = Math.max(...xs),
          y0 = Math.min(...ys),
          y1 = Math.max(...ys);
        g.polyFn(pts, (px, py) =>
          r() < n && px >= x0 && px <= x1 && py >= y0 && py <= y1 ? c : null,
        );
      };
      speck(
        this.pts([
          [x, y + sy, z],
          [x + sx, y + sy, z],
          [x + sx, y + sy, z + sz],
          [x, y + sy, z + sz],
        ]),
        R[1],
        0.07,
      );
      speck(
        this.pts([
          [x + sx, y, z],
          [x + sx, y + sy, z],
          [x + sx, y + sy, z + sz],
          [x + sx, y, z + sz],
        ]),
        R[0],
        0.06,
      );
      speck(
        this.pts([
          [x, y, z + sz],
          [x + sx, y, z + sz],
          [x + sx, y + sy, z + sz],
          [x, y + sy, z + sz],
        ]),
        R[4],
        0.05,
      );
    }
    if (o.edges !== false) {
      // lit top edges, shaded vertical edge, dark base lines
      this.line3([x, y, z + sz], [x + sx, y, z + sz], R[4]);
      this.line3([x, y, z + sz], [x, y + sy, z + sz], R[4]);
      this.line3([x + sx, y, z + sz], [x + sx, y + sy, z + sz], R[3]);
      this.line3([x, y + sy, z + sz], [x + sx, y + sy, z + sz], R[3]);
      this.line3([x + sx, y + sy, z], [x + sx, y + sy, z + sz], R[0]);
      this.line3([x, y + sy, z], [x + sx, y + sy, z], R[0]);
      this.line3([x + sx, y, z], [x + sx, y + sy, z], R[0]);
      this.line3([x, y + sy, z], [x, y + sy, z + sz], R[1]);
      this.line3([x + sx, y, z], [x + sx, y, z + sz], R[0]);
    }
  }

  /** Vertical cylinder centred at (x,y), radius r (grid units), height h. */
  cyl(
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    R: Ramp,
    cap: string = R[3],
  ) {
    const [cx, cy] = this.p(x, y, z);
    const rx = Math.max(1, Math.round(r * 11.3));
    const ry = Math.max(1, Math.round(r * 5.66));
    const hp = Math.round(h * ZH);
    const { g } = this;
    for (let dx = -rx; dx <= rx; dx++) {
      const t = dx / rx;
      const e = Math.round(ry * Math.sqrt(Math.max(0, 1 - t * t)));
      const tone =
        t < -0.55 ? 3 : t < -0.15 ? 4 : t < 0.2 ? 3 : t < 0.55 ? 2 : 1;
      g.r(cx + dx, cy - hp - e, 1, hp + 2 * e + 1, R[tone]!);
    }
    g.ell(cx, cy - hp, rx, ry, cap);
    // rim light and base line
    for (let dx = -rx; dx <= rx; dx++) {
      const t = dx / rx;
      const e = Math.round(ry * Math.sqrt(Math.max(0, 1 - t * t)));
      g.p(cx + dx, cy + e, R[0]);
      g.p(cx + dx, cy - hp - e, R[4]);
    }
    g.r(cx - rx, cy - hp, 1, hp + 1, R[0]);
    g.r(cx + rx, cy - hp, 1, hp + 1, R[0]);
  }

  /** Flat ellipse on a horizontal plane. */
  disc(x: number, y: number, z: number, r: number, c: string) {
    const [cx, cy] = this.p(x, y, z);
    this.g.ell(
      cx,
      cy,
      Math.max(1, Math.round(r * 11.3)),
      Math.max(1, Math.round(r * 5.66)),
      c,
    );
  }

  /** Dither-free soft ground shadow: translucent diamond offset away from the light. */
  shadow(x: number, y: number, sx: number, sy: number, a = 0.3) {
    const c = `rgba(8,12,24,${a})`;
    const k = 0.6;
    this.poly3(
      [
        [x + k, y + k, 0],
        [x + sx + k + 0.8, y + k, 0],
        [x + sx + k + 0.8, y + sy + k + 0.8, 0],
        [x + k, y + sy + k + 0.8, 0],
      ],
      c,
    );
  }

  /** Gable roof. ridge along x: slopes face +y and -y; ridge along y: slopes face +x and -x. */
  gable(
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    h: number,
    R: Ramp,
    wall: Ramp,
    ridge: "x" | "y" = "x",
    tiles = true,
  ) {
    const { g } = this;
    if (ridge === "x") {
      const my = y + sy / 2;
      this.poly3(
        [
          [x, y + sy, z],
          [x + sx, y + sy, z],
          [x + sx, my, z + h],
          [x, my, z + h],
        ],
        R[2],
      );
      this.poly3(
        [
          [x + sx, y, z],
          [x + sx, y + sy, z],
          [x + sx, my, z + h],
        ],
        wall[1],
      );
      this.poly3(
        [
          [x, y, z],
          [x + sx, y, z],
          [x + sx, my, z + h],
          [x, my, z + h],
        ],
        R[3],
      );
      if (tiles) {
        for (let i = 1; i < h * 3; i++) {
          const t = i / (h * 3);
          this.line3(
            [x, y + sy - (sy / 2) * t, z + h * t],
            [x + sx, y + sy - (sy / 2) * t, z + h * t],
            i % 2 ? R[1] : R[3],
          );
        }
      }
      this.line3([x, my, z + h], [x + sx, my, z + h], R[4]);
      this.line3([x, y + sy, z], [x + sx, y + sy, z], R[0]);
      this.line3([x + sx, y + sy, z], [x + sx, my, z + h], R[0]);
      this.line3([x + sx, y, z], [x + sx, my, z + h], R[1]);
      this.line3([x + sx, y, z], [x + sx, y + sy, z], R[0]);
      void g;
    } else {
      const mx = x + sx / 2;
      this.poly3(
        [
          [x, y + sy, z],
          [x + sx, y + sy, z],
          [mx, y + sy, z + h],
        ],
        wall[2],
      );
      this.poly3(
        [
          [x + sx, y, z],
          [x + sx, y + sy, z],
          [mx, y + sy, z + h],
          [mx, y, z + h],
        ],
        R[1],
      );
      this.poly3(
        [
          [x, y, z],
          [x, y + sy, z],
          [mx, y + sy, z + h],
          [mx, y, z + h],
        ],
        R[3],
      );
      if (tiles) {
        for (let i = 1; i < h * 3; i++) {
          const t = i / (h * 3);
          this.line3(
            [x + sx - (sx / 2) * t, y, z + h * t],
            [x + sx - (sx / 2) * t, y + sy, z + h * t],
            i % 2 ? R[0] : R[2],
          );
        }
      }
      this.line3([mx, y, z + h], [mx, y + sy, z + h], R[4]);
      this.line3([x + sx, y + sy, z], [mx, y + sy, z + h], R[0]);
      this.line3([x + sx, y, z], [x + sx, y + sy, z], R[0]);
      this.line3([x, y + sy, z], [x + sx, y + sy, z], R[0]);
    }
  }

  /** Tapered slab drawn as a line of pixels from a to b with thickness. */
  beam(a: P3, b: P3, c: string, t = 1) {
    const [x0, y0] = this.p(...a);
    const [x1, y1] = this.p(...b);
    for (let i = 0; i < t; i++) this.g.line(x0 + i, y0, x1 + i, y1, c);
  }
}

/** Convenience: translucent version of a pal colour for glass. */
export const glassFill = (p: Pal, a = 0.28) =>
  p.night ? `rgba(60,170,230,${a})` : `rgba(190,235,255,${a + 0.12})`;
