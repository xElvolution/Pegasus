"use client";

import { motion } from "framer-motion";

const signals = [
  {
    range: "0 – 50 bps",
    name: "Volatility Engine",
    description:
      "Rolling 10-swap window. Price shift over threshold scales the fee upward to capture risk.",
    formula: "shift > 50bp → fee × (1 + shift/50)",
  },
  {
    range: "≥ 3 / block",
    name: "MEV Shield",
    description:
      "Counts consecutive same-direction swaps in a block. Surges +50 bps once the sandwich pattern hits.",
    formula: "consecutive ≥ 3 → fee + 0.5%",
  },
  {
    range: "> 3 / block",
    name: "Volume Spike",
    description:
      "Multiple swaps in one block signal demand. Pegasus raises the fee to capture the premium.",
    formula: "block_swaps > 3 → fee × 1.2",
  },
  {
    range: "External",
    name: "AI Oracle",
    description:
      "Off-chain analytics engine can override fee per pool with a signed update for regime shifts.",
    formula: "oracle.setFee(pool, fee, active)",
  },
];

export function SignalsSection() {
  return (
    <section
      id="signals"
      className="min-h-screen flex items-center px-6 md:px-12 py-32"
    >
      <div className="w-full max-w-5xl mx-auto">
        <motion.p
          className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          05 / 07 · SIGNAL INDEX
        </motion.p>

        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="font-sans text-xs tracking-ultrawide uppercase text-white/40 mb-2">
            adaptive
          </p>
          <h2 className="font-serif text-5xl md:text-7xl font-light">
            signals
          </h2>
        </motion.div>

        <div className="space-y-0">
          {signals.map((s, i) => (
            <motion.div
              key={s.name}
              className="group cursor-default border-t border-white/10 py-8 transition-all duration-300 hover:pl-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 md:w-28 shrink-0">
                  {s.range}
                </p>

                <h3 className="font-serif text-2xl md:text-3xl font-light flex-1">
                  {s.name}
                </h3>

                <p className="font-sans text-sm text-white/50 md:max-w-xs">
                  {s.description}
                </p>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-4 md:pl-32">
                <p className="font-mono text-[11px] text-purple-glow/60">
                  {s.formula}
                </p>
              </div>

              <motion.div
                className="h-[1px] mt-8 bg-purple-deep origin-left"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 + 0.3 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
