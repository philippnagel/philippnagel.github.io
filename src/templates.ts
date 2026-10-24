import { scenes } from "./scenes";
import type { Ref, SceneDef } from "./types";

export const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const objOf = (defs: SceneDef[], r: Ref) =>
  defs[r.l]?.objects.find((o) => o.id === r.id);

export function captionHTML(
  defs: SceneDef[],
  level: number,
  focus: Ref | null,
): string {
  const o = focus && objOf(defs, focus);
  if (!o) return esc(defs[level]!.hint);
  return `<b class="${o.layer}">${esc(o.name)}</b> ${esc(o.text)}`;
}

export function crumbsHTML(defs: SceneDef[], level: number): string {
  let h = "";
  for (let l = 0; l <= level; l++) {
    if (l) h += "<i>›</i>";
    h += `<button data-l="${l}" ${l === level ? 'aria-current="step"' : ""}>${esc(defs[l]!.name)}</button>`;
  }
  return h;
}

/** Off-screen buttons so the canvas scene is keyboard and screen-reader reachable. */
export function a11yHTML(def: SceneDef, l: number): string {
  return def.objects
    .map(
      (o) =>
        `<li><button data-l="${l}" data-id="${o.id}">${esc(o.name)}${o.portal ? " (zoom in)" : ""}. ${esc(o.text)}</button></li>`,
    )
    .join("");
}

export { scenes };
