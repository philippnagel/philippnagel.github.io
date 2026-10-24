import type { Level } from '../types';

export const de: Level[] = [
  { name: 'NATIONAL GRID',
    p: [
      { t: 'Transmission · TSO', tag: '380/220 kV · Übertragungsnetz', l: ['4 TSOs balance the system', 'Aggregates only, no households'],
        i: 'Four TSOs (50Hertz, Amprion, TenneT, TransnetBW) run the 380/220 kV transmission grid and keep the system balanced. Nothing at household level is visible here, only aggregated schedules and settlement data.' },
      { t: 'Substation · DSO', tag: '110 kV → 20 kV · Umspannwerk', l: ['HV/MV transformer station', 'One DSO per grid area'],
        i: 'HV/MV substations (Umspannwerke) step 110 kV down to medium voltage. Each distribution system operator runs its grid area, and a DSO-affiliated company is usually the default metering point operator (grundzuständiger MSB) there.' },
      { t: 'Local grid station', tag: '20 kV → 0.4 kV · Ortsnetz', l: ['MV/LV transformer', 'Feeds the cable network'],
        i: 'The MV/LV transformer (Ortsnetzstation) feeds the 0.4 kV cable network. This is where households, PV and wallboxes first show up, as one aggregated feeder load.' },
      { t: 'Connection point', tag: 'Netzanschluss · Zählpunkt', l: ['Where energy is measured', 'Zoom in ▸'],
        i: 'Every grid connection has a Zählpunkt: the point where energy is measured and where market roles attach. Zoom in: this is where physical measurement turns into market data.' }
    ],
    r: [
      { t: 'BNetzA · EnWG', tag: 'Festlegungen · MaKo · MPES', l: ['Federal Network Agency', 'Binding market-process rules'],
        i: 'The Bundesnetzagentur issues binding Festlegungen (determinations) on market processes: the MaKo programme with its revisions (MaKo 2.0 etc.) and MPES for generation plants. It mandates the processes and the formats the industry specifies below.' },
      { t: 'BDEW · EDI@Energy', tag: 'AHB · MIG · EBD', l: ['GPKE · GeLi Gas · WiM · MaBiS', 'Processes → EDIFACT messages'],
        i: 'BDEW\'s EDI@Energy working group writes the implementation guides: AHB (application handbooks), MIG (message implementation guides) and EBD decision trees. They map GPKE (power), GeLi Gas (gas), WiM (metering) and MaBiS (balancing) onto EDIFACT messages.' },
      { t: 'VDE FNN · BSI', tag: 'TR-03109 · BSI-CC-PP-0073', l: ['Technical + security rules', 'SMGW certification regime'],
        i: 'BSI sets the security framework: TR-03109 for the smart-metering infrastructure and the Common Criteria protection profile for the SMGW (BSI-CC-PP-0073). VDE FNN contributes technical grid and metering rules.' },
      { t: 'Market roles', tag: 'NB · LF · MSB · ÜNB', l: ['Bilateral EDIFACT, no hub', 'IDs via BDEW code registry'],
        i: 'Network operator (NB), supplier (LF), metering point operator (MSB), TSO (ÜNB): each identified by a BDEW code number. Germany rejected a central data hub, so messages flow bilaterally between roles.' }
    ],
    links: [[0, 0], [1, 0], [1, 3], [2, 2], [3, 1], [3, 2], [3, 3]] },

  { name: 'METERING POINT',
    p: [
      { t: 'Meter cabinet', tag: 'Zählerplatz · 0.4 kV', l: ['Zählpunkt identified by', 'MeLo (33) + MaLo (11 chars)'],
        i: 'The meter cabinet at the connection. The metering location is identified by a MeLo ID (Messlokation, DE + 31 characters); the market location, where energy flows are attributed, by an 11-character MaLo ID.' },
      { t: 'Base meter · mME', tag: 'Basiszähler · eHZ', l: ['Electronic household meter', 'Reads locally, no WAN'],
        i: 'A modern meter (mME) measures locally and shows values on a display. Paired with a gateway it becomes part of an intelligent metering system (iMSys).' },
      { t: 'Smart Meter Gateway', tag: 'SMGW · BSI TR-03109-1', l: ['Security module (HSM)', 'LMN · HAN · WAN'],
        i: 'The gateway is the trust anchor. It receives meter telegrams over LMN, decrypts and verifies them, then signs, timestamps and forwards them encrypted over WAN to authorised parties. It also terminates the HAN towards customer devices.' },
      { t: 'Customer premises', tag: 'Kundenanlage · Submetering', l: ['Sub-meters, PV, loads', 'Zoom in ▸'],
        i: 'Behind the meter: sub-meters, sub-distribution, generation and loads. Controllable devices attach as CLS via the HAN. Zoom in for the edge devices.' }
    ],
    r: [
      { t: 'UTILMD', tag: 'Stammdaten · process messages', l: ['Registration, switching', 'MaLo/MeLo master data'],
        i: 'Master data and process messages: supplier registration and switching (GPKE), assignment of MaLo/MeLo, role changes. This is the message that makes a metering point exist for the market.' },
      { t: 'MSCONS', tag: 'Messwerte · metered values', l: ['Readings, load profiles', 'MSB → NB / LF'], f: 'mscons',
        i: 'Metered values (meter readings, load profiles) sent by the metering point operator to network operator, supplier and others. The values originate in the meter, are signed by the SMGW, and reach the market as EDIFACT.' },
      { t: 'ORDERS · CONTRL · APERAK', tag: 'Orders · acknowledgements', l: ['CONTRL: syntax-level ACK', 'APERAK: content-level ACK'],
        i: 'ORDERS carries requests and orders (for example metering data or configuration changes). CONTRL acknowledges at EDIFACT syntax level (envelope accepted or rejected); APERAK at application level (content rejected, e.g. unknown MaLo).' },
      { t: 'AS4 · TLS · PKI', tag: 'Transport & trust', l: ['EDIFACT over AS4 (ebMS3)', 'SM-PKI behind the gateway'], f: 'pki',
        i: 'Transport and trust. EDIFACT travels over AS4 with X.509 certificates; REST APIs appear alongside it for selected processes. On the gateway side, the SM-PKI rooted at BSI issues certificates so every WAN and HAN TLS session is mutually authenticated.' }
    ],
    links: [[0, 0], [1, 1], [2, 1], [2, 3], [3, 1], [3, 2]] },

  { name: 'EDGE DEVICES',
    p: [
      { t: 'Meter · sub-meter', tag: 'OBIS 1-0:1.8.0', l: ['Measurement register', 'Never talks to the market'],
        i: 'Meter or sub-meter exposing OBIS registers (1-0:1.8.0 is total active energy import). It hands readings to the SMGW over LMN and never talks to the market directly.' },
      { t: 'Smart Meter Gateway', tag: 'SMGW', l: ['Three interfaces', 'Sign · timestamp · forward'],
        i: 'The same gateway, seen through its three interfaces: LMN towards meters, HAN towards customer devices, WAN towards the backend. All three are specified in BSI TR-03109-1.' },
      { t: 'HEMS · control box', tag: 'CLS · §14a EnWG', l: ['Home energy management', 'Load signals, optimisation'],
        i: 'A home energy management system on the HAN reads consumption via the SMGW and steers devices. Controllable consumers under §14a EnWG can be driven through a control box on a CLS channel.' },
      { t: 'Wallbox · Inverter', tag: 'Heat pump · local sensors', l: ['Controllable local systems', 'No direct internet exposure'],
        i: 'Wallbox, PV inverter, heat pump, local sensors. As CLS they reach an authorised backend only through the gateway\'s TLS-protected, transparent channel.' }
    ],
    r: [
      { t: 'LMN · meter ↔ SMGW', tag: 'SML · OMS · RS-485', l: ['wireless M-Bus (OMS, 868 MHz)', 'or wired RS-485'],
        i: 'Meter to gateway. TR-03109-1 annexes require wireless M-Bus (OMS, 868 MHz) and wired RS-485 as physical options. SML historically carries the data in Germany; DLMS/COSEM is increasingly displacing it.' },
      { t: 'DLMS/COSEM', tag: 'IEC 62056 · OBIS', l: ['COSEM objects by OBIS code', 'GET / SET / ACTION'], f: 'dlms',
        i: 'The application layer for meter data: COSEM objects addressed by OBIS codes and accessed with GET, SET and ACTION services. The frame below reads total import energy.' },
      { t: 'HAN · TLS', tag: 'SMGW ↔ CLS / HEMS', l: ['TLS 1.2, mutual certificates', 'Per-party data profiles'],
        i: 'Gateway to HEMS and CLS devices. TLS 1.2 with mutual certificate authentication (cryptography per BSI TR-03116-3). The SMGW enforces which party may see which data.' },
      { t: 'WAN · SMGW admin', tag: 'GWA · EMT · SM-PKI', l: ['Provisioning, config, updates', 'Data out to market parties'], f: 'pki',
        i: 'Gateway to backend. The gateway administrator (GWA, run by the MSB) provisions, configures and updates SMGWs; external market participants receive data through the gateway\'s WAN channel. The trust chain is the SM-PKI.' }
    ],
    links: [[0, 0], [0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 2], [3, 2]] }
];
