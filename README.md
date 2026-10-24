# philippnagel.com

Personal site: one interactive page, "Grid to Packet".

An SVG diagram you zoom through three nested scales, with the physical stack (left) beside the protocol stack (right):

1. **National Grid**: TSO / DSO / substations ↔ BNetzA, BDEW EDI@Energy, VDE FNN / BSI, market roles
2. **Metering Point**: meter cabinet, base meter, Smart Meter Gateway, customer premises ↔ UTILMD, MSCONS, ORDERS/CONTRL/APERAK, AS4 / TLS / PKI
3. **Edge Devices**: meters, SMGW, HEMS, wallbox / inverter ↔ LMN, DLMS/COSEM, HAN, WAN / SMGW admin

Selecting a node highlights its counterpart on the other stream. Some nodes open an annotated protocol frame (MSCONS, DLMS/COSEM, SM-PKI chain).

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole page: markup, CSS, JS. No dependencies, no build step |
| `profile-circle-crop.png` | Avatar in the header |
| `CNAME` | Custom domain for GitHub Pages |

## Editing

- Content lives in the `LV` array (levels, nodes, links) and `FRAMES` (protocol frames) at the top of the script in `index.html`.
- Each level has 4 physical and 4 protocol nodes; `links` pairs `[physicalIndex, protocolIndex]`. The 4th physical node is the zoom portal into the next level.
- Colours are CSS variables in `:root`, with dark-mode overrides.

## Run

Open `index.html` in a browser, or serve the folder (`python3 -m http.server`). Deployed via GitHub Pages.
