import "./style.css";
import { Sound } from "./audio";
import { EMAIL, chapters, simpleHtml, srHtml } from "./chapters";
import { initLegal } from "./legal";
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
const root = document.documentElement;
let simple = root.classList.contains("simple");
let looping = false;

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
/** Art rows visible with mobile toolbars shown: the scene is laid out in these, the canvas is H tall. */
let Hv = 180;
let section = -1;

function renderChapter() {
  const c = chapters[section]!;
  chapterEl.classList.remove("in");
  fold(false);
  chapterEl.querySelector("small")!.textContent = c.tag;
  chapterEl.querySelector("h1")!.textContent = c.title;
  chapterEl.querySelector("p")!.textContent = c.body;
  chapterEl.querySelector(".terms")!.innerHTML = (c.terms ?? [])
    .map(([a, b]) => `<b>${a}</b> ${b}`)
    .join(" · ");
  const last = section === chapters.length - 1;
  chapterEl.querySelector<HTMLElement>(".cta")!.hidden = !last;
  chapterEl.querySelector<HTMLElement>(".work")!.hidden = !last;
  chapterEl.querySelector<HTMLElement>(".legal")!.hidden = !last;
  chapterEl.querySelector(".proof")!.textContent = c.proof ?? "";
  chapterEl.querySelector("ul")!.innerHTML = (c.offers ?? [])
    .map((o) => `<li>${o}</li>`)
    .join("");
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
const foldEl = chapterEl.querySelector<HTMLElement>(".fold")!;
function fold(min: boolean) {
  chapterEl.classList.toggle("min", min);
  foldEl.setAttribute("aria-expanded", String(!min));
  foldEl.setAttribute("aria-label", min ? "Expand" : "Collapse");
}
foldEl.addEventListener("click", () =>
  fold(!chapterEl.classList.contains("min")),
);
chapterEl.addEventListener("click", (e) => {
  if ((e.target as Element).closest("a, button")) return;
  if (matchMedia("(max-width: 720px)").matches)
    fold(!chapterEl.classList.contains("min"));
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
// (the build writes it into the HTML already, so crawlers get it without running this)
if (!trackEl.firstElementChild) trackEl.innerHTML = srHtml();

/* --- simple view: the chapters as plain text --- */
const viewEl = $("view");
const simpleEl = $("simple");
// (the build writes it into the HTML already, for readers without JavaScript)
if (!simpleEl.firstElementChild) simpleEl.innerHTML = simpleHtml();
function setView(next: boolean) {
  simple = next;
  root.classList.toggle("simple", simple);
  viewEl.textContent = simple ? "Story view" : "Simple view";
  try {
    localStorage.setItem("view", simple ? "simple" : "story");
  } catch {}
  sound.suspend(simple);
  if (simple && !started) {
    // leaving the gate behind: unlock the page, the gate itself is hidden by CSS
    root.classList.remove("locked");
    behindGate.forEach((el) => el.removeAttribute("inert"));
  }
  scrollTo(0, 0);
  if (!simple) {
    walker.x = 0;
    if (!started) root.classList.add("locked");
    void enter(false); // a no-op once the gate has been dismissed
    if (!looping) {
      looping = true;
      last = performance.now();
      requestAnimationFrame(loop);
    }
  }
}
viewEl.addEventListener("click", () => {
  sound.click();
  setView(!simple);
});
$("enter-simple").addEventListener("click", () => setView(true));
$("enter-services").addEventListener("click", () => {
  setView(true);
  $("services").scrollIntoView();
});
$<HTMLAnchorElement>("email").href = `mailto:${EMAIL}`;
$("replay").addEventListener("click", () => {
  sound.click();
  scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  chapterEl.querySelector<HTMLElement>("h1")!.focus({ preventScroll: true });
});

/* --- size, theme, loop --- */
let sized = false;
let sizeKey = "";
/** Layout width, without a classic scrollbar: what the fixed canvas is measured against. */
const viewW = () => document.documentElement.clientWidth;
/** Probes for the viewport height with mobile toolbars shown (svh) and hidden (lvh). */
const probes = ["svh", "lvh"].map((unit) => {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;top:0;width:0;height:100${unit};visibility:hidden;pointer-events:none`;
  document.body.append(el);
  return el;
});
/** `innerHeight` slides between these while the toolbars move; without svh / lvh support both fall back to it. */
const viewH = () => {
  const [small, large] = probes.map((el) => el.offsetHeight);
  return [
    Math.min(small || innerHeight, innerHeight),
    Math.max(large || 0, innerHeight),
  ] as const;
};
function resize() {
  const dpr = devicePixelRatio || 1;
  const [small, large] = viewH();
  // keyed on svh / lvh, not innerHeight: the toolbars sliding in and out must not re-lay the scene
  const key = `${viewW()}x${small}-${large}@${dpr}`;
  if (key === sizeKey) return;
  sizeKey = key;
  const prev = s;
  const walk = walkOf(scrollY, s);
  s = artScale(viewW(), dpr);
  W = Math.ceil(viewW() / s);
  // the canvas covers the tallest viewport, so no page background shows below it when the toolbars hide
  H = Math.ceil(large / s);
  Hv = Math.ceil(small / s);
  cv.width = W;
  cv.height = H;
  // an exact multiple of the art size, so every art pixel is the same square on screen
  cv.style.width = `${W * s}px`;
  cv.style.height = `${H * s}px`;
  ctx.imageSmoothingEnabled = false;
  trackEl.style.height = `${scrollOf(END, s) + large}px`;
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
  resize(); // a classic scrollbar has just taken some width
  behindGate.forEach((el) => el.removeAttribute("inert"));
  if (withSound) sound.click();
  setTimeout(() => gateEl.remove(), 600);
}
// always open at the start of the path, not wherever the browser last left the page
history.scrollRestoration = "manual";
scrollTo(0, 0);
// keep keyboard and screen readers on the gate until it is dismissed
const behindGate = [...document.body.children].filter(
  (el) =>
    el !== gateEl && el.tagName !== "SCRIPT" && !el.hasAttribute("data-live"),
);
if (!simple) {
  root.classList.add("locked");
  behindGate.forEach((el) => el.setAttribute("inert", ""));
}
viewEl.textContent = simple ? "Story view" : "Simple view";
$("enter").addEventListener("click", () => void enter(true));
$("enter-quiet").addEventListener("click", () => void enter(false));
soundEl.addEventListener("click", () => {
  setSound(sound.muted);
  sound.click();
});
document.addEventListener("visibilitychange", () =>
  sound.suspend(document.hidden || simple),
);
if (!simple) $("enter").focus();
resize();
initLegal($("overlay"));

/** Lays real links over the contact signpost so the boards themselves are clickable. */
const boardEls = [$("board-1"), $("board-2")] as HTMLAnchorElement[];
let boardKey = "";
function placeBoards(camX: number, gy: number) {
  const cx = END + ART_AHEAD - camX;
  const show = section === chapters.length - 1;
  const key = show ? `${cx}|${gy}|${s}` : "";
  if (key === boardKey) return;
  boardKey = key;
  boardEls.forEach((el, i) => {
    const b = BOARDS[i + 1]!;
    el.hidden = !show;
    if (!show) return;
    el.href = b.href;
    el.style.left = `${(cx + b.x) * s}px`;
    el.style.top = `${(gy + b.y) * s}px`;
    el.style.width = `${b.w * s}px`;
    el.style.height = `${b.h * s}px`;
  });
}

/* --- poking the world: animals react, equipment explains itself --- */
let lastView = { camX: 0, gy: 0 };
let clock = 0;
let tipTimer = 0;
let lastPointer = "";
const toArt = (e: MouseEvent) => [e.clientX / s, e.clientY / s] as const;
function hideTip() {
  tipEl.hidden = true;
}
function showTip(e: MouseEvent, ax: number, ay: number, touch = false) {
  const hs = hotspotAt(
    section,
    ax - Math.round(STATIONS[section]! + ART_AHEAD - lastView.camX),
    ay - lastView.gy,
    touch ? Math.ceil(12 / s) : 0,
  );
  if (!hs) return hideTip();
  tipEl.innerHTML = `<b>${hs.name}</b>${hs.text}`;
  tipEl.hidden = false;
  const w = tipEl.offsetWidth;
  const h = tipEl.offsetHeight;
  tipEl.style.left = `${Math.max(8, Math.min(viewW() - w - 8, e.clientX + 14))}px`;
  // a finger covers what is below it, so on touch the tip goes above when there is room
  const above = e.clientY - h - 24;
  tipEl.style.top = `${touch && above >= 8 ? above : Math.min(innerHeight - h - 8, e.clientY + 14)}px`;
}
/** Startles the animal at (ax, ay), if there is one. */
function poke(ax: number, ay: number, pad: number) {
  const hit = critterAt(ax, ay, pad);
  if (!hit) return false;
  startle(hit.i, clock);
  if (hit.kind === "cat" || hit.kind === "fox") sound.meow();
  else sound.squeak();
  hideTip();
  return true;
}
cv.addEventListener("pointermove", (e) => {
  if (!started || e.pointerType === "touch") return;
  const [ax, ay] = toArt(e);
  cv.style.cursor = critterAt(ax, ay) ? "pointer" : "";
  showTip(e, ax, ay);
});
cv.addEventListener("pointerleave", hideTip);
cv.addEventListener("pointerdown", (e) => {
  lastPointer = e.pointerType;
  if (!started || e.pointerType === "touch") return;
  const [ax, ay] = toArt(e);
  poke(ax, ay, 0);
});
// a tap is a click: unlike pointerdown, it does not fire when the finger starts a scroll
cv.addEventListener("click", (e) => {
  if (!started || lastPointer !== "touch") return;
  const [ax, ay] = toArt(e);
  if (poke(ax, ay, Math.ceil(12 / s))) return;
  showTip(e, ax, ay, true);
  clearTimeout(tipTimer);
  tipTimer = window.setTimeout(hideTip, 3500);
});
// the scene moves under a tip while scrolling, so it would point at the wrong thing
window.addEventListener("scroll", hideTip, { passive: true });

let lastStrike = strikeId(0);
let last = performance.now();
let lastFrame = 0;
let lastDraw = 0;
let hintHidden = false;
const loop = (now: number) => {
  if (simple) {
    looping = false;
    return;
  }
  const target = walkOf(scrollY, s);
  // standing still: the ambient life only needs 30 fps
  if (walker.x === target && now - lastDraw < 33) {
    requestAnimationFrame(loop);
    return;
  }
  lastDraw = now;
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  walker.update(target, dt);
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
  if (hintHidden !== scrollY > 40) {
    hintHidden = !hintHidden;
    hintEl.style.opacity = hintHidden ? "0" : "";
  }

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
    gy: Hv > 500 ? Math.round(Hv * 0.8) : Hv - 76,
    t,
    tk: s < 1.5 ? 2 : 1,
  };
  // mid-resize (e.g. switching device emulation) the viewport can be 0 wide or too short for a sky
  if (view.W < 1 || view.gy < 1) {
    requestAnimationFrame(loop);
    return;
  }
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
if (!simple) {
  looping = true;
  requestAnimationFrame(loop);
}
