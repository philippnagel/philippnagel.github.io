import { expect, test } from "bun:test";
import { scenes } from "../src/scenes";
import { a11yHTML, captionHTML, crumbsHTML, esc } from "../src/templates";

test("esc neutralises markup", () => {
  expect(esc('<b>&"')).toBe("&lt;b&gt;&amp;&quot;");
});

test("breadcrumb grows with depth", () => {
  expect(crumbsHTML(scenes, 0)).not.toContain("Metering Point");
  expect(crumbsHTML(scenes, 3)).toContain("Protocol Frame");
});

test("caption falls back to the scene hint", () => {
  expect(captionHTML(scenes, 0, null)).toContain("Hover or click");
  expect(captionHTML(scenes, 0, { l: 0, id: "tso" })).toContain("Transmission");
});

test("a11y list has one button per object", () => {
  const html = a11yHTML(scenes[0]!, 0);
  expect(html.match(/<button/g)!.length).toBe(scenes[0]!.objects.length);
});
