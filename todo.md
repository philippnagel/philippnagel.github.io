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

## Buyer review (utility / digital smart energy)

Verdict: memorable and technically credible, but a utility buyer can't yet justify a call. Reviewed from source copy (`chapters.ts`, `index.html`), not a live run.

### Keep

- Scale claims (500k+ meters, ~10M messages/week).
- Regulatory vocabulary (§14a EnWG, MsbG, SMGW, BSI TR-03109, DLMS/COSEM, GPKE/WiM/MPES).
- "The data side is where rollouts stall."
- ECHONET Lite ↔ DLMS/COSEM mapping as the differentiator.
- Low-friction CTA ("30 minutes, no pitch").
- BNetzA / BDEW / VDE FNN committee seats as trust signal.

### Problems

1. Substance is spread over 7 scroll stations; offers and proof come last. Time-poor buyers leave early.
2. No named evidence ("a client", "Japanese AMI"). Utilities buy on references. Needs a referenceable or anonymised case with outcome numbers.
3. Offers are capabilities, not outcomes. Rewrite each as problem → result.
4. Commercial position unclear: independent vs Mako365 employee, engagement size, availability. Conflict-of-interest worry. Hausheld date and entity unverified (see above).
5. Audience split (German MSB vs Japanese AMI vs EU–Japan studies). Pick a primary one.
6. Jargon wall for procurement and finance. Pixel concept risks reading as creative, not reliable, to conservative buyers.
7. Single CTA channel (cal.com, LinkedIn). No email, no Impressum or Datenschutz (§5 DDG for commercial sites in Germany).
8. Enter gate plus sound warning adds a click and may bounce corporate users.
9. Scroll-jacked canvas is slow for fact-seekers; `.sr` text is hidden, so no forwardable plain page.
10. Title and meta description describe the experience, not the service (poor search fit).

### Fixes, by priority

1. [ ] Visible plain-text services and proof block, or a "Skip to services" link (problems 1, 3, 6, 9).
2. [ ] Decide client-name policy, publish at least one case, anonymised if needed (problem 2).
3. [ ] Add Impressum, Datenschutz and an email address (problem 7).
4. [ ] Pick primary audience, trim the rest (problem 5).
5. [ ] Rewrite `<title>` and meta description, e.g. "Smart metering & market-communication consultant: SMGW, MaKo, DLMS/COSEM" (problem 10).
6. [ ] Make the gate optional or silent by default (problem 8).
7. [ ] State independence, engagement model and availability (problem 4).
