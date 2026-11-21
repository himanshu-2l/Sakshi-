"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  HardDrive,
  Lock,
  RefreshCw,
  Send,
  ShieldAlert,
  UploadCloud,
  Wifi,
  WifiOff,
} from "lucide-react";
import { signFrame } from "@/lib/crypto";
import type { ConsignmentBundle, SignedTelemetryFrame } from "@/lib/types";
import { HashChip } from "./HashChip";

export function SimulatorLabClient({
  initialBundle,
  devicePrivateKeyJwk,
}: {
  initialBundle: ConsignmentBundle;
  devicePrivateKeyJwk: JsonWebKey | null;
}) {
  const [bundle, setBundle] = useState<ConsignmentBundle>(initialBundle);
  const [privKey, setPrivKey] = useState<JsonWebKey | null>(devicePrivateKeyJwk);

  // Virtual Sakshi Hub controls
  const [offlineMode, setOfflineMode] = useState(false);
  const [tamperSwitch, setTamperSwitch] = useState(false);
  const [tempC, setTempC] = useState(2.4);
  const [humidityRh, setHumidityRh] = useState(88.5);
  const [ethylenePpm, setEthylenePpm] = useState(0.24);
  const [solarMv, setSolarMv] = useState(4850);

  // 16 MB SPI NOR Ring Buffer simulation
  const [offlineQueue, setOfflineQueue] = useState<SignedTelemetryFrame[]>([]);
  const [busy, setBusy] = useState(false);
  const [statusLog, setStatusLog] = useState<string>(
    "Ready. Toggle Cellular Blackout or capture a hardware-signed frame."
  );

  async function refreshBundle() {
    const res = await fetch(`/api/consignments/${bundle.consignment.id}`);
    if (res.ok) {
      const data = await res.json();
      setBundle(data.bundle);
      if (data.simulatorPrivateKeyJwk) {
        setPrivKey(data.simulatorPrivateKeyJwk);
      }
    }
  }

  async function handleCaptureFrame() {
    if (!privKey) {
      setStatusLog("Device key unavailable in this session.");
      return;
    }
    setBusy(true);
    try {
      const lastStored = bundle.frames[bundle.frames.length - 1];
      const lastQueued = offlineQueue[offlineQueue.length - 1];
      const prevFrame = lastQueued ?? lastStored;

      const nextSeq = prevFrame ? prevFrame.seq + 1 : 1;
      const prevHash = prevFrame ? prevFrame.frameHash : "0".repeat(64);

      const signed = await signFrame(
        {
          deviceId: bundle.device.id,
          consignmentId: bundle.consignment.id,
          seq: nextSeq,
          timestampIso: new Date().toISOString(),
          tempC,
          humidityRh,
          ethylenePpm,
          batteryMv: 3715,
          solarMv,
          tamperFlag: tamperSwitch,
          offlineBuffered: offlineMode,
          prevHash,
        },
        privKey
      );

      if (offlineMode) {
        setOfflineQueue((q) => [...q, signed]);
        setStatusLog(
          `Offline Mode: Frame #${signed.seq} signed with ECDSA P-256 and saved to SPI NOR ring buffer.`
        );
      } else {
        const res = await fetch("/api/ingest/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consignmentId: bundle.consignment.id,
            frames: [signed],
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatusLog(`Rejected by verifier: ${data.error ?? "Chain invalid"}`);
        } else {
          setStatusLog(
            `Live MQTT/TLS Sync: Frame #${signed.seq} verified & anchored (${data.anchor?.txId ?? "OK"}).`
          );
        }
        await refreshBundle();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleReconnectAndSync() {
    if (offlineQueue.length === 0) {
      setOfflineMode(false);
      setStatusLog("Reconnected to LTE Cat-1. Offline buffer was empty.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consignmentId: bundle.consignment.id,
          frames: offlineQueue,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusLog(`Sync rejected: ${data.error ?? "Chain verification failed"}`);
      } else {
        setStatusLog(
          `Reconnected! Flushed ${offlineQueue.length} offline-signed frames -> Merkle Anchor ${data.anchor?.txId ?? "OK"}.`
        );
        setOfflineQueue([]);
        setOfflineMode(false);
      }
      await refreshBundle();
    } finally {
      setBusy(false);
    }
  }

  async function handleDatabaseTamperAttack() {
    setBusy(true);
    try {
      const res = await fetch("/api/simulator/tamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consignmentId: bundle.consignment.id }),
      });
      const data = await res.json();
      if (res.ok && data.bundle) {
        setBundle(data.bundle);
        setStatusLog(
          `ATTACK EXECUTED: Altered tempC on Frame #${data.tamperedSeq} in database. Cryptographic verifier immediately flagged HASH_MISMATCH + INVALID_SIGNATURE!`
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    try {
      await fetch("/api/simulator/reset", { method: "POST" });
      setOfflineQueue([]);
      setOfflineMode(false);
      setTamperSwitch(false);
      await refreshBundle();
      setStatusLog("Ledger and device state reset to clean verified baseline.");
    } finally {
      setBusy(false);
    }
  }

  const report = bundle.verification;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0E1B14]">
            Interactive Offline-Sync &amp; Tamper-Attack Lab
          </h1>
          <p className="text-sm text-[#3B4F43] mt-1">
            Simulate rural cellular blackouts, hardware-signed local buffering, and
            unauthorized database tampering in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFFFFF] border border-[#D8E0D5] text-xs font-semibold text-[#0E1B14] hover:bg-[#ECEFE9]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Clean Chain
        </button>
      </div>

      {/* Live Status Console */}
      <div className="rounded-xl bg-[#0B1D16] text-[#E6F5EE] px-5 py-3.5 text-xs font-mono-tabular flex items-center justify-between gap-4">
        <span>{statusLog}</span>
        <Link
          href={`/consignments/${bundle.consignment.id}`}
          className="text-[#6EE7B7] font-sans font-semibold hover:underline shrink-0"
        >
          View Chart &amp; EPCIS →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Virtual Sakshi Hub Hardware Twin */}
        <div className="lg:col-span-5 instrument-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#0D4F36] text-white flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#0E1B14]">
                  Virtual Sakshi Hub ({bundle.device.id})
                </h2>
                <div className="text-xs text-[#586E61]">
                  ATECC608B P-256 + 16 MB SPI NOR Twin
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                offlineMode
                  ? "bg-[#E0F2FE] text-[#0369A1]"
                  : "bg-[#E6F5EE] text-[#0B7A53]"
              }`}
            >
              {offlineMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  Offline
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  LTE Online
                </>
              )}
            </span>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOfflineMode((v) => !v)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                offlineMode
                  ? "bg-[#E0F2FE] border-[#0369A1]/40 text-[#0369A1]"
                  : "bg-[#F6F7F4] border-[#D8E0D5] text-[#0E1B14]"
              }`}
            >
              <div className="text-xs font-semibold">
                {offlineMode ? "Cellular Blackout Active" : "Kill Cellular Network"}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {offlineMode ? "Logging to SPI NOR flash" : "Click to simulate dropout"}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTamperSwitch((v) => !v)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                tamperSwitch
                  ? "bg-[#FEF3C7] border-[#B45309]/40 text-[#B45309]"
                  : "bg-[#F6F7F4] border-[#D8E0D5] text-[#0E1B14]"
              }`}
            >
              <div className="text-xs font-semibold">
                {tamperSwitch ? "Enclosure Seal Broken" : "Trigger Tamper Switch"}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {tamperSwitch ? "tamperFlag = true" : "Physical seal intact"}
              </div>
            </button>
          </div>

          {/* Sensor Sliders */}
          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#3B4F43]">SHT40 Temperature</span>
                <span className="font-mono-tabular font-bold text-[#0E1B14]">
                  {tempC.toFixed(1)} °C
                </span>
              </div>
              <input
                type="range"
                min={-5}
                max={18}
                step={0.1}
                value={tempC}
                onChange={(e) => setTempC(Number(e.target.value))}
                className="w-full accent-[#0D4F36]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#3B4F43]">SHT40 Humidity</span>
                <span className="font-mono-tabular font-bold text-[#0E1B14]">
                  {humidityRh.toFixed(1)} %RH
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={99}
                step={0.5}
                value={humidityRh}
                onChange={(e) => setHumidityRh(Number(e.target.value))}
                className="w-full accent-[#0D4F36]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#3B4F43]">ME3-C2H4 Ethylene Gas</span>
                <span className="font-mono-tabular font-bold text-[#0E1B14]">
                  {ethylenePpm.toFixed(2)} ppm
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={5.0}
                step={0.05}
                value={ethylenePpm}
                onChange={(e) => setEthylenePpm(Number(e.target.value))}
                className="w-full accent-[#D97706]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#3B4F43]">BQ25570 Solar Input</span>
                <span className="font-mono-tabular font-bold text-[#0E1B14]">
                  {solarMv} mV
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={5200}
                step={100}
                value={solarMv}
                onChange={(e) => setSolarMv(Number(e.target.value))}
                className="w-full accent-[#0D4F36]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleCaptureFrame}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0D4F36] text-white text-sm font-semibold hover:bg-[#093B28] disabled:opacity-60 transition-colors"
            >
              <Send className="w-4 h-4" />
              {offlineMode
                ? "Sign & Buffer Frame Offline (SPI NOR)"
                : "Sign & Stream Frame Live"}
            </button>

            {offlineQueue.length > 0 && (
              <button
                type="button"
                onClick={handleReconnectAndSync}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0369A1] text-white text-sm font-semibold hover:bg-[#075985] disabled:opacity-60 transition-colors"
              >
                <UploadCloud className="w-4 h-4" />
                {`Reconnect LTE & Auto-Sync (${offlineQueue.length} Queued)`}
              </button>
            )}
          </div>

          {/* Local Offline Buffer Readout */}
          <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0E1B14]">
              <span className="inline-flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-[#0369A1]" />
                16 MB SPI NOR Offline Buffer
              </span>
              <span className="font-mono-tabular text-[#0369A1]">
                {offlineQueue.length} pending
              </span>
            </div>
            {offlineQueue.length === 0 ? (
              <p className="text-xs text-[#586E61]">
                Buffer empty. Enable Offline Mode and capture frames to see local
                ECDSA-signed queuing.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {offlineQueue.map((q) => (
                  <div
                    key={q.seq}
                    className="flex items-center justify-between text-[11px] font-mono-tabular bg-white px-2.5 py-1.5 rounded-lg border border-[#D8E0D5]"
                  >
                    <span>
                      #{q.seq} · {q.tempC.toFixed(1)}°C · {q.ethylenePpm.toFixed(2)}ppm
                    </span>
                    <span className="text-[#0B7A53] inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Signed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Verifier & Adversarial Tamper Attack */}
        <div className="lg:col-span-7 instrument-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0E1B14]">
                Cryptographic Chain Verifier
              </h2>
              <p className="text-xs text-[#586E61]">
                Every frame is checked for SHA-256 integrity, prevHash continuity, and
                ECDSA P-256 signature.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDatabaseTamperAttack}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#BE123C] text-white text-xs font-semibold hover:bg-[#9F1239] disabled:opacity-60 transition-colors shrink-0"
            >
              <AlertTriangle className="w-4 h-4" />
              Simulate Database Tamper Attack
            </button>
          </div>

          {/* Verdict Box */}
          <div
            className={`rounded-xl p-4 border ${
              report.valid
                ? "bg-[#E6F5EE] border-[#0B7A53]/30"
                : "bg-[#FFE4E6] border-[#BE123C]/40"
            }`}
          >
            <div className="flex items-start gap-3">
              {report.valid ? (
                <CheckCircle2 className="w-5 h-5 text-[#0B7A53] shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-[#BE123C] shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs">
                <div className="font-bold text-sm text-[#0E1B14]">
                  {report.valid
                    ? `CHAIN INTACT (${report.checkedCount} / ${report.checkedCount} Frames Verified)`
                    : `TAMPER DETECTED (${report.failures.length} Cryptographic Failure${report.failures.length > 1 ? "s" : ""})`}
                </div>
                {report.failures.map((f, i) => (
                  <div key={i} className="font-mono-tabular text-[#881337] font-semibold">
                    [{f.reason}] {f.detail}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Chain List */}
          <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
            {bundle.frames
              .slice()
              .reverse()
              .map((frame) => {
                const failed = report.failures.some((f) => f.seq === frame.seq);
                return (
                  <div
                    key={frame.seq}
                    className={`rounded-xl p-3.5 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      failed
                        ? "bg-[#FFE4E6]/70 border-[#BE123C]/50"
                        : "bg-[#F6F7F4] border-[#D8E0D5]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono-tabular">
                        <span className="font-bold text-[#0E1B14]">#{frame.seq}</span>
                        <span className="text-[#0E1B14]">
                          {frame.tempC.toFixed(1)}°C · {frame.humidityRh.toFixed(1)}% ·{" "}
                          {frame.ethylenePpm.toFixed(2)} ppm
                        </span>
                        {frame.offlineBuffered && (
                          <span className="px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] text-[10px] font-semibold">
                            Offline Buffered
                          </span>
                        )}
                        {frame.tamperFlag && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-semibold">
                            Seal Alert
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#586E61] font-mono-tabular">
                        TX: {frame.ledgerAnchorId ?? "Pending"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <HashChip label="Hash" value={frame.frameHash} chars={10} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
