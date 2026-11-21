import { PowerBudgetCalculator } from "@/components/PowerBudgetCalculator";

const BOM_ROWS = [
  {
    part: "ESP32-C3-MINI-1 MCU",
    role: "RISC-V Edge Controller + BLE",
    qty1: "₹311",
    qty100: "₹220",
    note: "Deep sleep ~43 µA",
  },
  {
    part: "Microchip ATECC608B",
    role: "Hardware ECDSA P-256 Root of Trust",
    qty1: "₹84",
    qty100: "₹58",
    note: "Monotonic counters + sealed private key",
  },
  {
    part: "Winsen ME3-C2H4",
    role: "Electrochemical Ethylene Sensor (0–100 ppm)",
    qty1: "₹12,600",
    qty100: "₹10,300",
    note: "Shared 1 per truck/hub; continuous <1 µA TIA",
  },
  {
    part: "Sensirion SHT40",
    role: "Digital Temp (±0.2°C) & Humidity (±1.8% RH)",
    qty1: "₹240",
    qty100: "₹165",
    note: "Also drives ME3-C2H4 temp compensation",
  },
  {
    part: "TI BQ25570 + LTO Cell",
    role: "MPPT Solar Harvester + Sub-Zero Buffer",
    qty1: "₹950",
    qty100: "₹680",
    note: "Safe charging below 0°C in reefers",
  },
  {
    part: "Quectel EC200U + 16MB NOR + RV-3028",
    role: "LTE Cat-1 + Offline Ring Buffer + RTC",
    qty1: "₹1,450",
    qty100: "₹1,080",
    note: "MQTT 5.0 over TLS + HTTPS fallback",
  },
];

const PINOUT_ROWS = [
  { bus: "I2C (SDA=GPIO8, SCL=GPIO9)", targets: "ATECC608B (0x60), SHT40 (0x44), RV-3028 RTC (0x52)" },
  { bus: "SPI (MOSI=7, MISO=2, SCK=6, CS=10)", targets: "W25Q128 16 MB SPI NOR Flash (Offline Ring Buffer)" },
  { bus: "ADC1_CH0 (GPIO0)", targets: "ME3-C2H4 Ultra-Low-Iq Transimpedance Amplifier Output" },
  { bus: "ADC1_CH1 (GPIO1)", targets: "BQ25570 / LTO Cell Voltage Divider" },
  { bus: "UART1 (TX=GPIO21, RX=GPIO20)", targets: "Quectel EC200U LTE Cat-1 AT / MQTT Modem" },
  { bus: "GPIO4 (RTC Wakeup Interrupt)", targets: "Enclosure Reed / Microswitch Tamper Sensor" },
];

export default function ResearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-3xl font-bold text-[#0E1B14]">
          Engineering Validation, Power Budget &amp; BOM Archive
        </h1>
        <p className="text-sm sm:text-base text-[#3B4F43] leading-relaxed">
          Transparent hardware economics, sub-zero LTO battery safety, and field-physics
          design decisions behind the Sakshi cold-chain witness node.
        </p>
      </div>

      <PowerBudgetCalculator />

      {/* BOM & Unit Economics */}
      <div className="instrument-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D8E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#0E1B14]">
            Transparent Prototype &amp; Pilot Bill of Materials (BOM)
          </h2>
          <span className="text-xs text-[#0D4F36] font-semibold">
            Amortized over 50 reusable trips ≈ ₹250 / trip
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#D8E0D5] bg-[#F6F7F4] text-xs font-semibold text-[#586E61]">
                <th className="py-3 px-6">Component</th>
                <th className="py-3 px-4">Subsystem Role</th>
                <th className="py-3 px-4">Qty 1</th>
                <th className="py-3 px-4">Qty 100</th>
                <th className="py-3 px-6">Engineering Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0D5]">
              {BOM_ROWS.map((row) => (
                <tr key={row.part}>
                  <td className="py-3.5 px-6 font-semibold text-[#0E1B14]">{row.part}</td>
                  <td className="py-3.5 px-4 text-[#3B4F43]">{row.role}</td>
                  <td className="py-3.5 px-4 font-mono-tabular">{row.qty1}</td>
                  <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#0D4F36]">
                    {row.qty100}
                  </td>
                  <td className="py-3.5 px-6 text-xs text-[#586E61]">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pinout & Validation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="instrument-card p-6 space-y-4">
          <h2 className="text-base font-bold text-[#0E1B14]">
            ESP32-C3 Hardware Bus &amp; Pinout Map
          </h2>
          <div className="space-y-3">
            {PINOUT_ROWS.map((p) => (
              <div
                key={p.bus}
                className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-3.5"
              >
                <div className="font-mono-tabular text-xs font-bold text-[#0D4F36]">
                  {p.bus}
                </div>
                <div className="text-xs text-[#3B4F43] mt-1">{p.targets}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="instrument-card p-6 space-y-4">
          <h2 className="text-base font-bold text-[#0E1B14]">
            Research-Backed Design Decisions
          </h2>
          <div className="space-y-3 text-sm text-[#3B4F43] leading-relaxed">
            <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4">
              <strong className="text-[#0E1B14]">
                1. Continuous Ethylene Front-End (No Power-Cycling):
              </strong>{" "}
              Electrochemical sensors like ME3-C2H4 require 24–48h stabilization if
              depolarized. Keeping a &lt;1 µA TIA powered continuously solves warm-up
              drift while preserving multi-week autonomy.
            </div>
            <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4">
              <strong className="text-[#0E1B14]">
                2. Sub-Zero Cold-Chain Safety (LTO Buffer):
              </strong>{" "}
              Standard Li-ion batteries suffer permanent lithium plating when charged
              below 0°C. Using LTO + BQ25570 thermistor gating protects reefers operating
              at -2°C to 4°C.
            </div>
            <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4">
              <strong className="text-[#0E1B14]">
                3. EPCIS 2.0 + Merkle Anchors (No Raw Stream Dumping):
              </strong>{" "}
              Only compact Merkle roots and GS1 EPCIS 2.0 ObjectEvents are anchored to
              Hyperledger Fabric / Vishvasya, keeping ledger fees and latency minimal.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
