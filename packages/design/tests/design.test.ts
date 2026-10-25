import { describe, expect, test } from "bun:test";
import { inflateSync } from "node:zlib";
import { back, strip } from "../cards/art";
import { css, typst } from "../src/emit";
import { palette } from "../src/palette";
import { Raster, png } from "../src/raster";
import { IDENTITY, UI } from "../src/tokens";
import { woffToSfnt } from "../src/woff";

describe("tokens", () => {
  test("tokens.css is generated from tokens.ts", async () => {
    const file = await Bun.file(
      new URL("../tokens.css", import.meta.url),
    ).text();
    // run `bun run tokens` after changing src/tokens.ts
    expect(file).toBe(css());
  });

  test("the palette shares the UI ink", () => {
    expect(palette("day").ink).toBe(UI.day.ink);
    expect(palette("night").ink).toBe(UI.night.ink);
  });

  test("typst module carries identity and colours", () => {
    const t = typst();
    expect(t).toContain(`email: "${IDENTITY.email}"`);
    expect(t).toContain(`blue-text: rgb("${UI.day.blueText}")`);
  });
});

describe("raster", () => {
  test("fillRect with alpha, translate and flip", () => {
    const r = new Raster(4, 1);
    const c = r.getContext("2d");
    c.fillStyle = "#ff0000";
    c.fillRect(0, 0, 1, 1);
    c.save();
    c.translate(4, 0);
    c.scale(-1, 1);
    c.globalAlpha = 0.5;
    c.fillRect(0, 0, 1, 1);
    c.restore();
    expect([...r.data.slice(0, 4)]).toEqual([255, 0, 0, 255]);
    expect([...r.data.slice(12, 16)]).toEqual([255, 0, 0, 128]);
    expect(r.data[7]).toBe(0);
  });

  test("png scales each pixel to a hard-edged block", () => {
    const r = new Raster(2, 1);
    r.data.set([1, 2, 3, 255, 4, 5, 6, 255]);
    const b = png(r, 3);
    expect([...b.slice(1, 4)].map((x) => String.fromCharCode(x))).toEqual([
      "P",
      "N",
      "G",
    ]);
    const v = new DataView(b.buffer);
    expect([v.getUint32(16), v.getUint32(20)]).toEqual([6, 3]);
    // IDAT follows the signature (8 bytes) and IHDR (25 bytes)
    const len = v.getUint32(33);
    const raw = inflateSync(b.slice(41, 41 + len));
    // row: filter byte, then 3 copies of each source pixel
    expect([...raw.subarray(1, 5)]).toEqual([1, 2, 3, 255]);
    expect([...raw.subarray(9, 13)]).toEqual([1, 2, 3, 255]);
    expect([...raw.subarray(13, 17)]).toEqual([4, 5, 6, 255]);
  });
});

describe("cards", () => {
  test("art covers the card with bleed, no holes", () => {
    const r = back(palette("day"));
    expect([r.width, r.height]).toEqual([91 * 3, 61 * 3]);
    for (let i = 3; i < r.data.length; i += 4) expect(r.data[i]).toBe(255);
    expect(strip(palette("day")).width).toBe(r.width);
  });

  test("the display font converts to a TrueType file", async () => {
    const woff = Bun.resolveSync(
      "@fontsource/pixelify-sans/files/pixelify-sans-latin-700-normal.woff",
      import.meta.dir,
    );
    const ttf = woffToSfnt(new Uint8Array(await Bun.file(woff).arrayBuffer()));
    const v = new DataView(ttf.buffer);
    expect(v.getUint32(0)).toBe(0x00010000);
    const tags = Array.from({ length: v.getUint16(4) }, (_, i) =>
      String.fromCharCode(...ttf.subarray(12 + i * 16, 16 + i * 16)),
    );
    expect(tags).toEqual(expect.arrayContaining(["cmap", "glyf", "head"]));
  });
});
