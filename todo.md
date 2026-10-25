# Todo: accomplishments and consulting copy

Goal: add personal accomplishments and text that helps prospective consulting clients find and trust me.

## Sources

- CV: `~/Documents/GitHub/cv/data.typ` (`consulting_summary`, `core_competencies`, `consulting_engagements`)
- Garden: `~/Documents/garden/market-ontology` (sourced comparison of DE, NL, JP and ENTSO-E/EU market communication)
- Site copy: `src/chapters.ts`

## Check before publishing

- Hausheld date and entities settled: site uses the press date (Nov 2025); Mako365 and Mako Software were sister companies acquired in the same transaction. Update the CV (it says Sept 2025) so both agree.
- Press names Ancala as Hausheld's private-equity owner. Decide whether to mention it.
- Sources:
  - https://ancala.com/ancala-forms-germanys-largest-independent-smart-metering-platform/
  - https://www.pv-magazine.de/2025/11/06/zusammenschluss-soll-smart-meter-rollout-push-verleihen/
  - https://ancala.com/portfolio/hausheld-ag/

## Insertion points (no new stations)

| Chapter        | Add                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Hello          | One positioning sentence: "I build and run smart-metering platforms: 500k+ meters, ~10M market messages a week." |
| Grid           | One-line proof of market-communication scale (~10M EDIFACT/AS4 messages/week across GPKE, WiM, MPES).            |
| Metering point | §14a EnWG, MsbG and iMSys rollout angle (garden: Q4 2025 rollout 23.3%).                                         |
| Meter cabinet  | SMGW lifecycle, BSI TR-03109, DLMS/COSEM (IEC 62056).                                                            |
| Protocol frame | Japan bridge: ECHONET Lite ↔ DLMS/COSEM, B-route. The differentiator.                                            |
| Contact        | Explicit offer plus a short track-record line, replacing "Say hello".                                            |

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

1. [x] Visible plain-text services and proof block, or a "Skip to services" link (problems 1, 3, 6, 9).
2. [x] Decide client-name policy, publish at least one case, anonymised if needed (problem 2).
3. [x] Add Impressum, Datenschutz and an email address (problem 7). Placeholders to fill: name, address, phone, VAT ID, email (`EMAIL` in `chapters.ts`, `index.html`, legal pages).
4. [ ] Pick primary audience, trim the rest (problem 5).
5. [x] Rewrite `<title>` and meta description, e.g. "Smart metering & market-communication consultant: SMGW, MaKo, DLMS/COSEM" (problem 10).
6. [ ] Make the gate optional or silent by default (problem 8).
7. [ ] State independence, engagement model and availability (problem 4).

## Further findings (review session)

### Fill in before publishing

- Impressum: name, address, phone, VAT ID, person responsible for content.
- Datenschutz: controller details. The privacy text is a template; have it checked (GitHub Pages hosting, third-country transfer, cal.com).
- Email: still the placeholder `hello@example.com`. It appears in `EMAIL` (`src/chapters.ts`), the `#email` link in `src/index.html`, and both legal pages.

### Open issues

- [ ] Independence conflict: the CV lists you as Managing Director at Hausheld AG after the acquisition. "Independent" was removed from the meta description for that reason. Decide how to describe your position before using the word again (see fix 7).
- [ ] CV says the Japan client was "an asset management firm"; the site says "a Japanese energy consultancy". Make them agree.
- [ ] Cases carry no outcome numbers (time saved, rollout rate, cost). Add real results if available; none were invented.
- [ ] Data center and battery stations (02, 03) read as filler: no proof of work in either. Cut them, shorten them, or tie each to a real project.
- [ ] Pixel concept may read as creative rather than reliable to conservative buyers. Keep the proof strip, plain services block and visible email prominent as the counterweight.
- [ ] Services and cases appear only in the simple view and hidden text, not on the story card. Check that story-view visitors can still find them (the gate has a "Skip to services and contact" button).
- [ ] Add German copy if the primary audience is German MSBs (fix 4).

### Done this session

- Philipp figure redrawn: face shading, mouth, nose, fringe, walk-cycle legs, back arm and wave arm.
