import { cabinet } from "./art/cabinet";
import { frame } from "./art/frame";
import { grid } from "./art/grid";
import { house } from "./art/house";
import type { SceneDef } from "./types";

/** Outermost first; each scene's portal object hosts the next one. */
export const scenes: SceneDef[] = [grid, house, cabinet, frame];
