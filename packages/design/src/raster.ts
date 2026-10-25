import { deflateSync } from "node:zlib";
import { rgb } from "./palette";
import { setCanvasFactory, type C } from "./gfx";

/**
 * A software 2D canvas with the part of the API the art code uses: solid
 * rects, alpha, integer translate, horizontal flip, image data and blitting
 * another raster. Enough to bake sprites and scenes outside the browser.
 */
export class Raster {
  private w = 0;
  private h = 0;
  data = new Uint8ClampedArray(0);

  constructor(w = 0, h = 0) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  // setting a size clears the bitmap, as on a real canvas
  get width() {
    return this.w;
  }
  set width(v: number) {
    this.w = v;
    this.data = new Uint8ClampedArray(this.w * this.h * 4);
  }
  get height() {
    return this.h;
  }
  set height(v: number) {
    this.h = v;
    this.data = new Uint8ClampedArray(this.w * this.h * 4);
  }

  getContext(_: "2d") {
    return new RasterContext(this) as unknown as C;
  }
}

interface State {
  tx: number;
  ty: number;
  sx: 1 | -1;
  alpha: number;
  fill: [number, number, number];
}

class RasterContext {
  private s: State = { tx: 0, ty: 0, sx: 1, alpha: 1, fill: [0, 0, 0] };
  private stack: State[] = [];
  constructor(readonly canvas: Raster) {}

  set fillStyle(v: string) {
    this.s.fill = rgb(v);
  }
  set globalAlpha(v: number) {
    this.s.alpha = v;
  }
  get globalAlpha() {
    return this.s.alpha;
  }
  save() {
    this.stack.push({ ...this.s });
  }
  restore() {
    this.s = this.stack.pop() ?? this.s;
  }
  translate(x: number, y: number) {
    this.s.tx += x * this.s.sx;
    this.s.ty += y;
  }
  scale(x: number, y: number) {
    if (Math.abs(x) !== 1 || y !== 1) throw new Error("only scale(±1, 1)");
    this.s.sx = (this.s.sx * x) as 1 | -1;
  }

  /** Device-space rect, normalised for a flipped x axis. */
  private rect(x: number, y: number, w: number, h: number) {
    let x0 = this.s.tx + this.s.sx * x;
    let x1 = this.s.tx + this.s.sx * (x + w);
    if (x1 < x0) [x0, x1] = [x1, x0];
    return [x0, this.s.ty + y, x1, this.s.ty + y + h] as const;
  }

  private put(
    x: number,
    y: number,
    r: number,
    g: number,
    b: number,
    a: number,
  ) {
    const { width: w, height: h, data: d } = this.canvas;
    if (x < 0 || y < 0 || x >= w || y >= h || a <= 0) return;
    const i = (y * w + x) * 4;
    const da = d[i + 3]! / 255;
    const oa = a + da * (1 - a);
    const mix = (s: number, t: number) => (s * a + t * da * (1 - a)) / oa;
    d[i] = mix(r, d[i]!);
    d[i + 1] = mix(g, d[i + 1]!);
    d[i + 2] = mix(b, d[i + 2]!);
    d[i + 3] = oa * 255;
  }

  fillRect(x: number, y: number, w: number, h: number) {
    const [x0, y0, x1, y1] = this.rect(x, y, w, h);
    const [r, g, b] = this.s.fill;
    for (let yy = Math.round(y0); yy < Math.round(y1); yy++)
      for (let xx = Math.round(x0); xx < Math.round(x1); xx++)
        this.put(xx, yy, r, g, b, this.s.alpha);
  }

  clearRect(x: number, y: number, w: number, h: number) {
    const [x0, y0, x1, y1] = this.rect(x, y, w, h);
    const { width: cw, data: d } = this.canvas;
    for (let yy = Math.max(0, Math.round(y0)); yy < Math.round(y1); yy++)
      for (let xx = Math.max(0, Math.round(x0)); xx < Math.round(x1); xx++)
        if (xx < cw && yy < this.canvas.height)
          d.fill(0, (yy * cw + xx) * 4, (yy * cw + xx) * 4 + 4);
  }

  getImageData(_x: number, _y: number, w: number, h: number) {
    return {
      width: w,
      height: h,
      data: new Uint8ClampedArray(this.canvas.data),
    };
  }
  putImageData(img: { data: Uint8ClampedArray }) {
    this.canvas.data.set(img.data);
  }

  drawImage(src: Raster, x: number, y: number) {
    const { width: w, height: h, data: d } = src;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const k = (j * w + i) * 4;
        if (!d[k + 3]) continue;
        const [x0, y0] = this.rect(x + i, y + j, 1, 1);
        this.put(
          x0,
          y0,
          d[k]!,
          d[k + 1]!,
          d[k + 2]!,
          (d[k + 3]! / 255) * this.s.alpha,
        );
      }
  }
}

/** Lets `bake` (sprites, outlines) run without a DOM. */
export const useRaster = () =>
  setCanvasFactory(() => new Raster() as unknown as HTMLCanvasElement);

/** Fills the raster with an opaque colour. */
export function fill(r: Raster, col: string) {
  const [a, b, c] = rgb(col);
  for (let i = 0; i < r.data.length; i += 4) r.data.set([a, b, c, 255], i);
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** RGBA PNG, each art pixel scaled up `k` times with hard edges. */
export function png(r: Raster, k = 1): Uint8Array {
  const W = r.width * k;
  const H = r.height * k;
  const raw = new Uint8Array(H * (W * 4 + 1));
  for (let y = 0; y < H; y++) {
    const row = y * (W * 4 + 1);
    const sy = Math.floor(y / k);
    for (let x = 0; x < W; x++) {
      const s = (sy * r.width + Math.floor(x / k)) * 4;
      raw.set(r.data.subarray(s, s + 4), row + 1 + x * 4);
    }
  }
  const chunk = (type: string, body: Uint8Array) => {
    const out = new Uint8Array(12 + body.length);
    const v = new DataView(out.buffer);
    v.setUint32(0, body.length);
    out.set(new TextEncoder().encode(type), 4);
    out.set(body, 8);
    v.setUint32(8 + body.length, crc32(out.subarray(4, 8 + body.length)));
    return out;
  };
  const ihdr = new Uint8Array(13);
  const v = new DataView(ihdr.buffer);
  v.setUint32(0, W);
  v.setUint32(4, H);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", new Uint8Array()),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) out.set(p, (o += p.length) - p.length);
  return out;
}
