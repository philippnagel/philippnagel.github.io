import { cp, readFile, rm, writeFile } from "node:fs/promises";
import { simpleHtml, srHtml } from "../src/chapters";

await rm("dist", { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ["src/index.html", "src/impressum.html", "src/datenschutz.html"],
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

// social preview image, referenced by an absolute URL so it is copied as is
await cp("src/og.png", "dist/og.png");

// GitHub Pages custom domain
await cp("CNAME", "dist/CNAME");

for (const o of result.outputs)
  console.log(
    o.path.replace(process.cwd() + "/", ""),
    `${(o.size / 1024).toFixed(1)} KB`,
  );
