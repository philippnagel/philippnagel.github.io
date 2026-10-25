# Todo

Goal: a page that helps prospective consulting clients (utilities, metering operators, investors) find and trust me.

## Sources

- CV: `~/Documents/GitHub/cv/data.typ` (`consulting_summary`, `core_competencies`, `consulting_engagements`)
- Garden: `~/Documents/garden/market-ontology` (sourced comparison of DE, NL, JP and ENTSO-E/EU market communication)
- Site copy: `src/chapters.ts`; legal text: `src/legal-text.ts`
- Hausheld press:
  - https://ancala.com/ancala-forms-germanys-largest-independent-smart-metering-platform/
  - https://www.pv-magazine.de/2025/11/06/zusammenschluss-soll-smart-meter-rollout-push-verleihen/
  - https://ancala.com/portfolio/hausheld-ag/

## Before publishing: legal

- [ ] Impressum (§ 5 DDG): add the managing director (Vertretungsberechtigter) of Vivicy OÜ, the register name (Eesti äriregister) next to the number, and the VAT ID (KMKR) if any.
- [ ] § 18 Abs. 2 MStV line names a company. Name a natural person, or drop it (no journalistic content on the site).
- [ ] Datenschutz is a template. Add: third-country transfer for GitHub (EU–US DPF), legal basis per purpose (email contact: Art. 6(1)(b)/(f)), Art. 15–21 and Art. 77 references, the authority by name (Andmekaitse Inspektsioon). Have it checked.

## Decisions

- [ ] Position: Impressum shows Vivicy OÜ, CV lists Managing Director at Hausheld AG. Decide how to describe independence, engagement model and availability; then state it on the contact card. Don't use "independent" until settled.
- [ ] Primary audience: German MSBs and suppliers, Japanese utilities and asset managers, or both. Trim the rest; add German copy if German MSBs.
- [ ] Client names: confirm permission to name the Octopus Energy Group company and Inexogy. Japan engagement stays anonymous.
- [ ] Ancala (Hausheld's owner): mention it or not.
- [ ] Garden notes (`japan`, `germany`, `netherlands`, `centralization-vs-bilateral`): publish as pages generated in `scripts/build.ts`, or only link the CV PDF.

## Consistency with the CV

- [ ] Hausheld date: site uses the press date (Nov 2025), CV says Sept 2025. Update the CV.
- [ ] Japan client: CV says "an asset management firm", site says "a Japanese energy consultancy". Make them agree.

## Copy

- [ ] Add real outcome numbers to the cases (time saved, rollout rate, cost). None invented so far.
- [ ] Offers read as capabilities; rewrite each as problem → result.
- [ ] Show cases on the story-view contact card, not only in the simple view (at least the 500k-meter case and the Hausheld acquisition).
- [ ] Battery and data center stations (02, 03) have no proof of work. Tie each to a real project, shorten, or cut.
- [ ] Pixel concept may read as creative rather than reliable to conservative buyers. Keep the proof strip, services block and email prominent.

## UX

- [ ] Gate: make entry silent by default, sound opt-in through the speaker button, or drop the gate.

## Site and build

- [ ] JSON-LD (`Person` + `ProfessionalService`), `robots.txt`, `sitemap.xml`.
- [ ] `404.html`.
- [ ] Chapter text is written into the built HTML twice (`.sr` and `#simple`); use one source.
- [ ] Test that the built HTML has no placeholders (`example.com`) and the legal pages are filled in.
- [ ] Check the theme-color sync (day/night toggle) on a mobile browser.

## Done

- Copy per chapter: positioning, §14a EnWG / MsbG, SMGW / BSI TR-03109 / DLMS/COSEM, ECHONET Lite ↔ DLMS/COSEM, Work-with-me offers and track-record line.
- Simple view with services and cases up front; "Skip to services and contact" on the gate.
- Impressum and Datenschutz as overlay and standalone pages; email address set.
- `<title>` and meta description describe the service.
- Philipp figure redrawn.
