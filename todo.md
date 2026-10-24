# Todo: accomplishments and consulting copy

Goal: add personal accomplishments and text that helps prospective consulting clients find and trust me.

## Sources

- CV: `~/Documents/GitHub/cv/data.typ` (`consulting_summary`, `core_competencies`, `consulting_engagements`)
- Garden: `~/Documents/garden/market-ontology` (sourced comparison of DE, NL, JP and ENTSO-E/EU market communication)
- Site copy: `src/chapters.ts`

## Check before publishing

- CV says the Hausheld acquisition closed Sept 2025. Press (pv magazine, ox8) dates it Nov 2025 and names Mako365, not Mako Software. Confirm the date and entity name.
- Press names Ancala as Hausheld's private-equity owner. Decide whether to mention it.
- Sources:
  - https://ancala.com/ancala-forms-germanys-largest-independent-smart-metering-platform/
  - https://www.pv-magazine.de/2025/11/06/zusammenschluss-soll-smart-meter-rollout-push-verleihen/
  - https://ancala.com/portfolio/hausheld-ag/

## Insertion points (no new stations)

| Chapter | Add |
| --- | --- |
| Hello | One positioning sentence: "I build and run smart-metering platforms: 500k+ meters, ~10M market messages a week." |
| Grid | One-line proof of market-communication scale (~10M EDIFACT/AS4 messages/week across GPKE, WiM, MPES). |
| Metering point | §14a EnWG, MsbG and iMSys rollout angle (garden: Q4 2025 rollout 23.3%). |
| Meter cabinet | SMGW lifecycle, BSI TR-03109, DLMS/COSEM (IEC 62056). |
| Protocol frame | Japan bridge: ECHONET Lite ↔ DLMS/COSEM, B-route. The differentiator. |
| Contact | Explicit offer plus a short track-record line, replacing "Say hello". |

## New copy

- "Work with me" panel on the Contact chapter, mirrored in the `.sr` text:
  1. Cross-border smart-metering data access (EU and Japan)
  2. MSB platform architecture and rollout operations
  3. Market communication (MaKo) automation and regulatory mapping
  4. Technical due diligence and integration
- Track-record strip: 9+ years, 500k meters, ~10M messages/week, Hausheld exit, BNetzA/BDEW/VDE FNN committee seats.
- Optional: publish a curated subset of garden notes (`japan`, `germany`, `netherlands`, `centralization-vs-bilateral`) as readable pages, generated in `scripts/build.ts`.

## Open decisions

1. Which client names may be used publicly (Octopus/EMG, Inexogy)? Keep the Japan engagement anonymous?
2. Publish garden notes on the site, or only link the CV PDF?
3. Target audience: German MSBs and suppliers, Japanese utilities and asset managers, or both?
4. Keep cal.com and LinkedIn as the call to action?

## Steps

1. Draft the copy in `chapters.ts` with a length budget so it fits on mobile.
2. Add the Work-with-me panel and track-record strip in `index.html` and `style.css`.
3. Optionally generate the notes pages from the garden.
4. Run `bun run check` and look at the page in a browser.
