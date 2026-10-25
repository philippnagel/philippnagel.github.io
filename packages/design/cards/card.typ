// Business card, 85 x 55 mm trim with 3 mm bleed on every side.
// Page 1 is the front, page 2 the back. Assets come from `bun run cards`,
// which compiles this once per theme: `--input theme=day|night`.
#import "@preview/tiaoma:0.3.0": qrcode
#import "/out/tokens.typ": identity, accent, ui

#let bleed = 3mm
// keep text 4 mm inside the trim: printers cut within about 1 mm
#let safe = bleed + 4mm
#let theme = sys.inputs.at("theme", default: "day")
#let t = ui.at(theme)
// the QR card stays dark on light in both themes: scanners expect it
#let day = ui.day

#set page(width: 85mm + 2 * bleed, height: 55mm + 2 * bleed, margin: 0mm)
#set text(font: "DejaVu Sans Mono", size: 6.6pt, fill: t.ink)

// front: name, role, contact, and a course of bricks along the foot
#page(fill: t.card)[
  #place(bottom, image("/out/strip-" + theme + ".png", width: 100%, scaling: "pixelated"))
  #place(top + left, dx: safe, dy: safe + 1mm, stack(
    spacing: 2.4mm,
    text(font: "Pixelify Sans", weight: "bold", size: 17pt)[#identity.name],
    text(fill: t.blue-text)[#identity.role],
  ))
  #place(top + left, dx: safe, dy: safe + 19mm)[
    #set par(leading: 0.55em)
    #link("mailto:" + identity.email)[#identity.email] \
    #link("tel:" + identity.phone.replace(" ", ""))[#identity.phone] \
    #link("https://www." + identity.linkedin)[#identity.linkedin] \
    #link(identity.url)[#text(fill: t.blue-text)[#identity.site]]
  ]
]

// back: the scene, and a QR code to the site on a card like the site's buttons
// the white card is the quiet zone: about three modules either side
#let qr = 20mm
#let pad = 2.6mm
#page[
  #place(image("/out/back-" + theme + ".png", width: 100%, scaling: "pixelated"))
  #place(top + right, dx: -safe - 1mm + 0.6mm, dy: safe + 0.6mm,
    rect(width: qr + 2 * pad, height: qr + 2 * pad, fill: day.line, stroke: none))
  #place(top + right, dx: -safe - 1mm, dy: safe,
    rect(width: qr + 2 * pad, height: qr + 2 * pad, fill: day.card,
      stroke: 0.6pt + day.line, inset: pad,
      qrcode(identity.url, width: qr, options: (fg-color: day.ink))))
]
