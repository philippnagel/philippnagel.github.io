import type { Insets, Obj, Origin, SceneDef, Size, View } from "./types";

/** Every scene is a SW x SH grid of art pixels. */
export const SW = 960;
export const SH = 540;
export const PORTAL_W = 144;
export const PORTAL_H = 81;
export const KID = PORTAL_W / SW;

/** Scene-space window of an object's portal. */
export const portalRect = (o: Obj) => ({
  x: o.portal!.x,
  y: o.portal!.y,
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
  const left = ins.left ?? 0;
  const aw = size.w - left - ins.right;
  const ah = size.h - ins.top - ins.bottom;
  const ps = Math.min(aw / fw, ah / fh) / 1.04;
  return {
    cx: o.x + fw / 2 - (left + aw / 2 - size.w / 2) / ps,
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

/** Section stops along the scroll track: the level each one frames. */
export const STOPS = [0, 0, 1, 2, 3, 3];

/** Share of each section during which the camera holds still at either end. */
const HOLD = 0.3;

/** Scroll position `t` (in sections) to a camera view between consecutive stops. */
export function scrollView(t: number, fit: (level: number) => View): View {
  const k = Math.max(0, Math.min(STOPS.length - 2, Math.floor(t)));
  const f = Math.max(0, Math.min(1, (t - k - HOLD) / (1 - 2 * HOLD)));
  return flyFrame(fit(STOPS[k]!), fit(STOPS[k + 1]!), ease(f));
}
