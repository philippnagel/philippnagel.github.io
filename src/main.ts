import "./style.css";
import { Sound } from "./audio";
import { chapters } from "./chapters";
import { palette, type Theme } from "./palette";
import { drawPhilipp } from "./philipp";
import { currentTheme, initTheme } from "./theme";
import {
  ART_AHEAD,
  CHAR_AT,
  END,
  STATIONS,
  Walker,
  artScale,
  nearest,
  scrollOf,
  walkOf,
} from "./walk";
import { critterAt, startle } from "./critters";
import { BOARDS, hotspotAt } from "./stations";
import { strikeId } from "./weather";
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
const tipEl = $("tip");
const sound = new Sound();
let started = false;

const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
let reduceMotion = motionQuery.matches;
const walker = new Walker(reduceMotion);
motionQuery.addEventListener("change", () => {
  reduceMotion = motionQuery.matches;
  walker.instant = reduceMotion;
});
let pal = palette(currentTheme());
let s = 4;
let W = 320;
let H = 180;
let section = -1;

function renderChapter() {
  const c = chapters[section]!;
  chapterEl.classList.remove("in", "min");
  chapterEl.querySelector("small")!.textContent = c.tag;
  chapterEl.querySelector("h1")!.textContent = c.title;
  chapterEl.querySelector("p")!.textContent = c.body;
  chapterEl.querySelector(".terms")!.innerHTML = (c.terms ?? [])
    .map(([a, b]) => `<b>${a}</b> ${b}`)
    .join(" · ");
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
chapterEl.addEventListener("click", (e) => {
  if ((e.target as Element).closest("a, button")) return;
  if (matchMedia("(max-width: 720px)").matches)
    chapterEl.classList.toggle("min");
});
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
let sized = false;
function resize() {
  const prev = s;
  const walk = walkOf(scrollY, s);
  s = artScale(innerWidth);
  W = Math.ceil(innerWidth / s);
  H = Math.ceil(innerHeight / s);
  cv.width = W;
  cv.height = H;
  ctx.imageSmoothingEnabled = false;
  trackEl.style.height = `${scrollOf(END, s) + innerHeight}px`;
  // keep the same spot on the path when the scale changes (not on first load, where `s` is a placeholder)
  if (sized && s !== prev) scrollTo(0, scrollOf(walk, s));
  sized = true;
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
    // never let a stalled audio context keep the gate up
    await Promise.race([sound.start(), new Promise((r) => setTimeout(r, 800))]);
  } catch {
    /* no audio support: carry on silently */
  }
  setSound(withSound);
  soundEl.hidden = false;
  gateEl.classList.add("gone");
  document.documentElement.classList.remove("locked");
  behindGate.forEach((el) => el.removeAttribute("inert"));
  if (withSound) sound.click();
  setTimeout(() => gateEl.remove(), 600);
}
// always open at the start of the path, not wherever the browser last left the page
history.scrollRestoration = "manual";
scrollTo(0, 0);
document.documentElement.classList.add("locked");
// keep keyboard and screen readers on the gate until it is dismissed
const behindGate = [...document.body.children].filter(
  (el) => el !== gateEl && el.tagName !== "SCRIPT",
);
behindGate.forEach((el) => el.setAttribute("inert", ""));
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

/** Lays real links over the contact signpost so the boards themselves are clickable. */
const boardEls = [$("board-1"), $("board-2")] as HTMLAnchorElement[];
function placeBoards(camX: number, gy: number) {
  const k = innerWidth / W;
  const ky = innerHeight / H;
  const cx = END + ART_AHEAD - camX;
  const show = section === chapters.length - 1;
  boardEls.forEach((el, i) => {
    const b = BOARDS[i + 1]!;
    el.hidden = !show;
    if (!show) return;
    el.href = b.href;
    el.style.left = `${(cx + b.x) * k}px`;
    el.style.top = `${(gy + b.y) * ky}px`;
    el.style.width = `${b.w * k}px`;
    el.style.height = `${b.h * ky}px`;
  });
}

/* --- poking the world: animals react, equipment explains itself --- */
let lastView = { camX: 0, gy: 0 };
let clock = 0;
let tipTimer = 0;
const toArt = (e: PointerEvent) => [
  (e.clientX * W) / innerWidth,
  (e.clientY * H) / innerHeight,
];
function hideTip() {
  tipEl.hidden = true;
}
function showTip(e: PointerEvent, ax: number, ay: number) {
  const hs = hotspotAt(
    section,
    ax - Math.round(STATIONS[section]! + ART_AHEAD - lastView.camX),
    ay - lastView.gy,
  );
  if (!hs) return hideTip();
  tipEl.innerHTML = `<b>${hs.name}</b>${hs.text}`;
  tipEl.hidden = false;
  const w = tipEl.offsetWidth;
  tipEl.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, e.clientX + 14))}px`;
  tipEl.style.top = `${Math.min(innerHeight - tipEl.offsetHeight - 8, e.clientY + 14)}px`;
}
cv.addEventListener("pointermove", (e) => {
  if (!started || e.pointerType === "touch") return;
  const [ax, ay] = toArt(e) as [number, number];
  cv.style.cursor = critterAt(ax, ay) ? "pointer" : "";
  showTip(e, ax, ay);
});
cv.addEventListener("pointerleave", hideTip);
cv.addEventListener("pointerdown", (e) => {
  if (!started) return;
  const [ax, ay] = toArt(e) as [number, number];
  const hit = critterAt(ax, ay);
  if (hit) {
    startle(hit.i, clock);
    if (hit.kind === "cat" || hit.kind === "fox") sound.meow();
    else sound.squeak();
    hideTip();
    return;
  }
  if (e.pointerType === "touch") {
    showTip(e, ax, ay);
    clearTimeout(tipTimer);
    tipTimer = window.setTimeout(hideTip, 3500);
  }
});

let lastStrike = strikeId(0);
let last = performance.now();
let lastFrame = 0;
const loop = (now: number) => {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  walker.update(walkOf(scrollY, s), dt);
  const t = reduceMotion ? 0 : now / 1000;
  clock = t;
  const strike = strikeId(t);
  if (strike !== lastStrike) {
    lastStrike = strike;
    if (strike >= 0 && started) sound.thunder(0.4 + (strike % 3) * 0.5);
  }

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

  const charX = Math.round(W * (W < 500 ? 0.2 : CHAR_AT));
  const view = {
    camX: Math.round(walker.x) - charX,
    W,
    H,
    gy: H > 500 ? Math.round(H * 0.8) : H - 76,
    t,
    tk: s === 1 ? 2 : 1,
  };
  lastView = view;
  drawWorld(ctx, pal, view);
  drawPhilipp(ctx, pal, {
    x: charX,
    y: view.gy + 22,
    frame: walker.frame,
    moving: walker.moving,
    facing: walker.facing,
    wave:
      !walker.moving &&
      (section === chapters.length - 1 || (section === 0 && walker.x < 8)),
    t,
  });
  drawForeground(ctx, pal, view);
  placeBoards(view.camX, view.gy);
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
