"use client";

import { motion } from "framer-motion";

export function SpotlightSection() {
  return (
    <section className="min-h-screen flex items-center px-6 md:px-12 py-32">
      <div className="w-full max-w-6xl mx-auto">
        <motion.p
          className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          04 / 07 · FEATURED SIGNAL
        </motion.p>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left: name and description */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light uppercase leading-[0.9] mb-4 text-glow-purple">
              MEV Shield
            </h2>
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6">
              CONSECUTIVE_DIRECTIONAL_DETECTOR
            </p>
            <p className="font-sans text-white/60 text-sm md:text-base leading-relaxed max-w-md">
              Sandwich attackers leave a signature: three or more swaps in the
              same direction within a single block. Pegasus counts. When the
              pattern hits, the fee surges by +0.5%, making extraction
              unprofitable before it lands.
            </p>

            <div className="mt-10 flex gap-8">
              <div>
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                  THRESHOLD
                </p>
                <p className="font-serif text-2xl font-light">3</p>
              </div>
              <div>
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                  SURGE
                </p>
                <p className="font-serif text-2xl font-light text-purple-glow">
                  +50 bps
                </p>
              </div>
              <div>
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                  WINDOW
                </p>
                <p className="font-serif text-2xl font-light">1 block</p>
              </div>
            </div>
          </motion.div>

          {/* Right: visualization */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.15 }}
          >
            <div className="relative">
              <motion.div
                className="relative aspect-[4/3] overflow-hidden rounded-sm border border-purple-deep/20"
                initial={{ clipPath: "inset(100% 0 0 0)" }}
                whileInView={{ clipPath: "inset(0% 0 0 0)" }}
                viewport={{ once: true }}
                transition={{
                  duration: 1.2,
                  delay: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {/* Sandwich attack visualization */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-deep/10 via-pegasus-deeper to-pegasus-dark p-10 flex flex-col justify-between">
                  {/* Timeline visualization */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 w-16">
                        BLOCK N
                      </span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {[
                      { dir: "→", label: "Buy", warn: true, fee: "0.30%" },
                      { dir: "→", label: "Buy", warn: true, fee: "0.30%" },
                      { dir: "→", label: "Buy", warn: true, fee: "0.30%" },
                      {
                        dir: "⚠",
                        label: "MEV DETECTED",
                        warn: false,
                        fee: "0.80%",
                        accent: true,
                      },
                    ].map((row, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.8 + i * 0.15 }}
                        className={`flex items-center gap-3 py-1.5 ${
                          row.accent ? "text-purple-glow" : "text-white/70"
                        }`}
                      >
                        <span className="font-mono text-sm w-6">{row.dir}</span>
                        <span className="font-sans text-xs tracking-wider uppercase flex-1">
                          {row.label}
                        </span>
                        <span className="font-mono text-xs">{row.fee}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Bottom result */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 1.6 }}
                    className="border-t border-white/10 pt-4"
                  >
                    <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-1">
                      RESULT
                    </p>
                    <p className="font-serif text-xl font-light text-purple-glow">
                      Sandwich neutralized.
                    </p>
                  </motion.div>
                </div>
              </motion.div>

              <div className="flex items-center justify-between mt-4">
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/30">
                  MEV SHIELD
                </p>
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/20 italic">
                  beforeSwap()
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
