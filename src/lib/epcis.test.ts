import { describe, expect, it } from "vitest";
import { buildEpcisDocument, buildFsma204Csv } from "./epcis";
import { generateDeviceKeyPair, getGenesisHash, signFrame } from "./crypto";
import type { ConsignmentBundle } from "./types";

describe("GS1 EPCIS 2.0 & FDA FSMA 204 Exporter", () => {
  it("builds valid GS1 EPCIS 2.0 JSON-LD and FSMA 204 CSV", async () => {
    const keys = await generateDeviceKeyPair();
    const frame = await signFrame(
      {
        deviceId: "SAK-001",
        consignmentId: "LOT-IND-2026-001",
        seq: 1,
        timestampIso: "2026-11-25T08:00:00.000Z",
        tempC: 2.8,
        humidityRh: 88.5,
        ethylenePpm: 0.35,
        batteryMv: 3650,
        solarMv: 4100,
        tamperFlag: false,
        offlineBuffered: false,
        prevHash: getGenesisHash(),
      },
      keys.privateKeyJwk
    );

    const bundle: ConsignmentBundle = {
      consignment: {
        id: "LOT-IND-2026-001",
        tlc: "TLC-MH-NSK-2026-8841",
        deviceId: "SAK-001",
        commodity: "Table Grapes",
        variety: "Thompson Seedless",
        originFarm: "Sahyadri FPO, Nashik",
        destination: "JNPT Cold Port -> Rotterdam",
        quantityKg: 4200,
        tempMinC: 0.5,
        tempMaxC: 4.5,
        ethyleneMaxPpm: 1.5,
        status: "in_transit",
        epcUrn: "urn:epc:id:sgtin:8904001.107346.202601",
      },
      device: {
        id: "SAK-001",
        name: "Sakshi Hub #001",
        hardwareProfile: "ESP32-C3 + ATECC608B + SHT40 + ME3-C2H4",
        firmwareVersion: "2.1.0",
        publicKeyJwk: keys.publicKeyJwk,
        lastSeenAtIso: "2026-11-25T08:00:00.000Z",
        batteryPct: 92,
        solarActive: true,
        bleTagsCount: 6,
        status: "online",
      },
      frames: [{ ...frame, syncedAt: "2026-11-25T08:00:05.000Z", ledgerAnchorId: "TX-1" }],
      custodyEvents: [
        {
          id: "ev-1",
          consignmentId: "LOT-IND-2026-001",
          bizStep: "shipping",
          disposition: "in_transit",
          locationName: "Nashik Packhouse",
          readPointGln: "urn:epc:id:sgln:8904001.00025.0",
          timestampIso: "2026-11-25T08:00:00.000Z",
          actor: "Sahyadri FPO",
          notes: "Pre-cooled and sealed",
        },
      ],
      anchors: [],
      verification: {
        valid: true,
        checkedCount: 1,
        offlineCount: 0,
        firstSeq: 1,
        lastSeq: 1,
        verifiedAtIso: "2026-11-25T08:01:00.000Z",
        durationMs: 2.1,
        failures: [],
      },
    };

    const doc = buildEpcisDocument(bundle);
    expect(doc.type).toBe("EPCISDocument");
    expect(doc["@context"][0]).toContain("epcis/2.0.0/epcis-context.jsonld");
    expect(doc.epcisBody.eventList).toHaveLength(1);

    const csv = buildFsma204Csv(bundle);
    expect(csv).toContain("TLC-MH-NSK-2026-8841");
    expect(csv).toContain("VERIFIED_ECDSA_P256");
  });
});
