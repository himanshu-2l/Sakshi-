"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  ShieldAlert,
  Thermometer,
  WifiOff,
} from "lucide-react";
import { verifyHashChain } from "@/lib/crypto";
import type { ChainVerificationReport, ConsignmentBundle } from "@/lib/types";
import { HashChip } from "./HashChip";

export function QrPassportClient({ bundle }: { bundle: ConsignmentBundle }) {
  const [clientReport, setClientReport] = useState<ChainVerificationReport | null>(
    null
  );
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    let active = true;
    verifyHashChain(bundle.frames, bundle.device.publicKeyJwk).then((res) => {
      if (active) setClientReport(res);
    });
    return () => {
      active = false;
    };
  }, [bundle]);

  const report = clientReport ?? bundle.verification;
  const temps = bundle.frames.map((f) => f.tempC);
  const minTemp = temps.length ? Math.min(...temps).toFixed(1) : "—";
  const maxTemp = temps.length ? Math.max(...temps).toFixed(1) : "—";
  const peakEth = bundle.frames.length
    ? Math.max(...bundle.frames.map((f) => f.ethylenePpm)).toFixed(2)
    : "—";

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Instant Cryptographic Verdict */}
      <div
        className={`rounded-2xl p-6 border ${
          report.valid
            ? "bg-[#E6F5EE] border-[#0B7A53]/30"
            : "bg-[#FFE4E6] border-[#BE123C]/40"
        }`}
      >
        <div className="flex items-start gap-3.5">
          {report.valid ? (
            <CheckCircle2 className="w-7 h-7 text-[#0B7A53] shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-7 h-7 text-[#BE123C] shrink-0 mt-0.5" />
          )}
          <div>
            <h1 className="text-xl font-bold text-[#0E1B14]">
              {report.valid
                ? "Authentic Cold-Chain Witness"
                : "Tampered or Broken Chain Detected"}
            </h1>
            <p className="text-sm text-[#3B4F43] mt-1">
              {clientReport
                ? `Verified directly in your browser (${clientReport.checkedCount} ECDSA P-256 signatures in ${clientReport.durationMs} ms).`
                : "Verifying hardware signatures…"}
            </p>
          </div>
        </div>
      </div>

      {/* Consignment Summary */}
      <div className="instrument-card p-6 space-y-4">
        <div>
          <div className="font-mono-tabular text-xs font-semibold text-[#586E61]">
            {bundle.consignment.tlc} · {bundle.device.id}
          </div>
          <h2 className="text-2xl font-bold text-[#0E1B14] mt-1">
            {bundle.consignment.commodity}
          </h2>
          <p className="text-sm text-[#3B4F43]">{bundle.consignment.variety}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-xl bg-[#F6F7F4] p-3 border border-[#D8E0D5]">
            <div className="text-[11px] text-[#586E61] flex items-center gap-1">
              <Thermometer className="w-3 h-3" />
              Range
            </div>
            <div className="font-mono-tabular text-sm font-bold text-[#0E1B14] mt-1">
              {minTemp}°–{maxTemp}°C
            </div>
          </div>

          <div className="rounded-xl bg-[#F6F7F4] p-3 border border-[#D8E0D5]">
            <div className="text-[11px] text-[#586E61]">Peak C₂H₄</div>
            <div className="font-mono-tabular text-sm font-bold text-[#0E1B14] mt-1">
              {peakEth} ppm
            </div>
          </div>

          <div className="rounded-xl bg-[#F6F7F4] p-3 border border-[#D8E0D5]">
            <div className="text-[11px] text-[#586E61] flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-[#0369A1]" />
              Offline Sync
            </div>
            <div className="font-mono-tabular text-sm font-bold text-[#0369A1] mt-1">
              {report.offlineCount} frames
            </div>
          </div>
        </div>
      </div>

      {/* Farm-to-Fork Custody Timeline */}
      <div className="instrument-card p-6 space-y-4">
        <h3 className="text-base font-bold text-[#0E1B14]">
          Farm-to-Fork Custody Journey
        </h3>
        <div className="space-y-4">
          {bundle.custodyEvents.map((ev, idx) => (
            <div key={ev.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="w-6 h-6 rounded-full bg-[#0D4F36] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                {idx < bundle.custodyEvents.length - 1 && (
                  <span className="w-px flex-1 bg-[#D8E0D5] my-1" />
                )}
              </div>
              <div className="pb-2">
                <div className="text-sm font-semibold text-[#0E1B14] capitalize">
                  {ev.bizStep} · {ev.actor}
                </div>
                <div className="text-xs text-[#586E61] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {ev.locationName}
                </div>
                <p className="text-xs text-[#3B4F43] mt-1">{ev.notes}</p>
                <div className="font-mono-tabular text-[11px] text-[#586E61] mt-1">
                  {new Date(ev.timestampIso).toISOString().replace("T", " ").slice(0, 16)} UTC
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable Cryptographic Proof */}
      <div className="instrument-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTechnical((v) => !v)}
          className="w-full px-6 py-4 flex items-center justify-between text-sm font-semibold text-[#0E1B14] hover:bg-[#F6F7F4]"
        >
          <span>Technical Cryptographic &amp; Ledger Proof</span>
          {showTechnical ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {showTechnical && (
          <div className="px-6 pb-5 pt-2 border-t border-[#D8E0D5] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#586E61]">Latest Anchor TX</span>
              <span className="font-mono-tabular font-semibold text-[#0D4F36]">
                {bundle.anchors[bundle.anchors.length - 1]?.txId ?? "—"}
              </span>
            </div>
            {bundle.anchors[bundle.anchors.length - 1] && (
              <div className="flex items-center justify-between">
                <span className="text-[#586E61]">Merkle Root</span>
                <HashChip
                  value={bundle.anchors[bundle.anchors.length - 1].merkleRoot}
                  chars={14}
                />
              </div>
            )}
            <div className="pt-2">
              <Link
                href={`/consignments/${bundle.consignment.id}`}
                className="text-[#0D4F36] font-semibold hover:underline"
              >
                Open Full Proof Inspector &amp; EPCIS 2.0 Export →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
