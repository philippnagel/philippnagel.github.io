import { ease, flyFrame } from './geometry';
import type { Size, View } from './types';

/** View state plus animated transitions. Rendering is delegated through `onChange`. */
export class Camera {
  view: View = { cx: 500, cy: 500, w: 1100 };
  private anim = 0;

  constructor(
    private readonly size: () => Size,
    private readonly onChange: (v: View) => void,
    private readonly reduceMotion: boolean,
  ) {}

  set(v: View) {
    this.view = { ...v };
    this.onChange(this.view);
  }

  stop() {
    cancelAnimationFrame(this.anim);
    this.anim = 0;
  }

  flyTo(to: View) {
    this.stop();
    const from = { ...this.view };
    const dur = this.reduceMotion ? 0 : 900 + 250 * Math.abs(Math.log10(to.w / from.w));
    const t0 = performance.now();
    const step = (now: number) => {
      const u = dur ? Math.min(1, (now - t0) / dur) : 1;
      this.set(flyFrame(from, to, ease(u)));
      this.anim = u < 1 ? requestAnimationFrame(step) : 0;
    };
    this.anim = requestAnimationFrame(step);
  }

  toWorld(px: number, py: number): [number, number] {
    const { w, h } = this.size();
    const ps = w / this.view.w;
    return [this.view.cx + (px - w / 2) / ps, this.view.cy + (py - h / 2) / ps];
  }

  /** Zooms by factor `f` keeping the world point under (px, py) fixed. */
  zoomAt(px: number, py: number, f: number) {
    const nw = Math.min(2600, Math.max(6, this.view.w * f));
    const [wx, wy] = this.toWorld(px, py);
    const r = nw / this.view.w;
    this.set({ cx: wx - (wx - this.view.cx) * r, cy: wy - (wy - this.view.cy) * r, w: nw });
  }

  panBy(dxPx: number, dyPx: number) {
    const ps = this.size().w / this.view.w;
    this.set({ ...this.view, cx: this.view.cx - dxPx / ps, cy: this.view.cy - dyPx / ps });
  }
}
