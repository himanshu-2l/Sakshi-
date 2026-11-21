"use client";

import { useState } from "react";
import { BatteryCharging, Sun } from "lucide-react";

export function PowerBudgetCalculator() {
  const [sampleIntervalMin, setSampleIntervalMin] = useState(15);
  const [syncIntervalMin, setSyncIntervalMin] = useState(60);
  const [sunHoursPerDay, setSunHoursPerDay] = useState(4.5);

  // Realistic Sakshi Hub component currents (mA)
  const tiaQuiescentMa = 0.001; // <1 uA ultra-low-Iq op-amp for ME3-C2H4 continuous bias
  const deepSleepMa = 0.045; // ESP32-C3 + ATECC608B + RV-3028 + NOR sleep
  const sampleBurstMa = 32; // 0.3s wake to sample SHT40 + ADC + ATECC608B sign
  const lteBurstMa = 185; // 4.5s EC200U MQTT+TLS publish burst

  const samplesPerHour = 60 / sampleIntervalMin;
  const syncsPerHour = 60 / syncIntervalMin;

  const sampleDuty = (samplesPerHour * 0.3) / 3600;
  const syncDuty = (syncsPerHour * 4.5) / 3600;

  const avgCurrentMa =
    tiaQuiescentMa +
    deepSleepMa +
    sampleBurstMa * sampleDuty +
    lteBurstMa * syncDuty;

  const dailyConsumptionMah = avgCurrentMa * 24;
  // 0.5W 5V compact solar panel through BQ25570 (~82% MPPT efficiency) -> ~65 mA avg in good sun
  const dailySolarHarvestMah = sunHoursPerDay * 65 * 0.82;
  const netBalanceMah = dailySolarHarvestMah - dailyConsumptionMah;
  const ltoCapacityMah = 1200; // 1200 mAh cold-safe LTO buffer
  const darkAutonomyDays = ltoCapacityMah / dailyConsumptionMah;

  return (
    <div className="instrument-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0E1B14]">
            Interactive Solar &amp; LTO Power Budget Model
          </h2>
          <p className="text-xs text-[#586E61]">
            Models continuous ME3-C2H4 TIA biasing (&lt;1 µA), ESP32-C3 deep sleep,
            EC200U LTE bursts, and BQ25570 MPPT solar harvesting.
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
            netBalanceMah >= 0
              ? "bg-[#E6F5EE] text-[#0B7A53]"
              : "bg-[#FEF3C7] text-[#B45309]"
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          {netBalanceMah >= 0 ? "Energy-Positive" : "Net Discharge"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#3B4F43] font-medium">Sampling Interval</span>
            <span className="font-mono-tabular font-bold">{sampleIntervalMin} min</span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={sampleIntervalMin}
            onChange={(e) => setSampleIntervalMin(Number(e.target.value))}
            className="w-full accent-[#0D4F36]"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#3B4F43] font-medium">LTE Sync Interval</span>
            <span className="font-mono-tabular font-bold">{syncIntervalMin} min</span>
          </div>
          <input
            type="range"
            min={15}
            max={240}
            step={15}
            value={syncIntervalMin}
            onChange={(e) => setSyncIntervalMin(Number(e.target.value))}
            className="w-full accent-[#0D4F36]"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#3B4F43] font-medium">Effective Sunlight</span>
            <span className="font-mono-tabular font-bold">{sunHoursPerDay.toFixed(1)} hrs/day</span>
          </div>
          <input
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={sunHoursPerDay}
            onChange={(e) => setSunHoursPerDay(Number(e.target.value))}
            className="w-full accent-[#0D4F36]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4">
          <div className="text-xs text-[#586E61]">Avg System Draw</div>
          <div className="font-mono-tabular text-xl font-bold text-[#0E1B14] mt-1">
            {avgCurrentMa.toFixed(2)} mA
          </div>
        </div>
        <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4">
          <div className="text-xs text-[#586E61]">Daily Load</div>
          <div className="font-mono-tabular text-xl font-bold text-[#0E1B14] mt-1">
            {dailyConsumptionMah.toFixed(1)} mAh
          </div>
        </div>
        <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4">
          <div className="text-xs text-[#586E61]">Solar Harvest</div>
          <div className="font-mono-tabular text-xl font-bold text-[#0B7A53] mt-1">
            {dailySolarHarvestMah.toFixed(1)} mAh
          </div>
        </div>
        <div className="rounded-xl bg-[#F6F7F4] border border-[#D8E0D5] p-4">
          <div className="text-xs text-[#586E61] flex items-center gap-1">
            <BatteryCharging className="w-3.5 h-3.5 text-[#0369A1]" />
            Zero-Sun Autonomy
          </div>
          <div className="font-mono-tabular text-xl font-bold text-[#0369A1] mt-1">
            {darkAutonomyDays.toFixed(0)} days
          </div>
        </div>
      </div>
    </div>
  );
}
