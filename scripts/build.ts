import { cp, readFile, rm, writeFile } from "node:fs/promises";
import { UI } from "@philippnagel/design/tokens";
import { simpleHtml, srHtml } from "../src/chapters";
import { legalPage, type LegalKey } from "../src/legal-text";

await rm("dist", { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ["src/index.html"],
  outdir: "dist",
  minify: true,
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// the chapter text in the HTML itself, so it is there before (and without) any script
const page = "dist/index.html";
const html = await readFile(page, "utf8");
const track = '<main id="track"></main>';
if (!html.includes(track)) throw new Error("#track not found in built HTML");
await writeFile(
  page,
  html.replace(track, `<main id="track">${srHtml()}</main>`),
);

// browser bar colours from the tokens, so they are right before any script runs
const bars = { "%bar-day%": UI.day.bg, "%bar-night%": UI.night.bg };
for (const [k, v] of Object.entries(bars)) {
  const cur = await readFile(page, "utf8");
  if (!cur.includes(k)) throw new Error(`${k} not found in built HTML`);
  await writeFile(page, cur.replaceAll(k, v));
}

// the plain reading page, so readers without JavaScript get the chapters too
const simple = '<div id="simple"></div>';
if (!html.includes(simple)) throw new Error("#simple not found in built HTML");
await writeFile(
  page,
  (await readFile(page, "utf8")).replace(
    simple,
    `<div id="simple">${simpleHtml()}</div>`,
  ),
);

// the legal pages: the same text as the overlay, with the built stylesheet and icon
const head = [...html.matchAll(/<link rel="(?:stylesheet|icon)"[^>]*>/g)].map(
  (m) => m[0],
);
if (head.length < 2) throw new Error("stylesheet / icon link not found");
for (const key of ["impressum", "datenschutz"] as LegalKey[])
  await writeFile(`dist/${key}.html`, legalPage(key, head.join("\n    ")));

// social preview image, referenced by an absolute URL so it is copied as is
await cp("src/og.png", "dist/og.png");

// GitHub Pages custom domain
await cp("CNAME", "dist/CNAME");

for (const o of result.outputs)
  console.log(
    o.path.replace(process.cwd() + "/", ""),
    `${(o.size / 1024).toFixed(1)} KB`,
  );
