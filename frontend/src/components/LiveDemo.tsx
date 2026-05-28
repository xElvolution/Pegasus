"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import gsap from "gsap";

interface FeeDataPoint {
  time: number;
  fee: number;
  reason: string;
}

const scenarios = [
  {
    id: "calm",
    label: "Calm Market",
    description: "Low volatility. Fees compress to attract volume.",
    fees: [3000, 2800, 2600, 2400, 2200, 2000, 1800, 1500, 1200, 1000],
    reason: "Low volatility, attracting volume",
  },
  {
    id: "volatile",
    label: "High Volatility",
    description: "Price shifts trigger the volatility engine.",
    fees: [3000, 3500, 4200, 5000, 6000, 7200, 8000, 7500, 6500, 5500],
    reason: "Volatility surge, protecting LPs",
  },
  {
    id: "mev",
    label: "MEV Attack",
    description: "Three buys in one block. Shield raises the fee.",
    fees: [3000, 3000, 3500, 5000, 8000, 10000, 10000, 9000, 7000, 5000],
    reason: "MEV detected, sandwich neutralized",
  },
  {
    id: "normal",
    label: "Normal Trading",
    description: "Stable conditions. Fee hovers near base.",
    fees: [3000, 3100, 2900, 3200, 2800, 3000, 3100, 2700, 3000, 3000],
    reason: "Stable market, base fee",
  },
];

export function LiveDemo() {
  const [currentFee, setCurrentFee] = useState(3000);
  const [feeHistory, setFeeHistory] = useState<FeeDataPoint[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>("calm");
  const feeRef = useRef<HTMLSpanElement>(null);

  const simulate = (id: string) => {
    if (simulating) return;
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) return;

    setSimulating(true);
    setActiveScenario(id);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= scenario.fees.length) {
        setSimulating(false);
        clearInterval(interval);
        return;
      }

      const fee = scenario.fees[i];
      setCurrentFee(fee);
      setFeeHistory((prev) => [
        ...prev.slice(-20),
        { time: Date.now(), fee, reason: scenario.reason },
      ]);

      if (feeRef.current) {
        gsap.fromTo(
          feeRef.current,
          { scale: 1.1, color: "#9a65ff" },
          {
            scale: 1,
            color: "#ffffff",
            duration: 0.5,
            ease: "power3.out",
          }
        );
      }

      i++;
    }, 600);
  };

  const feePct = (currentFee / 10000) * 100;
  const formatFee = (f: number) => (f / 10000).toFixed(2) + "%";

  return (
    <section
      id="demo"
      className="min-h-screen flex items-center px-6 md:px-12 py-32"
    >
      <div className="w-full max-w-6xl mx-auto">
        <motion.p
          className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          07 / 07 · CONCEPTUAL SCENARIOS — FOR LIVE STATE SEE DASHBOARD
        </motion.p>

        <motion.h2
          className="font-serif text-5xl md:text-7xl font-light mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          watch it adapt
        </motion.h2>

        <div className="grid md:grid-cols-12 gap-12">
          {/* Left: Fee Display */}
          <div className="md:col-span-7 border-t border-white/10 pt-12">
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6">
              CURRENT FEE
            </p>

            <div className="flex items-baseline gap-6 mb-12">
              <span
                ref={feeRef}
                className="font-serif text-hero-sm font-light leading-none text-glow-purple"
              >
                {formatFee(currentFee)}
              </span>
              <span className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40">
                {currentFee <= 1000
                  ? "LOW"
                  : currentFee <= 3500
                  ? "BASE"
                  : currentFee <= 6000
                  ? "ELEVATED"
                  : "SURGE"}
              </span>
            </div>

            {/* Fee bar */}
            <div className="relative h-[2px] bg-white/10 mb-2">
              <motion.div
                className="absolute top-0 left-0 h-full bg-purple-glow"
                animate={{ width: `${feePct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ boxShadow: "0 0 8px rgba(154, 101, 255, 0.6)" }}
              />
              <div
                className="absolute top-[-3px] w-[2px] h-[8px] bg-white/30"
                style={{ left: "30%" }}
              />
            </div>
            <div className="flex justify-between text-[10px] tracking-ultrawide uppercase text-white/30 font-sans mb-12">
              <span>0.01%</span>
              <span style={{ marginLeft: "calc(30% - 1rem)" }}>BASE 0.30%</span>
              <span>1.00%</span>
            </div>

            {/* Log */}
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-4">
              FEE LOG
            </p>
            <div className="max-h-48 overflow-y-auto space-y-2 font-mono text-[11px]">
              {feeHistory.length === 0 ? (
                <p className="text-white/30">
                  // Select a scenario below to begin
                </p>
              ) : (
                feeHistory
                  .slice()
                  .reverse()
                  .map((p, i) => (
                    <div
                      key={p.time + "-" + i}
                      className="grid grid-cols-[auto_auto_1fr] gap-4 text-white/50 py-1 border-t border-white/5 first:border-t-0"
                    >
                      <span className="text-white/30">
                        {new Date(p.time).toLocaleTimeString()}
                      </span>
                      <span className="text-purple-glow">
                        {formatFee(p.fee)}
                      </span>
                      <span className="text-white/40">{p.reason}</span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Right: Scenarios */}
          <div className="md:col-span-5 space-y-0">
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6">
              SCENARIOS
            </p>

            {scenarios.map((s, i) => (
              <motion.button
                key={s.id}
                onClick={() => simulate(s.id)}
                disabled={simulating}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`w-full text-left border-t border-white/10 py-6 px-1 transition-all duration-300 hover:pl-4 group disabled:opacity-50 ${
                  activeScenario === s.id && simulating
                    ? "pl-4 text-purple-glow"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-serif text-xl font-light">{s.label}</p>
                  <span className="font-sans text-[10px] tracking-ultrawide uppercase text-white/30">
                    {activeScenario === s.id && simulating ? "RUNNING" : "RUN"}
                  </span>
                </div>
                <p className="font-sans text-xs text-white/50">
                  {s.description}
                </p>
              </motion.button>
            ))}
            <div className="border-t border-white/10" />
          </div>
        </div>
      </div>
    </section>
  );
}
