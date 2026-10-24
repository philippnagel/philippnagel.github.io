export type Theme = "night" | "day";

export interface Pal {
  night: boolean;
  /** sky bands, top to bottom */
  sky: string[];
  far: string;
  hill: string;
  ground: string;
  grass2: string;
  path: string;
  line: string;
  dot: string;
  /** foreground silhouettes */
  fg: string;
  shadow: string;
  ink: string;
  dim: string;
  white: string;
  steel: string;
  steelDark: string;
  /** window / lamp light */
  glow: string;
  red: string;
  blue: string;
  green: string;
  yellow: string;
  skin: string;
  hair: string;
  jacket: string;
  shirt: string;
  pants: string;
  shoe: string;
}

const hex = (h: string, i: number) =>
  parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);

export const mix = (a: string, b: string, t: number) => {
  const c = (i: number) =>
    Math.round(hex(a, i) + (hex(b, i) - hex(a, i)) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${c(0)}${c(1)}${c(2)}`;
};

const shared = {
  red: "#d82d17",
  blue: "#4398cd",
  green: "#47a639",
  yellow: "#edcb1f",
  skin: "#f2c6a0",
  hair: "#c07a3c",
  shirt: "#5b8fd0",
  pants: "#33415c",
  shoe: "#e8e8e8",
};

const day: Pal = {
  ...shared,
  night: false,
  sky: ["#4fa3e8", "#67b4ee", "#82c4f3", "#9dd2f7", "#b8e0fa", "#d2ecfb"],
  far: "#a9cbe0",
  hill: "#8dbf9a",
  ground: "#5cae45",
  grass2: "#4c9a38",
  path: "#d9c79a",
  line: "#2f6f27",
  dot: "#6cbc52",
  fg: "#3b8a2c",
  shadow: "#3d7f30",
  ink: "#10131a",
  dim: "#4a5568",
  white: "#f4f6f8",
  steel: "#9aa4b2",
  steelDark: "#6b7686",
  glow: "#fff3b0",
  jacket: "#2b2d36",
};

const night: Pal = {
  ...shared,
  night: true,
  sky: ["#050818", "#0a1030", "#0f1a46", "#16255a", "#1d3070", "#243a80"],
  far: "#101a3d",
  hill: "#142a4a",
  ground: "#1c4430",
  grass2: "#17392a",
  path: "#363a5c",
  line: "#0d2418",
  dot: "#24563c",
  fg: "#0a1a12",
  shadow: "#10281c",
  ink: "#e6edf3",
  dim: "#8b98c0",
  white: "#d8def0",
  steel: "#5b6585",
  steelDark: "#3c4566",
  glow: "#ffd75a",
  jacket: "#3a3d4a",
};

export const palette = (t: Theme): Pal => (t === "night" ? night : day);
