import { inflateSync } from "node:zlib";

/**
 * WOFF 1.0 to a plain TrueType / OpenType file, for tools that only read
 * sfnt fonts (Typst). The tables are unpacked and laid out again; nothing
 * else changes.
 */
export function woffToSfnt(woff: Uint8Array): Uint8Array {
  const v = new DataView(woff.buffer, woff.byteOffset, woff.byteLength);
  if (v.getUint32(0) !== 0x774f4646) throw new Error("not a WOFF 1.0 file");
  const flavor = v.getUint32(4);
  const n = v.getUint16(12);
  const tables = Array.from({ length: n }, (_, i) => {
    const o = 44 + i * 20;
    const off = v.getUint32(o + 4);
    const comp = v.getUint32(o + 8);
    const orig = v.getUint32(o + 12);
    const raw = woff.subarray(off, off + comp);
    return {
      tag: v.getUint32(o),
      sum: v.getUint32(o + 16),
      data: comp < orig ? new Uint8Array(inflateSync(raw)) : raw,
    };
  });

  const head = 12 + n * 16;
  const pad = (x: number) => (x + 3) & ~3;
  const size = tables.reduce((s, t) => s + pad(t.data.length), head);
  const out = new Uint8Array(size);
  const w = new DataView(out.buffer);
  const sel = Math.floor(Math.log2(n));
  w.setUint32(0, flavor);
  w.setUint16(4, n);
  w.setUint16(6, 2 ** sel * 16);
  w.setUint16(8, sel);
  w.setUint16(10, n * 16 - 2 ** sel * 16);
  let at = head;
  tables.forEach((t, i) => {
    const r = 12 + i * 16;
    w.setUint32(r, t.tag);
    w.setUint32(r + 4, t.sum);
    w.setUint32(r + 8, at);
    w.setUint32(r + 12, t.data.length);
    out.set(t.data, at);
    at += pad(t.data.length);
  });
  return out;
}
