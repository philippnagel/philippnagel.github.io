import { describe, expect, test } from "bun:test";
import {
  PORTAL_W,
  SH,
  SW,
  fitView,
  flyFrame,
  lodOpacity,
  origins,
  scrollView,
  STOPS,
} from "../src/geometry";
import { scenes } from "../src/scenes";

const size = { w: 1440, h: 900 };
const ins = { top: 96, right: 0, bottom: 84 };

describe("fitView", () => {
  test("shrinks the visible world window by the portal ratio per level", () => {
    const o = origins(scenes);
    expect(
      fitView(o[0]!, size, ins).w / fitView(o[1]!, size, ins).w,
    ).toBeCloseTo(SW / PORTAL_W);
  });

  test("frame fits inside the free area", () => {
    const o = origins(scenes)[0]!;
    const v = fitView(o, size, ins);
    const ps = size.w / v.w;
    const left = size.w / 2 + (0 - v.cx) * ps;
    const right = size.w / 2 + (SW - v.cx) * ps;
    const top = size.h / 2 + (0 - v.cy) * ps;
    const bottom = size.h / 2 + (SH - v.cy) * ps;
    expect(left).toBeGreaterThanOrEqual(0);
    expect(right).toBeLessThanOrEqual(size.w);
    expect(top).toBeGreaterThanOrEqual(ins.top - 1);
    expect(bottom).toBeLessThanOrEqual(size.h - ins.bottom + 1);
  });
});

describe("flyFrame", () => {
  const from = { cx: 160, cy: 90, w: 340 };
  const to = { cx: 270, cy: 138, w: 50 };
  test("hits both endpoints", () => {
    const s = flyFrame(from, to, 0);
    expect(s.cx).toBeCloseTo(from.cx);
    expect(s.w).toBeCloseTo(from.w);
    const e = flyFrame(from, to, 1);
    expect(e.cx).toBeCloseTo(to.cx);
    expect(e.cy).toBeCloseTo(to.cy);
    expect(e.w).toBeCloseTo(to.w);
  });
  test("zoom is monotonic", () => {
    let prev = Infinity;
    for (let u = 0; u <= 1; u += 0.1) {
      const w = flyFrame(from, to, u).w;
      expect(w).toBeLessThanOrEqual(prev);
      prev = w;
    }
  });
});

test("lodOpacity clamps and ramps", () => {
  expect(lodOpacity(0, 900)).toBe(0);
  expect(lodOpacity(1e6, 900)).toBe(1);
  expect(lodOpacity(0.5 * 900, 900)).toBeGreaterThan(0.3);
  expect(lodOpacity(0.2 * 900, 900)).toBe(0);
});

describe("scrollView", () => {
  const fit = (l: number) => fitView(origins(scenes)[l]!, size, ins);

  test("holds each stop, then flies to the next", () => {
    expect(scrollView(2, fit).w).toBeCloseTo(fit(1).w);
    expect(scrollView(2.1, fit).w).toBeCloseTo(fit(1).w);
    expect(scrollView(2.9, fit).w).toBeCloseTo(fit(2).w);
    const mid = scrollView(2.5, fit);
    expect(mid.w).toBeLessThan(fit(1).w);
    expect(mid.w).toBeGreaterThan(fit(2).w);
  });

  test("clamps past the last section", () => {
    expect(scrollView(99, fit).w).toBeCloseTo(fit(STOPS[STOPS.length - 1]!).w);
  });
});
