# Sakshi 2.0 — Low-Cost IoT Blockchain Nodes for Farm-to-Fork Traceability

**Smart India Hackathon 2026 · Problem Statement `SIH26232`**  
**Ministry:** Ministry of Food Processing Industries (MoFPI) · **Team:** Upper Moons (`ID: 165001`)

> *"Trust starts at the sensor, not at the blockchain."*

Sakshi is an offline-first agricultural cold-chain traceability platform that signs temperature, humidity, and ethylene gas readings at the sensing edge using hardware **ECDSA P-256 (`secp256r1`)** cryptography, buffers hash-chained records during rural cellular blackouts, and anchors tamper-evident Merkle checkpoints to a permissioned ledger with one-click **GS1 EPCIS 2.0 JSON-LD** and **FDA FSMA 204** export.

---

## Key Capabilities

- **Hardware-Rooted Trust (`src/lib/crypto.ts`)**: Real WebCrypto `ECDSA P-256` signing & verification, deterministic canonical JSON serialization, `SHA-256` hash-chaining (`prevHash`), monotonic sequence gap/replay detection, and Merkle root computation.
- **Offline-First Resilience (`src/lib/ledger.ts`)**: Models the 16 MB SPI NOR ring buffer so consignments traversing cellular dead zones (e.g., Kasara Ghat) keep signing locally and auto-sync in order upon LTE reconnect.
- **Zero-Trust Mobile QR Passport (`/verify/[id]`)**: Any buyer or inspector scanning a consignment QR code verifies all `ECDSA P-256` signatures directly inside their phone browser via `crypto.subtle.verify()`.
- **Interactive Offline-Sync & Tamper-Attack Lab (`/simulator`)**: Live virtual Sakshi Hub twin to toggle cellular blackouts, queue signed frames offline, flush batches to `/api/ingest/batch`, and execute a live database tamper attack that is immediately caught by the cryptographic verifier.
- **Export Compliance (`/api/consignments/[id]/export`)**:
  - **GS1 EPCIS 2.0 JSON-LD** (`ObjectEvent` + `sensorElementList` for `Temperature` in `CEL`, `Humidity` in `P1`, and `EthyleneConcentration` in `PPM`)
  - **FDA FSMA 204 CSV** (Traceability Lot Code + Critical Tracking Events + Key Data Elements)
- **Engineering & BOM Archive (`/research`)**: Interactive solar/LTO power budget model (continuous `<1 µA` ME3-C2H4 TIA + ESP32-C3 deep sleep + BQ25570 MPPT) and transparent Qty 1 vs. Qty 100 Bill of Materials.

---

## Quickstart

```bash
npm install
npm test          # Run cryptographic, EPCIS 2.0, and ledger integration tests
npm run typecheck # Verify TypeScript types
npm run build     # Production Next.js build
npm run start     # Serve at http://localhost:3000
```

## Routes

| Route | Purpose |
| :--- | :--- |
| `/` | Flagship overview & live `#SAK-001` signed witness preview |
| `/dashboard` | Fleet & cold-chain command center across active lots |
| `/consignments/[id]` | Telemetry chart, browser WebCrypto proof inspector & EPCIS/FSMA exports |
| `/verify/[id]` | Mobile-first public QR consignment passport |
| `/simulator` | Interactive Offline-Sync & Database Tamper-Attack Lab |
| `/research` | Solar/LTO power budget calculator, BOM economics & ESP32-C3 pinout |
