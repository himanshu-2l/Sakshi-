import Link from "next/link";
import {
  ArrowUpRight,
  BatteryCharging,
  Download,
  QrCode,
  Radio,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { listConsignmentBundles } from "@/lib/ledger";
import { CryptoStatusBadge } from "@/components/CryptoStatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const bundles = await listConsignmentBundles();

  const totalFrames = bundles.reduce((acc, b) => acc + b.frames.length, 0);
  const totalOfflineRecovered = bundles.reduce(
    (acc, b) => acc + b.verification.offlineCount,
    0
  );
  const activeAlerts = bundles.filter(
    (b) => !b.verification.valid || b.consignment.status !== "in_transit" && b.consignment.status !== "delivered"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0E1B14]">
            Fleet &amp; Cold-Chain Command Center
          </h1>
          <p className="text-sm text-[#586E61] mt-1">
            Live cryptographic verification across active Sakshi Hubs and FPO export consignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/simulator"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D4F36] text-white text-sm font-semibold hover:bg-[#093B28] transition-colors"
          >
            Simulate Field Event
          </Link>
        </div>
      </div>

      {/* Operational Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="instrument-card p-5">
          <div className="text-xs font-medium text-[#586E61]">Active Sakshi Hubs</div>
          <div className="font-mono-tabular text-2xl font-bold text-[#0E1B14] mt-1">
            {bundles.length}
          </div>
          <div className="text-xs text-[#0B7A53] mt-1 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" />
            {bundles.reduce((a, b) => a + b.device.bleTagsCount, 0)} paired BLE crate tags
          </div>
        </div>

        <div className="instrument-card p-5">
          <div className="text-xs font-medium text-[#586E61]">ECDSA-Signed Frames</div>
          <div className="font-mono-tabular text-2xl font-bold text-[#0E1B14] mt-1">
            {totalFrames}
          </div>
          <div className="text-xs text-[#0B7A53] mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% P-256 hash-chained
          </div>
        </div>

        <div className="instrument-card p-5">
          <div className="text-xs font-medium text-[#586E61]">Offline Blackout Recovery</div>
          <div className="font-mono-tabular text-2xl font-bold text-[#0369A1] mt-1">
            {totalOfflineRecovered}
          </div>
          <div className="text-xs text-[#586E61] mt-1 flex items-center gap-1">
            <WifiOff className="w-3.5 h-3.5 text-[#0369A1]" />
            Buffered &amp; synced zero-loss
          </div>
        </div>

        <div className="instrument-card p-5">
          <div className="text-xs font-medium text-[#586E61]">Excursion / Tamper Alerts</div>
          <div
            className={`font-mono-tabular text-2xl font-bold mt-1 ${
              activeAlerts > 0 ? "text-[#B45309]" : "text-[#0B7A53]"
            }`}
          >
            {activeAlerts}
          </div>
          <div className="text-xs text-[#586E61] mt-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-[#B45309]" />
            Signed at edge before upload
          </div>
        </div>
      </div>

      {/* Consignments Table */}
      <div className="instrument-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D8E0D5] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0E1B14]">
            Monitored Consignments
          </h2>
          <span className="text-xs text-[#586E61] font-mono-tabular">
            {bundles.length} active lots
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D8E0D5] bg-[#F6F7F4] text-xs font-semibold text-[#586E61]">
                <th className="py-3 px-6">Lot &amp; Commodity</th>
                <th className="py-3 px-4">Hub / Power</th>
                <th className="py-3 px-4">Temp (°C)</th>
                <th className="py-3 px-4">Humidity</th>
                <th className="py-3 px-4">Ethylene (ppm)</th>
                <th className="py-3 px-4">Cryptographic Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0D5] text-sm">
              {bundles.map((b) => {
                const latest = b.frames[b.frames.length - 1];
                const tempBreach =
                  latest &&
                  (latest.tempC > b.consignment.tempMaxC ||
                    latest.tempC < b.consignment.tempMinC);
                const ethBreach =
                  latest && latest.ethylenePpm > b.consignment.ethyleneMaxPpm;

                return (
                  <tr key={b.consignment.id} className="hover:bg-[#F6F7F4]/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#0E1B14]">
                        {b.consignment.commodity}
                      </div>
                      <div className="text-xs text-[#586E61] mt-0.5">
                        {b.consignment.originFarm}
                      </div>
                      <div className="font-mono-tabular text-[11px] text-[#3B4F43] mt-1">
                        {b.consignment.id} · {b.consignment.tlc}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-mono-tabular text-xs font-semibold text-[#0E1B14]">
                        {b.device.id}
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs text-[#586E61] mt-1 font-mono-tabular">
                        <BatteryCharging className="w-3.5 h-3.5 text-[#0B7A53]" />
                        {b.device.batteryPct}% {b.device.solarActive ? "· Solar" : "· LTO"}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono-tabular">
                      <span
                        className={`font-semibold ${
                          tempBreach ? "text-[#BE123C]" : "text-[#0E1B14]"
                        }`}
                      >
                        {latest ? `${latest.tempC.toFixed(1)}°C` : "—"}
                      </span>
                      <div className="text-[11px] text-[#586E61]">
                        {b.consignment.tempMinC}–{b.consignment.tempMaxC}°C
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono-tabular text-[#0E1B14]">
                      {latest ? `${latest.humidityRh.toFixed(1)}%` : "—"}
                    </td>

                    <td className="py-4 px-4 font-mono-tabular">
                      <span
                        className={`font-semibold ${
                          ethBreach ? "text-[#B45309]" : "text-[#0E1B14]"
                        }`}
                      >
                        {latest ? latest.ethylenePpm.toFixed(2) : "—"}
                      </span>
                      <div className="text-[11px] text-[#586E61]">
                        max {b.consignment.ethyleneMaxPpm}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <CryptoStatusBadge
                        valid={b.verification.valid}
                        offlineCount={b.verification.offlineCount}
                        tamperAlert={b.consignment.status === "tamper_alert"}
                        excursionAlert={b.consignment.status === "excursion_alert"}
                      />
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/consignments/${b.consignment.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ECEFE9] hover:bg-[#DFE5DC] text-[#0E1B14] text-xs font-semibold transition-colors"
                        >
                          Proof
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/verify/${b.consignment.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D8E0D5] hover:bg-[#F6F7F4] text-[#0D4F36] text-xs font-semibold transition-colors"
                          title="Open Mobile QR Passport"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </Link>
                        <a
                          href={`/api/consignments/${b.consignment.id}/export?format=epcis`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D8E0D5] hover:bg-[#F6F7F4] text-[#3B4F43] text-xs font-semibold transition-colors"
                          title="Download GS1 EPCIS 2.0 JSON-LD"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
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
