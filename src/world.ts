import { palettes, type Pal, type Theme } from "./palette";
import { Pix } from "./pix";
import { envelope } from "./art/common";
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
  pal: Pal;
  scenes: BuiltScene[];
  env: HTMLCanvasElement;
}

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
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
        if (w.kind === "p") g.p(x, y, pal.metal2);
        else if (i % 2 === 0) g.p(x, y, pal.data);
      });
    const objs = new Map<string, HTMLCanvasElement>();
    for (const o of def.objects) {
      const c = canvas(o.w, o.h);
      o.paint(pixOf(c), pal);
      objs.set(o.id, c);
    }
    return { def, bg, objs, adj: adjacencyOf(def) };
  });
  const env = canvas(9, 6);
  envelope(pixOf(env), pal, 0, 0);
  return { pal, scenes, env };
}
