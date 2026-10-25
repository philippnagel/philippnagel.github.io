import { css } from "../src/emit";

await Bun.write(new URL("../tokens.css", import.meta.url), css());
