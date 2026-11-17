# PRODUCT.md — Sakshi 2.0

## Identity
- **Name:** Sakshi
- **Tagline:** Every consignment carries its own witness.
- **Context:** Smart India Hackathon (SIH 2026) — Problem Statement `SIH26232` (*Low-Cost IoT Blockchain Nodes for Farm-to-Fork Traceability*), Ministry of Food Processing Industries (MoFPI), Team Upper Moons (`165001`).

## Audience & Modes
1. **SIH Evaluators & MoFPI Officials (`Persuade` on `/`, `Operate` on `/simulator`, `Read` on `/research`):** Need immediate visual proof that trust begins at the sensing hardware (ATECC608B ECDSA P-256 + SPI NOR offline hash-chaining), survives rural cellular blackouts, catches database tampering mathematically, and meets real power/cost constraints.
2. **Cold-Chain Exporters, Packhouses & FPOs (`Operate` on `/dashboard` & `/consignments/[id]`):** Need daylight-legible fleet monitoring across temperature, humidity, and ethylene gas (ppm), excursion alerts, and one-click regulatory exports (GS1 EPCIS 2.0 JSON-LD & FDA FSMA 204 CSV).
3. **Importers, Retail Buyers & Consumers (`Read/Verify` on `/verify/[id]`):** Scan QR `#SAK-001` on mobile and receive an instant, browser-verified cryptographic verdict on cold-chain integrity and farm-to-fork provenance without trusting the server.

## Non-Negotiable Truths
- Zero fake cryptography: every frame hash (`SHA-256`), chain link (`prevHash`), signature (`ECDSA P-256 / secp256r1`), and Merkle root is computed and verified with real WebCrypto primitives.
- Honest hardware economics: the Winsen ME3-C2H4 ethylene sensor is shared at the reusable Hub level alongside optional low-cost BLE pallet tags, with a continuous `<1 µA` transimpedance front-end and SHT40 temperature compensation.
