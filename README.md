# philippnagel.com

Personal site: one interactive page, "Grid to Packet".

An SVG diagram you zoom through three nested scales, with the physical stack (left) beside the protocol stack (right). A DE / JP toggle (also `#jp` in the URL) switches between the German and Japanese smart-metering stacks. German version:

1. **National Grid**: TSO / DSO / substations ↔ BNetzA, BDEW EDI@Energy, VDE FNN / BSI, market roles
2. **Metering Point**: meter cabinet, base meter, Smart Meter Gateway, customer premises ↔ UTILMD, MSCONS, ORDERS/CONTRL/APERAK, AS4 / TLS / PKI
3. **Edge Devices**: meters, SMGW, HEMS, wallbox / inverter ↔ LMN, DLMS/COSEM, HAN, WAN / SMGW admin

Japan covers METI/ANRE, OCCTO EDI, the national aggregation system and 電力データ管理協会 (SMDSA), plus the A-, B- and IoT-Routes (Wi-SUN, ECHONET Lite, DLMS/COSEM).

Selecting a node highlights its counterpart on the other stream. Some nodes open an annotated protocol frame (MSCONS, DLMS/COSEM, SM-PKI chain, ECHONET Lite, SMDSA data chain, IoT-Route stack).

## Stack

TypeScript + [Bun](https://bun.sh) 1.4.4. No runtime dependencies; `typescript` and `@types/bun` are dev-only. The browser gets one bundled JS file, one CSS file and the avatar.

## Commands

```sh
bun install
bun run dev        # dev server with HMR (src/index.html)
bun run build      # bundle + minify into dist/ (also copies CNAME)
bun run test       # data validation + geometry/template unit tests
bun run typecheck  # tsc --noEmit
bun run check      # typecheck + tests (what CI runs)
```

## Layout

| Path | Purpose |
|------|---------|
| `src/index.html`, `src/style.css` | Page shell and all styling (CSS variables, dark mode) |
| `src/data/{de,jp}.ts`, `frames.ts` | Content: levels, nodes, links, protocol frames |
| `src/types.ts` | Shared types |
| `src/geometry.ts` | Layout constants, nested-scene origins, camera fit/fly maths (pure) |
| `src/scene.ts` | SVG markup for a scene (pure) |
| `src/templates.ts` | HTML for panel, breadcrumb, minimap (pure) |
| `src/stage.ts` | SVG DOM: mounting, level-of-detail fades, highlight painting |
| `src/camera.ts`, `src/input.ts` | Animated camera; wheel / drag / pinch |
| `src/main.ts` | App state and event wiring |
| `tests/` | `bun test` suites |
| `scripts/build.ts` | Production build |
| `.github/workflows/pages.yml` | Test, build and deploy to GitHub Pages |

## Editing content

- Add or change nodes in `src/data/de.ts` / `jp.ts`. Each level has 4 physical and 4 protocol nodes; `links` pairs `[physicalIndex, protocolIndex]`; the 4th physical node is the zoom portal into the next level.
- Protocol frames live in `src/data/frames.ts`; reference one from a node with `f: 'key'`.
- New market: add a data file and register it in `src/data/index.ts`. `bun test` checks link indices, frame keys and label lengths.

## Deploy

Pushing to `main` runs the workflow. One-time setup: repo Settings → Pages → Source: **GitHub Actions**.
