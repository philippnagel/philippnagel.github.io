/** Where the character stands on screen, as a share of the width. */
export const CHAR_AT = 0.38;
/** Station art is centred this far ahead of the character's focus point. */
export const ART_AHEAD = 100;

/** Distance along the path (art px) at which each chapter is in focus. */
export const STATIONS = [0, 960, 1920, 2880, 3840, 4800, 5760, 6720];
export const END = STATIONS[STATIONS.length - 1]!;

/** Index of the station closest to walk distance `x`. */
export function nearest(x: number): number {
  let best = 0;
  for (let i = 1; i < STATIONS.length; i++)
    if (Math.abs(STATIONS[i]! - x) < Math.abs(STATIONS[best]! - x)) best = i;
  return best;
}

/**
 * CSS pixels per art pixel. The zoom is a whole number of *device* pixels, so
 * every art pixel covers the same square of the screen at any pixel ratio.
 */
export const artScale = (cssWidth: number, dpr = 1) => {
  const css = Math.max(1, Math.min(3, Math.round(cssWidth / 640)));
  return Math.max(1, Math.round(css * dpr)) / dpr;
};

/** Walk distance for a page scroll offset, and back. */
export const walkOf = (scrollY: number, s: number) =>
  Math.max(0, Math.min(END, scrollY / s));
export const scrollOf = (walk: number, s: number) => walk * s;

/** Smooths the walk distance and derives walking state for the animation. */
export class Walker {
  x = 0;
  facing: 1 | -1 = 1;
  moving = false;
  /** accumulated distance, drives the leg cycle */
  step = 0;

  constructor(public instant: boolean) {}

  update(target: number, dt: number) {
    const prev = this.x;
    this.x = this.instant
      ? target
      : this.x + (target - this.x) * Math.min(1, dt * 7);
    if (Math.abs(target - this.x) < 0.05) this.x = target;
    const dx = this.x - prev;
    this.step += Math.abs(dx);
    this.moving = dt > 0 && Math.abs(dx) / dt > 6;
    if (dx > 0.01) this.facing = 1;
    else if (dx < -0.01) this.facing = -1;
  }

  get frame() {
    return Math.floor(this.step / 4) & 3;
  }
}
