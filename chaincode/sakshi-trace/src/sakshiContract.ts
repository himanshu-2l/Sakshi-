import { Context, Contract, Info, Returns, Transaction } from "fabric-contract-api";
import crypto from "node:crypto";

export interface DeviceRegistration {
  deviceId: string;
  publicKeyJwkJson: string;
  hardwareProfile: string;
  registeredAtIso: string;
}

export interface CheckpointAnchor {
  consignmentId: string;
  deviceId: string;
  anchorIndex: number;
  startSeq: number;
  endSeq: number;
  merkleRoot: string;
  prevAnchorHash: string;
  anchorHash: string;
  epcisHash: string;
  anchoredAtIso: string;
}

@Info({
  title: "SakshiTraceContract",
  description: "Permissioned ledger smart contract for Sakshi cold-chain Merkle checkpoints",
})
export class SakshiTraceContract extends Contract {
  @Transaction()
  public async RegisterDevice(
    ctx: Context,
    deviceId: string,
    publicKeyJwkJson: string,
    hardwareProfile: string,
    registeredAtIso: string
  ): Promise<void> {
    const key = `DEVICE:${deviceId}`;
    const existing = await ctx.stub.getState(key);
    if (existing && existing.length > 0) {
      throw new Error(`Device ${deviceId} is already registered`);
    }
    const record: DeviceRegistration = {
      deviceId,
      publicKeyJwkJson,
      hardwareProfile,
      registeredAtIso,
    };
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(record)));
  }

  @Transaction()
  @Returns("string")
  public async AnchorCheckpoint(
    ctx: Context,
    consignmentId: string,
    deviceId: string,
    startSeq: number,
    endSeq: number,
    merkleRoot: string,
    epcisHash: string,
    anchoredAtIso: string
  ): Promise<string> {
    const deviceKey = `DEVICE:${deviceId}`;
    const deviceBytes = await ctx.stub.getState(deviceKey);
    if (!deviceBytes || deviceBytes.length === 0) {
      throw new Error(`Unregistered device ${deviceId}`);
    }

    const ledgerKey = `LEDGER:${consignmentId}`;
    const existingBytes = await ctx.stub.getState(ledgerKey);
    const chain: CheckpointAnchor[] =
      existingBytes && existingBytes.length > 0
        ? JSON.parse(existingBytes.toString())
        : [];

    const prev = chain[chain.length - 1];
    if (prev && startSeq !== prev.endSeq + 1) {
      throw new Error(
        `Non-contiguous checkpoint sequence: expected startSeq ${prev.endSeq + 1}, got ${startSeq}`
      );
    }

    const prevAnchorHash = prev ? prev.anchorHash : "0".repeat(64);
    const anchorIndex = chain.length + 1;
    const anchorHash = crypto
      .createHash("sha256")
      .update(`${consignmentId}:${anchorIndex}:${merkleRoot}:${prevAnchorHash}:${anchoredAtIso}`)
      .digest("hex");

    const anchor: CheckpointAnchor = {
      consignmentId,
      deviceId,
      anchorIndex,
      startSeq,
      endSeq,
      merkleRoot,
      prevAnchorHash,
      anchorHash,
      epcisHash,
      anchoredAtIso,
    };

    chain.push(anchor);
    await ctx.stub.putState(ledgerKey, Buffer.from(JSON.stringify(chain)));
    return JSON.stringify(anchor);
  }

  @Transaction(false)
  @Returns("string")
  public async GetConsignmentLedger(ctx: Context, consignmentId: string): Promise<string> {
    const ledgerKey = `LEDGER:${consignmentId}`;
    const bytes = await ctx.stub.getState(ledgerKey);
    if (!bytes || bytes.length === 0) {
      return "[]";
    }
    return bytes.toString();
  }
}
