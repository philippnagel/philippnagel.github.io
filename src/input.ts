import type { Camera } from './camera';

interface Pt { x: number; y: number }

/** Wheel zoom, drag pan and two-finger pinch. `moved` lets click handlers ignore drags. */
export class Input {
  moved = false;
  private ptrs = new Map<number, Pt>();
  private last: (Pt & { d: number }) | null = null;

  constructor(
    private readonly el: HTMLElement,
    private readonly cam: Camera,
    private readonly onInteract: () => void,
  ) {
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      cam.stop();
      cam.zoomAt(e.clientX, e.clientY, Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
      onInteract();
    }, { passive: false });
    el.addEventListener('pointerdown', (e) => {
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.moved = false;
      cam.stop();
      this.last = this.centroid();
    });
    window.addEventListener('pointermove', (e) => this.move(e));
    window.addEventListener('pointerup', (e) => this.release(e));
    window.addEventListener('pointercancel', (e) => this.release(e));
  }

  private centroid() {
    const pts = [...this.ptrs.values()];
    if (!pts.length) return null;
    const x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return { x, y, d: pts.length > 1 ? Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y) : 0 };
  }

  private move(e: PointerEvent) {
    const p = this.ptrs.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    const now = this.centroid()!;
    if (!this.moved && Math.hypot(dx, dy) < 3 && this.ptrs.size === 1) return;
    if (!this.moved) {
      this.moved = true;
      this.el.classList.add('drag');
      this.onInteract();
    }
    if (this.ptrs.size >= 2 && this.last?.d) this.cam.zoomAt(now.x, now.y, this.last.d / now.d);
    if (this.last) this.cam.panBy(now.x - this.last.x, now.y - this.last.y);
    this.last = now;
  }

  private release(e: PointerEvent) {
    this.ptrs.delete(e.pointerId);
    this.last = this.centroid();
    if (!this.ptrs.size) this.el.classList.remove('drag');
  }
}
