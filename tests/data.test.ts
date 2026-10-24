import { describe, expect, test } from 'bun:test';
import { frames, LEVEL_NAMES, markets } from '../src/data';
import { DRILL } from '../src/geometry';

// Rough text budgets (chars) so labels fit inside the SVG node boxes.
const MAX = { title: 26, tag: 40, line: 46, drillLine: 32 };

describe.each(markets)('market $id', (m) => {
  test('has one level per breadcrumb name', () => {
    expect(m.levels.length).toBe(LEVEL_NAMES.length);
  });

  for (const [li, lv] of m.levels.entries()) {
    describe(`level ${li + 1}`, () => {
      test('four nodes per stream', () => {
        expect(lv.p.length).toBe(4);
        expect(lv.r.length).toBe(4);
      });

      test('links point at existing nodes and are unique', () => {
        const seen = new Set<string>();
        for (const [p, r] of lv.links) {
          expect(lv.p[p]).toBeDefined();
          expect(lv.r[r]).toBeDefined();
          expect(seen.has(`${p}:${r}`)).toBe(false);
          seen.add(`${p}:${r}`);
        }
      });

      test('every node is linked to the other stream', () => {
        lv.p.forEach((_, i) => expect(lv.links.some(([p]) => p === i)).toBe(true));
        lv.r.forEach((_, i) => expect(lv.links.some(([, r]) => r === i)).toBe(true));
      });

      test('frame keys exist', () => {
        for (const n of [...lv.p, ...lv.r]) if (n.f) expect(frames[n.f]).toBeDefined();
      });

      test('labels fit their boxes', () => {
        for (const side of ['p', 'r'] as const)
          lv[side].forEach((n, i) => {
            const drill = side === 'p' && i === DRILL && li < m.levels.length - 1;
            expect(n.t.length).toBeLessThanOrEqual(MAX.title);
            expect(n.tag.length).toBeLessThanOrEqual(MAX.tag);
            expect(n.l.length).toBeLessThanOrEqual(2);
            for (const line of n.l) expect(line.length).toBeLessThanOrEqual(drill ? MAX.drillLine : MAX.line);
          });
      });
    });
  }
});

test('frames have notes or a trailing footnote only', () => {
  for (const [key, rows] of Object.entries(frames)) {
    rows.forEach(([, note], i) => {
      if (note === null) expect(i, `${key} footnote must be last`).toBe(rows.length - 1);
    });
  }
});
