# philippnagel.com

Personal site: one scrolling pixel-art page, "Grid to Packet".

Scroll to walk Philipp (the pixel character is him) along a path through six stations, in a side-scrolling world with parallax layers (sky, far skyline, hills, pylons, path, foreground grass):

1. **Hello**: the title as a block-pixel logo.
2. **Grid**: wind turbines, substation, transformer. Yellow squares are power, blue squares are data, and the market cloud floats above.
3. **Metering point**: a house with rooftop PV, meter box, EV and charger, and a link up to the DSO.
4. **Meter cabinet**: meter, gateway and sub-meter, with a live kWh counter and the WAN link.
5. **Protocol frame**: one meter reading, field by field (header, address, OBIS, value, CRC).
6. **Contact**: fireworks, a signpost and a mailbox.

A start gate (Enter / Enter without sound) unlocks audio and the page. Sound is synthesised in the browser with Web Audio (no audio files): a small chiptune loop that changes key between day and night, footsteps, an arrival chime per station and UI clicks; the speaker button in the header mutes it.

A chapter card explains each station; the dots on the right jump between them. The scene follows light / dark mode (day / night) and the header button toggles it.

## Stack

TypeScript + [Bun](https://bun.sh) 1.4.4. No runtime dependencies; `typescript` and `@types/bun` are dev-only. Everything is drawn in code to a small canvas (about 320x180 art pixels, scaled by a whole number) with a 5x7 bitmap font. No image assets except the avatar. Page scroll sets how far Philipp has walked; the walk is eased so he keeps stepping after you stop.

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

| Path                              | Purpose                                                   |
| --------------------------------- | --------------------------------------------------------- |
| `src/index.html`, `src/style.css` | Page shell and UI styling                                 |
| `src/world.ts`                    | Sky, parallax layers, ground and the six station scenes   |
| `src/philipp.ts`                  | The character and its walk cycle                          |
| `src/walk.ts`                     | Station positions, scroll to walk mapping, eased `Walker` |
| `src/palette.ts`, `src/theme.ts`  | Day and night palettes; theme toggle                      |
| `src/audio.ts`                    | Web Audio synth: music loop, footsteps, chimes            |
| `src/font.ts`                     | 5x7 bitmap font                                           |
| `src/chapters.ts`                 | Chapter card copy, one per station                        |
| `src/main.ts`                     | Canvas sizing, frame loop, chapter card and rail          |
| `tests/`                          | `bun test` suites                                         |
| `.github/workflows/pages.yml`     | Check, build and deploy to GitHub Pages                   |

## Editing a station

- `STATIONS` in `walk.ts` lists where each chapter is in focus; add a matching entry in `chapters.ts` and a draw function in `STATION_ART` (`world.ts`).
- Station functions draw around a centre x and the ground line `gy`, using `px`, `wire`, `dotted`, `label` and `dataCloud`. Strings drawn on the canvas go in `CANVAS_TEXT` so the test can check the font covers them.

## Deploy

Pushing to `main` runs the workflow. One-time setup: repo Settings → Pages → Source: **GitHub Actions**.
