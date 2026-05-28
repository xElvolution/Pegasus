"use client";

import { useEffect, useState } from "react";

interface FeeChartProps {
  currentFee: number;
}

interface DataPoint {
  time: number;
  fee: number;
}

function formatFee(fee: number) {
  return (fee / 10000).toFixed(2) + "%";
}

export function FeeChart({ currentFee }: FeeChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    setData((prev) => {
      const newPoint = { time: Date.now(), fee: currentFee };
      return [...prev.slice(-29), newPoint];
    });
  }, [currentFee]);

  const maxFee = Math.max(...data.map((d) => d.fee), 5000);
  const minFee = Math.min(...data.map((d) => d.fee), 500);
  const range = maxFee - minFee || 1;

  return (
    <div className="relative h-72 w-full">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-6 w-16 flex flex-col justify-between text-[10px] tracking-ultrawide uppercase text-white/30 font-sans pointer-events-none">
        <span>{formatFee(maxFee)}</span>
        <span>{formatFee(Math.round((maxFee + minFee) / 2))}</span>
        <span>{formatFee(minFee)}</span>
      </div>

      {/* Chart area */}
      <div className="ml-16 h-full relative">
        {/* Horizontal grid */}
        {[0, 33, 66, 100].map((pct) => (
          <div
            key={pct}
            className="absolute left-0 right-0 border-t border-white/5"
            style={{ top: `${pct}%` }}
          />
        ))}

        {/* Base fee line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-purple-deep/30 pointer-events-none"
          style={{ top: `${((maxFee - 3000) / range) * 100}%` }}
        >
          <span className="absolute -top-2.5 right-0 font-sans text-[10px] tracking-ultrawide uppercase text-purple-glow/60 bg-pegasus-dark px-2">
            BASE 0.30%
          </span>
        </div>

        {/* SVG line chart */}
        {data.length > 1 && (
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox={`0 0 ${data.length - 1} 100`}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9a65ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#9a65ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <path
              d={
                `M 0 ${100 - ((data[0].fee - minFee) / range) * 100} ` +
                data
                  .slice(1)
                  .map(
                    (d, i) =>
                      `L ${i + 1} ${100 - ((d.fee - minFee) / range) * 100}`
                  )
                  .join(" ") +
                ` L ${data.length - 1} 100 L 0 100 Z`
              }
              fill="url(#areaGradient)"
            />
            {/* Line */}
            <path
              d={
                `M 0 ${100 - ((data[0].fee - minFee) / range) * 100} ` +
                data
                  .slice(1)
                  .map(
                    (d, i) =>
                      `L ${i + 1} ${100 - ((d.fee - minFee) / range) * 100}`
                  )
                  .join(" ")
              }
              fill="none"
              stroke="#9a65ff"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Latest point */}
            <circle
              cx={data.length - 1}
              cy={
                100 - ((data[data.length - 1].fee - minFee) / range) * 100
              }
              r="3"
              fill="#9a65ff"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={data.length - 1}
              cy={
                100 - ((data[data.length - 1].fee - minFee) / range) * 100
              }
              r="6"
              fill="none"
              stroke="#9a65ff"
              strokeWidth="0.5"
              opacity="0.3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      {/* X-axis hint */}
      <div className="absolute left-16 right-0 bottom-0 flex justify-between text-[10px] tracking-ultrawide uppercase text-white/30 font-sans pt-2">
        <span>T-30</span>
        <span>NOW</span>
      </div>
    </div>
  );
}
