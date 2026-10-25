import type { Theme } from "./palette";

const KEY = "theme";
const dark = () => matchMedia("(prefers-color-scheme: dark)");

export function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "dark" || (t !== "light" && dark().matches) ? "night" : "day";
}

/** Browser bar colour, matching `--bg`; the meta tags' media queries only know the system setting. */
const BAR = { day: "#bfe4fa", night: "#0f1a46" };
function syncBar() {
  if (!document.documentElement.dataset.theme) return;
  const color = BAR[currentTheme()];
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((m) => (m.content = color));
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
