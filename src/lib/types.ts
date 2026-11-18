export interface TelemetryPayload {
  deviceId: string;
  consignmentId: string;
  seq: number;
  timestampIso: string;
  tempC: number;
  humidityRh: number;
  ethylenePpm: number;
  batteryMv: number;
  solarMv: number;
  tamperFlag: boolean;
  offlineBuffered: boolean;
  prevHash: string;
}

export interface SignedTelemetryFrame extends TelemetryPayload {
  frameHash: string;
  signature: string;
}

export interface StoredTelemetryFrame extends SignedTelemetryFrame {
  syncedAt: string;
  ledgerAnchorId: string | null;
}

export type ChainFailureReason =
  | "INVALID_SIGNATURE"
  | "BROKEN_HASH_LINK"
  | "HASH_MISMATCH"
  | "SEQUENCE_GAP"
  | "REPLAY_DETECTED";

export interface ChainFailure {
  seq: number;
  reason: ChainFailureReason;
  detail: string;
}

export interface ChainVerificationReport {
  valid: boolean;
  checkedCount: number;
  offlineCount: number;
  firstSeq: number | null;
  lastSeq: number | null;
  verifiedAtIso: string;
  durationMs: number;
  failures: ChainFailure[];
}

export interface CustodyEvent {
  id: string;
  consignmentId: string;
  bizStep: "harvesting" | "cooling" | "packing" | "shipping" | "receiving" | "inspecting";
  disposition: string;
  locationName: string;
  readPointGln: string;
  timestampIso: string;
  actor: string;
  notes: string;
}

export interface LedgerAnchor {
  anchorIndex: number;
  txId: string;
  networkMode: "verifiable-local" | "hyperledger-fabric";
  consignmentId: string;
  startSeq: number;
  endSeq: number;
  merkleRoot: string;
  prevAnchorHash: string;
  anchorHash: string;
  anchoredAtIso: string;
}

export interface DeviceRecord {
  id: string;
  name: string;
  hardwareProfile: string;
  firmwareVersion: string;
  publicKeyJwk: JsonWebKey;
  lastSeenAtIso: string;
  batteryPct: number;
  solarActive: boolean;
  bleTagsCount: number;
  status: "online" | "offline_buffering" | "alert";
}

export interface ConsignmentRecord {
  id: string;
  tlc: string;
  deviceId: string;
  commodity: string;
  variety: string;
  originFarm: string;
  destination: string;
  quantityKg: number;
  tempMinC: number;
  tempMaxC: number;
  ethyleneMaxPpm: number;
  status: "in_transit" | "delivered" | "excursion_alert" | "tamper_alert";
  epcUrn: string;
}

export interface ConsignmentBundle {
  consignment: ConsignmentRecord;
  device: DeviceRecord;
  frames: StoredTelemetryFrame[];
  custodyEvents: CustodyEvent[];
  anchors: LedgerAnchor[];
  verification: ChainVerificationReport;
}
