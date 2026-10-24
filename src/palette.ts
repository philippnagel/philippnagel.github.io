/** Five-tone material ramp: [outline/darkest, shadow, base, light, highlight]. */
export type Ramp = [string, string, string, string, string];

export interface Pal {
  night: boolean;
  /** vertical gradient stops for the data band, top to bottom */
  sky: string[];
  dot: string;
  ink: string;
  inkDim: string;
  outline: string;
  power: string;
  data: string;
  white: string;
  metal: Ramp;
  steel: Ramp;
  dark: Ramp;
  concrete: Ramp;
  wall: Ramp;
  roof: Ramp;
  wood: Ramp;
  soil: Ramp;
  grass: Ramp;
  leaf: Ramp;
  glass: Ramp;
  pv: Ramp;
  yellow: Ramp;
  red: Ramp;
  purple: Ramp;
  cyan: Ramp;
  amber: Ramp;
  skin: Ramp;
  road: Ramp;
  paper: Ramp;
}

const hex = (h: string, i: number) =>
  parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
export const mix = (a: string, b: string, t: number) => {
  const c = (i: number) =>
    Math.round(hex(a, i) * (1 - t) + hex(b, i) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${c(0)}${c(1)}${c(2)}`;
};

/** Builds a ramp with hue-shifted shadows and highlights. */
function ramp(base: string, shadow: string, light: string): Ramp {
  return [
    mix(base, shadow, 0.72),
    mix(base, shadow, 0.38),
    base,
    mix(base, light, 0.32),
    mix(base, light, 0.65),
  ];
}

const BASES = {
  metal: "#8e9bab",
  steel: "#5d6f88",
  dark: "#363d4a",
  concrete: "#b8bcc4",
  wall: "#eadcbf",
  roof: "#c4503f",
  wood: "#8b5a36",
  soil: "#7a5636",
  grass: "#74b85c",
  leaf: "#3f9048",
  glass: "#8fd0ee",
  pv: "#2c4c96",
  yellow: "#f2c230",
  red: "#d8453c",
  purple: "#7c5cc8",
  cyan: "#14a8cc",
  amber: "#f5a020",
  skin: "#e8b890",
  road: "#59616d",
  paper: "#f4f1e8",
} as const;

function build(night: boolean): Pal {
  const shadow = night ? "#04060f" : "#1d1438";
  const light = night ? "#bfd8ff" : "#fff3cf";
  const tint = (c: string) => (night ? mix(c, "#0b1630", 0.5) : c);
  const R = (k: keyof typeof BASES) => {
    let base = tint(BASES[k]);
    if (night && k === "glass") base = "#ffcf5e";
    return ramp(base, shadow, k === "glass" && night ? "#fff3c4" : light);
  };
  const ramps = Object.fromEntries(
    (Object.keys(BASES) as (keyof typeof BASES)[]).map((k) => [k, R(k)]),
  ) as Record<keyof typeof BASES, Ramp>;
  return {
    night,
    sky: night
      ? ["#050a1a", "#08122a", "#0d1c3c", "#14294f", "#1b3560"]
      : ["#7fc0ee", "#9ad0f2", "#b8e0f6", "#d4ecf9", "#eaf6fc"],
    dot: night ? "#27487a" : "#8dbfe0",
    ink: night ? "#e4f1ff" : "#15202e",
    inkDim: night ? "#86a2c0" : "#43566b",
    outline: ramps.dark[0],
    power: night ? "#ffb020" : "#f59e0b",
    data: night ? "#2ad4ff" : "#0b9fc4",
    white: night ? "#d7e6ff" : "#ffffff",
    ...ramps,
  };
}

export const palettes = { day: build(false), night: build(true) } as const;
export type Theme = keyof typeof palettes;
