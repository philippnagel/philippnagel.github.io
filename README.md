# philippnagel.com

Personal site: one scrolling pixel-art page, "Grid to Packet".

Scroll to walk Philipp (the pixel character is him) along a path through eight stations, in a side-scrolling world with parallax layers (sky, far skyline, hills, pylons, path, foreground grass):

1. **Hello**: the title as a block-pixel logo.
2. **Grid**: wind turbines, substation, transformer. Yellow squares are power, blue squares are data, and the market cloud floats above.
3. **Battery site (BESS)**: three battery containers with live state-of-charge bars and fans, a power conversion cabinet and a transformer. Power flows in while charging and out while discharging, and the energy management system talks to the market.
4. **Data center**: a long server hall with flickering rack lights, a swinging load meter, spinning roof coolers that shed heat, a grid connection with two transformers, a UPS and a backup generator, and a cloud link above.
5. **Metering point**: a house with rooftop PV, meter box, EV and charger, and a link up to the DSO.
6. **Meter cabinet**: meter, gateway and sub-meter, with a live kWh counter and the WAN link.
7. **Protocol frame**: one meter reading, field by field (header, address, OBIS, value, CRC).
8. **Contact**: fireworks, a signpost and a mailbox.

A start gate (Enter / Enter without sound) unlocks audio and the page. Sound is synthesised in the browser with Web Audio (no audio files): a small chiptune loop that changes key between day and night, footsteps, an arrival chime per station and UI clicks; the speaker button in the header mutes it.

Impressum and Datenschutz open as an overlay (links in the corner, or `/#impressum`, `/#datenschutz`) and also exist as standalone pages (`/impressum.html`, `/datenschutz.html`). A chapter card explains each station; the dots on the right jump between them. The scene follows light / dark mode (day / night) and the header button toggles it.

## Stack

TypeScript + [Bun](https://bun.sh) 1.4.4. No runtime dependencies; `typescript`, `@types/bun` and the Pixelify Sans font (inlined into the CSS at build time) are dev-only. Everything is drawn in code to a small canvas (about 640x360 art pixels, scaled by a whole number). The art is a brick world after the Yamauchi No.10 site: objects are extruded bricks (lit top face, shaded side, studs) or voxel shapes built cube by cube (`block`, `vox`, `studs` in `gfx.ts`), in five-tone material ramps with an automatic coloured silhouette outline, pre-rendered once per time of day. The sky is flat banded plates under a faint stud grid, the hills are stepped brick terraces from value noise, and the ground is a studded baseplate with a plate path. Labels use a 5x7 bitmap font. No image assets in the scene; the only images are the avatar, the icons and the social preview (`og.png`). Page scroll sets how far Philipp has walked; the walk is eased so he keeps stepping after you stop.

## Creative Inspiration

- Landing page of the Nintendo Family Office: https://www.y-n10.com/
- High quality, fidelity pixel/blocky art
- Scrollytelling

## Commands

```sh
bun install
bun run dev         # dev server with HMR (src/index.html)
bun run build       # bundle + minify into dist/ (also copies CNAME)
bun run test        # scene / geometry / template tests
bun run typecheck   # tsc --noEmit
bun run format      # bun fmt
bun run check       # fmt check + typecheck + tests (what CI runs)
bun run tokens      # regenerate packages/design/tokens.css after editing tokens.ts
bun run cards       # business card PDF + previews in packages/design/out/ (needs typst)
```

## Layout

| Path                              | Purpose                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/index.html`, `src/style.css` | Page shell and UI styling                                                                      |
| `src/world.ts`                    | Sky, parallax layers, ground and the eight station scenes                                      |
| `src/walk.ts`                     | Station positions, scroll to walk mapping, eased `Walker`                                      |
| `src/theme.ts`                    | Theme toggle                                                                                   |
| `src/audio.ts`                    | Web Audio synth: music loop, footsteps, chimes                                                 |
| `src/chapters.ts`                 | Chapter card copy, one per station                                                             |
| `src/legal-text.ts`, `legal.ts`   | Impressum and Datenschutz: overlay, `#impressum` links; the build also writes standalone pages |
| `src/main.ts`                     | Canvas sizing, frame loop, chapter card and rail                                               |
| `packages/design/`                | Design library: tokens, palettes, bricks, 5x7 font, Philipp, business cards                    |
| `tests/`                          | `bun test` suites                                                                              |
| `.github/workflows/pages.yml`     | Check, build and deploy to GitHub Pages                                                        |

## Design library

`packages/design` (`@philippnagel/design`, a Bun workspace) holds what the site and print share:

- `tokens.ts`: identity (name, role, contact), accent and UI colours per scheme, font stacks. `tokens.css` is generated from it and imported by `style.css`; `tokens.typ` is generated for Typst.
- `palette.ts`, `gfx.ts`, `font.ts`, `philipp.ts`: scene palettes, brick and voxel primitives, the 5x7 font, the character.
- `raster.ts`: a software canvas and PNG writer, so the same art code draws without a browser.
- `cards/`: the business card. `art.ts` draws the back scene and the brick strip for the front; `card.typ` lays out both sides at 85 x 55 mm plus 3 mm bleed, with a QR code to the site. `bun run cards` writes `out/card.pdf` (RGB, front then back) and 300 ppi previews.

## Editing a station

- `STATIONS` in `walk.ts` lists where each chapter is in focus; add a matching entry in `chapters.ts` and a `Station` in `STATION_ART` (`stations.ts`).
- A station has `bounds`, a `still` drawing (baked once per time of day, outlined) and a `live` drawing (animation and light), both in station space where x = 0 is the middle of the art and y = 0 the ground line. Strings drawn on the canvas go in `CANVAS_TEXT` so the test can check the font covers them.

## Deploy

Pushing to `main` runs the workflow. One-time setup: repo Settings → Pages → Source: **GitHub Actions**.
