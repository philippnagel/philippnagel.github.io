import type { Pal } from "./palette";
import type { Pix } from "./pix";

/** 'p' = physical power layer, 'd' = data / protocol layer. */
export type Layer = "p" | "d";
export type LayerMode = "both" | Layer;

export interface Obj {
  id: string;
  layer: Layer;
  /** top-left and size in scene art pixels */
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  /** one-line caption shown on hover / selection */
  text: string;
  /** ids of objects on the other layer that this one acts on */
  links: string[];
  /** paints in object-local coordinates (0,0 = top-left) */
  paint: (g: Pix, pal: Pal) => void;
  /** when set, a child scene lives in a PORTAL_W x PORTAL_H window at (x+dx, y+dy) */
  portal?: { dx: number; dy: number };
}

export interface Wire {
  kind: Layer;
  pts: [number, number][];
}

export interface SceneDef {
  id: string;
  /** breadcrumb name */
  name: string;
  /** caption shown when nothing is focused */
  hint: string;
  bg: (g: Pix, pal: Pal) => void;
  objects: Obj[];
  wires: Wire[];
}

export interface Ref {
  l: number;
  id: string;
}

export interface View {
  cx: number;
  cy: number;
  w: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Origin {
  x: number;
  y: number;
  k: number;
}

export interface Insets {
  top: number;
  right: number;
  bottom: number;
}
