import { drawStation } from "./stations";
import {
  drawFar,
  drawForeground,
  drawGround,
  drawMid,
  drawSky,
  type View,
} from "./scenery";
import type { Pal } from "./palette";
import { ART_AHEAD, STATIONS } from "./walk";

export { hash } from "./gfx";
export type { View } from "./scenery";
export { drawForeground };

/** Text drawn on the canvas, kept here so tests can check the font covers it. */
export const CANVAS_TEXT = [
  "PHILIPP",
  "NAGEL",
  "GRID TO PACKET",
  "SCROLL",
  "WIND",
  "STATION",
  "TRAFO",
  "MARKET",
  "HOUSE",
  "METER",
  "EV",
  "DSO",
  "GATEWAY",
  "SUB",
  "WAN",
  "KWH",
  "GW",
  "HDR",
  "ADDR",
  "OBIS",
  "VALUE",
  "CRC",
  "ONE READING",
  "SAY HELLO",
  "HELLO",
  "BOOK A CALL",
  "LINKEDIN",
  "N",
  "0123456789",
];

/** Draws the sky, the parallax layers, the ground and the stations; the character goes on top. */
export function drawWorld(c: CanvasRenderingContext2D, p: Pal, v: View) {
  drawSky(c, p, v);
  drawFar(c, p, v);
  drawMid(c, p, v);
  drawGround(c, p, v);
  STATIONS.forEach((s, i) => {
    const cx = Math.round(s + ART_AHEAD - v.camX);
    if (cx < -330 || cx > v.W + 330) return;
    drawStation(c, p, v, i, cx, v.gy);
  });
}
