"use client";

import type { StoredTelemetryFrame } from "@/lib/types";

interface TelemetryChartProps {
  frames: StoredTelemetryFrame[];
  tempMinC: number;
  tempMaxC: number;
  ethyleneMaxPpm: number;
}

export function TelemetryChart({
  frames,
  tempMinC,
  tempMaxC,
  ethyleneMaxPpm,
}: TelemetryChartProps) {
  if (frames.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-[#586E61]">
        No telemetry frames recorded yet.
      </div>
    );
  }

  const width = 760;
  const height = 250;
  const padL = 46;
  const padR = 20;
  const padT = 20;
  const padB = 34;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const temps = frames.map((f) => f.tempC);
  const minVal = Math.min(tempMinC - 1, ...temps);
  const maxVal = Math.max(tempMaxC + 2, ...temps);
  const range = Math.max(1, maxVal - minVal);

  const xFor = (idx: number) =>
    frames.length === 1
      ? padL + plotW / 2
      : padL + (idx / (frames.length - 1)) * plotW;

  const yForTemp = (t: number) =>
    padT + plotH - ((t - minVal) / range) * plotH;

  const yMaxLine = yForTemp(tempMaxC);
  const yMinLine = yForTemp(tempMinC);

  const pathD = frames
    .map((f, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yForTemp(f.tempC).toFixed(1)}`)
    .join(" ");

  const ethMax = Math.max(ethyleneMaxPpm * 1.2, ...frames.map((f) => f.ethylenePpm), 1);
  const ethPathD = frames
    .map((f, i) => {
      const yEth = padT + plotH - (f.ethylenePpm / ethMax) * plotH;
      return `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yEth.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-w-[540px]"
        role="img"
        aria-label="Cold-chain temperature and ethylene telemetry chart"
      >
        {/* Safe cold-chain envelope */}
        <rect
          x={padL}
          y={Math.min(yMaxLine, yMinLine)}
          width={plotW}
          height={Math.abs(yMinLine - yMaxLine)}
          fill="#E6F5EE"
          opacity={0.55}
        />

        {/* Offline dropout shaded columns */}
        {frames.map((f, i) => {
          if (!f.offlineBuffered) return null;
          const x = xFor(i);
          const barW = frames.length > 1 ? plotW / (frames.length - 1) : 24;
          return (
            <rect
              key={`off-${f.seq}`}
              x={Math.max(padL, x - barW / 2)}
              y={padT}
              width={Math.min(barW, padL + plotW - Math.max(padL, x - barW / 2))}
              height={plotH}
              fill="#E0F2FE"
              opacity={0.7}
            />
          );
        })}

        {/* Threshold dashed lines */}
        <line
          x1={padL}
          y1={yMaxLine}
          x2={padL + plotW}
          y2={yMaxLine}
          stroke="#B45309"
          strokeDasharray="4 4"
          strokeWidth={1.2}
        />
        <text
          x={padL + 6}
          y={yMaxLine - 5}
          fontSize={10}
          fill="#B45309"
          fontFamily="var(--font-mono)"
        >
          MAX {tempMaxC}°C
        </text>

        <line
          x1={padL}
          y1={yMinLine}
          x2={padL + plotW}
          y2={yMinLine}
          stroke="#0369A1"
          strokeDasharray="4 4"
          strokeWidth={1.2}
        />

        {/* Y-axis ticks */}
        {[minVal, (minVal + maxVal) / 2, maxVal].map((val, idx) => (
          <text
            key={idx}
            x={padL - 8}
            y={yForTemp(val) + 4}
            textAnchor="end"
            fontSize={10}
            fill="#586E61"
            fontFamily="var(--font-mono)"
          >
            {val.toFixed(1)}°
          </text>
        ))}

        {/* Ethylene line */}
        <path
          d={ethPathD}
          fill="none"
          stroke="#D97706"
          strokeWidth={1.75}
          strokeDasharray="3 3"
        />

        {/* Temperature line */}
        <path
          d={pathD}
          fill="none"
          stroke="#0D4F36"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {frames.map((f, i) => {
          const cx = xFor(i);
          const cy = yForTemp(f.tempC);
          const excursion = f.tempC > tempMaxC || f.tempC < tempMinC;
          return (
            <g key={f.seq}>
              <circle
                cx={cx}
                cy={cy}
                r={f.offlineBuffered ? 5 : 4}
                fill={excursion ? "#BE123C" : f.offlineBuffered ? "#0369A1" : "#0D4F36"}
                stroke="#FFFFFF"
                strokeWidth={1.5}
              />
              {(i === 0 || i === frames.length - 1 || i % 3 === 0) && (
                <text
                  x={cx}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#586E61"
                  fontFamily="var(--font-mono)"
                >
                  #{f.seq}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-5 mt-3 text-xs text-[#3B4F43]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#0D4F36] inline-block" />
          Temperature (°C)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-[#D97706] inline-block" />
          Ethylene C₂H₄ (ppm)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#E0F2FE] border border-[#0369A1]/40 inline-block" />
          Offline Cellular Dropout (Locally Signed)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#E6F5EE] border border-[#0B7A53]/30 inline-block" />
          Safe Thermal Band
        </span>
      </div>
    </div>
  );
}
