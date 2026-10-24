import "./style.css";
import { Camera } from "./camera";
import { chapters } from "./chapters";
import { STOPS, fitView, origins, portalOf, scrollView } from "./geometry";
import { Renderer, type RenderState } from "./renderer";
import { scenes } from "./scenes";
import { a11yHTML, captionHTML } from "./templates";
import { currentTheme, initTheme } from "./theme";
import type { LayerMode, Ref } from "./types";
import { buildWorld } from "./world";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const cv = $<HTMLCanvasElement>("cv");
const stageEl = $("stage");
const captionEl = $("caption");
const hintEl = $("hint");
const layersEl = $("layers");
const a11yEl = $("a11y");
const chapterEl = $("chapter");
const railEl = $("rail");
const trackEl = $("track");

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const org = origins(scenes);

/** All mutable app state lives here. */
const st: RenderState & { level: number; section: number } = {
  layer: "both",
  sel: null,
  hov: null,
  level: 0,
  section: -1,
};

const size = () => ({ w: innerWidth, h: innerHeight });
/** Wide screens put the chapter card in a left column; narrow ones above the scene. */
const wide = () => innerWidth >= 1000;
const insets = () => ({
  left: wide() ? 380 : 0,
  top: wide() ? 72 : innerWidth <= 720 ? 232 : 190,
  right: 0,
  bottom: innerWidth <= 720 ? 96 : 84,
});
const fit = (l: number) => fitView(org[l]!, size(), insets());
let dpr = 1;

const renderer = new Renderer(cv, scenes, reduceMotion);
const camera = new Camera((v) => {
  const l = renderer.levelAt(v, size());
  if (l !== st.level) {
    st.level = l;
    renderChrome();
  }
});

/** Scroll position in sections (0 .. chapters.length - 1). */
const scrollT = () => scrollY / Math.max(1, innerHeight);
const sync = () => {
  const t = Math.max(0, Math.min(chapters.length - 1, scrollT()));
  camera.set(scrollView(t, fit));
  const sec = Math.round(t);
  if (sec !== st.section) {
    st.section = sec;
    renderChapter();
  }
  hintEl.style.opacity = scrollY > 40 ? "0" : "";
};

function renderChapter() {
  const c = chapters[st.section]!;
  chapterEl.classList.remove("in");
  chapterEl.querySelector("small")!.textContent = c.tag;
  chapterEl.querySelector("h1")!.textContent = c.title;
  chapterEl.querySelector("p")!.textContent = c.body;
  chapterEl.querySelector<HTMLElement>(".cta")!.hidden =
    st.section !== chapters.length - 1;
  void chapterEl.offsetWidth; // restart the fade-in
  chapterEl.classList.add("in");
  railEl
    .querySelectorAll("button")
    .forEach((b, i) =>
      i === st.section
        ? b.setAttribute("aria-current", "step")
        : b.removeAttribute("aria-current"),
    );
}

function renderChrome() {
  a11yEl.innerHTML = a11yHTML(scenes[st.level]!, st.level);
  renderCaption();
}

const renderCaption = () =>
  (captionEl.innerHTML = captionHTML(scenes, st.level, st.hov ?? st.sel));

/** Scrolls to a section, which the camera then follows. */
function goSection(i: number) {
  scrollTo({
    top: i * innerHeight,
    behavior: reduceMotion ? "auto" : "smooth",
  });
}

/** Activate an object: select it, and open its portal if it has one. */
function activate(r: Ref) {
  st.sel = r;
  renderCaption();
  if (scenes[r.l]!.objects.find((o) => o.id === r.id)?.portal)
    goSection(STOPS.indexOf(r.l + 1));
}

function setHover(r: Ref | null) {
  if (r?.l === st.hov?.l && r?.id === st.hov?.id) return;
  st.hov = r;
  stageEl.classList.toggle("over", !!r);
  renderCaption();
}

/* --- pointer --- */
stageEl.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const h = renderer.pick(camera.view, size(), e.clientX, e.clientY);
  setHover(h?.obj ? { l: h.l, id: h.obj.id } : null);
});
stageEl.addEventListener("pointerleave", () => setHover(null));
stageEl.addEventListener("click", (e) => {
  const h = renderer.pick(camera.view, size(), e.clientX, e.clientY);
  if (h?.obj) activate({ l: h.l, id: h.obj.id });
  else {
    st.sel = null;
    renderCaption();
  }
});

/* --- chrome --- */
railEl.innerHTML = chapters
  .map((c, i) => `<button data-i="${i}" aria-label="${c.tag}"></button>`)
  .join("");
railEl.addEventListener("click", (e) => {
  const b = (e.target as Element).closest<HTMLElement>("[data-i]");
  if (b) goSection(+b.dataset.i!);
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

/* --- size, theme, loop --- */
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(innerWidth * dpr);
  cv.height = Math.round(innerHeight * dpr);
  trackEl.style.height = `${chapters.length * innerHeight}px`;
  sync();
}
window.addEventListener("resize", resize);
window.addEventListener("scroll", sync, { passive: true });

const applyTheme = () => renderer.setWorld(buildWorld(scenes, currentTheme()));
initTheme($("theme"), applyTheme);

applyTheme();
resize();
renderChrome();

const loop = (now: number) => {
  renderer.draw(camera.view, size(), dpr, st, now / 1000);
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

// Dev/test hook: `?debug` exposes jump(level) for screenshots.
if (location.search.includes("debug"))
  (window as unknown as Record<string, unknown>).__app = {
    jump: (i: number) => scrollTo(0, i * innerHeight),
    view: (cx: number, cy: number, w: number) => camera.set({ cx, cy, w }),
    focus: (l: number, id: string) => setHover({ l, id }),
    portal: (l: number) => portalOf(scenes[l]!)?.id,
  };
