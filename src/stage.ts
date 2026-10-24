import { defsSVG, sceneSVG } from './scene';
import { LOD_ON, SZ, lodOpacity, origins, related, sameRef } from './geometry';
import type { Level, Ref, Size, View } from './types';

export const refOf = (n: Element): Ref => {
  const d = (n as SVGElement).dataset;
  return { l: +d.l!, s: d.s as Ref['s'], i: +d.i! };
};

const byChild = (els: Element[]) => els.sort((a, b) => +(a as SVGElement).dataset.child! - +(b as SVGElement).dataset.child!) as SVGElement[];

/** Owns the SVG DOM: mounting scenes, level-of-detail fades and highlight painting. */
export class Stage {
  private levels: Level[] = [];
  private scenes: SVGElement[] = [];
  private nodes: SVGElement[] = [];
  private links: SVGElement[] = [];
  private phits: SVGElement[] = [];
  private pframes: SVGElement[] = [];
  private active: boolean[] = [];
  private org = origins(0);

  constructor(readonly svg: SVGSVGElement) {}

  mount(levels: Level[]) {
    this.levels = levels;
    this.org = origins(levels.length);
    this.svg.innerHTML = `${defsSVG}<g class="scene" data-l="0">${sceneSVG(levels, 0)}</g>`;
    const all = (sel: string) => [...this.svg.querySelectorAll<SVGElement>(sel)];
    this.scenes = all('.scene').sort((a, b) => +a.dataset.l! - +b.dataset.l!);
    this.nodes = all('.node');
    this.links = all('.link');
    this.phits = byChild(all('.phit'));
    this.pframes = byChild(all('.pframe'));
    this.active = levels.map((_, l) => l === 0);
  }

  /** Is this level's scene visible and interactive at the current zoom? */
  isActive(l: number) {
    return !!this.active[l];
  }

  /** Applies the camera to the SVG and returns the level that now fills the screen. */
  apply(v: View, size: Size): number {
    const ps = size.w / v.w;
    this.svg.setAttribute('viewBox', `${v.cx - v.w / 2} ${v.cy - (v.w * size.h) / size.w / 2} ${v.w} ${(v.w * size.h) / size.w}`);
    let cur = 0;
    for (let l = 1; l < this.levels.length; l++) {
      const px = SZ * this.org[l]!.k * ps;
      const o = lodOpacity(px);
      const on = o > LOD_ON;
      this.scenes[l]!.style.opacity = String(o);
      this.scenes[l]!.style.pointerEvents = on ? 'auto' : 'none';
      this.phits[l - 1]!.style.pointerEvents = on ? 'none' : 'all';
      this.pframes[l - 1]!.style.opacity = String(1 - o);
      if (px >= 0.45 * Math.min(size.w, size.h)) cur = l;
      if (on !== this.active[l]) {
        this.active[l] = on;
        for (const n of this.nodes) if (+n.dataset.l! === l) n.setAttribute('tabindex', on ? '0' : '-1');
      }
    }
    return cur;
  }

  /** Highlights `focus` (hover wins over selection) and its counterparts; dims the rest of that level. */
  paint(sel: Ref | null, hov: Ref | null) {
    const ref = hov ?? sel;
    for (const n of this.nodes) n.classList.remove('on', 'dim', 'sel');
    for (const e of this.links) e.classList.remove('on', 'dim');
    if (!ref) return;
    const rel = related(this.levels[ref.l]!, ref);
    for (const n of this.nodes) {
      if (+n.dataset.l! !== ref.l) continue;
      const r = refOf(n);
      const hit = sameRef(r, ref) || rel.some((x) => x.s === r.s && x.i === r.i);
      n.classList.add(hit ? 'on' : 'dim');
      if (sameRef(r, sel)) n.classList.add('sel');
    }
    for (const e of this.links)
      if (+e.dataset.l! === ref.l) e.classList.add(rel.some((x) => x.n === +e.dataset.n!) ? 'on' : 'dim');
  }
}
