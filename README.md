# philippnagel.com

Personal site: one interactive pixel-art page, "Grid to Packet".

One shared isometric scene with two layers drawn together: the **power layer** (a floating terrain island) and the **data layer** (a glass deck hovering above it). Zoom through four nested scales, each a full pixel-art scene:

1. **Grid**: generation, transmission, substation, local transformer, a house. Regulator, standards, security and market roles above.
2. **Metering Point**: the house with its grid connection, meter cabinet, rooftop PV, home energy management and EV charger. Trust chain, master data, market messages and gateway admin above.
3. **Meter Cabinet**: meter, gateway, sub-meter and local devices. The meter-to-gateway, wide-area and home-area links and the security module above.
4. **Protocol Frame**: one meter reading as a frame, field by field.

Hover or click anything to light up what it is linked to on the other layer; a caption explains it. Click the glowing hologram window (next to the house, the meter cabinet and the WAN packet), which previews the next level, to dive in. `BOTH / POWER / DATA` switches which layer is emphasised. The scene follows light/dark mode (day / night).

## Stack

TypeScript + [Bun](https://bun.sh) 1.4.4. No runtime dependencies; `typescript` and `@types/bun` are dev-only. All art is drawn in code on an isometric 2:1 grid at 960x540 art pixels per scene, with shaded five-tone material ramps, a 5x7 bitmap font, live animation (turbine blades, smoke, traffic, LEDs, clouds, packets) and night-time glows. Objects are pre-rendered bitmaps, picked pixel-accurately and outlined by silhouette. There are no image assets except the avatar.

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

| Path                                       | Purpose                                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `src/index.html`, `src/style.css`          | Page shell and UI styling                                                                    |
| `src/art/{grid,house,cabinet,frame}.ts`    | The four scenes: background, objects, links, wires                                           |
| `src/art/kit.ts`, `common.ts`, `shared.ts` | Shared scenery: sky, island, deck, trees, fences, cars, people, clouds, gateway sprite       |
| `src/iso.ts`                               | Isometric primitives: boxes, cylinders, gable roofs, face quads, shadows                     |
| `src/pix.ts`                               | Pixel painter: shaded slabs, cylinders, spheres, polygons, dithering, 5x7 font, wire helpers |
| `src/palette.ts`                           | Day and night palettes built from five-tone material ramps                                   |
| `src/scenes.ts`                            | Scene order (outermost first)                                                                |
| `src/geometry.ts`                          | Scene size, portal nesting, camera fit / fly maths (pure)                                    |
| `src/world.ts`, `src/renderer.ts`          | Pre-rendered bitmaps; canvas drawing, level-of-detail fades, highlights, hit testing         |
| `src/camera.ts`, `src/input.ts`            | Animated camera; wheel / drag / pinch                                                        |
| `src/templates.ts`                         | Caption, breadcrumb and screen-reader markup                                                 |
| `src/main.ts`                              | App state and event wiring                                                                   |
| `tests/`                                   | `bun test` suites                                                                            |
| `.github/workflows/pages.yml`              | Check, build and deploy to GitHub Pages                                                      |

## Editing a scene

- Each scene is a 960x540 pixel canvas holding an isometric terrain island (power layer) and a glass deck (data layer). `place(iso, [gx, gy, gz], fitBox(...), draw)` positions an object by grid coordinates.
- An object has a rectangle, a `paint(g, pal)` function in local coordinates (static), optional `anim(g, t, pal)` (drawn live every frame) and `lights` (night glows), a name, a caption (`text`) and `links` to objects on the other layer (links are symmetric).
- Exactly one object per scene has a `portal`: the 144x81 hologram window (given in scene coordinates) in which the next scene appears.
- `bun test` checks unique ids, bounds, link targets (and that links cross layers), drawable glyphs, wires inside the scene and portal nesting.

## Deploy

Pushing to `main` runs the workflow. One-time setup: repo Settings → Pages → Source: **GitHub Actions**.
