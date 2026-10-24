import { palettes, type Pal, type Theme } from "./palette";
import { Pix } from "./pix";
import { envelope } from "./art/kit";
import { SH, SW } from "./geometry";
import { adjacencyOf } from "./graph";
import type { SceneDef } from "./types";

export interface BuiltScene {
  def: SceneDef;
  bg: HTMLCanvasElement;
  objs: Map<string, HTMLCanvasElement>;
  /** symmetric link adjacency between object ids */
  adj: Map<string, Set<string>>;
}

export interface World {
  /** alpha (0-255) of an object bitmap at a local pixel */
  alphaAt: (c: HTMLCanvasElement, x: number, y: number) => number;
  /** coloured silhouette of a bitmap grown by `g` px, for outlines */
  silhouette: (
    c: HTMLCanvasElement,
    color: string,
    g: number,
  ) => HTMLCanvasElement;
  pal: Pal;
  scenes: BuiltScene[];
  env: HTMLCanvasElement;
  glow: (color: string, r: number) => HTMLCanvasElement;
}

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
const p2 = (pal: Pal) =>
  pal.night ? "rgba(42,212,255,.35)" : "rgba(11,159,196,.25)";
const pixOf = (c: HTMLCanvasElement) => new Pix(c.getContext("2d")!);

/** Pre-renders every scene background and object into 1:1 art-pixel bitmaps. */
export function buildWorld(defs: SceneDef[], theme: Theme): World {
  const pal = palettes[theme];
  const scenes = defs.map((def): BuiltScene => {
    const bg = canvas(SW, SH);
    const g = pixOf(bg);
    def.bg(g, pal);
    for (const w of def.wires)
      w.pts.forEach(([x, y], i) => {
        if (w.kind === "p") {
          g.r(x, y, 2, 2, pal.dark[1]);
          if (i % 3 === 0) g.p(x, y - 1, pal.metal[3]);
        } else if (i % 4 < 2) {
          g.r(x, y, 2, 2, pal.data);
          g.p(x - 1, y - 1, p2(pal));
        }
      });
    const objs = new Map<string, HTMLCanvasElement>();
    for (const o of def.objects) {
      const c = canvas(o.w, o.h);
      o.paint(pixOf(c), pal);
      objs.set(o.id, c);
    }
    return { def, bg, objs, adj: adjacencyOf(def) };
  });
  const env = canvas(15, 10);
  envelope(pixOf(env), pal, 0, 0);
  const alphas = new WeakMap<HTMLCanvasElement, Uint8ClampedArray>();
  const alphaAt = (c: HTMLCanvasElement, x: number, y: number) => {
    if (x < 0 || y < 0 || x >= c.width || y >= c.height) return 0;
    let d = alphas.get(c);
    if (!d) {
      d = c
        .getContext("2d", { willReadFrequently: true })!
        .getImageData(0, 0, c.width, c.height).data;
      alphas.set(c, d);
    }
    return d[(Math.floor(y) * c.width + Math.floor(x)) * 4 + 3]!;
  };
  const sil = new Map<string, HTMLCanvasElement>();
  const ids = new WeakMap<HTMLCanvasElement, number>();
  let nextId = 1;
  const silhouette = (c: HTMLCanvasElement, color: string, g: number) => {
    if (!ids.has(c)) ids.set(c, nextId++);
    const key = `${ids.get(c)}:${color}:${g}`;
    let out = sil.get(key);
    if (!out) {
      out = canvas(c.width + g * 2, c.height + g * 2);
      const cx = out.getContext("2d")!;
      for (let dy = -g; dy <= g; dy++)
        for (let dx = -g; dx <= g; dx++) cx.drawImage(c, g + dx, g + dy);
      cx.globalCompositeOperation = "source-in";
      cx.fillStyle = color;
      cx.fillRect(0, 0, out.width, out.height);
      sil.set(key, out);
    }
    return out;
  };
  const glows = new Map<string, HTMLCanvasElement>();
  const glow = (color: string, r: number) => {
    const key = `${color}:${r}`;
    let c = glows.get(key);
    if (!c) {
      c = canvas(r * 2, r * 2);
      const cx = c.getContext("2d")!;
      const gr = cx.createRadialGradient(r, r, 0, r, r, r);
      gr.addColorStop(0, color + "aa");
      gr.addColorStop(0.4, color + "44");
      gr.addColorStop(1, color + "00");
      cx.fillStyle = gr;
      cx.fillRect(0, 0, r * 2, r * 2);
      glows.set(key, c);
    }
    return c;
  };
  return { pal, scenes, env, glow, alphaAt, silhouette };
}
