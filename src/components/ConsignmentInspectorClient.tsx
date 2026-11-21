"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { buildEpcisDocument } from "@/lib/epcis";
import { verifyHashChain } from "@/lib/crypto";
import type { ChainVerificationReport, ConsignmentBundle } from "@/lib/types";
import { CryptoStatusBadge } from "./CryptoStatusBadge";
import { HashChip } from "./HashChip";
import { TelemetryChart } from "./TelemetryChart";

export function ConsignmentInspectorClient({
  initialBundle,
}: {
  initialBundle: ConsignmentBundle;
}) {
  const [bundle] = useState(initialBundle);
  const [browserReport, setBrowserReport] = useState<ChainVerificationReport | null>(
    null
  );
  const [verifying, setVerifying] = useState(false);
  const [showEpcisPreview, setShowEpcisPreview] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const report = browserReport ?? bundle.verification;
  const passportUrl = origin
    ? `${origin}/verify/${bundle.consignment.id}`
    : `/verify/${bundle.consignment.id}`;

  async function runBrowserVerification() {
    setVerifying(true);
    try {
      const result = await verifyHashChain(
        bundle.frames,
        bundle.device.publicKeyJwk
      );
      setBrowserReport(result);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#586E61] hover:text-[#0E1B14]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Fleet Command Center
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0E1B14]">
              {bundle.consignment.commodity} — {bundle.consignment.id}
            </h1>
            <CryptoStatusBadge
              valid={report.valid}
              offlineCount={report.offlineCount}
              tamperAlert={bundle.consignment.status === "tamper_alert"}
              excursionAlert={bundle.consignment.status === "excursion_alert"}
            />
          </div>
          <p className="text-sm text-[#3B4F43]">
            {bundle.consignment.originFarm} → {bundle.consignment.destination} ·{" "}
            <span className="font-mono-tabular">{bundle.consignment.tlc}</span>
          </p>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={runBrowserVerification}
            disabled={verifying}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D4F36] text-white text-sm font-semibold hover:bg-[#093B28] disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            {verifying ? "Verifying in Browser…" : "Verify Chain in Browser"}
          </button>
          <a
            href={`/api/consignments/${bundle.consignment.id}/export?format=epcis`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8E0D5] text-sm font-semibold text-[#0E1B14] hover:bg-[#ECEFE9] transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            EPCIS 2.0
          </a>
          <a
            href={`/api/consignments/${bundle.consignment.id}/export?format=fsma`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D8E0D5] text-sm font-semibold text-[#0E1B14] hover:bg-[#ECEFE9] transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            FSMA 204 CSV
          </a>
        </div>
      </div>

      {/* Browser WebCrypto Verification Banner */}
      <div
        className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          report.valid
            ? "bg-[#E6F5EE] border-[#0B7A53]/30 text-[#0E1B14]"
            : "bg-[#FFE4E6] border-[#BE123C]/40 text-[#881337]"
        }`}
      >
        <div className="flex items-start gap-3">
          {report.valid ? (
            <CheckCircle2 className="w-5 h-5 text-[#0B7A53] mt-0.5 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-[#BE123C] mt-0.5 shrink-0" />
          )}
          <div className="text-sm">
            <div className="font-semibold">
              {report.valid
                ? `All ${report.checkedCount} telemetry frames verified via ECDSA P-256 & SHA-256 hash chain`
                : `Cryptographic Integrity Failure (${report.failures.length} violation${report.failures.length === 1 ? "" : "s"} detected)`}
            </div>
            <div className="text-xs opacity-85 mt-0.5 font-mono-tabular">
              {browserReport ? "Verified locally in your browser WebCrypto engine" : "Server-verified"} ·{" "}
              {report.durationMs} ms · {report.offlineCount} offline-buffered frames
            </div>
            {!report.valid && report.failures[0] && (
              <div className="text-xs font-mono-tabular mt-1.5 font-semibold">
                {report.failures[0].reason}: {report.failures[0].detail}
              </div>
            )}
          </div>
        </div>
        <Link
          href={`/verify/${bundle.consignment.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white/80 hover:bg-white text-[#0E1B14] shrink-0"
        >
          Public QR Passport
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Chart + QR Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 instrument-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0E1B14]">
              Cold-Chain Telemetry &amp; Offline Recovery Timeline
            </h2>
            <span className="font-mono-tabular text-xs text-[#586E61]">
              {bundle.device.id} · {bundle.device.firmwareVersion}
            </span>
          </div>
          <TelemetryChart
            frames={bundle.frames}
            tempMinC={bundle.consignment.tempMinC}
            tempMaxC={bundle.consignment.tempMaxC}
            ethyleneMaxPpm={bundle.consignment.ethyleneMaxPpm}
          />
        </div>

        <div className="lg:col-span-4 instrument-card p-6 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#0E1B14]">
              Consignment QR Witness
            </h2>
            <p className="text-xs text-[#586E61]">
              Buyers and inspectors scan this label to verify ECDSA signatures directly on mobile.
            </p>
          </div>
          <div className="flex justify-center py-2">
            <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#D8E0D5]">
              <QRCodeSVG value={passportUrl} size={156} fgColor="#0E1B14" />
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#586E61]">Ledger Mode</span>
              <span className="font-mono-tabular font-semibold text-[#0E1B14]">
                {bundle.anchors[0]?.networkMode ?? "verifiable-local"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#586E61]">Merkle Checkpoints</span>
              <span className="font-mono-tabular font-semibold text-[#0E1B14]">
                {bundle.anchors.length} anchored
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live GS1 EPCIS 2.0 JSON-LD Preview Panel */}
      <div className="instrument-card overflow-hidden">
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#0E1B14]">
              GS1 EPCIS 2.0 JSON-LD Payload Preview
            </h2>
            <p className="text-xs text-[#586E61]">
              Inspect the exact standards-compliant <span className="font-mono-tabular">sensorElementList</span> exported for global customs &amp; buyers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowEpcisPreview((v) => !v)}
            className="px-3.5 py-2 rounded-xl bg-[#ECEFE9] hover:bg-[#DFE5DC] text-xs font-semibold text-[#0E1B14] transition-colors self-start sm:self-auto"
          >
            {showEpcisPreview ? "Hide JSON-LD" : "Inspect EPCIS 2.0 JSON-LD"}
          </button>
        </div>
        {showEpcisPreview && (
          <div className="border-t border-[#D8E0D5] bg-[#0B1D16] text-[#E6F5EE] p-5 overflow-x-auto">
            <pre className="font-mono-tabular text-xs leading-relaxed">
              {JSON.stringify(buildEpcisDocument(bundle), null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Signed Frame Table */}
      <div className="instrument-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D8E0D5] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0E1B14]">
            Signed Telemetry Hash-Chain
          </h2>
          <span className="text-xs text-[#586E61]">
            Click any hash to copy full 256-bit digest
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D8E0D5] bg-[#F6F7F4] text-xs font-semibold text-[#586E61]">
                <th className="py-3 px-5">Seq</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Temp / RH / C₂H₄</th>
                <th className="py-3 px-4">Sync Mode</th>
                <th className="py-3 px-4">Prev Hash → Frame Hash</th>
                <th className="py-3 px-5">Ledger TX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0D5] text-xs">
              {bundle.frames.map((f) => {
                const failed = report.failures.some((fail) => fail.seq === f.seq);
                return (
                  <tr
                    key={f.seq}
                    className={failed ? "bg-[#FFE4E6]/60" : "hover:bg-[#F6F7F4]/70"}
                  >
                    <td className="py-3 px-5 font-mono-tabular font-bold text-[#0E1B14]">
                      #{f.seq}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-[#3B4F43]">
                      {new Date(f.timestampIso).toISOString().replace("T", " ").slice(0, 16)} UTC
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-[#0E1B14]">
                      {f.tempC.toFixed(1)}°C · {f.humidityRh.toFixed(1)}% ·{" "}
                      {f.ethylenePpm.toFixed(2)} ppm
                    </td>
                    <td className="py-3 px-4">
                      {f.offlineBuffered ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] font-semibold">
                          <WifiOff className="w-3 h-3" />
                          Offline Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E6F5EE] text-[#0B7A53] font-semibold">
                          Live MQTT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <HashChip value={f.prevHash} chars={8} />
                        <span className="text-[#586E61]">→</span>
                        <HashChip value={f.frameHash} chars={8} />
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono-tabular font-semibold text-[#0D4F36]">
                      {f.ledgerAnchorId ?? "Pending"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
