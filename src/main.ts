import './style.css';
import { Camera } from './camera';
import { marketById, markets } from './data';
import { DRILL, fitView, origins } from './geometry';
import { Input } from './input';
import { Stage, refOf } from './stage';
import { crumbsHTML, introHTML, minimapHTML, panelHTML } from './templates';
import { initTheme } from './theme';
import type { Market, Ref } from './types';

const $ = <T extends HTMLElement | SVGElement>(id: string) => document.getElementById(id) as unknown as T;
const svg = $<SVGSVGElement>('svg');
const stageEl = $<HTMLElement>('stage');
const panelEl = $<HTMLElement>('panel');
const crumbEl = $<HTMLElement>('crumbs');
const miniEl = $<SVGSVGElement>('minimap');
const hintEl = $<HTMLElement>('hint');
const marketEl = $<HTMLElement>('mk');

/** All mutable app state lives here. */
const state: { market: Market; level: number; sel: Ref | null; hov: Ref | null } = {
  market: markets[0]!,
  level: 0,
  sel: null,
  hov: null,
};

const size = () => ({ w: innerWidth, h: innerHeight });
const mobile = () => innerWidth <= 880;
const insets = () => ({ top: 96, right: mobile() ? 0 : 360, bottom: mobile() ? Math.round(innerHeight * 0.42) : 0 });
const levels = () => state.market.levels;
const fit = (l: number) => fitView(origins(levels().length)[l]!, size(), insets());

const stage = new Stage(svg);
const camera = new Camera(size, (v) => {
  const cur = stage.apply(v, size());
  if (cur !== state.level) {
    state.level = cur;
    renderChrome();
  }
}, matchMedia('(prefers-reduced-motion: reduce)').matches);
const input = new Input(stageEl, camera, () => (hintEl.style.opacity = '0'));

function renderChrome() {
  crumbEl.innerHTML = crumbsHTML(levels(), state.level, state.sel);
  miniEl.innerHTML = minimapHTML(state.level);
}

function select(ref: Ref | null) {
  state.sel = ref;
  stage.paint(state.sel, state.hov);
  panelEl.innerHTML = panelHTML(levels(), state.sel);
  renderChrome();
}

function go(l: number) {
  hintEl.style.opacity = '0';
  camera.flyTo(fit(Math.max(0, Math.min(levels().length - 1, l))));
}

function setMarket(id: string) {
  state.market = marketById(id);
  state.sel = state.hov = null;
  state.level = 0;
  stage.mount(levels());
  camera.stop();
  camera.set(fit(0));
  panelEl.innerHTML = introHTML();
  renderChrome();
  marketEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === state.market.id)));
  try {
    history.replaceState(null, '', state.market.id === markets[0]!.id ? location.pathname : `#${state.market.id}`);
  } catch {}
}

/* --- events --- */
svg.addEventListener('click', (e) => {
  if (input.moved) return;
  const t = e.target as Element;
  const hit = t.closest<SVGElement>('.phit');
  if (hit) return go(+hit.dataset.child!);
  const n = t.closest('.node');
  select(n ? refOf(n) : null);
});
svg.addEventListener('dblclick', (e) => {
  const n = (e.target as Element).closest('.node');
  if (!n) return;
  const r = refOf(n);
  if (r.s === 'p' && r.i === DRILL && r.l < levels().length - 1) go(r.l + 1);
});
svg.addEventListener('keydown', (e) => {
  const n = (e.target as Element).closest('.node');
  if (n && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    select(refOf(n));
  }
});
svg.addEventListener('pointerover', (e) => {
  const n = (e.target as Element).closest('.node');
  const r = n ? refOf(n) : null;
  const next = r && stage.isActive(r.l) ? r : null;
  if (next?.l !== state.hov?.l || next?.s !== state.hov?.s || next?.i !== state.hov?.i) {
    state.hov = next;
    stage.paint(state.sel, state.hov);
  }
});
svg.addEventListener('pointerleave', () => {
  state.hov = null;
  stage.paint(state.sel, null);
});
panelEl.addEventListener('click', (e) => {
  const t = e.target as Element;
  const chip = t.closest<HTMLElement>('.chip');
  const act = t.closest<HTMLElement>('[data-act]');
  if (chip && state.sel) select({ l: state.sel.l, s: chip.dataset.s as Ref['s'], i: +chip.dataset.i! });
  if (act && state.sel) go(act.dataset.act === 'in' ? state.sel.l + 1 : state.sel.l - 1);
});
crumbEl.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLElement>('[data-l]');
  if (b) go(+b.dataset.l!);
});
miniEl.addEventListener('click', (e) => {
  const r = (e.target as Element).closest<SVGElement>('rect');
  if (r) go(+r.dataset.l!);
});
marketEl.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLElement>('button');
  if (b) setMarket(b.dataset.m!);
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') go(state.level - 1);
});
window.addEventListener('resize', () => {
  camera.stop();
  camera.set(fit(state.level));
});

initTheme($('theme'));
setMarket(location.hash.slice(1));
