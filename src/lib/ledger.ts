import {
  computeMerkleRoot,
  generateDeviceKeyPair,
  getGenesisHash,
  sha256Hex,
  signFrame,
  verifyHashChain,
  type DeviceKeyPair,
} from "./crypto";
import type {
  ConsignmentBundle,
  ConsignmentRecord,
  CustodyEvent,
  DeviceRecord,
  LedgerAnchor,
  SignedTelemetryFrame,
  StoredTelemetryFrame,
} from "./types";

interface LedgerState {
  initialized: boolean;
  devices: Map<string, DeviceRecord>;
  deviceKeys: Map<string, DeviceKeyPair>;
  consignments: Map<string, ConsignmentRecord>;
  frames: Map<string, StoredTelemetryFrame[]>;
  custodyEvents: Map<string, CustodyEvent[]>;
  anchors: Map<string, LedgerAnchor[]>;
}

const globalForLedger = globalThis as unknown as { __sakshiLedger?: LedgerState };

function getStore(): LedgerState {
  if (!globalForLedger.__sakshiLedger) {
    globalForLedger.__sakshiLedger = {
      initialized: false,
      devices: new Map(),
      deviceKeys: new Map(),
      consignments: new Map(),
      frames: new Map(),
      custodyEvents: new Map(),
      anchors: new Map(),
    };
  }
  return globalForLedger.__sakshiLedger;
}

async function anchorFrames(
  store: LedgerState,
  consignmentId: string,
  newFrames: StoredTelemetryFrame[],
  networkMode: "verifiable-local" | "hyperledger-fabric" = "verifiable-local"
): Promise<LedgerAnchor | null> {
  if (newFrames.length === 0) return null;
  const existing = store.anchors.get(consignmentId) ?? [];
  const prevAnchorHash =
    existing.length > 0 ? existing[existing.length - 1].anchorHash : getGenesisHash();
  const anchorIndex = existing.length + 1;
  const merkleRoot = await computeMerkleRoot(newFrames.map((f) => f.frameHash));
  const anchoredAtIso = new Date().toISOString();
  const anchorHash = await sha256Hex(
    `${consignmentId}:${anchorIndex}:${merkleRoot}:${prevAnchorHash}:${anchoredAtIso}`
  );
  const txId = `VSH-${anchorHash.slice(0, 12).toUpperCase()}`;

  const anchor: LedgerAnchor = {
    anchorIndex,
    txId,
    networkMode,
    consignmentId,
    startSeq: newFrames[0].seq,
    endSeq: newFrames[newFrames.length - 1].seq,
    merkleRoot,
    prevAnchorHash,
    anchorHash,
    anchoredAtIso,
  };

  for (const frame of newFrames) {
    frame.ledgerAnchorId = txId;
  }

  store.anchors.set(consignmentId, [...existing, anchor]);
  return anchor;
}

async function seedConsignment(
  store: LedgerState,
  opts: {
    consignment: ConsignmentRecord;
    deviceName: string;
    batteryPct: number;
    solarActive: boolean;
    bleTagsCount: number;
    deviceStatus: DeviceRecord["status"];
    custody: CustodyEvent[];
    telemetryPoints: Array<{
      hoursAgo: number;
      tempC: number;
      humidityRh: number;
      ethylenePpm: number;
      batteryMv: number;
      solarMv: number;
      tamperFlag?: boolean;
      offlineBuffered?: boolean;
    }>;
  }
) {
  const keys = await generateDeviceKeyPair();
  const device: DeviceRecord = {
    id: opts.consignment.deviceId,
    name: opts.deviceName,
    hardwareProfile: "ESP32-C3 + ATECC608B + SHT40 + ME3-C2H4 + BQ25570/LTO",
    firmwareVersion: "v2.1.4-sih",
    publicKeyJwk: keys.publicKeyJwk,
    lastSeenAtIso: new Date().toISOString(),
    batteryPct: opts.batteryPct,
    solarActive: opts.solarActive,
    bleTagsCount: opts.bleTagsCount,
    status: opts.deviceStatus,
  };

  store.devices.set(device.id, device);
  store.deviceKeys.set(device.id, keys);
  store.consignments.set(opts.consignment.id, opts.consignment);
  store.custodyEvents.set(opts.consignment.id, opts.custody);

  const signedFrames: StoredTelemetryFrame[] = [];
  let prevHash = getGenesisHash();

  for (let i = 0; i < opts.telemetryPoints.length; i += 1) {
    const pt = opts.telemetryPoints[i];
    const ts = new Date(Date.now() - pt.hoursAgo * 3600_000).toISOString();
    const signed = await signFrame(
      {
        deviceId: device.id,
        consignmentId: opts.consignment.id,
        seq: i + 1,
        timestampIso: ts,
        tempC: pt.tempC,
        humidityRh: pt.humidityRh,
        ethylenePpm: pt.ethylenePpm,
        batteryMv: pt.batteryMv,
        solarMv: pt.solarMv,
        tamperFlag: Boolean(pt.tamperFlag),
        offlineBuffered: Boolean(pt.offlineBuffered),
        prevHash,
      },
      keys.privateKeyJwk
    );

    signedFrames.push({
      ...signed,
      syncedAt: new Date(Date.now() - Math.max(0, pt.hoursAgo - 0.1) * 3600_000).toISOString(),
      ledgerAnchorId: null,
    });
    prevHash = signed.frameHash;
  }

  store.frames.set(opts.consignment.id, signedFrames);
  await anchorFrames(store, opts.consignment.id, signedFrames.slice(0, 6));
  if (signedFrames.length > 6) {
    await anchorFrames(store, opts.consignment.id, signedFrames.slice(6));
  }
}

async function seedAll(store: LedgerState) {
  store.devices.clear();
  store.deviceKeys.clear();
  store.consignments.clear();
  store.frames.clear();
  store.custodyEvents.clear();
  store.anchors.clear();

  const hoursAgoIso = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

  await seedConsignment(store, {
    consignment: {
      id: "LOT-IND-2026-001",
      tlc: "TLC-MH-NSK-2026-8841",
      deviceId: "SAK-001",
      commodity: "Table Grapes",
      variety: "Thompson Seedless (Export Grade A)",
      originFarm: "Sahyadri Farmers Producer Co., Nashik, MH",
      destination: "JNPT Reefer Terminal -> Port of Rotterdam",
      quantityKg: 4200,
      tempMinC: 0.5,
      tempMaxC: 4.0,
      ethyleneMaxPpm: 1.2,
      status: "in_transit",
      epcUrn: "urn:epc:id:sgtin:8904001.107346.202601",
    },
    deviceName: "Sakshi Hub #001 (Nashik-JNPT Reefer)",
    batteryPct: 94,
    solarActive: true,
    bleTagsCount: 8,
    deviceStatus: "online",
    custody: [
      {
        id: "ev-001-1",
        consignmentId: "LOT-IND-2026-001",
        bizStep: "harvesting",
        disposition: "active",
        locationName: "Plot 14B, Pimpalgaon Baswant, Nashik",
        readPointGln: "urn:epc:id:sgln:8904001.00014.1",
        timestampIso: hoursAgoIso(18),
        actor: "Sahyadri FPO Harvest Team",
        notes: "Morning harvest at 18°Brix, Lot TLC assigned.",
      },
      {
        id: "ev-001-2",
        consignmentId: "LOT-IND-2026-001",
        bizStep: "cooling",
        disposition: "in_progress",
        locationName: "Sahyadri Forced-Air Pre-Cooling Bay 2",
        readPointGln: "urn:epc:id:sgln:8904001.00018.0",
        timestampIso: hoursAgoIso(14),
        actor: "Packhouse Cold Ops",
        notes: "Core pulp temperature pulled down to 2.1°C.",
      },
      {
        id: "ev-001-3",
        consignmentId: "LOT-IND-2026-001",
        bizStep: "packing",
        disposition: "conformant",
        locationName: "Nashik Export Packhouse Line 3",
        readPointGln: "urn:epc:id:sgln:8904001.00020.3",
        timestampIso: hoursAgoIso(11),
        actor: "APEDA Certified Packer",
        notes: "8 BLE pallet tags paired to Sakshi Hub SAK-001.",
      },
      {
        id: "ev-001-4",
        consignmentId: "LOT-IND-2026-001",
        bizStep: "shipping",
        disposition: "in_transit",
        locationName: "NH-160 Kasara Ghat Corridor -> JNPT",
        readPointGln: "urn:epc:id:sgln:8904001.00025.0",
        timestampIso: hoursAgoIso(8),
        actor: "KoolChain Logistics MH-15-TR-4412",
        notes: "4-hour cellular blackout across Kasara Ghat; all frames signed offline and auto-synced on reconnect.",
      },
    ],
    telemetryPoints: [
      { hoursAgo: 12, tempC: 2.1, humidityRh: 88.2, ethylenePpm: 0.18, batteryMv: 3710, solarMv: 4600 },
      { hoursAgo: 11, tempC: 2.3, humidityRh: 88.5, ethylenePpm: 0.21, batteryMv: 3720, solarMv: 4920 },
      { hoursAgo: 10, tempC: 2.4, humidityRh: 89.0, ethylenePpm: 0.22, batteryMv: 3725, solarMv: 4780 },
      { hoursAgo: 9, tempC: 2.6, humidityRh: 89.4, ethylenePpm: 0.24, batteryMv: 3705, solarMv: 3900 },
      { hoursAgo: 8, tempC: 2.9, humidityRh: 89.8, ethylenePpm: 0.27, batteryMv: 3680, solarMv: 1200, offlineBuffered: true },
      { hoursAgo: 7, tempC: 3.1, humidityRh: 90.1, ethylenePpm: 0.29, batteryMv: 3660, solarMv: 900, offlineBuffered: true },
      { hoursAgo: 6, tempC: 3.2, humidityRh: 90.3, ethylenePpm: 0.31, batteryMv: 3650, solarMv: 850, offlineBuffered: true },
      { hoursAgo: 5, tempC: 3.0, humidityRh: 89.9, ethylenePpm: 0.30, batteryMv: 3645, solarMv: 1100, offlineBuffered: true },
      { hoursAgo: 4, tempC: 2.7, humidityRh: 89.1, ethylenePpm: 0.26, batteryMv: 3690, solarMv: 4200 },
      { hoursAgo: 3, tempC: 2.4, humidityRh: 88.7, ethylenePpm: 0.23, batteryMv: 3715, solarMv: 4850 },
      { hoursAgo: 2, tempC: 2.2, humidityRh: 88.4, ethylenePpm: 0.21, batteryMv: 3730, solarMv: 5010 },
      { hoursAgo: 1, tempC: 2.1, humidityRh: 88.3, ethylenePpm: 0.20, batteryMv: 3740, solarMv: 4960 },
    ],
  });

  await seedConsignment(store, {
    consignment: {
      id: "LOT-IND-2026-002",
      tlc: "TLC-MH-RTN-2026-3109",
      deviceId: "SAK-002",
      commodity: "Alphonso Mangoes",
      variety: "GI-Tagged Ratnagiri Hapoos",
      originFarm: "Konkan Agri Cooperative, Ratnagiri, MH",
      destination: "Mumbai Air Cargo Cold Room -> Dubai",
      quantityKg: 1850,
      tempMinC: 10.0,
      tempMaxC: 13.5,
      ethyleneMaxPpm: 2.5,
      status: "excursion_alert",
      epcUrn: "urn:epc:id:sgtin:8904002.204110.202602",
    },
    deviceName: "Sakshi Hub #002 (Konkan Ripening Watch)",
    batteryPct: 81,
    solarActive: true,
    bleTagsCount: 4,
    deviceStatus: "alert",
    custody: [
      {
        id: "ev-002-1",
        consignmentId: "LOT-IND-2026-002",
        bizStep: "harvesting",
        disposition: "active",
        locationName: "Devgad Orchard Cluster, Ratnagiri",
        readPointGln: "urn:epc:id:sgln:8904002.00007.1",
        timestampIso: hoursAgoIso(14),
        actor: "Konkan Agri FPO",
        notes: "Mature green GI-tagged Alphonso harvest.",
      },
      {
        id: "ev-002-2",
        consignmentId: "LOT-IND-2026-002",
        bizStep: "packing",
        disposition: "conformant",
        locationName: "Ratnagiri Vapor Heat Treatment Center",
        readPointGln: "urn:epc:id:sgln:8904002.00011.0",
        timestampIso: hoursAgoIso(10),
        actor: "MoFPI Export Packhouse",
        notes: "Ethylene threshold set at 2.5 ppm to prevent premature ripening.",
      },
      {
        id: "ev-002-3",
        consignmentId: "LOT-IND-2026-002",
        bizStep: "shipping",
        disposition: "non_conformant_condition",
        locationName: "NH-66 Chiplun -> Panvel Corridor",
        readPointGln: "urn:epc:id:sgln:8904002.00019.0",
        timestampIso: hoursAgoIso(3),
        actor: "Western Reefer Express",
        notes: "ME3-C2H4 detected ethylene rise to 3.4 ppm + 15.2°C cooling excursion.",
      },
    ],
    telemetryPoints: [
      { hoursAgo: 10, tempC: 11.8, humidityRh: 89.0, ethylenePpm: 0.65, batteryMv: 3680, solarMv: 4900 },
      { hoursAgo: 8, tempC: 12.1, humidityRh: 89.4, ethylenePpm: 0.92, batteryMv: 3670, solarMv: 4700 },
      { hoursAgo: 6, tempC: 12.6, humidityRh: 90.2, ethylenePpm: 1.45, batteryMv: 3650, solarMv: 3100, offlineBuffered: true },
      { hoursAgo: 4, tempC: 14.3, humidityRh: 91.5, ethylenePpm: 2.65, batteryMv: 3630, solarMv: 1800, offlineBuffered: true },
      { hoursAgo: 2, tempC: 15.2, humidityRh: 92.1, ethylenePpm: 3.40, batteryMv: 3615, solarMv: 4100 },
      { hoursAgo: 1, tempC: 12.9, humidityRh: 90.4, ethylenePpm: 2.85, batteryMv: 3630, solarMv: 4500 },
    ],
  });

  await seedConsignment(store, {
    consignment: {
      id: "LOT-IND-2026-003",
      tlc: "TLC-HP-SML-2026-5520",
      deviceId: "SAK-003",
      commodity: "Himachal Apples",
      variety: "Royal Delicious (CA Cold Store)",
      originFarm: "Kotgarh Growers Collective, Shimla, HP",
      destination: "Azadpur Cold Hub, New Delhi",
      quantityKg: 6400,
      tempMinC: -0.5,
      tempMaxC: 2.5,
      ethyleneMaxPpm: 1.8,
      status: "delivered",
      epcUrn: "urn:epc:id:sgtin:8904003.309921.202603",
    },
    deviceName: "Sakshi Hub #003 (Shimla Mountain Transit)",
    batteryPct: 88,
    solarActive: false,
    bleTagsCount: 12,
    deviceStatus: "online",
    custody: [
      {
        id: "ev-003-1",
        consignmentId: "LOT-IND-2026-003",
        bizStep: "cooling",
        disposition: "conformant",
        locationName: "Kotgarh Controlled Atmosphere Store",
        readPointGln: "urn:epc:id:sgln:8904003.00002.0",
        timestampIso: hoursAgoIso(16),
        actor: "HPMC Cold Chain",
        notes: "LTO buffer active at -0.2°C; sub-zero charge protection engaged.",
      },
      {
        id: "ev-003-2",
        consignmentId: "LOT-IND-2026-003",
        bizStep: "receiving",
        disposition: "conformant",
        locationName: "Azadpur Cold Terminal Bay 7, Delhi",
        readPointGln: "urn:epc:id:sgln:8904003.00044.7",
        timestampIso: hoursAgoIso(2),
        actor: "Delhi Fresh Distribution",
        notes: "All 12 BLE crate tags reconciled; zero excursion.",
      },
    ],
    telemetryPoints: [
      { hoursAgo: 12, tempC: 0.4, humidityRh: 91.2, ethylenePpm: 0.55, batteryMv: 3690, solarMv: 1400 },
      { hoursAgo: 9, tempC: 0.6, humidityRh: 91.5, ethylenePpm: 0.58, batteryMv: 3680, solarMv: 2100, offlineBuffered: true },
      { hoursAgo: 6, tempC: 0.8, humidityRh: 91.8, ethylenePpm: 0.62, batteryMv: 3670, solarMv: 1900, offlineBuffered: true },
      { hoursAgo: 3, tempC: 0.7, humidityRh: 91.4, ethylenePpm: 0.60, batteryMv: 3675, solarMv: 3200 },
      { hoursAgo: 1, tempC: 0.5, humidityRh: 91.1, ethylenePpm: 0.57, batteryMv: 3685, solarMv: 3500 },
    ],
  });

  store.initialized = true;
}

export async function ensureLedgerReady(): Promise<LedgerState> {
  const store = getStore();
  if (!store.initialized) {
    await seedAll(store);
  }
  return store;
}

export async function listConsignmentBundles(): Promise<ConsignmentBundle[]> {
  const store = await ensureLedgerReady();
  const bundles: ConsignmentBundle[] = [];
  for (const id of store.consignments.keys()) {
    const bundle = await getConsignmentBundle(id);
    if (bundle) bundles.push(bundle);
  }
  return bundles;
}

export async function getConsignmentBundle(
  consignmentId: string
): Promise<ConsignmentBundle | null> {
  const store = await ensureLedgerReady();
  const consignment = store.consignments.get(consignmentId);
  if (!consignment) return null;
  const device = store.devices.get(consignment.deviceId);
  if (!device) return null;

  const frames = store.frames.get(consignmentId) ?? [];
  const custodyEvents = store.custodyEvents.get(consignmentId) ?? [];
  const anchors = store.anchors.get(consignmentId) ?? [];
  const verification = await verifyHashChain(frames, device.publicKeyJwk);

  return {
    consignment,
    device,
    frames,
    custodyEvents,
    anchors,
    verification,
  };
}

export async function getDeviceKeysForSimulator(deviceId: string) {
  const store = await ensureLedgerReady();
  return store.deviceKeys.get(deviceId) ?? null;
}

export async function ingestSignedBatch(
  consignmentId: string,
  incomingFrames: SignedTelemetryFrame[]
) {
  const store = await ensureLedgerReady();
  const consignment = store.consignments.get(consignmentId);
  if (!consignment) {
    return { ok: false as const, error: `Unknown consignment ${consignmentId}` };
  }
  const device = store.devices.get(consignment.deviceId);
  if (!device) {
    return { ok: false as const, error: `Unknown device ${consignment.deviceId}` };
  }

  const existing = store.frames.get(consignmentId) ?? [];
  const combined: StoredTelemetryFrame[] = [
    ...existing,
    ...incomingFrames.map((f) => ({
      ...f,
      syncedAt: new Date().toISOString(),
      ledgerAnchorId: null,
    })),
  ];

  const report = await verifyHashChain(combined, device.publicKeyJwk);
  if (!report.valid) {
    return {
      ok: false as const,
      error: "Cryptographic chain verification failed",
      verification: report,
    };
  }

  const newlyAdded = combined.slice(existing.length);
  const anchor = await anchorFrames(store, consignmentId, newlyAdded);
  store.frames.set(consignmentId, combined);

  const latest = newlyAdded[newlyAdded.length - 1];
  if (latest) {
    device.lastSeenAtIso = new Date().toISOString();
    device.batteryPct = Math.min(100, Math.max(5, Math.round(((latest.batteryMv - 3200) / 600) * 100)));
    device.solarActive = latest.solarMv > 2500;
    if (latest.tamperFlag) {
      consignment.status = "tamper_alert";
      device.status = "alert";
    } else if (
      latest.tempC > consignment.tempMaxC ||
      latest.tempC < consignment.tempMinC ||
      latest.ethylenePpm > consignment.ethyleneMaxPpm
    ) {
      consignment.status = "excursion_alert";
      device.status = "alert";
    } else {
      device.status = "online";
    }
  }

  return {
    ok: true as const,
    ingestedCount: newlyAdded.length,
    anchor,
    verification: report,
  };
}

export async function simulateDatabaseTamper(consignmentId: string, seq?: number) {
  const store = await ensureLedgerReady();
  const frames = store.frames.get(consignmentId);
  if (!frames || frames.length === 0) {
    return { ok: false as const, error: "No frames available to tamper" };
  }
  const targetIndex = seq
    ? frames.findIndex((f) => f.seq === seq)
    : Math.max(0, Math.floor(frames.length / 2));
  const idx = targetIndex >= 0 ? targetIndex : 0;

  // Mutate temperature in the DB WITHOUT updating frameHash or ATECC608B signature
  frames[idx] = {
    ...frames[idx],
    tempC: Number((frames[idx].tempC + 6.4).toFixed(2)),
  };

  const consignment = store.consignments.get(consignmentId);
  if (consignment) {
    consignment.status = "tamper_alert";
  }

  const bundle = await getConsignmentBundle(consignmentId);
  return {
    ok: true as const,
    tamperedSeq: frames[idx].seq,
    bundle,
  };
}

export async function resetLedgerStore() {
  const store = getStore();
  await seedAll(store);
  return { ok: true as const };
}
