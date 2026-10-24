import {
  KID,
  LOD_ON,
  SH,
  SW,
  lodOpacity,
  origins,
  portalOf,
  portalRect,
} from "./geometry";
import { Pix } from "./pix";
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
/** Opacity of the miniature next-level scene shown inside a portal frame. */
const THUMB_ALPHA = 0.92;

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

  /** Pixel-accurate picking: objects are hit where their bitmap is opaque. */
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
      const built = this.world.scenes[l]!;
      for (let i = objs.length - 1; i >= 0; i--) {
        const b = objs[i]!;
        const r = b.portal ? portalRect(b) : null;
        if (r && lx >= r.x && lx < r.x + r.w && ly >= r.y && ly < r.y + r.h)
          return { l, obj: b };
        if (
          lx >= b.x &&
          lx < b.x + b.w &&
          ly >= b.y &&
          ly < b.y + b.h &&
          this.world.alphaAt(built.objs.get(b.id)!, lx - b.x, ly - b.y) > 100
        )
          return { l, obj: b };
      }
      return { l, obj: null };
    }
    return null;
  }

  draw(v: View, s: Size, dpr: number, st: RenderState, t: number) {
    const { ctx } = this;
    const ps = (s.w / v.w) * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.world.pal.sky[4]!;
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
    this.scene(0, 1, v, s, st, t, true);
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
    full: boolean,
  ) {
    const { ctx, world } = this;
    const b = world.scenes[l]!;
    const def = b.def;
    const focus = full ? this.focusOf(l, st) : null;
    const related = focus ? (b.adj.get(focus.id) ?? new Set<string>()) : null;
    const layerA = (layer: "p" | "d") =>
      st.layer === "both" || st.layer === layer ? 1 : 0.14;

    // As a child scene takes over the screen, its parent fades out so only the child remains.
    const pobj = portalOf(def);
    const hasChild = !!pobj && l + 1 < this.defs.length;
    const childOp = hasChild ? this.opacity(l + 1, v, s) : 0;
    const a0 = alpha;
    alpha *= 1 - childOp;

    ctx.globalAlpha = alpha;
    ctx.drawImage(b.bg, 0, 0);

    const px = new Pix(ctx);
    if (full && !this.reduceMotion) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, SW, SH);
      ctx.clip();
      def.anim?.(px, t, world.pal);
      ctx.restore();
      ctx.globalAlpha = alpha;
      this.flows(def, alpha, st, t);
    }

    if (focus) this.halos(def, b, focus, alpha, t);
    for (const o of def.objects) {
      const dim = focus && o.id !== focus.id && !related!.has(o.id) ? 0.3 : 1;
      ctx.globalAlpha = alpha * layerA(o.layer) * dim;
      ctx.drawImage(b.objs.get(o.id)!, o.x, o.y);
      if (full && o.anim && !this.reduceMotion) {
        ctx.save();
        ctx.translate(o.x, o.y);
        o.anim(px, t, world.pal);
        ctx.restore();
      }
    }
    if (full && world.pal.night) this.lights(def, alpha, t);
    ctx.globalAlpha = alpha;

    if (focus) this.highlight(def, b, focus, alpha, t);

    if (hasChild && pobj) {
      const r = portalRect(pobj);
      this.portalFrame(r, alpha * (1 - childOp), focus?.id === pobj.id, t);
      this.connector(pobj, r, alpha * (1 - childOp), t);
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      ctx.translate(r.x, r.y);
      ctx.scale(KID, KID);
      this.scene(
        l + 1,
        a0 * Math.max(childOp, THUMB_ALPHA),
        v,
        s,
        st,
        t,
        childOp > 0.25,
      );
      ctx.restore();
      ctx.globalAlpha = alpha * (1 - childOp);
      this.scanlines(r);
    }
    ctx.globalAlpha = 1;
  }

  private lights(def: SceneDef, alpha: number, t: number) {
    const { ctx, world } = this;
    ctx.globalCompositeOperation = "lighter";
    for (const o of def.objects)
      for (const l of o.lights ?? []) {
        const sprite = world.glow(l.color, l.r);
        ctx.globalAlpha = alpha * (0.85 + 0.1 * Math.sin(t * 2 + l.x));
        ctx.drawImage(sprite, o.x + l.x - l.r, o.y + l.y - l.r);
      }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = alpha;
  }

  private flows(def: SceneDef, alpha: number, st: RenderState, t: number) {
    const { ctx, world } = this;
    for (const w of def.wires) {
      const a = alpha * (st.layer === "both" || st.layer === w.kind ? 1 : 0.14);
      const n = w.pts.length;
      if (n < 8) continue;
      ctx.globalAlpha = a;
      if (w.kind === "p") {
        const count = Math.max(2, Math.floor(n / 40));
        for (let k = 0; k < count; k++) {
          const i = Math.floor((t * SPARK_SPEED + (k * n) / count) % n);
          const [x, y] = w.pts[i]!;
          ctx.fillStyle = world.pal.power;
          ctx.fillRect(x - 2, y - 2, 4, 4);
          ctx.fillStyle = world.pal.white;
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      } else {
        const count = n > 160 ? 2 : 1;
        for (let k = 0; k < count; k++) {
          const i = Math.floor((t * ENV_SPEED + (k * n) / count) % n);
          const [x, y] = w.pts[i]!;
          ctx.drawImage(world.env, x - 7, y - 12);
        }
      }
    }
    ctx.globalAlpha = alpha;
  }

  /** Arc between two object centres, sampled to pixels. */
  private route(def: SceneDef, a: Obj, b: Obj) {
    const key = `${def.id}:${a.id}:${b.id}`;
    let r = this.routes.get(key);
    if (!r) {
      const x0 = a.x + a.w / 2,
        y0 = a.y + a.h / 2,
        x1 = b.x + b.w / 2,
        y1 = b.y + b.h / 2;
      const cx = (x0 + x1) / 2,
        cy = Math.min(y0, y1) - 50 - Math.abs(x1 - x0) * 0.08;
      const n = Math.max(
        24,
        Math.round((Math.abs(x1 - x0) + Math.abs(y1 - y0)) / 2.5),
      );
      r = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        r.push([
          Math.round(
            (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cx + u * u * x1,
          ),
          Math.round(
            (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * cy + u * u * y1,
          ),
        ]);
      }
      this.routes.set(key, r);
    }
    return r;
  }

  /** Coloured outlines drawn beneath the objects themselves. */
  private halos(
    def: SceneDef,
    b: { objs: Map<string, HTMLCanvasElement>; adj: Map<string, Set<string>> },
    f: Ref,
    alpha: number,
    t: number,
  ) {
    const { ctx, world } = this;
    const byId = new Map(def.objects.map((o) => [o.id, o]));
    const self = byId.get(f.id)!;
    const color = (o: Obj) =>
      o.layer === "p" ? world.pal.power : world.pal.data;
    const pulse = 0.7 + 0.3 * Math.sin(t * 5);
    const halo = (o: Obj, col: string, grow: number, a: number) => {
      ctx.globalAlpha = a;
      ctx.drawImage(
        world.silhouette(b.objs.get(o.id)!, col, grow),
        o.x - grow,
        o.y - grow,
      );
    };
    for (const rid of b.adj.get(f.id) ?? [])
      halo(byId.get(rid)!, color(byId.get(rid)!), 2, alpha * pulse);
    halo(self, color(self), 4, alpha * (0.35 + 0.25 * pulse));
    halo(self, color(self), 2, alpha);
    ctx.globalAlpha = alpha;
  }

  /** Link arcs and travelling envelopes between the focused object and its counterparts. */
  private highlight(
    def: SceneDef,
    b: { adj: Map<string, Set<string>> },
    f: Ref,
    alpha: number,
    t: number,
  ) {
    const { ctx, world } = this;
    const byId = new Map(def.objects.map((o) => [o.id, o]));
    const self = byId.get(f.id)!;
    for (const rid of b.adj.get(f.id) ?? []) {
      const other = byId.get(rid)!;
      const pts = this.route(def, self, other);
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = world.pal.yellow[3];
      pts.forEach(([x, y], i) => {
        if (i % 4 < 2) ctx.fillRect(x, y, 2, 2);
      });
      if (!this.reduceMotion) {
        ctx.globalAlpha = alpha;
        for (let k = 0; k < 2; k++) {
          const [x, y] =
            pts[Math.floor((t * 38 + (k * pts.length) / 2) % pts.length)]!;
          ctx.drawImage(world.env, x - 7, y - 5);
        }
      }
    }
    ctx.globalAlpha = alpha;
  }

  private portalFrame(
    r: { x: number; y: number; w: number; h: number },
    a: number,
    focused: boolean,
    t: number,
  ) {
    if (a < 0.02) return;
    const { ctx, world } = this;
    const col = focused ? world.pal.yellow[3] : world.pal.data;
    ctx.globalAlpha = a * (focused ? 1 : 0.55 + 0.25 * Math.sin(t * 3));
    ctx.fillStyle = col;
    const c = 14;
    for (const [x, y, dx, dy] of [
      [r.x, r.y, 1, 1],
      [r.x + r.w, r.y, -1, 1],
      [r.x, r.y + r.h, 1, -1],
      [r.x + r.w, r.y + r.h, -1, -1],
    ] as const) {
      ctx.fillRect(dx > 0 ? x - 3 : x + 1, dy > 0 ? y - 3 : y + 1, c, 3);
      ctx.fillRect(
        dx > 0 ? x - 3 : x + 1 - (c - 3),
        dy > 0 ? y - 3 : y + 1 - (c - 3),
        3,
        c,
      );
    }
    ctx.globalAlpha = a * 0.25;
    ctx.fillRect(r.x - 3, r.y - 3, r.w + 6, 1);
    ctx.fillRect(r.x - 3, r.y + r.h + 2, r.w + 6, 1);
    // magnifier
    const mx = r.x + r.w - 20,
      my = r.y - 26;
    ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(t * 4));
    ctx.fillStyle = world.pal.outline;
    ctx.fillRect(mx, my, 16, 16);
    ctx.fillStyle = world.pal.white;
    ctx.fillRect(mx + 2, my + 2, 9, 2);
    ctx.fillRect(mx + 2, my + 9, 9, 2);
    ctx.fillRect(mx + 2, my + 2, 2, 9);
    ctx.fillRect(mx + 9, my + 2, 2, 9);
    ctx.fillRect(mx + 11, my + 11, 4, 4);
  }

  /** Dotted beam from the portal object up to its hologram window. */
  private connector(
    o: Obj,
    r: { x: number; y: number; w: number; h: number },
    a: number,
    t: number,
  ) {
    if (a < 0.02) return;
    const { ctx, world } = this;
    const x0 = o.x + o.w * 0.5,
      y0 = o.y + o.h * 0.35,
      x1 = r.x + r.w / 2,
      y1 = r.y + r.h;
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 4);
    ctx.fillStyle = world.pal.data;
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha =
        a * (0.25 + 0.6 * ((Math.sin(t * 3 - i * 0.5) + 1) / 2));
      ctx.fillRect(
        Math.round(x0 + ((x1 - x0) * i) / n),
        Math.round(y0 + ((y1 - y0) * i) / n),
        2,
        2,
      );
    }
  }

  /** Subtle hologram scanlines over a portal thumbnail. */
  private scanlines(r: { x: number; y: number; w: number; h: number }) {
    const { ctx, world } = this;
    ctx.fillStyle = world.pal.night
      ? "rgba(42,212,255,.10)"
      : "rgba(11,159,196,.08)";
    for (let y = r.y; y < r.y + r.h; y += 3) ctx.fillRect(r.x, y, r.w, 1);
  }
}
