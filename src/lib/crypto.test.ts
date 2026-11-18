import { describe, expect, it } from "vitest";
import {
  computeMerkleRoot,
  generateDeviceKeyPair,
  getGenesisHash,
  signFrame,
  verifyHashChain,
} from "./crypto";
import type { SignedTelemetryFrame } from "./types";

async function buildChain(count: number) {
  const keys = await generateDeviceKeyPair();
  const frames: SignedTelemetryFrame[] = [];
  let prevHash = getGenesisHash();

  for (let seq = 1; seq <= count; seq += 1) {
    const signed = await signFrame(
      {
        deviceId: "SAK-001",
        consignmentId: "LOT-IND-2026-001",
        seq,
        timestampIso: new Date(Date.UTC(2026, 10, 25, 8, seq * 10)).toISOString(),
        tempC: 3.4 + seq * 0.1,
        humidityRh: 86.2,
        ethylenePpm: 0.42,
        batteryMv: 3720,
        solarMv: 4850,
        tamperFlag: false,
        offlineBuffered: seq === 2,
        prevHash,
      },
      keys.privateKeyJwk
    );
    frames.push(signed);
    prevHash = signed.frameHash;
  }

  return { keys, frames };
}

describe("Sakshi ECDSA P-256 & Hash-Chain Trust Core", () => {
  it("verifies a valid chain including offline-buffered frames", async () => {
    const { keys, frames } = await buildChain(4);
    const report = await verifyHashChain(frames, keys.publicKeyJwk);

    expect(report.valid).toBe(true);
    expect(report.checkedCount).toBe(4);
    expect(report.offlineCount).toBe(1);
    expect(report.failures).toHaveLength(0);
  });

  it("catches a single-bit database temperature tamper without private key", async () => {
    const { keys, frames } = await buildChain(4);
    const tampered = frames.map((f) =>
      f.seq === 3 ? { ...f, tempC: 9.8 } : f
    );

    const report = await verifyHashChain(tampered, keys.publicKeyJwk);
    expect(report.valid).toBe(false);
    expect(report.failures.some((f) => f.seq === 3 && f.reason === "HASH_MISMATCH")).toBe(true);
  });

  it("catches a deleted offline record as a monotonic sequence gap and broken link", async () => {
    const { keys, frames } = await buildChain(4);
    const missingSeq2 = frames.filter((f) => f.seq !== 2);

    const report = await verifyHashChain(missingSeq2, keys.publicKeyJwk);
    expect(report.valid).toBe(false);
    expect(report.failures.some((f) => f.reason === "SEQUENCE_GAP")).toBe(true);
    expect(report.failures.some((f) => f.reason === "BROKEN_HASH_LINK")).toBe(true);
  });

  it("rejects frames forged with an attacker key", async () => {
    const { keys } = await buildChain(2);
    const attacker = await generateDeviceKeyPair();
    const forged = await signFrame(
      {
        deviceId: "SAK-001",
        consignmentId: "LOT-IND-2026-001",
        seq: 1,
        timestampIso: new Date().toISOString(),
        tempC: 2.5,
        humidityRh: 85,
        ethylenePpm: 0.2,
        batteryMv: 3700,
        solarMv: 0,
        tamperFlag: false,
        offlineBuffered: false,
        prevHash: getGenesisHash(),
      },
      attacker.privateKeyJwk
    );

    const report = await verifyHashChain([forged], keys.publicKeyJwk);
    expect(report.valid).toBe(false);
    expect(report.failures.some((f) => f.reason === "INVALID_SIGNATURE")).toBe(true);
  });

  it("computes deterministic Merkle roots", async () => {
    const { frames } = await buildChain(3);
    const rootA = await computeMerkleRoot(frames.map((f) => f.frameHash));
    const rootB = await computeMerkleRoot(frames.map((f) => f.frameHash));
    expect(rootA).toBe(rootB);
    expect(rootA).toHaveLength(64);
  });
});
