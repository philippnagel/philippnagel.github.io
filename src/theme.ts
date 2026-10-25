import type { Theme } from "@philippnagel/design/palette";
import { UI } from "@philippnagel/design/tokens";

const KEY = "theme";
const dark = () => matchMedia("(prefers-color-scheme: dark)");

export function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "dark" || (t !== "light" && dark().matches) ? "night" : "day";
}

/**
 * Browser bar colour, matching `--bg`. Each meta tag follows its media query
 * (the system setting) unless a theme was picked, which overrides both.
 */
function syncBar() {
  const picked = document.documentElement.dataset.theme;
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((m) => {
      const t = picked
        ? currentTheme()
        : m.media.includes("dark")
          ? "night"
          : "day";
      m.content = UI[t].bg;
    });
}

export function initTheme(button: HTMLElement, onChange: (t: Theme) => void) {
  const root = document.documentElement;
  try {
    const t = localStorage.getItem(KEY);
    if (t === "dark" || t === "light") root.dataset.theme = t;
  } catch {}
  syncBar();
  button.addEventListener("click", () => {
    root.dataset.theme = currentTheme() === "night" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, root.dataset.theme);
    } catch {}
    syncBar();
    onChange(currentTheme());
  });
  dark().addEventListener("change", () => onChange(currentTheme()));
}
