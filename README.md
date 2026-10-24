# philippnagel.com

Personal site: one interactive page, "Grid to Packet".

An SVG diagram you zoom through three nested scales, with the physical stack (left) beside the protocol stack (right). A DE / JP toggle (also `#jp` in the URL) switches between the German and Japanese smart-metering stacks. German version:

1. **National Grid**: TSO / DSO / substations ↔ BNetzA, BDEW EDI@Energy, VDE FNN / BSI, market roles
2. **Metering Point**: meter cabinet, base meter, Smart Meter Gateway, customer premises ↔ UTILMD, MSCONS, ORDERS/CONTRL/APERAK, AS4 / TLS / PKI
3. **Edge Devices**: meters, SMGW, HEMS, wallbox / inverter ↔ LMN, DLMS/COSEM, HAN, WAN / SMGW admin

Japan covers METI/ANRE, OCCTO EDI, the national aggregation system and 電力データ管理協会 (SMDSA), plus the A-, B- and IoT-Routes (Wi-SUN, ECHONET Lite, DLMS/COSEM).

Selecting a node highlights its counterpart on the other stream. Some nodes open an annotated protocol frame (MSCONS, DLMS/COSEM, SM-PKI chain, ECHONET Lite, SMDSA data chain, IoT-Route stack).

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole page: markup, CSS, JS. No dependencies, no build step |
| `profile-circle-crop.png` | Avatar in the header |
| `CNAME` | Custom domain for GitHub Pages |

## Editing

- Content lives in `LV_DE` / `LV_JP` (levels, nodes, links; add a market in `MARKETS`) and `FRAMES` (protocol frames) at the top of the script in `index.html`.
- Each level has 4 physical and 4 protocol nodes; `links` pairs `[physicalIndex, protocolIndex]`. The 4th physical node is the zoom portal into the next level.
- Colours are CSS variables in `:root`, with dark-mode overrides.

## Run

Open `index.html` in a browser, or serve the folder (`python3 -m http.server`). Deployed via GitHub Pages.
