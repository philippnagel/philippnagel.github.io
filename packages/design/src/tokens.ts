/** Who the brand is: the facts every medium prints. */
export const IDENTITY = {
  name: "Philipp Nagel",
  role: "Smart energy: metering, storage & markets",
  email: "phil@philippnagel.com",
  phone: "+49 151 1436 7551",
  linkedin: "linkedin.com/in/philippnagel",
  site: "philippnagel.com",
  url: "https://philippnagel.com/",
};

/** Accent colours, the same by day and night. */
export const ACCENT = {
  red: "#d82d17",
  blue: "#4398cd",
  green: "#47a639",
  yellow: "#edcb1f",
};

/** UI surface colours per scheme; `bg` is also the browser bar colour. */
export const UI = {
  day: {
    bg: "#bfe4fa",
    card: "#ffffff",
    ink: "#10131a",
    mute: "#4a5568",
    line: "#10131a",
    /** blue for small text: 5.8:1 on white */
    blueText: "#1f6a9c",
  },
  night: {
    bg: "#0f1a46",
    card: "#0a1030",
    ink: "#e6edf3",
    mute: "#8b98c0",
    line: "#e6edf3",
    blueText: ACCENT.blue,
  },
};

export const FONT = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
  /** display face, weight 700 */
  pix: "Pixelify Sans",
};
