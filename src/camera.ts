import type { View } from "./types";

/** Current view. Scroll position drives it; rendering is delegated through `onChange`. */
export class Camera {
  view: View = { cx: 500, cy: 500, w: 1100 };

  constructor(private readonly onChange: (v: View) => void) {}

  set(v: View) {
    this.view = { ...v };
    this.onChange(this.view);
  }
}
