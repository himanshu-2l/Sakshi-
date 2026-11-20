import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  Lock,
  QrCode,
  Radio,
  ShieldCheck,
  Sun,
  ThermometerSnowflake,
  WifiOff,
} from "lucide-react";
import { listConsignmentBundles } from "@/lib/ledger";
import { CryptoStatusBadge } from "@/components/CryptoStatusBadge";
import { HashChip } from "@/components/HashChip";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const bundles = await listConsignmentBundles();
  const primary = bundles[0];
  const latestFrame = primary?.frames[primary.frames.length - 1];
  const latestAnchor = primary?.anchors[primary.anchors.length - 1];

  return (
    <div className="space-y-20">
      {/* Hero Section — Clean Editorial + Live Signed Instrument Witness */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-[#0E1B14] leading-[1.06] text-balance">
              Every consignment carries its own witness.
            </h1>

            <p className="text-lg text-[#3B4F43] max-w-[62ch] leading-relaxed">
              Sakshi is an offline-first IoT cold-chain node that signs temperature,
              humidity, and ethylene gas at the sensor using hardware{" "}
              <span className="font-mono-tabular text-[#0E1B14] font-medium">
                ECDSA P-256
              </span>{" "}
              cryptography—surviving rural cellular blackouts and anchoring
              tamper-evident GS1 EPCIS 2.0 records to a permissioned ledger.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/simulator"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0D4F36] text-white font-semibold text-sm hover:bg-[#093B28] active:scale-[0.98] transition-all"
              >
                Test Offline Sync &amp; Tamper Lab
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FFFFFF] border border-[#D8E0D5] text-[#0E1B14] font-semibold text-sm hover:bg-[#ECEFE9] transition-colors"
              >
                Open Fleet Command Center
              </Link>
              <Link
                href="/verify/LOT-IND-2026-001"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-[#0D4F36] font-semibold text-sm hover:bg-[#ECEFE9] transition-colors"
              >
                <QrCode className="w-4 h-4" />
                Scan #SAK-001 Passport
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#586E61]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B7A53]" />
                Real WebCrypto ECDSA P-256
              </span>
              <span className="inline-flex items-center gap-1.5">
                <WifiOff className="w-4 h-4 text-[#0369A1]" />
                16 MB SPI NOR Offline Ring Buffer
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#0D4F36]" />
                GS1 EPCIS 2.0 + FDA FSMA 204
              </span>
            </div>
          </div>

          {/* Live Signed Witness Instrument Card */}
          {primary && latestFrame && (
            <div className="lg:col-span-5">
              <div className="instrument-card p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono-tabular text-xs font-semibold text-[#586E61]">
                      {primary.device.id} · {primary.consignment.tlc}
                    </div>
                    <h2 className="text-lg font-bold text-[#0E1B14] mt-0.5">
                      {primary.consignment.commodity} — {primary.consignment.variety.split(" (")[0]}
                    </h2>
                  </div>
                  <CryptoStatusBadge
                    valid={primary.verification.valid}
                    offlineCount={primary.verification.offlineCount}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-3">
                    <div className="text-[11px] font-medium text-[#586E61]">
                      Temperature
                    </div>
                    <div className="font-mono-tabular text-xl font-bold text-[#0E1B14] mt-1">
                      {latestFrame.tempC.toFixed(1)}°C
                    </div>
                    <div className="text-[11px] text-[#0B7A53] mt-0.5">
                      Target {primary.consignment.tempMinC}–{primary.consignment.tempMaxC}°C
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-3">
                    <div className="text-[11px] font-medium text-[#586E61]">
                      Humidity
                    </div>
                    <div className="font-mono-tabular text-xl font-bold text-[#0E1B14] mt-1">
                      {latestFrame.humidityRh.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-[#586E61] mt-0.5">
                      SHT40 ±1.8%
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-3">
                    <div className="text-[11px] font-medium text-[#586E61]">
                      Ethylene C₂H₄
                    </div>
                    <div className="font-mono-tabular text-xl font-bold text-[#0E1B14] mt-1">
                      {latestFrame.ethylenePpm.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-[#586E61] mt-0.5">
                      ppm (ME3-C2H4)
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#3B4F43]">
                      Frame #{latestFrame.seq} Hash
                    </span>
                    <HashChip value={latestFrame.frameHash} chars={14} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#3B4F43]">
                      Previous Link
                    </span>
                    <HashChip value={latestFrame.prevHash} chars={14} />
                  </div>
                  {latestAnchor && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#3B4F43]">
                        Ledger Anchor
                      </span>
                      <span className="font-mono-tabular text-xs font-semibold text-[#0D4F36]">
                        {latestAnchor.txId}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-[#586E61]">
                    {primary.verification.checkedCount} signed frames ·{" "}
                    {primary.verification.offlineCount} recovered offline
                  </span>
                  <Link
                    href={`/consignments/${primary.consignment.id}`}
                    className="text-xs font-semibold text-[#0D4F36] hover:underline inline-flex items-center gap-1"
                  >
                    Inspect Proof
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Deep Canopy Dark Band — Trust Starts at the Sensor */}
      <section className="bg-[#0B1D16] text-[#F6F7F4] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Trust starts at the sensor, not at the blockchain.
            </h2>
            <p className="text-[#B8C9BF] text-base sm:text-lg leading-relaxed">
              A blockchain only guarantees that stored records weren&apos;t altered after
              upload. Sakshi closes the physical-to-digital gap by hashing, chaining, and
              signing every sensor reading inside an ATECC608B secure element before it
              ever touches cellular networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="canopy-card p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#16382B] text-[#6EE7B7] flex items-center justify-center">
                <ThermometerSnowflake className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">
                Sense &amp; Compensate
              </h3>
              <p className="text-sm text-[#B8C9BF] leading-relaxed">
                Sensirion SHT40 (±0.2°C) + Winsen ME3-C2H4 ethylene sensor on a continuous{" "}
                <span className="font-mono-tabular text-white">&lt;1 µA</span>{" "}
                transimpedance front-end with live temperature compensation.
              </p>
            </div>

            <div className="canopy-card p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#16382B] text-[#6EE7B7] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">
                Hardware ECDSA P-256
              </h3>
              <p className="text-sm text-[#B8C9BF] leading-relaxed">
                Each frame links to <span className="font-mono-tabular text-white">prevHash</span>,
                increments a monotonic counter, and is signed inside Microchip ATECC608B
                so missing or altered logs are mathematically impossible to hide.
              </p>
            </div>

            <div className="canopy-card p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#16382B] text-[#6EE7B7] flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">
                Sub-Zero Energy Harvest
              </h3>
              <p className="text-sm text-[#B8C9BF] leading-relaxed">
                TI BQ25570 MPPT solar harvester paired with a Lithium Titanate (LTO)
                buffer—safe for charging in sub-zero cold storage where standard Li-ion
                cells degrade.
              </p>
            </div>

            <div className="canopy-card p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#16382B] text-[#6EE7B7] flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">
                Reusable Hub + BLE Tags
              </h3>
              <p className="text-sm text-[#B8C9BF] leading-relaxed">
                One reusable Sakshi Hub shares the expensive ethylene &amp; LTE Cat-1
                hardware across a truck, while low-cost BLE tags monitor individual
                FPO crates.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#1E4233]">
            <div className="flex items-center gap-3 text-sm text-[#B8C9BF]">
              <Cpu className="w-4 h-4 text-[#6EE7B7]" />
              <span>
                Explore full power-budget math, Qty 1 vs Qty 100 BOM economics, and
                ESP32-C3 pinouts.
              </span>
            </div>
            <Link
              href="/research"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6EE7B7] hover:text-white transition-colors"
            >
              Open Engineering &amp; BOM Archive
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Regulatory & Export Readiness Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="instrument-card p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0E1B14]">
              Export-ready compliance in one click.
            </h2>
            <p className="text-[#3B4F43] leading-relaxed">
              Instead of dumping raw sensor streams onto a ledger, Sakshi anchors
              cryptographic Merkle checkpoints and exports standards-compliant traceability
              documents for global importers and Indian regulators.
            </p>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4 space-y-1">
              <div className="font-semibold text-sm text-[#0E1B14]">
                GS1 EPCIS 2.0 JSON-LD
              </div>
              <p className="text-xs text-[#586E61] leading-relaxed">
                Structured <span className="font-mono-tabular">ObjectEvent</span> +{" "}
                <span className="font-mono-tabular">sensorElementList</span> (CEL, P1, C₂H₄ ppm).
              </p>
            </div>
            <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4 space-y-1">
              <div className="font-semibold text-sm text-[#0E1B14]">
                FDA FSMA 204
              </div>
              <p className="text-xs text-[#586E61] leading-relaxed">
                24-hour exportable CSV mapping Traceability Lot Codes (TLC) to CTEs &amp; KDEs.
              </p>
            </div>
            <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4 space-y-1">
              <div className="font-semibold text-sm text-[#0E1B14]">
                EU Reg (EC) 178/2002
              </div>
              <p className="text-xs text-[#586E61] leading-relaxed">
                Verified one-step-back / one-step-forward custody chain across FPOs &amp; ports.
              </p>
            </div>
            <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4 space-y-1">
              <div className="font-semibold text-sm text-[#0E1B14]">
                MeitY NBF / Vishvasya
              </div>
              <p className="text-xs text-[#586E61] leading-relaxed">
                Permissioned Hyperledger Fabric / NBFLite adapter for sovereign audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
