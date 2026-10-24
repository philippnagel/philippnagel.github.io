import { DRILL, KID, NH, PORT, PW, PX, PY, SZ, X, ny } from './geometry';
import { esc } from './templates';
import type { Level, Side } from './types';

const SIDES: Side[] = ['p', 'r'];

/** Inner markup of one scene; drillable nodes embed the next scene at 1/10 scale. */
export function sceneSVG(levels: Level[], l: number): string {
  const d = levels[l]!;
  let s = `<rect class="fbg" width="${SZ}" height="${SZ}"/><rect width="${SZ}" height="${SZ}" fill="url(#grid)"/>`;
  s += `<text class="lvl" x="${SZ / 2}" y="30" text-anchor="middle">LEVEL ${l + 1} · ${d.name}</text>`;
  s += `<text class="lane p" x="${X.p}" y="72">PHYSICAL · POWER DELIVERY</text><text class="lane r" x="${X.r}" y="72">INFORMATION · PROTOCOL</text>`;
  d.links.forEach(([a, b], n) => {
    const y1 = ny(a) + NH / 2;
    const y2 = ny(b) + NH / 2;
    s += `<path class="link" data-l="${l}" data-n="${n}" d="M${X.p + PW} ${y1} C${X.p + PW + 50} ${y1} ${X.r - 50} ${y2} ${X.r} ${y2}"/>`;
  });
  for (const side of SIDES)
    for (let i = 0; i < 3; i++) s += `<path class="flow ${side}" d="M${X[side] + PW / 2} ${ny(i) + NH} V${ny(i + 1)}"/>`;
  for (const side of SIDES)
    d[side].forEach((n, i) => {
      const x = X[side];
      const y = ny(i);
      const drill = side === 'p' && i === DRILL && l < levels.length - 1;
      s += `<g class="node ${side}" data-l="${l}" data-s="${side}" data-i="${i}" tabindex="0" role="button" aria-label="${esc(n.t)}">`;
      s += `<rect class="nbox" x="${x}" y="${y}" width="${PW}" height="${NH}" rx="10"/>`;
      s += `<text class="ntag" x="${x + 20}" y="${y + 36}">${esc(n.tag)}</text><text class="nttl" x="${x + 20}" y="${y + 72}">${esc(n.t)}</text>`;
      n.l.forEach((t, k) => (s += `<text class="nsub" x="${x + 20}" y="${y + 108 + k * 24}">${esc(t)}</text>`));
      if (n.f) s += `<text class="ntag" x="${x + 20}" y="${y + NH - 14}">▤ frame</text>`;
      if (drill) {
        s += `<g transform="translate(${PX} ${PY}) scale(${KID})"><g class="scene" data-l="${l + 1}">${sceneSVG(levels, l + 1)}</g></g>`;
        s += `<rect class="pframe" data-child="${l + 1}" x="${PX}" y="${PY}" width="${PORT}" height="${PORT}"/>`;
        s += `<rect class="phit" data-child="${l + 1}" x="${PX}" y="${PY}" width="${PORT}" height="${PORT}"/>`;
      }
      s += `</g>`;
    });
  return s;
}

export const defsSVG = `<defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="var(--grid)" stroke-width="1"/></pattern></defs>`;
