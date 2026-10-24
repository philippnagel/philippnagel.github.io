import type { Level, Origin, Ref, Related, Size, View } from './types';

/** Scene frame is a SZ x SZ square; every level is drawn at this local size. */
export const SZ = 1000;
export const PW = 420;
export const NH = 190;
export const GAP = 40;
export const Y0 = 100;
export const PORT = 100;
export const KID = PORT / SZ;
/** Index of the physical node that holds the portal into the next level. */
export const DRILL = 3;
export const X = { p: 30, r: 550 } as const;

export const ny = (i: number) => Y0 + i * (NH + GAP);
export const PX = X.p + PW - PORT - 14;
export const PY = ny(DRILL) + (NH - PORT) / 2;

/** World-space origin and scale of each nested scene. */
export function origins(depth: number): Origin[] {
  const out: Origin[] = [{ x: 0, y: 0, k: 1 }];
  for (let l = 1; l < depth; l++) {
    const o = out[l - 1]!;
    out.push({ x: o.x + o.k * PX, y: o.y + o.k * PY, k: o.k * KID });
  }
  return out;
}

export interface Insets {
  top: number;
  right: number;
  bottom: number;
}

/** Camera that frames scene `o` inside the free area left by the UI chrome. */
export function fitView(o: Origin, size: Size, ins: Insets): View {
  const frame = SZ * o.k;
  const aw = size.w - ins.right;
  const ah = size.h - ins.top - ins.bottom;
  const ps = Math.min(aw, ah) / (frame * 1.05);
  const acx = aw / 2;
  const acy = ins.top + ah / 2;
  return {
    cx: o.x + frame / 2 - (acx - size.w / 2) / ps,
    cy: o.y + frame / 2 - (acy - size.h / 2) / ps,
    w: size.w / ps,
  };
}

/** Opacity of a child scene given its on-screen size in px. */
export const lodOpacity = (px: number) => Math.min(1, Math.max(0, (px - 70) / 110));
export const LOD_ON = 0.6;

export const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

/** Interpolates two views; zoom is exponential, pan keeps the screen-space path straight. */
export function flyFrame(from: View, to: View, u: number): View {
  const w = Math.exp(Math.log(from.w) + (Math.log(to.w) - Math.log(from.w)) * u);
  const dInv = 1 / to.w - 1 / from.w;
  const s = Math.abs(dInv) < 1e-12 ? u : (1 / w - 1 / from.w) / dInv;
  return { cx: from.cx + (to.cx - from.cx) * s, cy: from.cy + (to.cy - from.cy) * s, w };
}

/** Nodes on the other stream linked to `ref`. */
export function related(level: Level, ref: Ref): Related[] {
  const out: Related[] = [];
  level.links.forEach(([a, b], n) => {
    if (ref.s === 'p' && a === ref.i) out.push({ n, s: 'r', i: b });
    if (ref.s === 'r' && b === ref.i) out.push({ n, s: 'p', i: a });
  });
  return out;
}

export const sameRef = (a: Ref | null, b: Ref | null) =>
  !!a && !!b && a.l === b.l && a.s === b.s && a.i === b.i;
