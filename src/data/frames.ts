import type { Frame } from '../types';

export const frames: Record<string, Frame> = {
  mscons: [
    ["UNB+UNOC:3+9900000000003:500+9900000000010:500+260101:0000+REF0001'", "interchange envelope · sender → receiver as BDEW code numbers (qualifier 500)"],
    ["UNH+1+MSCONS:D:04B:UN:2.4c'", "message header · type + release (version string illustrative)"],
    ["BGM+7+MSG0001+9'", "beginning of message · document reference"],
    ["NAD+MS+9900000000003::293'", "sender role (MS) · 293 = BDEW code list"],
    ["LOC+172+DE0001234567890123456789012345678'", "Messlokation (MeLo) · DE + 31 characters"],
    ["QTY+220:1234.5:KWH'", "measured value + unit"],
    ["Illustrative and abridged, not schema-valid.", null]
  ],
  dlms: [
    ["C0 01 C1", "GET.request-normal · invoke-id C1"],
    ["00 03", "COSEM class 3 · Register"],
    ["01 00 01 08 00 FF", "OBIS 1-0:1.8.0*255 · active energy import, total"],
    ["02 · 00", "attribute 2 (value) · no selective access"],
    ["C4 01 C1 00 06 00 01 E2 40", "GET.response-normal · data-access-result OK · double-long-unsigned 0x0001E240 = 123456"],
    ["Request then response, reading one register.", null]
  ],
  pki: [
    ["SM-PKI Root CA (BSI)", "trust anchor for the smart-metering infrastructure"],
    ["↳ Sub-CA", "issues certificates to SMGW, gateway admin (GWA) and external market participants (EMT)"],
    ["↳ Leaf certificate (ECC)", "device or role identity, presented in the TLS handshake"],
    ["TLS 1.2 · mutual authentication", "both ends present certificates; the SMGW decides who may read what"]
  ],
  smdsa: [
    ["TDO meters → per-TDO MDMS", "Gen-2 meters, 30-min data"],
    ["↳ 集約システム", "single national aggregation layer (GDBL)"],
    ["↳ 協会システム", "consent + access control, operated by GDBL for the association"],
    ["↳ Utilization member", "B1: individual data, per-record consent, ISMS · B2: statistics, no consent"],
    ["Two systems today; a planned step merges them into one platform.", null]
  ],
  echonet: [
    ["10 81", "EHD1/EHD2 · ECHONET Lite, format 1"],
    ["00 01", "TID · transaction id"],
    ["05 FF 01", "SEOJ · controller (HEMS)"],
    ["02 88 01", "DEOJ · low-voltage smart electric energy meter, instance 1"],
    ["62 · 01", "ESV Get · 1 property"],
    ["E0 · 00", "EPC cumulative energy (normal direction) · PDC 0"],
    ["Response: ... 72 01 E0 04 00 01 E2 40", "ESV Get_Res · EPC E0 · 4 bytes · 0x0001E240 = 123456 (× unit EPC E1)"]
  ],
  iot: [
    ["L5–L7 · DLMS/COSEM", "application layer, Telemetering Promotion Council spec"],
    ["L4 · UDP", "transport"],
    ["L3 · IPv6 / ICMPv6", "network"],
    ["L2 · 6LoWPAN", "adaptation"],
    ["L1–L2 · IEEE 802.15.4", "radio, Wi-SUN Alliance spec, 920 MHz"],
    ["Isolated from A- and B-Route", "no IP forwarding, mutual auth, AES-128 minimum at layer 2"]
  ]
};
