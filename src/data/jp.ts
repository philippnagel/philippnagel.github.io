import type { Level } from '../types';

export const jp: Level[] = [
  { name: 'NATIONAL GRID',
    p: [
      { t: 'Transmission · TDO', tag: '500/275 kV · 送電網', l: ['10 General TDOs, no TSO/DSO split', '50 Hz east, 60 Hz west'],
        i: 'Japan\'s 10 General TDOs (一般送配電事業者) own transmission and distribution in their area; there is no separate TSO/DSO split. The grid runs at 50 Hz in the east and 60 Hz in the west.' },
      { t: 'Substation · TDO', tag: '66 kV → 6.6 kV · 変電所', l: ['Primary substation', 'Feeds 6.6 kV distribution'],
        i: 'Substations step sub-transmission voltage down to 6.6 kV distribution feeders, run by the same TDO that owns the meters downstream.' },
      { t: 'Pole transformer', tag: '6.6 kV → 100/200 V · 柱上変圧器', l: ['Overhead, mounted on poles', 'Feeds the low-voltage service'],
        i: 'Pole-mounted transformers supply the low-voltage service drop. The first point where individual premises are electrically visible.' },
      { t: 'Connection point', tag: '引込線 · 供給地点', l: ['Where the smart meter sits', 'Zoom in ▸'],
        i: 'Each supply point has a TDO-owned smart meter. Meter ownership by the network operator predates smart metering here, which is why a single national data layer was possible. Zoom in.' }
    ],
    r: [
      { t: 'METI · ANRE', tag: 'Gen-2 spec · 電気事業法', l: ['Next-Gen Smart Meter Study Group', 'Gen-2 rollout done ~FY2034'],
        i: 'METI\'s agency (ANRE) owns policy and the binding Gen-2 smart meter specification, drafted by the Next-Generation Smart Meter Study Group. Gen-2 rollout began in FY2025 and completes around FY2034.' },
      { t: 'EGC · OCCTO', tag: '監視等委員会 · 広域機関', l: ['EGC: data-access oversight', 'OCCTO: EDI + market rules'],
        i: 'EGC is the independent market and data-access regulator. OCCTO sets the business-protocol standard (OCCTO EDI) and the demand-adjustment market rules. It has no role in the aggregation data chain.' },
      { t: 'TDGC · 10 TDOs', tag: '送配電網協議会', l: ['Common specs across all TDOs', 'External-connection standard'],
        i: 'The TDOs coordinate through TDGC on common specifications, for example the 特定計量システム external-connection standard shared by all 10, which suppresses the procurement fragmentation seen in larger multi-utility markets.' },
      { t: 'Data intermediary', tag: '電力データ管理協会', l: ['Certified, EBA Art.37-3/37-4', 'Single national consent gate'],
        i: 'A METI-certified association (認定協会) that governs consent and third-party data access nationally. The structural opposite of Germany\'s no-hub model: one certified intermediary for everyone who is not a retailer.' }
    ],
    links: [[0, 1], [0, 2], [1, 2], [2, 2], [3, 0], [3, 1], [3, 3]] },

  { name: 'METERING POINT',
    p: [
      { t: 'Gen-2 smart meter', tag: '次世代スマートメーター', l: ['30-min settlement data', '5-min for ≥10% of LV meters'],
        i: 'TDO-owned meter. 30-minute granularity is the standard; Gen-2 adds 5-minute collection for at least 10% of low-voltage meters, roughly five years after Australia\'s move to 5-minute settlement.' },
      { t: 'Wi-SUN mesh · FAN', tag: '920 MHz multi-hop', l: ['Meters relay for each other', 'Concentrator → WAN'],
        i: 'Meters form a multi-hop IPv6 radio mesh on 920 MHz. Concentrators collect the traffic and hand it to the TDO over a WAN. There is no per-home gateway like the German SMGW.' },
      { t: 'TDO HES · MDMS', tag: 'Per-TDO back office', l: ['HES: real-time head-end', 'MDMS: readings · assets · network'],
        i: 'Each TDO runs its own head-end system (real-time) and MDMS (reading store, asset management, network management). Consolidation happens only one layer up, in the national aggregation system.' },
      { t: 'Customer premises', tag: '需要家 · HEMS · BEMS', l: ['Direct access via B-Route', 'Zoom in ▸'],
        i: 'Home and building energy management hang off the meter through the B-Route, a consumer-direct real-time channel that bypasses the aggregation chain. Zoom in for the edge devices.' }
    ],
    r: [
      { t: 'A-Route', tag: 'Meter → TDO MDMS', l: ['Wi-SUN 920 MHz, IPv6', 'Billing-grade readings'],
        i: 'The utility route: readings travel meter to concentrator to HES to MDMS over the Wi-SUN mesh. Used for billing and settlement data.' },
      { t: 'Aggregation system', tag: '集約システム · GDBL', l: ['One national layer, all 10 TDOs', '30-min push · 3-yr retention'],
        i: 'A single national aggregation layer built and operated by GDBL. Each TDO pushes 30-minute data into it; it retains three years. This is the most centralised element among the markets in this ontology.' },
      { t: 'OCCTO EDI Ver.3A', tag: 'C-Route · retailers only', l: ['HTTPS pull of XML/ZIP', 'No consumer consent needed'],
        i: 'Retailer data path: external servers pull XML/ZIP files over HTTPS from each TDO\'s public server. It flows automatically under the wheeling contract with no consumer consent, and includes sub-meter (特定計量) data. No EDIFACT-equivalent exists here.' },
      { t: 'SMDSA · consent gate', tag: '電力データ管理協会', l: ['Web API · per-record consent', 'B1 individual / B2 statistics'], f: 'smdsa',
        i: 'The only legal path to meter data for non-retailers (DR aggregators, municipalities, building operators). Individual data (B1) needs per-record consumer consent and ISMS certification; statistics (B2) need no consent. Supply-point level only.' }
    ],
    links: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [3, 3]] },

  { name: 'EDGE DEVICES',
    p: [
      { t: 'Smart meter', tag: 'One meter, three radio routes', l: ['A-Route, B-Route, IoT-Route', 'Hard isolation between them'],
        i: 'The same Gen-2 meter exposes separate radio routes for the utility (A), the consumer (B) and cross-utility sub-meters (IoT). IoT-Route mandates network isolation from A and B, with no IP forwarding between routes.' },
      { t: 'HEMS', tag: 'B-Route LV', l: ['Home energy management', 'Real-time, unaggregated'],
        i: 'Consumer-side energy management reads the meter directly. Structurally Japan\'s analogue to the German HAN or the Dutch P1 port, but layered on top of the national aggregation chain, not instead of it.' },
      { t: 'BEMS', tag: 'B-Route HV', l: ['Building energy management', 'Large commercial'],
        i: 'High-voltage meters serve building energy management systems over a Wi-SUN B-Route.' },
      { t: 'Gas · water · EV · PV', tag: '特例計量器 · sub-meters', l: ['Co-metered via the electric meter', 'Shared data backbone'],
        i: 'Gas, water, EV charging and PV sub-meters (特例計量器) connect to the electric meter over the IoT-Route. Few countries use the electricity meter network as a shared backbone for other utilities at national scale.' }
    ],
    r: [
      { t: 'A-Route · Wi-SUN', tag: 'IEEE 802.15.4g · 920 MHz', l: ['Multi-hop IPv6 mesh', 'Meter → TDO'],
        i: 'Radio layer of the utility route: Wi-SUN Alliance profile on IEEE 802.15.4g, 920 MHz, IPv6 multi-hop.' },
      { t: 'B-Route · ECHONET Lite', tag: 'ISO/IEC 14543-4-3', l: ['Wi-SUN, Wi-Fi 2.4 GHz in Gen-2', 'Meter → HEMS / BEMS'], f: 'echonet',
        i: 'Consumer interface: ECHONET Lite object model over Wi-SUN (and Wi-Fi 2.4 GHz for LV in Gen-2). Japan does not use DLMS/COSEM here, which is why foreign meter vendors need Japan-specific variants.' },
      { t: 'IoT-Route', tag: 'TTC JJ-300.10 · May 2024', l: ['802.15.4 / 6LoWPAN / IPv6 / UDP', 'DLMS/COSEM on top'], f: 'iot',
        i: 'Sub-meter route ratified May 2024. Lower layers are the Wi-SUN stack; application layers run DLMS/COSEM, so DLMS-experienced vendors can reuse their implementation here even though ECHONET Lite is not DLMS.' },
      { t: 'Route isolation', tag: 'AES-128 · mutual auth', l: ['IoT-Route: no IP forwarding', 'between A, B and IoT routes'],
        i: 'IoT-Route requires hard network isolation from A-Route and B-Route, mutual authentication and AES-128 minimum at layer 2.' }
    ],
    links: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 1], [2, 1], [3, 2]] }
];
