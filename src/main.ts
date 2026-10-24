import "./style.css";
import { Camera } from "./camera";
import { fitView, origins, portalOf } from "./geometry";
import { Input } from "./input";
import { Renderer, type RenderState } from "./renderer";
import { scenes } from "./scenes";
import { a11yHTML, captionHTML, crumbsHTML } from "./templates";
import { currentTheme, initTheme } from "./theme";
import type { LayerMode, Ref } from "./types";
import { buildWorld } from "./world";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const cv = $<HTMLCanvasElement>("cv");
const stageEl = $("stage");
const crumbEl = $("crumbs");
const captionEl = $("caption");
const hintEl = $("hint");
const layersEl = $("layers");
const a11yEl = $("a11y");

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const org = origins(scenes);

/** All mutable app state lives here. */
const st: RenderState & { level: number } = {
  layer: "both",
  sel: null,
  hov: null,
  level: 0,
};

const size = () => ({ w: innerWidth, h: innerHeight });
const insets = () => ({
  top: 96,
  right: 0,
  bottom: innerWidth <= 720 ? 96 : 84,
});
const fit = (l: number) => fitView(org[l]!, size(), insets());
let dpr = 1;

const renderer = new Renderer(cv, scenes, reduceMotion);
const camera = new Camera(
  size,
  (v) => {
    const l = renderer.levelAt(v, size());
    if (l !== st.level) {
      st.level = l;
      renderChrome();
    }
  },
  reduceMotion,
);
const input = new Input(stageEl, camera, () => (hintEl.style.opacity = "0"));

function renderChrome() {
  crumbEl.innerHTML = crumbsHTML(scenes, st.level);
  a11yEl.innerHTML = a11yHTML(scenes[st.level]!, st.level);
  renderCaption();
}

const renderCaption = () =>
  (captionEl.innerHTML = captionHTML(scenes, st.level, st.hov ?? st.sel));

function go(l: number) {
  hintEl.style.opacity = "0";
  camera.flyTo(fit(Math.max(0, Math.min(scenes.length - 1, l))));
}

/** Activate an object: select it, and open its portal if it has one. */
function activate(r: Ref) {
  st.sel = r;
  renderCaption();
  if (scenes[r.l]!.objects.find((o) => o.id === r.id)?.portal) go(r.l + 1);
}

function setHover(r: Ref | null) {
  if (r?.l === st.hov?.l && r?.id === st.hov?.id) return;
  st.hov = r;
  stageEl.classList.toggle("over", !!r);
  renderCaption();
}

/* --- pointer --- */
stageEl.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse" || input.moved) return;
  const h = renderer.pick(camera.view, size(), e.clientX, e.clientY);
  setHover(h?.obj ? { l: h.l, id: h.obj.id } : null);
});
stageEl.addEventListener("pointerleave", () => setHover(null));
stageEl.addEventListener("click", (e) => {
  if (input.moved) return;
  const h = renderer.pick(camera.view, size(), e.clientX, e.clientY);
  if (h?.obj) activate({ l: h.l, id: h.obj.id });
  else {
    st.sel = null;
    renderCaption();
  }
});

/* --- chrome --- */
crumbEl.addEventListener("click", (e) => {
  const b = (e.target as Element).closest<HTMLElement>("[data-l]");
  if (b) go(+b.dataset.l!);
});
layersEl.addEventListener("click", (e) => {
  const b = (e.target as Element).closest<HTMLElement>("button");
  if (!b) return;
  st.layer = b.dataset.m as LayerMode;
  layersEl
    .querySelectorAll("button")
    .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
});
a11yEl.addEventListener("focusin", (e) => {
  const b = (e.target as Element).closest<HTMLElement>("[data-id]");
  if (b) setHover({ l: +b.dataset.l!, id: b.dataset.id! });
});
a11yEl.addEventListener("focusout", () => setHover(null));
a11yEl.addEventListener("click", (e) => {
  const b = (e.target as Element).closest<HTMLElement>("[data-id]");
  if (b) activate({ l: +b.dataset.l!, id: b.dataset.id! });
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") go(st.level - 1);
});

/* --- size, theme, loop --- */
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(innerWidth * dpr);
  cv.height = Math.round(innerHeight * dpr);
}
window.addEventListener("resize", () => {
  resize();
  camera.stop();
  camera.set(fit(st.level));
});

const applyTheme = () => renderer.setWorld(buildWorld(scenes, currentTheme()));
initTheme($("theme"), applyTheme);

resize();
applyTheme();
camera.set(fit(0));
renderChrome();

const loop = (now: number) => {
  renderer.draw(camera.view, size(), dpr, st, now / 1000);
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

// Dev/test hook: `?debug` exposes jump(level) for screenshots.
if (location.search.includes("debug"))
  (window as unknown as Record<string, unknown>).__app = {
    jump: (l: number) => {
      camera.stop();
      camera.set(fit(l));
    },
    focus: (l: number, id: string) => setHover({ l, id }),
    portal: (l: number) => portalOf(scenes[l]!)?.id,
  };
