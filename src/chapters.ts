import { STOPS } from "./geometry";

export interface Chapter {
  /** short label for the rail */
  tag: string;
  title: string;
  body: string;
}

/** One chapter per scroll section; `STOPS[i]` is the scene level it frames. */
export const chapters: Chapter[] = [
  {
    tag: "Hello",
    title: "Philipp Nagel",
    body: "Smart metering, from the power grid down to a single protocol frame. Scroll to zoom in.",
  },
  {
    tag: "Grid",
    title: "01. The grid",
    body: "Generation, transmission, substation, transformer, and one house. Rules, roles and markets float above as the data layer.",
  },
  {
    tag: "Metering point",
    title: "02. The metering point",
    body: "Grid connection, meter cabinet, rooftop PV, home energy management and an EV charger. Every one of them also speaks data.",
  },
  {
    tag: "Meter cabinet",
    title: "03. The meter cabinet",
    body: "Meter, gateway and sub-meters, joined by the meter, wide-area and home-area links. A security module signs it all.",
  },
  {
    tag: "Protocol frame",
    title: "04. One reading",
    body: "A single meter reading, field by field. This is the smallest thing the grid says.",
  },
  {
    tag: "Contact",
    title: "Let's talk",
    body: "Working on metering, market communication or grid data? Say hello.",
  },
];

if (chapters.length !== STOPS.length)
  throw new Error("chapters and STOPS must be the same length");
