import {
  LOD_ON,
  KID,
  SH,
  SW,
  lodOpacity,
  origins,
  portalOf,
  portalRect,
} from "./geometry";
import { routePts } from "./pix";
import type { LayerMode, Obj, Ref, SceneDef, Size, View } from "./types";
import type { World } from "./world";

export interface RenderState {
  layer: LayerMode;
  sel: Ref | null;
  hov: Ref | null;
}

export interface Hit {
  l: number;
  obj: Obj | null;
}

const SPARK_SPEED = 34;
const ENV_SPEED = 24;

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly org;
  private routes = new Map<string, [number, number][]>();
  world!: World;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly defs: SceneDef[],
    private readonly reduceMotion: boolean,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.org = origins(defs);
  }

  setWorld(w: World) {
    this.world = w;
    this.routes.clear();
  }

  /** On-screen width (css px) of scene l at the given view. */
  private px(l: number, v: View, s: Size) {
    return SW * this.org[l]!.k * (s.w / v.w);
  }

  /** Fade-in factor of scene l (level 0 is always 1). */
  opacity(l: number, v: View, s: Size) {
    return l === 0 ? 1 : lodOpacity(this.px(l, v, s), Math.min(s.w, s.h));
  }

  /** Deepest scene that mostly fills the screen. */
  levelAt(v: View, s: Size) {
    let cur = 0;
    for (let l = 1; l < this.defs.length; l++)
      if (this.px(l, v, s) >= 0.5 * Math.min(s.w, s.h)) cur = l;
    return cur;
  }

  /** Is a scene interactive (visible enough)? */
  active(l: number, v: View, s: Size) {
    return l === 0 || this.opacity(l, v, s) > LOD_ON;
  }

  pick(v: View, s: Size, cx: number, cy: number): Hit | null {
    const ps = s.w / v.w;
    const wx = v.cx + (cx - s.w / 2) / ps;
    const wy = v.cy + (cy - s.h / 2) / ps;
    for (let l = this.defs.length - 1; l >= 0; l--) {
      if (!this.active(l, v, s)) continue;
      const o = this.org[l]!;
      const lx = (wx - o.x) / o.k;
      const ly = (wy - o.y) / o.k;
      if (lx < 0 || ly < 0 || lx >= SW || ly >= SH) continue;
      const objs = this.defs[l]!.objects;
      for (let i = objs.length - 1; i >= 0; i--) {
        const b = objs[i]!;
        const r = b.portal ? portalRect(b) : null;
        const hitBody =
          lx >= b.x && lx < b.x + b.w && ly >= b.y && ly < b.y + b.h;
        const hitPortal =
          r && lx >= r.x && lx < r.x + r.w && ly >= r.y && ly < r.y + r.h;
        if (hitBody || hitPortal) return { l, obj: b };
      }
      return { l, obj: null };
    }
    return null;
  }

  draw(v: View, s: Size, dpr: number, st: RenderState, t: number) {
    const { ctx } = this;
    const ps = (s.w / v.w) * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.world.pal.bandB;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = false;
    const h = (v.w * s.h) / s.w;
    ctx.setTransform(
      ps,
      0,
      0,
      ps,
      -(v.cx - v.w / 2) * ps,
      -(v.cy - h / 2) * ps,
    );
    this.scene(0, 1, v, s, st, t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private focusOf(l: number, st: RenderState) {
    const f = st.hov ?? st.sel;
    return f && f.l === l ? f : null;
  }

  private scene(
    l: number,
    alpha: number,
    v: View,
    s: Size,
    st: RenderState,
    t: number,
  ) {
    const { ctx, world } = this;
    const b = world.scenes[l]!;
    const def = b.def;
    const focus = this.focusOf(l, st);
    const related = focus ? (b.adj.get(focus.id) ?? new Set<string>()) : null;
    const layerA = (layer: "p" | "d") =>
      st.layer === "both" || st.layer === layer ? 1 : 0.14;

    // As a child scene takes over the screen, its parent fades out so only the child remains.
    const pobj = portalOf(def);
    const childOp =
      pobj && l + 1 < this.defs.length ? this.opacity(l + 1, v, s) : 0;
    alpha *= 1 - 0.98 * childOp;

    ctx.globalAlpha = alpha;
    ctx.drawImage(b.bg, 0, 0);

    if (!this.reduceMotion) this.flows(def, alpha, st, t);

    for (const o of def.objects) {
      const dim = focus && o.id !== focus.id && !related!.has(o.id) ? 0.3 : 1;
      ctx.globalAlpha = alpha * layerA(o.layer) * dim;
      ctx.drawImage(b.objs.get(o.id)!, o.x, o.y);
    }
    ctx.globalAlpha = alpha;

    if (focus) this.highlight(def, b.adj, focus, alpha, st, t);

    if (pobj && l + 1 < this.defs.length) {
      const r = portalRect(pobj);
      const op = childOp;
      this.portalMarker(r, alpha * (1 - op), focus?.id === pobj.id, t);
      if (op > 0.01) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.clip();
        ctx.translate(r.x, r.y);
        ctx.scale(KID, KID);
        this.scene(l + 1, op, v, s, st, t);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  private flows(def: SceneDef, alpha: number, st: RenderState, t: number) {
    const { ctx, world } = this;
    for (const w of def.wires) {
      const a = alpha * (st.layer === "both" || st.layer === w.kind ? 1 : 0.14);
      const n = w.pts.length;
      if (n < 8) continue;
      ctx.globalAlpha = a;
      if (w.kind === "p") {
        ctx.fillStyle = world.pal.power;
        for (let k = 0; k < Math.max(2, Math.floor(n / 40)); k++) {
          const i = Math.floor(
            (t * SPARK_SPEED + (k * n) / Math.max(2, Math.floor(n / 40))) % n,
          );
          const [x, y] = w.pts[i]!;
          ctx.fillRect(x - 1, y - 1, 3, 3);
        }
      } else {
        const count = n > 160 ? 2 : 1;
        for (let k = 0; k < count; k++) {
          const i = Math.floor((t * ENV_SPEED + (k * n) / count) % n);
          const [x, y] = w.pts[i]!;
          ctx.drawImage(world.env, x - 4, y - 7);
        }
      }
    }
    ctx.globalAlpha = alpha;
  }

  private route(def: SceneDef, a: Obj, b: Obj) {
    const key = `${def.id}:${a.id}:${b.id}`;
    let r = this.routes.get(key);
    if (!r) {
      const aAbove = a.y + a.h <= b.y;
      const ax = Math.round(a.x + a.w / 2);
      const bx = Math.round(b.x + b.w / 2);
      r = aAbove
        ? routePts(ax, a.y + a.h, bx, b.y - 1)
        : routePts(ax, a.y - 1, bx, b.y + b.h);
      this.routes.set(key, r);
    }
    return r;
  }

  private outline(o: Obj, color: string, grow: number, a: number) {
    const { ctx } = this;
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    const x = o.x - grow,
      y = o.y - grow,
      w = o.w + grow * 2,
      h = o.h + grow * 2;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
  }

  private highlight(
    def: SceneDef,
    adj: Map<string, Set<string>>,
    f: Ref,
    alpha: number,
    st: RenderState,
    t: number,
  ) {
    const { ctx, world } = this;
    const byId = new Map(def.objects.map((o) => [o.id, o]));
    const self = byId.get(f.id)!;
    const color = (o: Obj) =>
      o.layer === "p" ? world.pal.power : world.pal.data;
    const pulse = 0.7 + 0.3 * Math.sin(t * 5);
    for (const rid of adj.get(f.id) ?? []) {
      const other = byId.get(rid)!;
      const pts = this.route(def, self, other);
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = world.pal.yellow;
      pts.forEach(([x, y], i) => {
        if (i % 3 === 0) ctx.fillRect(x, y, 1, 1);
      });
      ctx.globalAlpha = alpha * 0.35;
      pts.forEach(([x, y], i) => {
        if (i % 3 !== 0) ctx.fillRect(x, y, 1, 1);
      });
      if (!this.reduceMotion) {
        ctx.globalAlpha = alpha;
        for (let k = 0; k < 2; k++) {
          const i = Math.floor((t * 38 + (k * pts.length) / 2) % pts.length);
          const [x, y] = pts[i]!;
          ctx.drawImage(world.env, x - 4, y - 3);
        }
      }
      this.outline(other, color(other), 1, alpha * pulse);
    }
    this.outline(self, color(self), 1, alpha);
    this.outline(self, color(self), 2, alpha * 0.4 * pulse);
    ctx.globalAlpha = alpha;
  }

  private portalMarker(
    r: { x: number; y: number; w: number; h: number },
    a: number,
    focused: boolean,
    t: number,
  ) {
    if (a < 0.02) return;
    const { ctx, world } = this;
    ctx.globalAlpha = a * (focused ? 1 : 0.8);
    ctx.fillStyle = world.pal.yellow;
    for (let x = r.x; x < r.x + r.w; x += 2) {
      ctx.fillRect(x, r.y - 1, 1, 1);
      ctx.fillRect(x, r.y + r.h, 1, 1);
    }
    for (let y = r.y; y < r.y + r.h; y += 2) {
      ctx.fillRect(r.x - 1, y, 1, 1);
      ctx.fillRect(r.x + r.w, y, 1, 1);
    }
    // magnifier
    const mx = r.x + r.w - 9;
    const my = r.y - 9;
    ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(t * 4));
    ctx.fillStyle = world.pal.outline;
    ctx.fillRect(mx, my, 7, 7);
    ctx.fillStyle = world.pal.white;
    ctx.fillRect(mx + 1, my + 1, 4, 1);
    ctx.fillRect(mx + 1, my + 4, 4, 1);
    ctx.fillRect(mx + 1, my + 1, 1, 4);
    ctx.fillRect(mx + 4, my + 1, 1, 4);
    ctx.fillRect(mx + 5, my + 5, 2, 2);
  }
}
