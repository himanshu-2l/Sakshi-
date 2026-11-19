import { describe, expect, it } from "vitest";
import { signFrame } from "./crypto";
import {
  getConsignmentBundle,
  getDeviceKeysForSimulator,
  ingestSignedBatch,
  listConsignmentBundles,
  resetLedgerStore,
  simulateDatabaseTamper,
} from "./ledger";

describe("Sakshi Verifiable Ledger Store", () => {
  it("seeds 3 valid consignments with real ECDSA P-256 chains", async () => {
    await resetLedgerStore();
    const bundles = await listConsignmentBundles();
    expect(bundles).toHaveLength(3);
    for (const b of bundles) {
      expect(b.verification.valid).toBe(true);
      expect(b.anchors.length).toBeGreaterThan(0);
    }
  });

  it("ingests an offline-buffered batch and anchors a new Merkle checkpoint", async () => {
    await resetLedgerStore();
    const before = await getConsignmentBundle("LOT-IND-2026-001");
    expect(before).not.toBeNull();
    const keys = await getDeviceKeysForSimulator("SAK-001");
    expect(keys).not.toBeNull();

    const last = before!.frames[before!.frames.length - 1];
    const nextFrame = await signFrame(
      {
        deviceId: "SAK-001",
        consignmentId: "LOT-IND-2026-001",
        seq: last.seq + 1,
        timestampIso: new Date().toISOString(),
        tempC: 2.3,
        humidityRh: 88.9,
        ethylenePpm: 0.22,
        batteryMv: 3735,
        solarMv: 4920,
        tamperFlag: false,
        offlineBuffered: true,
        prevHash: last.frameHash,
      },
      keys!.privateKeyJwk
    );

    const res = await ingestSignedBatch("LOT-IND-2026-001", [nextFrame]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.ingestedCount).toBe(1);
      expect(res.verification.valid).toBe(true);
    }
  });

  it("detects database tampering immediately and restores cleanly on reset", async () => {
    await resetLedgerStore();
    const tamperRes = await simulateDatabaseTamper("LOT-IND-2026-001", 3);
    expect(tamperRes.ok).toBe(true);
    if (tamperRes.ok) {
      expect(tamperRes.bundle?.verification.valid).toBe(false);
      expect(tamperRes.bundle?.verification.failures.some((f) => f.seq === 3)).toBe(true);
    }

    await resetLedgerStore();
    const clean = await getConsignmentBundle("LOT-IND-2026-001");
    expect(clean?.verification.valid).toBe(true);
  });
});
