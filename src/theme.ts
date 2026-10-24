import type { Theme } from "./palette";

const KEY = "theme";
const dark = () => matchMedia("(prefers-color-scheme: dark)");

export function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "dark" || (!t && dark().matches) ? "night" : "day";
}

export function initTheme(button: HTMLElement, onChange: (t: Theme) => void) {
  const root = document.documentElement;
  try {
    const t = localStorage.getItem(KEY);
    if (t) root.dataset.theme = t;
  } catch {}
  button.addEventListener("click", () => {
    root.dataset.theme = currentTheme() === "night" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, root.dataset.theme);
    } catch {}
    onChange(currentTheme());
  });
  dark().addEventListener("change", () => onChange(currentTheme()));
}
