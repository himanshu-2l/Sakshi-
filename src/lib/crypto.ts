import type {
  ChainFailure,
  ChainVerificationReport,
  SignedTelemetryFrame,
  TelemetryPayload,
} from "./types";

const GENESIS_HASH = "0".repeat(64);

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("WebCrypto SubtleCrypto is unavailable in this runtime");
  }
  return subtle;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(b64, "base64");
    const copy = new Uint8Array(buf.length);
    copy.set(buf);
    return copy;
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function getGenesisHash(): string {
  return GENESIS_HASH;
}

export function canonicalizePayload(payload: TelemetryPayload): string {
  const ordered = {
    batteryMv: Math.round(payload.batteryMv),
    consignmentId: payload.consignmentId,
    deviceId: payload.deviceId,
    ethylenePpm: Number(payload.ethylenePpm.toFixed(2)),
    humidityRh: Number(payload.humidityRh.toFixed(2)),
    offlineBuffered: Boolean(payload.offlineBuffered),
    prevHash: payload.prevHash,
    seq: payload.seq,
    solarMv: Math.round(payload.solarMv),
    tamperFlag: Boolean(payload.tamperFlag),
    tempC: Number(payload.tempC.toFixed(2)),
    timestampIso: payload.timestampIso,
  };
  return JSON.stringify(ordered);
}

export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await getSubtle().digest("SHA-256", encoded);
  return toHex(new Uint8Array(digest));
}

export async function computeFrameHash(payload: TelemetryPayload): Promise<string> {
  return sha256Hex(canonicalizePayload(payload));
}

export interface DeviceKeyPair {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}

export async function generateDeviceKeyPair(): Promise<DeviceKeyPair> {
  const subtle = getSubtle();
  const keyPair = await subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
  const publicKeyJwk = await subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await subtle.exportKey("jwk", keyPair.privateKey);
  return { publicKeyJwk, privateKeyJwk };
}

export async function signFrame(
  payload: TelemetryPayload,
  privateKeyJwk: JsonWebKey
): Promise<SignedTelemetryFrame> {
  const subtle = getSubtle();
  const frameHash = await computeFrameHash(payload);
  const privateKey = await subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    privateKey,
    new TextEncoder().encode(frameHash)
  );
  return {
    ...payload,
    frameHash,
    signature: toBase64(new Uint8Array(signatureBuffer)),
  };
}

export async function verifyFrameSignature(
  frame: SignedTelemetryFrame,
  publicKeyJwk: JsonWebKey
): Promise<boolean> {
  try {
    const subtle = getSubtle();
    const publicKey = await subtle.importKey(
      "jwk",
      publicKeyJwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );
    const sigBytes = fromBase64(frame.signature);
    return await subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      publicKey,
      sigBytes,
      new TextEncoder().encode(frame.frameHash)
    );
  } catch {
    return false;
  }
}

export async function verifyHashChain(
  frames: SignedTelemetryFrame[],
  publicKeyJwk: JsonWebKey
): Promise<ChainVerificationReport> {
  const startedAt = performance.now();
  const sorted = [...frames].sort((a, b) => a.seq - b.seq);
  const failures: ChainFailure[] = [];
  let offlineCount = 0;

  for (let i = 0; i < sorted.length; i += 1) {
    const frame = sorted[i];
    if (frame.offlineBuffered) {
      offlineCount += 1;
    }

    const expectedHash = await computeFrameHash(frame);
    if (expectedHash !== frame.frameHash) {
      failures.push({
        seq: frame.seq,
        reason: "HASH_MISMATCH",
        detail: `Frame #${frame.seq} payload SHA-256 mismatch (expected ${expectedHash.slice(0, 12)}…, stored ${frame.frameHash.slice(0, 12)}…)`,
      });
    }

    const sigOk = await verifyFrameSignature(frame, publicKeyJwk);
    if (!sigOk) {
      failures.push({
        seq: frame.seq,
        reason: "INVALID_SIGNATURE",
        detail: `Frame #${frame.seq} ECDSA P-256 signature failed ATECC608B public key verification`,
      });
    }

    if (i === 0) {
      if (frame.seq === 1 && frame.prevHash !== GENESIS_HASH) {
        failures.push({
          seq: frame.seq,
          reason: "BROKEN_HASH_LINK",
          detail: `Genesis frame #1 prevHash does not match zero seed`,
        });
      }
    } else {
      const prev = sorted[i - 1];
      if (frame.seq === prev.seq) {
        failures.push({
          seq: frame.seq,
          reason: "REPLAY_DETECTED",
          detail: `Duplicate monotonic counter seq #${frame.seq}`,
        });
      } else if (frame.seq !== prev.seq + 1) {
        failures.push({
          seq: frame.seq,
          reason: "SEQUENCE_GAP",
          detail: `Missing monotonic counter between #${prev.seq} and #${frame.seq}`,
        });
      }
      if (frame.prevHash !== prev.frameHash) {
        failures.push({
          seq: frame.seq,
          reason: "BROKEN_HASH_LINK",
          detail: `Frame #${frame.seq} prevHash (${frame.prevHash.slice(0, 10)}…) != frame #${prev.seq} hash (${prev.frameHash.slice(0, 10)}…)`,
        });
      }
    }
  }

  return {
    valid: failures.length === 0 && sorted.length > 0,
    checkedCount: sorted.length,
    offlineCount,
    firstSeq: sorted.length > 0 ? sorted[0].seq : null,
    lastSeq: sorted.length > 0 ? sorted[sorted.length - 1].seq : null,
    verifiedAtIso: new Date().toISOString(),
    durationMs: Number((performance.now() - startedAt).toFixed(2)),
    failures,
  };
}

export async function computeMerkleRoot(hashes: string[]): Promise<string> {
  if (hashes.length === 0) return GENESIS_HASH;
  let layer = [...hashes];
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] ?? left;
      next.push(await sha256Hex(`${left}:${right}`));
    }
    layer = next;
  }
  return layer[0];
}
