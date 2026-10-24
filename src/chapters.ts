import { STATIONS } from "./walk";

export interface Chapter {
  /** short label for the rail */
  tag: string;
  title: string;
  body: string;
}

/** One chapter per station along the path. */
export const chapters: Chapter[] = [
  {
    tag: "Hello",
    title: "Philipp Nagel",
    body: "Smart metering, from the power grid down to a single protocol frame. Scroll to walk with me.",
  },
  {
    tag: "Grid",
    title: "01. The grid",
    body: "Generation, transmission, substation, transformer, and a house. Yellow squares are power, blue squares are data, and the markets float above.",
  },
  {
    tag: "Storage",
    title: "02. The battery site",
    body: "A grid-scale battery (BESS) soaks up surplus power and gives it back at the peak. Its energy management system takes orders from the market and the grid operator.",
  },
  {
    tag: "Metering point",
    title: "03. The metering point",
    body: "Grid connection, meter cabinet, rooftop PV, home energy management and an EV charger. Every one of them also speaks data.",
  },
  {
    tag: "Meter cabinet",
    title: "04. The meter cabinet",
    body: "Meter, gateway and sub-meters, joined by the meter, wide-area and home-area links. A security module signs it all.",
  },
  {
    tag: "Protocol frame",
    title: "05. One reading",
    body: "A single meter reading, field by field. This is the smallest thing the grid says.",
  },
  {
    tag: "Contact",
    title: "Let's talk",
    body: "Working on metering, market communication or grid data? Say hello.",
  },
];

if (chapters.length !== STATIONS.length)
  throw new Error("one chapter per station");
