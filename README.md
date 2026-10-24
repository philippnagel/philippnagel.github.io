# philippnagel.com

Personal site: one interactive pixel-art page, "Grid to Packet".

One shared scene with two layers drawn together: the **power layer** (ground) and the **data layer** (the band above it). Zoom through four nested scales, each a full pixel-art scene:

1. **Grid**: generation, transmission, substation, local transformer, a house. Regulator, standards, security and market roles above.
2. **Metering Point**: the house with its grid connection, meter cabinet, rooftop PV, home energy management and EV charger. Trust chain, master data, market messages and gateway admin above.
3. **Meter Cabinet**: meter, gateway, sub-meter and local devices. The meter-to-gateway, wide-area and home-area links and the security module above.
4. **Protocol Frame**: one meter reading as a frame, field by field.

Hover or click anything to light up what it is linked to on the other layer; a caption explains it. Click the dashed window (house, meter cabinet, WAN packet) to dive in. `BOTH / POWER / DATA` switches which layer is emphasised. The scene follows light/dark mode (day / night).

## Stack

TypeScript + [Bun](https://bun.sh) 1.4.4. No runtime dependencies; `typescript` and `@types/bun` are dev-only. All art is drawn in code onto 1:1 canvases and scaled with nearest-neighbour, so there are no image assets except the avatar.

## Commands

```sh
bun install
bun run dev         # dev server with HMR (src/index.html)
bun run build       # bundle + minify into dist/ (also copies CNAME)
bun run test        # scene / geometry / template tests
bun run typecheck   # tsc --noEmit
bun run fmt         # bun fmt
bun run check       # fmt check + typecheck + tests (what CI runs)
```

## Layout

| Path                              | Purpose                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| `src/index.html`, `src/style.css` | Page shell and UI styling                                                            |
| `src/art/*.ts`                    | The four scenes: background, objects (sprites), links, wires                         |
| `src/pix.ts`                      | Pixel painter: rects, lines, discs, 3x5 bitmap font, wire helpers                    |
| `src/palette.ts`                  | Day and night palettes                                                               |
| `src/scenes.ts`                   | Scene order (outermost first)                                                        |
| `src/geometry.ts`                 | Scene size, portal nesting, camera fit / fly maths (pure)                            |
| `src/world.ts`, `src/renderer.ts` | Pre-rendered bitmaps; canvas drawing, level-of-detail fades, highlights, hit testing |
| `src/camera.ts`, `src/input.ts`   | Animated camera; wheel / drag / pinch                                                |
| `src/templates.ts`                | Caption, breadcrumb and screen-reader markup                                         |
| `src/main.ts`                     | App state and event wiring                                                           |
| `tests/`                          | `bun test` suites                                                                    |
| `.github/workflows/pages.yml`     | Check, build and deploy to GitHub Pages                                              |

## Editing a scene

- Each scene is a 320x180 pixel grid. A data band sits above `BAND_Y` (80), the power band below it.
- An object has a rectangle, a `paint(g, pal)` function in local coordinates, a name, a caption and `links` to objects on the other layer (links are symmetric).
- Exactly one object per scene has a `portal`: the 48x27 window in which the next scene appears.
- `bun test` checks bounds, layer placement, overlaps, link targets, drawable glyphs and portal nesting.

## Deploy

Pushing to `main` runs the workflow. One-time setup: repo Settings → Pages → Source: **GitHub Actions**.
