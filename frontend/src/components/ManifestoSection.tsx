"use client";

import { motion } from "framer-motion";

export function ManifestoSection() {
  const title =
    "Static fees were built for a market that no longer exists. Pegasus listens.";
  const words = title.split(" ");

  return (
    <section className="min-h-screen flex items-center px-6 md:px-12 py-32 relative">
      <div className="max-w-5xl w-full">
        <motion.p
          className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          03 / 07 · MANIFESTO
        </motion.p>

        <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light leading-tight mb-12">
          {words.map((word, i) => (
            <span key={i} className="inline-block overflow-hidden mr-[0.3em]">
              <motion.span
                className="inline-block"
                initial={{ y: "100%" }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h2>

        <motion.p
          className="text-white/60 font-sans text-base md:text-lg max-w-2xl leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Markets breathe. Volatility rises. MEV bots strike in coordinated
          waves. A fixed 0.3% fee is a relic, too high in calm, too low in
          chaos. Pegasus is a Uniswap V4 Hook that reads three on-chain signals
          and tunes the fee on every single swap.
        </motion.p>

        <motion.p
          className="text-white/60 font-sans text-base md:text-lg max-w-2xl leading-relaxed mt-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Liquidity providers earn more when it matters. Traders pay less when
          it should be cheap. The pool defends itself.
        </motion.p>
      </div>

      <div className="hidden md:block absolute right-12 top-1/2 -translate-y-1/2">
        <p
          className="font-sans text-[10px] tracking-ultrawide uppercase text-purple-glow whitespace-nowrap"
          style={{ writingMode: "vertical-rl" }}
        >
          ADAPTIVE FEE ENGINE
        </p>
      </div>
    </section>
  );
}
