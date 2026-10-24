import "./style.css";
import { Sound } from "./audio";
import { chapters } from "./chapters";
import { palette, type Theme } from "./palette";
import { drawPhilipp } from "./philipp";
import { currentTheme, initTheme } from "./theme";
import {
  CHAR_AT,
  END,
  STATIONS,
  Walker,
  artScale,
  nearest,
  scrollOf,
  walkOf,
} from "./walk";
import { drawForeground, drawWorld } from "./world";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const cv = $<HTMLCanvasElement>("cv");
const ctx = cv.getContext("2d")!;
const chapterEl = $("chapter");
const railEl = $("rail");
const trackEl = $("track");
const hintEl = $("hint");
const gateEl = $("gate");
const soundEl = $("sound");
const sound = new Sound();
let started = false;

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const walker = new Walker(reduceMotion);
let pal = palette(currentTheme());
let s = 4;
let W = 320;
let H = 180;
let section = -1;

function renderChapter() {
  const c = chapters[section]!;
  chapterEl.classList.remove("in");
  chapterEl.querySelector("small")!.textContent = c.tag;
  chapterEl.querySelector("h1")!.textContent = c.title;
  chapterEl.querySelector("p")!.textContent = c.body;
  chapterEl.querySelector<HTMLElement>(".cta")!.hidden =
    section !== chapters.length - 1;
  void chapterEl.offsetWidth; // restart the fade-in
  chapterEl.classList.add("in");
  railEl
    .querySelectorAll("button")
    .forEach((b, i) =>
      i === section
        ? b.setAttribute("aria-current", "step")
        : b.removeAttribute("aria-current"),
    );
}

/* --- chrome --- */
railEl.innerHTML = chapters
  .map((c, i) => `<button data-i="${i}" aria-label="${c.tag}"></button>`)
  .join("");
railEl.addEventListener("click", (e) => {
  const b = (e.target as Element).closest<HTMLElement>("[data-i]");
  if (b) {
    sound.click();
    scrollTo({
      top: scrollOf(STATIONS[+b.dataset.i!]!, s),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }
});
// the same copy as real text, for screen readers and search
trackEl.innerHTML = `<div class="sr">${chapters
  .map((c) => `<h2>${c.title}</h2><p>${c.body}</p>`)
  .join("")}</div>`;

/* --- size, theme, loop --- */
function resize() {
  s = artScale(innerWidth);
  W = Math.ceil(innerWidth / s);
  H = Math.ceil(innerHeight / s);
  cv.width = W;
  cv.height = H;
  ctx.imageSmoothingEnabled = false;
  trackEl.style.height = `${scrollOf(END, s) + innerHeight}px`;
}
window.addEventListener("resize", resize);
const themeChanged = (t: Theme) => {
  pal = palette(t);
  sound.night = t === "night";
};
initTheme($("theme"), (t) => {
  sound.click();
  themeChanged(t);
});
themeChanged(currentTheme());

/* --- start gate and sound --- */
function setSound(on: boolean) {
  sound.setMuted(!on);
  soundEl.setAttribute("aria-pressed", String(on));
  soundEl.classList.toggle("muted", !on);
}
async function enter(withSound: boolean) {
  if (started) return;
  started = true;
  sound.muted = !withSound;
  try {
    await sound.start();
  } catch {
    /* no audio support: carry on silently */
  }
  setSound(withSound);
  soundEl.hidden = false;
  gateEl.classList.add("gone");
  document.documentElement.classList.remove("locked");
  if (withSound) sound.click();
  setTimeout(() => gateEl.remove(), 600);
}
document.documentElement.classList.add("locked");
$("enter").addEventListener("click", () => void enter(true));
$("enter-quiet").addEventListener("click", () => void enter(false));
soundEl.addEventListener("click", () => {
  setSound(sound.muted);
  sound.click();
});
document.addEventListener("visibilitychange", () =>
  sound.suspend(document.hidden),
);
$("enter").focus();
resize();

let last = performance.now();
let lastFrame = 0;
const loop = (now: number) => {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  walker.update(walkOf(scrollY, s), dt);
  const t = reduceMotion ? 0 : now / 1000;

  const i = nearest(walker.x);
  if (i !== section) {
    section = i;
    renderChapter();
    if (started) sound.chime(i);
  }
  hintEl.style.opacity = scrollY > 40 ? "0" : "";

  if (
    walker.moving &&
    started &&
    (walker.frame & 1) === 0 &&
    walker.frame !== lastFrame
  )
    sound.footstep();
  lastFrame = walker.frame;

  const charX = Math.round(W * CHAR_AT);
  const view = {
    camX: Math.round(walker.x) - charX,
    W,
    H,
    gy: Math.round(H * 0.74),
    t,
  };
  drawWorld(ctx, pal, view);
  drawPhilipp(ctx, pal, {
    x: charX,
    y: view.gy + 7,
    frame: walker.frame,
    moving: walker.moving,
    facing: walker.facing,
    wave:
      !walker.moving &&
      (section === chapters.length - 1 || (section === 0 && walker.x < 8)),
    t,
  });
  drawForeground(ctx, pal, view);
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
