import { STATIONS } from "./walk";

export interface Chapter {
  /** short label for the rail */
  tag: string;
  title: string;
  body: string;
  /** canvas abbreviations spelled out */
  terms?: [string, string][];
  /** one line of track record, shown on the contact card */
  proof?: string;
  /** what I can be hired for, shown on the contact card */
  offers?: string[];
  /** worked examples, shown in the simple view and the hidden text, not on the card */
  cases?: { title: string; text: string }[];
}

/** Contact address; `src/index.html` repeats it for readers without JavaScript. */
export const EMAIL = "phil@philippnagel.com";

/** One chapter per station along the path. */
export const chapters: Chapter[] = [
  {
    tag: "Hello",
    title: "Smart energy infrastructure, built and run at scale",
    body: "I build the platforms behind the meter: 500,000+ smart meters, about 10 million market messages a week. Scroll to walk the path with me.",
  },
  {
    tag: "Grid",
    title: "01. The grid",
    body: "Generation, transmission, substation, transformer, a house. Yellow squares are power, blue are data. Utilities run both, and the data side is where rollouts stall.",
    terms: [["TRAFO", "transformer"]],
  },
  {
    tag: "Storage",
    title: "02. The battery site",
    body: "A grid-scale battery (BESS) soaks up surplus power and returns it at the peak. Its energy management system takes orders from the market and the grid operator. Every one of those links is an integration.",
    terms: [
      ["BESS", "battery energy storage system"],
      ["PCS", "power conversion system"],
      ["EMS", "energy management system"],
      ["TRAFO", "transformer"],
    ],
  },
  {
    tag: "Data center",
    title: "03. The data center",
    body: "A data center can draw as much as a small city, around the clock, and AI is making them bigger. Grid connections take years, so operators now pair them with batteries, flexible load and waste-heat reuse. Each of those is a data and market integration.",
    terms: [
      ["UPS", "uninterruptible power supply"],
      ["GEN", "backup generator"],
      ["TRAFO", "transformer"],
    ],
  },
  {
    tag: "Metering point",
    title: "04. The metering point",
    body: "Meter cabinet, rooftop PV, home energy management, an EV charger. Regulation (§14a EnWG, MsbG) now expects all of it to be controllable and billable. I've worked on the rollout side of that.",
    terms: [
      ["DSO", "distribution system operator"],
      ["EV", "electric vehicle"],
    ],
  },
  {
    tag: "Meter cabinet",
    title: "05. The meter cabinet",
    body: "Meter, gateway and sub-meters, signed by a security module. I run gateway lifecycle at scale on DLMS/COSEM (IEC 62056) and BSI TR-03109, from commissioning to certification per operator.",
    terms: [
      ["WAN", "wide-area network"],
      ["GW", "gateway"],
      ["SUB", "sub-meter"],
    ],
  },
  {
    tag: "Protocol frame",
    title: "06. One reading",
    body: "A single reading, field by field. The same standard sits under German gateways and Japanese AMI, and I've mapped ECHONET Lite to DLMS/COSEM for a client. Cross-border data access is a protocol problem first.",
    terms: [
      ["HDR", "header"],
      ["ADDR", "address"],
      ["OBIS", "object identification code"],
      ["CRC", "checksum"],
    ],
  },
  {
    tag: "Contact",
    title: "Work with me",
    body: "Remote, or on-site when it's worth it. Bring me a metering, market-communication or grid-data problem. A first call is 30 minutes, no pitch.",
    proof:
      "9+ years · 500k+ meters · ~10M messages/week · BNetzA / BDEW / VDE FNN committees",
    offers: [
      "Smart metering platform architecture and rollout operations",
      "Market communication (MaKo, EDIFACT/AS4) automation and regulatory mapping",
      "Gateway (SMGW) lifecycle and DLMS/COSEM integration",
      "Technical due diligence, and EU–Japan data-access studies",
    ],
    cases: [
      {
        title: "Japanese smart-metering data access, 2025",
        text: "For a Japanese energy consultancy: mapped the B-route data pipeline and SMDSA intermediary access to EU conventions, identified the ECHONET Lite ↔ DLMS/COSEM translation requirements, and delivered a working proof of concept for HES/MDMS integration. Also compared METI/ANRE AMI policy with the EU SMGW governance model.",
      },
      {
        title: "Gateway management for commercial metering operators",
        text: "Built MakoFlow on DLMS/COSEM: a multi-tenant platform running about 500,000 smart meters for 6–7 commercial metering operators, including a company of Octopus Energy Group and Inexogy, with regulatory certification per operator.",
      },
      {
        title: "Acquisition by Hausheld, 2025",
        text: "Mako365 and Mako Software, two sister companies I co-founded, were acquired together by Hausheld AG in November 2025. I ran the technical and operational due diligence.",
      },
    ],
  },
];

if (chapters.length !== STATIONS.length)
  throw new Error("one chapter per station");

/** The chapters as real text, visually hidden: for screen readers and search, and written into the HTML at build time. */
export const srHtml = () =>
  `<div class="sr">${chapters
    .map(
      (c) =>
        `<h2>${c.title}</h2><p>${c.body}</p>` +
        (c.proof ? `<p>${c.proof}</p>` : "") +
        (c.offers?.length
          ? `<ul>${c.offers.map((o) => `<li>${o}</li>`).join("")}</ul>`
          : "") +
        casesHtml(c) +
        (c.terms?.length
          ? `<p>${c.terms.map(([a, b]) => `${a}: ${b}`).join("; ")}</p>`
          : ""),
    )
    .join("")}</div>`;

const CTA = `<div class="cta"><a class="btn pri" href="https://cal.com/nagel">Book a call</a><a class="btn" href="mailto:${EMAIL}">Email</a><a class="btn" href="https://www.linkedin.com/in/philippnagel/" rel="me">LinkedIn</a></div>`;

export const LEGAL = `<a href="./impressum.html">Impressum</a> · <a href="./datenschutz.html">Datenschutz</a>`;

const casesHtml = (c: Chapter) =>
  c.cases?.length
    ? c.cases.map((k) => `<h3>${k.title}</h3><p>${k.text}</p>`).join("")
    : "";

const list = (c: Chapter) =>
  c.offers?.length
    ? `<ul>${c.offers.map((o) => `<li>${o}</li>`).join("")}</ul>`
    : "";

/** The chapters as a plain reading page, for the simple view, and the no-JavaScript fallback (written into the HTML at build time). Services and proof sit right after the intro, so a buyer reaches them without reading the whole tour. */
export const simpleHtml = () => {
  const last = chapters.length - 1;
  const section = (c: Chapter, i: number) => {
    const h = i ? 2 : 1;
    return (
      `<section><small>${c.tag}</small><h${h}>${c.title}</h${h}><p>${c.body}</p>` +
      (c.terms?.length
        ? `<p class="terms">${c.terms.map(([a, b]) => `<b>${a}</b> ${b}`).join(" · ")}</p>`
        : "") +
      (i === last ? CTA : "") +
      `</section>`
    );
  };
  const services = chapters[last]!;
  return (
    section(chapters[0]!, 0) +
    `<section id="services"><small>Services</small><h2>What I do for utilities and operators</h2>` +
    (services.proof ? `<p class="proof">${services.proof}</p>` : "") +
    list(services) +
    casesHtml(services) +
    CTA +
    `</section>` +
    chapters
      .slice(1)
      .map((c, i) => section(c, i + 1))
      .join("") +
    `<footer class="legal">${LEGAL}</footer>`
  );
};
