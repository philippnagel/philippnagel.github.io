export type Side = 'p' | 'r';
export type Frame = [code: string, note: string | null][];

export interface NodeData {
  /** title */
  t: string;
  /** mono tag line */
  tag: string;
  /** sub lines shown on the node */
  l: string[];
  /** description shown in the side panel */
  i: string;
  /** key into the frames table */
  f?: string;
}

export interface Level {
  name: string;
  p: NodeData[];
  r: NodeData[];
  /** [physical index, protocol index] pairs */
  links: [number, number][];
}

export interface Market {
  id: string;
  label: string;
  levels: Level[];
}

export interface Ref {
  l: number;
  s: Side;
  i: number;
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

export interface Related {
  n: number;
  s: Side;
  i: number;
}
