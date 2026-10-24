import { STATIONS } from "./walk";

export interface Chapter {
  /** short label for the rail */
  tag: string;
  title: string;
  body: string;
  /** canvas abbreviations spelled out */
  terms?: [string, string][];
}

/** One chapter per station along the path. */
export const chapters: Chapter[] = [
  {
    tag: "Hello",
    title: "Smart metering, grid to packet",
    body: "I work on the data behind the meter: market communication, grid data and protocols. Scroll to walk with me.",
  },
  {
    tag: "Grid",
    title: "01. The grid",
    body: "Generation, transmission, substation, transformer, and a house. Yellow squares are power, blue squares are data, and the markets float above.",
    terms: [["TRAFO", "transformer"]],
  },
  {
    tag: "Storage",
    title: "02. The battery site",
    body: "A grid-scale battery (BESS) soaks up surplus power and gives it back at the peak. Its energy management system takes orders from the market and the grid operator.",
    terms: [
      ["BESS", "battery energy storage system"],
      ["PCS", "power conversion system"],
      ["EMS", "energy management system"],
      ["TRAFO", "transformer"],
    ],
  },
  {
    tag: "Metering point",
    title: "03. The metering point",
    body: "Grid connection, meter cabinet, rooftop PV, home energy management and an EV charger. Every one of them also speaks data.",
    terms: [
      ["DSO", "distribution system operator"],
      ["EV", "electric vehicle"],
    ],
  },
  {
    tag: "Meter cabinet",
    title: "04. The meter cabinet",
    body: "Meter, gateway and sub-meters, joined by the meter, wide-area and home-area links. A security module signs it all.",
    terms: [
      ["WAN", "wide-area network"],
      ["GW", "gateway"],
      ["SUB", "sub-meter"],
    ],
  },
  {
    tag: "Protocol frame",
    title: "05. One reading",
    body: "A single meter reading, field by field. This is the smallest thing the grid says.",
    terms: [
      ["HDR", "header"],
      ["ADDR", "address"],
      ["OBIS", "object identification code"],
      ["CRC", "checksum"],
    ],
  },
  {
    tag: "Contact",
    title: "Let's talk",
    body: "Working on metering, market communication or grid data? Say hello.",
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
        (c.terms?.length
          ? `<p>${c.terms.map(([a, b]) => `${a}: ${b}`).join("; ")}</p>`
          : ""),
    )
    .join("")}</div>`;
