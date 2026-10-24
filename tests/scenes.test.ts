import { describe, expect, test } from "bun:test";
import {
  BAND_Y,
  PORTAL_H,
  PORTAL_W,
  SH,
  SW,
  portalOf,
  portalRect,
  origins,
} from "../src/geometry";
import { GLYPH_W, hasGlyph, textWidth } from "../src/pix";
import { scenes } from "../src/scenes";
import { adjacencyOf } from "../src/graph";

describe.each(scenes.map((s, l) => [s, l] as const))("scene $0.id", (s, l) => {
  test("object ids are unique", () => {
    expect(new Set(s.objects.map((o) => o.id)).size).toBe(s.objects.length);
  });

  test("objects stay inside the scene", () => {
    for (const o of s.objects) {
      expect(o.x, o.id).toBeGreaterThanOrEqual(0);
      expect(o.y, o.id).toBeGreaterThanOrEqual(0);
      expect(o.x + o.w, o.id).toBeLessThanOrEqual(SW);
      expect(o.y + o.h, o.id).toBeLessThanOrEqual(SH);
    }
  });

  test("layers respect the band divider", () => {
    for (const o of s.objects) {
      if (o.layer === "d")
        expect(
          o.y + o.h,
          `${o.id} data object must sit above the divider`,
        ).toBeLessThanOrEqual(BAND_Y + 2);
      else
        expect(
          o.y + o.h,
          `${o.id} power object must reach the ground band`,
        ).toBeGreaterThan(BAND_Y);
    }
  });

  test("objects on the same layer do not overlap", () => {
    for (const a of s.objects)
      for (const b of s.objects) {
        if (a.id >= b.id || a.layer !== b.layer) continue;
        const overlap =
          a.x < b.x + b.w &&
          b.x < a.x + a.w &&
          a.y < b.y + b.h &&
          b.y < a.y + a.h;
        expect(overlap, `${a.id} overlaps ${b.id}`).toBe(false);
      }
  });

  test("links resolve and cross layers", () => {
    const byId = new Map(s.objects.map((o) => [o.id, o]));
    for (const o of s.objects)
      for (const t of o.links) {
        expect(byId.has(t), `${o.id} -> ${t}`).toBe(true);
        expect(
          byId.get(t)!.layer,
          `${o.id} -> ${t} must cross layers`,
        ).not.toBe(o.layer);
      }
    const adj = adjacencyOf(s);
    for (const o of s.objects)
      expect(adj.get(o.id)!.size, `${o.id} is unlinked`).toBeGreaterThan(0);
  });

  test("names use drawable glyphs", () => {
    for (const o of s.objects)
      expect([...o.name].every(hasGlyph), o.name).toBe(true);
  });

  test("wires are inside the scene", () => {
    for (const w of s.wires)
      for (const [x, y] of w.pts) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(SW);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(SH);
      }
  });

  test("portal exists exactly where a child scene exists", () => {
    const p = portalOf(s);
    if (l < scenes.length - 1) {
      expect(p, "missing portal").toBeDefined();
      const r = portalRect(p!);
      expect(r.w).toBe(PORTAL_W);
      expect(r.h).toBe(PORTAL_H);
      expect(r.x + r.w).toBeLessThanOrEqual(SW);
      expect(r.y + r.h).toBeLessThanOrEqual(SH);
      expect(s.objects.filter((o) => o.portal).length).toBe(1);
    } else expect(p).toBeUndefined();
  });
});

test("nested scenes shrink by the portal ratio", () => {
  const o = origins(scenes);
  expect(o.length).toBe(scenes.length);
  for (let i = 1; i < o.length; i++)
    expect(o[i]!.k / o[i - 1]!.k).toBeCloseTo(PORTAL_W / SW);
});

test("glyph metrics", () => {
  expect(textWidth("AB")).toBe(GLYPH_W * 2 - 1);
});
