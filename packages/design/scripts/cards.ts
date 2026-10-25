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

const p = palette("day");
await Bun.write(out + "tokens.typ", typst());
await Bun.write(out + "back.png", png(back(p), SCALE));
await Bun.write(out + "strip.png", png(strip(p), SCALE));

// Typst reads only sfnt fonts; unpack the WOFF the site ships
const woff = Bun.resolveSync(
  "@fontsource/pixelify-sans/files/pixelify-sans-latin-700-normal.woff",
  root,
);
await Bun.write(
  out + "fonts/pixelify-sans-700.ttf",
  woffToSfnt(new Uint8Array(await Bun.file(woff).arrayBuffer())),
);

const typstArgs = (fmt: string, to: string, ...extra: string[]) => [
  "typst",
  "compile",
  "--root",
  root,
  "--font-path",
  out + "fonts",
  "--format",
  fmt,
  ...extra,
  root + "cards/card.typ",
  to,
];
for (const cmd of [
  typstArgs("pdf", out + "card.pdf"),
  typstArgs("png", out + "card-{p}.png", "--ppi", "300"),
]) {
  const r = Bun.spawnSync(cmd, { stdout: "inherit", stderr: "inherit" });
  if (r.exitCode !== 0) process.exit(r.exitCode ?? 1);
}
console.log("out/card.pdf (front, back), out/card-1.png, out/card-2.png");
