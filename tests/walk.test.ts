import { describe, expect, test } from "bun:test";
import { bass, melody, noteHz } from "../src/audio";
import { chapters } from "../src/chapters";
import { hasGlyph } from "../src/font";
import { palette } from "../src/palette";
import {
  END,
  STATIONS,
  Walker,
  artScale,
  nearest,
  scrollOf,
  walkOf,
} from "../src/walk";
import { CANVAS_TEXT, hash } from "../src/world";

describe("stations", () => {
  test("ascend, one chapter each", () => {
    expect(chapters.length).toBe(STATIONS.length);
    for (let i = 1; i < STATIONS.length; i++)
      expect(STATIONS[i]!).toBeGreaterThan(STATIONS[i - 1]!);
  });

  test("nearest picks the closest station", () => {
    STATIONS.forEach((x, i) => expect(nearest(x)).toBe(i));
    expect(nearest(-50)).toBe(0);
    expect(nearest(END + 999)).toBe(STATIONS.length - 1);
  });
});

describe("scroll mapping", () => {
  test("round-trips and clamps", () => {
    expect(walkOf(scrollOf(480, 2), 2)).toBe(480);
    expect(walkOf(-10, 2)).toBe(0);
    expect(walkOf(1e9, 2)).toBe(END);
  });

  test("art scale is a whole number within bounds", () => {
    for (const w of [320, 390, 1280, 1920, 5000]) {
      const k = artScale(w);
      expect(Number.isInteger(k)).toBe(true);
      expect(k).toBeGreaterThanOrEqual(1);
      expect(k).toBeLessThanOrEqual(3);
    }
  });
});

describe("Walker", () => {
  test("eases toward the target and flags walking", () => {
    const w = new Walker(false);
    w.update(100, 0.016);
    expect(w.x).toBeGreaterThan(0);
    expect(w.x).toBeLessThan(100);
    expect(w.moving).toBe(true);
    expect(w.facing).toBe(1);
    for (let i = 0; i < 400; i++) w.update(100, 0.016);
    expect(w.x).toBe(100);
    expect(w.moving).toBe(false);
  });

  test("faces backwards when walking back; instant mode snaps", () => {
    const w = new Walker(true);
    w.update(50, 0.016);
    expect(w.x).toBe(50);
    w.update(10, 0.016);
    expect(w.facing).toBe(-1);
  });
});

describe("art", () => {
  test("font covers every canvas string", () => {
    for (const s of CANVAS_TEXT)
      for (const ch of s) expect(hasGlyph(ch)).toBe(true);
  });

  test("hash stays in [0, 1) and is deterministic", () => {
    for (let i = -50; i < 500; i++) {
      const h = hash(i);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
      expect(hash(i)).toBe(h);
    }
  });

  test("day and night palettes define the same colours", () => {
    expect(Object.keys(palette("day")).sort()).toEqual(
      Object.keys(palette("night")).sort(),
    );
  });
});

describe("audio", () => {
  test("noteHz uses concert pitch", () => {
    expect(noteHz(69)).toBe(440);
    expect(noteHz(81)).toBeCloseTo(880);
  });

  test("melody and bass loop and stay in a sane range", () => {
    for (const night of [false, true])
      for (let i = 0; i < 64; i++) {
        expect(melody(i, night)).toBe(melody(i + 32, night));
        const m = melody(i, night);
        if (m !== null) {
          expect(m).toBeGreaterThanOrEqual(60);
          expect(m).toBeLessThanOrEqual(100);
        }
        const b = bass(i, night);
        if (b !== null) expect(b).toBeLessThan(70);
      }
  });
});
