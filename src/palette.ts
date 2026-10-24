export interface Pal {
  bandA: string;
  bandB: string;
  dot: string;
  ground: string;
  ground2: string;
  road: string;
  outline: string;
  ink: string;
  inkDim: string;
  wall: string;
  wall2: string;
  roof: string;
  roof2: string;
  wood: string;
  concrete: string;
  metal: string;
  metal2: string;
  metalDark: string;
  glass: string;
  pv: string;
  pv2: string;
  cable: string;
  panel: string;
  panel2: string;
  green: string;
  green2: string;
  purple: string;
  power: string;
  data: string;
  white: string;
  yellow: string;
  red: string;
}

const day: Pal = {
  bandA: "#d8ecf8",
  bandB: "#cfe6f5",
  dot: "#a5cde4",
  ground: "#8fc46a",
  ground2: "#7db35a",
  road: "#6b7480",
  outline: "#1b2430",
  ink: "#1b2430",
  inkDim: "#4a5a6c",
  wall: "#ece0c6",
  wall2: "#cfc19f",
  roof: "#c05040",
  roof2: "#92392f",
  wood: "#8a5a35",
  concrete: "#b9bfc7",
  metal: "#a3afbd",
  metal2: "#74828f",
  metalDark: "#4b5865",
  glass: "#9fd3ee",
  pv: "#2b4a8c",
  pv2: "#4468b8",
  cable: "#2a2f3a",
  panel: "#5f6b78",
  panel2: "#4d5864",
  green: "#3f9b4a",
  green2: "#2d7a38",
  purple: "#7a5ac8",
  power: "#f59e0b",
  data: "#0b9fc4",
  white: "#ffffff",
  yellow: "#f2c230",
  red: "#d9453d",
};

const mix = (a: string, b: string, t: number) => {
  const n = (h: string, i: number) =>
    parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = (i: number) =>
    Math.round(n(a, i) * (1 - t) + n(b, i) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${c(0)}${c(1)}${c(2)}`;
};

const NIGHT_TINT = "#0a1224";
const keep = new Set<keyof Pal>(["power", "data", "white", "yellow", "red"]);

function nightOf(d: Pal): Pal {
  const out = { ...d };
  for (const k of Object.keys(d) as (keyof Pal)[])
    if (!keep.has(k)) out[k] = mix(d[k], NIGHT_TINT, 0.38);
  Object.assign(out, {
    bandA: "#0d1a30",
    bandB: "#0b162a",
    dot: "#1f3b63",
    outline: "#03060c",
    ink: "#cfe6f5",
    inkDim: "#7f9bb5",
    glass: "#ffd45a",
    ground: "#14301f",
    ground2: "#102a1a",
    road: "#1a212c",
    power: "#ffb020",
    data: "#2ad4ff",
  });
  return out;
}

export const palettes = { day, night: nightOf(day) } as const;
export type Theme = keyof typeof palettes;
