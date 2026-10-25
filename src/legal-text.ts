import { EMAIL } from "./chapters";

const mail = `<a href="mailto:${EMAIL}">${EMAIL}</a>`;

/**
 * The legal pages, one source for the overlay and the standalone pages the
 * build writes (`scripts/build.ts`). German, as the law asks for.
 */
export const LEGAL = {
  impressum: {
    title: "Impressum",
    main: `
      <h1>Impressum</h1>
      <p>Angaben gemäß § 5 DDG</p>
      <p>
        Vivicy OÜ<br />
        Sepapaja tn 6<br />
        11415 Tallinn<br />
        Estonia
      </p>
      <h2>Kontakt</h2>
      <p>
        E-Mail: ${mail}
      </p>
      <h2>Registriernummer</h2>
      <p>16814070</p>
      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>Vivicy OÜ, Anschrift wie oben</p>`,
  },
  datenschutz: {
    title: "Datenschutz",
    main: `
      <h1>Datenschutzerklärung</h1>
      <h2>Verantwortlicher</h2>
      <p>Vivicy OÜ, Sepapaja tn 6, 11415 Tallinn. E-Mail: ${mail}</p>
      <h2>Hosting</h2>
      <p>
        Diese Seite wird über GitHub Pages ausgeliefert (GitHub Inc., USA). Beim
        Aufruf verarbeitet der Hoster technisch notwendige Daten wie die
        IP-Adresse (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <h2>Lokaler Speicher</h2>
      <p>
        Die Seite speichert im Browser (localStorage) nur Ihre Wahl von Design
        und Ansicht. Diese Daten verlassen Ihr Gerät nicht.
      </p>
      <h2>Kontakt und Terminbuchung</h2>
      <p>
        Bei E-Mail-Kontakt verarbeiten wir Ihre Angaben zur Bearbeitung der
        Anfrage. Die Terminbuchung läuft über cal.com; dort gelten deren
        Datenschutzhinweise.
      </p>
      <h2>Ihre Rechte</h2>
      <p>
        Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch,
        Datenübertragbarkeit sowie Beschwerde bei der Datenschutzbehörde von Estland.
      </p>`,
  },
} as const;

export type LegalKey = keyof typeof LEGAL;

/** A standalone page: what the overlay shows, plus a way back, for direct links and readers without scripts. */
export function legalPage(key: LegalKey, head: string) {
  const { title, main } = LEGAL[key];
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} · Philipp Nagel</title>
    <meta name="robots" content="noindex" />
    ${head}
  </head>
  <body class="doc">
    <main>
      <p><a href="./">← Philipp Nagel</a></p>${main}
    </main>
  </body>
</html>
`;
}
