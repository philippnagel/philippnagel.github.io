import type { Insets, Obj, Origin, SceneDef, Size, View } from "./types";

/** Every scene is a SW x SH grid of art pixels. */
export const SW = 640;
export const SH = 360;
/** Divider between the data band (above) and the power band (below). */
export const BAND_Y = 160;
export const PORTAL_W = 96;
export const PORTAL_H = 54;
export const KID = PORTAL_W / SW;

/** Scene-space window of an object's portal. */
export const portalRect = (o: Obj) => ({
  x: o.x + o.portal!.dx,
  y: o.y + o.portal!.dy,
  w: PORTAL_W,
  h: PORTAL_H,
});
export const portalOf = (s: SceneDef) => s.objects.find((o) => o.portal);

/** World-space origin and scale of each nested scene. */
export function origins(scenes: SceneDef[]): Origin[] {
  const out: Origin[] = [{ x: 0, y: 0, k: 1 }];
  for (let l = 1; l < scenes.length; l++) {
    const parent = out[l - 1]!;
    const p = portalOf(scenes[l - 1]!);
    if (!p)
      throw new Error(
        `scene ${scenes[l - 1]!.id} has no portal but a child exists`,
      );
    const r = portalRect(p);
    out.push({
      x: parent.x + parent.k * r.x,
      y: parent.y + parent.k * r.y,
      k: parent.k * KID,
    });
  }
  return out;
}

/** Camera that frames scene `o` inside the area left free by the UI chrome. */
export function fitView(o: Origin, size: Size, ins: Insets): View {
  const fw = SW * o.k;
  const fh = SH * o.k;
  const aw = size.w - ins.right;
  const ah = size.h - ins.top - ins.bottom;
  const ps = Math.min(aw / fw, ah / fh) / 1.04;
  return {
    cx: o.x + fw / 2 - (aw / 2 - size.w / 2) / ps,
    cy: o.y + fh / 2 - (ins.top + ah / 2 - size.h / 2) / ps,
    w: size.w / ps,
  };
}

/** Opacity of a nested scene from its on-screen width relative to the viewport's short side. */
export const LOD_ON = 0.6;
export const lodOpacity = (px: number, minDim: number) =>
  Math.min(1, Math.max(0, (px / minDim - 0.3) / 0.4));

export const ease = (u: number) =>
  u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

/** Interpolates two views; zoom is exponential, pan keeps the screen-space path straight. */
export function flyFrame(from: View, to: View, u: number): View {
  const w = Math.exp(
    Math.log(from.w) + (Math.log(to.w) - Math.log(from.w)) * u,
  );
  const dInv = 1 / to.w - 1 / from.w;
  const s = Math.abs(dInv) < 1e-12 ? u : (1 / w - 1 / from.w) / dInv;
  return {
    cx: from.cx + (to.cx - from.cx) * s,
    cy: from.cy + (to.cy - from.cy) * s,
    w,
  };
}
