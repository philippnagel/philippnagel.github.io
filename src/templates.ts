import { frames, LEVEL_NAMES } from './data';
import { DRILL, related } from './geometry';
import type { Level, Ref } from './types';

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const introHTML = () => `<div class="eyebrow">Grid → packet</div><h2>Two stacks, one meter</h2>
  <p>Left: the physical path electricity takes, from the transmission grid to a wallbox. Right: the regulation, market messages and device protocols that describe and control it.</p>
  <p>Select any node to light up its counterpart on the other stream, then dive in through the dashed thumbnail: <b>Connection point → Customer premises</b>.</p>
  <h3>Controls</h3><p><kbd>scroll</kbd> / pinch zoom &nbsp; <kbd>drag</kbd> pan &nbsp; <kbd>Esc</kbd> zoom out</p>`;

export function panelHTML(levels: Level[], sel: Ref | null): string {
  if (!sel) return introHTML();
  const lv = levels[sel.l]!;
  const n = lv[sel.s][sel.i]!;
  const isP = sel.s === 'p';
  const rel = related(lv, sel);
  let h = `<div class="eyebrow ${sel.s}">Level ${sel.l + 1} · ${isP ? 'Physical' : 'Protocol'}</div><h2>${esc(n.t)}</h2><div class="tag">${esc(n.tag)}</div><p>${esc(n.i)}</p>`;
  if (rel.length) {
    h += `<h3>${isP ? 'Protocols acting here' : 'Physical counterpart'}</h3><div class="chips">`;
    for (const x of rel) h += `<button class="chip ${x.s}" data-s="${x.s}" data-i="${x.i}">${esc(lv[x.s][x.i]!.t)}</button>`;
    h += `</div>`;
  }
  const frame = n.f ? frames[n.f] : undefined;
  if (frame) {
    h += `<h3>Protocol frame</h3><div class="frame">`;
    for (const [code, note] of frame)
      h += note ? `<div><code>${esc(code)}</code><span>${esc(note)}</span></div>` : `<div class="note">${esc(code)}</div>`;
    h += `</div>`;
  }
  h += `<div class="acts">`;
  if (isP && sel.i === DRILL && sel.l < levels.length - 1) h += `<button class="btn pri" data-act="in">Zoom in ▸</button>`;
  if (sel.l > 0) h += `<button class="btn" data-act="out">◂ Zoom out</button>`;
  return h + `</div>`;
}

export function crumbsHTML(levels: Level[], level: number, sel: Ref | null): string {
  const n = sel && sel.l === level ? levels[sel.l]![sel.s][sel.i]! : null;
  const framed = !!(n && n.f && frames[n.f]);
  let h = '';
  for (let l = 0; l <= level; l++) {
    if (l) h += '<i>›</i>';
    const cur = l === level && !framed;
    h += `<button data-l="${l}" ${cur ? 'aria-current="step"' : ''}>${LEVEL_NAMES[l]}</button>`;
  }
  if (n && framed) h += `<i>›</i><button class="fr" aria-current="step">Protocol Frame · ${esc(n.t)}</button>`;
  return h;
}

/** Nested squares, one per level; purely schematic. */
const MM: [number, number, number][] = [[4, 4, 112], [14, 50, 62], [22, 82, 26]];
export const minimapHTML = (level: number) =>
  MM.map(([x, y, s], l) => `<rect data-l="${l}" x="${x}" y="${y}" width="${s}" height="${s}" rx="3" class="${l === level ? 'act' : ''}"/><text x="${x + 4}" y="${y + 11}">L${l + 1}</text>`).join('');
