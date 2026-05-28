"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Min Fee", value: "0.01%" },
  { label: "Max Fee", value: "1.00%" },
  { label: "Base Fee", value: "0.30%" },
  { label: "Volatility Window", value: "10 swaps" },
  { label: "MEV Threshold", value: "3 directional" },
  { label: "Gas Overhead", value: "< 50k" },
];

export function MetricsCard() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 md:px-12 py-32">
      <div className="w-full max-w-4xl">
        <motion.p
          className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          02 / 07 · HOOK PARAMETERS
        </motion.p>

        <motion.div
          className="border border-purple-deep/30 box-glow-purple rounded-sm p-8 md:p-12 bg-pegasus-dark/80"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-serif text-3xl md:text-5xl font-light tracking-wide mb-10 text-purple-glow">
            The Hook
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                  {stat.label}
                </p>
                <p className="font-serif text-lg md:text-xl font-light">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
