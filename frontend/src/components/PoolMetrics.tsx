"use client";

interface PoolMetricsProps {
  metrics: {
    swapCount: number;
    volatility: number;
    consecutiveDirection: number;
    blockSwapCount: number;
  };
  currentFee: number;
}

function formatFee(fee: number) {
  return (fee / 10000).toFixed(2) + "%";
}

export function PoolMetrics({ metrics, currentFee }: PoolMetricsProps) {
  const rows = [
    {
      label: "Total Swaps",
      value: metrics.swapCount.toLocaleString(),
      sub: "Through Pegasus Hook",
    },
    {
      label: "Volatility Index",
      value: `${metrics.volatility} bps`,
      sub: metrics.volatility > 50 ? "Above threshold" : "Below threshold",
      accent: metrics.volatility > 50,
    },
    {
      label: "MEV Signal",
      value: `${metrics.consecutiveDirection} / 3`,
      sub:
        metrics.consecutiveDirection >= 3
          ? "Sandwich detected"
          : "Pattern normal",
      accent: metrics.consecutiveDirection >= 3,
    },
    {
      label: "Block Congestion",
      value: `${metrics.blockSwapCount} swaps`,
      sub: "In current block",
      accent: metrics.blockSwapCount > 3,
    },
    {
      label: "Current Fee",
      value: formatFee(currentFee),
      sub:
        currentFee <= 1000
          ? "Low"
          : currentFee <= 3500
          ? "Base"
          : currentFee <= 6000
          ? "Elevated"
          : "Surge",
      accent: currentFee > 5000,
    },
    {
      label: "vs Static 0.30%",
      value:
        currentFee < 3000
          ? `−${((3000 - currentFee) / 100).toFixed(1)} bps`
          : `+${((currentFee - 3000) / 100).toFixed(1)} bps`,
      sub: currentFee < 3000 ? "Cheaper than static" : "LP premium",
      accent: currentFee >= 3000,
    },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className="border-t border-white/10 py-8 px-4 first:border-t-0 md:border-t md:first:border-t group transition-all duration-300 hover:pl-6"
          style={{
            borderTopColor:
              i < 3 && typeof window !== "undefined" && window.innerWidth >= 768
                ? "transparent"
                : undefined,
          }}
        >
          <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-3">
            {row.label}
          </p>
          <p
            className={`font-serif text-3xl md:text-4xl font-light leading-none mb-3 ${
              row.accent ? "text-purple-glow" : "text-white"
            }`}
          >
            {row.value}
          </p>
          <p className="font-sans text-xs text-white/50">{row.sub}</p>
        </div>
      ))}
    </div>
  );
}
