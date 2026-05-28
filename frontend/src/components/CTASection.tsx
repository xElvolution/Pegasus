"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const cards = [
  {
    href: "/dashboard",
    label: "Dashboard",
    sub: "Real-time fee analytics",
    description:
      "Watch the hook in action. Live volatility, MEV signals, block congestion, fee evolution.",
  },
  {
    href: "https://github.com/",
    label: "Source",
    sub: "Open hook contracts",
    description:
      "PegasusHook.sol, oracle interface, deployment scripts. Audited fee logic, 0.8.26 viaIR.",
  },
];

export function CTASection() {
  return (
    <section className="min-h-screen flex items-center px-6 md:px-12 py-32">
      <div className="w-full max-w-6xl mx-auto">
        <motion.p
          className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          NEXT
        </motion.p>

        <motion.h2
          className="font-serif text-5xl md:text-7xl font-light mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          explore
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <Link href={card.href} className="block group">
                <div className="relative overflow-hidden rounded-sm border border-white/10 p-10 md:p-14 transition-all duration-500 group-hover:border-purple-deep/30 bg-gradient-to-br from-purple-deep/5 to-transparent">
                  <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-4">
                    {card.sub}
                  </p>
                  <h3 className="font-serif text-3xl md:text-5xl font-light uppercase transition-transform duration-500 group-hover:scale-105 origin-left mb-6">
                    {card.label}
                  </h3>
                  <p className="font-sans text-sm text-white/50 max-w-md leading-relaxed">
                    {card.description}
                  </p>
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-purple-glow"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
