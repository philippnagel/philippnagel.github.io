import { describe, expect, test } from 'bun:test';
import { de } from '../src/data/de';
import { SZ, fitView, flyFrame, lodOpacity, origins, related } from '../src/geometry';

describe('origins', () => {
  test('each level shrinks by the portal ratio and nests inside its parent', () => {
    const [a, b, c] = origins(3);
    expect(a).toEqual({ x: 0, y: 0, k: 1 });
    expect(b!.k).toBeCloseTo(0.1);
    expect(c!.k).toBeCloseTo(0.01);
    expect(b!.x).toBeGreaterThan(0);
    expect(b!.x + b!.k * SZ).toBeLessThan(SZ);
    expect(c!.x).toBeGreaterThan(b!.x);
    expect(c!.x + c!.k * SZ).toBeLessThan(b!.x + b!.k * SZ);
  });
});

describe('fitView', () => {
  const size = { w: 1440, h: 900 };
  const ins = { top: 96, right: 360, bottom: 0 };

  test('shrinks the visible world window by 10x per level', () => {
    const [a, b] = origins(2);
    expect(fitView(a!, size, ins).w / fitView(b!, size, ins).w).toBeCloseTo(10);
  });

  test('frames the scene centre in the free area', () => {
    const o = origins(1)[0]!;
    const v = fitView(o, size, ins);
    const ps = size.w / v.w;
    const freeCx = (size.w - ins.right) / 2;
    const screenX = size.w / 2 + (SZ / 2 - v.cx) * ps;
    expect(screenX).toBeCloseTo(freeCx);
  });
});

describe('flyFrame', () => {
  const from = { cx: 500, cy: 500, w: 1100 };
  const to = { cx: 380, cy: 880, w: 110 };
  test('hits both endpoints', () => {
    const start = flyFrame(from, to, 0);
    expect(start.cx).toBeCloseTo(from.cx);
    expect(start.w).toBeCloseTo(from.w);
    const end = flyFrame(from, to, 1);
    expect(end.cx).toBeCloseTo(to.cx);
    expect(end.cy).toBeCloseTo(to.cy);
    expect(end.w).toBeCloseTo(to.w);
  });
  test('zoom is monotonic', () => {
    let prev = Infinity;
    for (let u = 0; u <= 1; u += 0.1) {
      const w = flyFrame(from, to, u).w;
      expect(w).toBeLessThanOrEqual(prev);
      prev = w;
    }
  });
});

test('lodOpacity clamps to 0..1', () => {
  expect(lodOpacity(0)).toBe(0);
  expect(lodOpacity(1e6)).toBe(1);
  expect(lodOpacity(125)).toBeGreaterThan(0);
});

test('related is symmetric across streams', () => {
  const lv = de[1]!;
  for (const [p, r] of lv.links) {
    expect(related(lv, { l: 1, s: 'p', i: p }).some((x) => x.s === 'r' && x.i === r)).toBe(true);
    expect(related(lv, { l: 1, s: 'r', i: r }).some((x) => x.s === 'p' && x.i === p)).toBe(true);
  }
});
