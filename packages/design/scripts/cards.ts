import { mkdir } from "node:fs/promises";
import { back, strip } from "../cards/art";
import { typst } from "../src/emit";
import { palette } from "../src/palette";
import { png } from "../src/raster";
import { woffToSfnt } from "../src/woff";

/** Each art pixel becomes a block of device pixels: 3 px/mm x 8 = 610 dpi, hard edges. */
const SCALE = 8;
const root = new URL("..", import.meta.url).pathname;
const out = root + "out/";
await mkdir(out + "fonts", { recursive: true });

const THEMES = ["day", "night"] as const;
await Bun.write(out + "tokens.typ", typst());
for (const t of THEMES) {
  const p = palette(t);
  await Bun.write(out + `back-${t}.png`, png(back(p), SCALE));
  await Bun.write(out + `strip-${t}.png`, png(strip(p), SCALE));
}

// Typst reads only sfnt fonts; unpack the WOFF the site ships
const woff = Bun.resolveSync(
  "@fontsource/pixelify-sans/files/pixelify-sans-latin-700-normal.woff",
  root,
);
await Bun.write(
  out + "fonts/pixelify-sans-700.ttf",
  woffToSfnt(new Uint8Array(await Bun.file(woff).arrayBuffer())),
);

const typstArgs = (
  theme: string,
  fmt: string,
  to: string,
  ...extra: string[]
) => [
  "typst",
  "compile",
  "--root",
  root,
  "--input",
  `theme=${theme}`,
  "--font-path",
  out + "fonts",
  "--format",
  fmt,
  ...extra,
  root + "cards/card.typ",
  to,
];
for (const t of THEMES)
  for (const cmd of [
    typstArgs(t, "pdf", out + `card-${t}.pdf`),
    typstArgs(t, "png", out + `card-${t}-{p}.png`, "--ppi", "300"),
  ]) {
    const r = Bun.spawnSync(cmd, { stdout: "inherit", stderr: "inherit" });
    if (r.exitCode !== 0) process.exit(r.exitCode ?? 1);
  }
console.log(
  THEMES.map(
    (t) => `out/card-${t}.pdf (front, back), out/card-${t}-{1,2}.png`,
  ).join("\n"),
);
