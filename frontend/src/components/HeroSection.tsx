"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Bioluminescent purple orb */}
      <div className="absolute inset-0 flex items-center justify-center z-[1]">
        <div
          className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bioluminescent-pulse bg-purple-deep/5"
          style={{ filter: "blur(120px)" }}
        />
      </div>

      {/* Pegasus image — centered behind text */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-[2] pointer-events-none px-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.25, scale: 1 }}
        transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Image
          src="/pegasus.png"
          alt=""
          width={700}
          height={700}
          className="object-contain w-[80vw] max-w-[700px] h-auto"
          priority
          aria-hidden="true"
        />
      </motion.div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-pegasus-dark via-transparent to-pegasus-dark/40 z-[2]" />

      {/* Top-left label */}
      <div className="absolute top-20 md:top-24 left-4 sm:left-6 md:left-12 z-10">
        <p className="font-sans text-[9px] md:text-[10px] tracking-ultrawide uppercase text-white/40">
          001 / ADAPTIVE FEE ENGINE
        </p>
      </div>

      {/* Section counter top-right */}
      <div className="absolute top-20 md:top-24 right-4 sm:right-6 md:right-12 z-10">
        <p className="font-sans text-[9px] md:text-[10px] tracking-ultrawide uppercase text-white/40">
          01 / 07
        </p>
      </div>

      {/* Main heading */}
      <div className="text-center z-10 px-4 sm:px-6">
        <div className="overflow-hidden">
          <motion.h1
            className="font-serif text-hero font-light leading-[0.85] tracking-wide uppercase text-glow-purple"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Pegasus
          </motion.h1>
        </div>

        <motion.div
          className="mt-8 md:mt-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="font-serif text-base sm:text-lg md:text-2xl text-white/60 italic font-light leading-relaxed">
            Uniswap gave you the unicorn.
          </p>
          <p className="font-serif text-base sm:text-lg md:text-2xl text-white/90 italic font-light leading-relaxed">
            We gave it wings.
          </p>
        </motion.div>
      </div>

      {/* Bottom-left meta */}
      <div className="absolute bottom-8 md:bottom-12 left-4 sm:left-6 md:left-12 z-10">
        <p className="font-sans text-[9px] md:text-[10px] tracking-ultrawide uppercase text-white/40">
          UNISWAP V4 HOOK
        </p>
        <p className="font-sans text-[9px] md:text-[10px] tracking-ultrawide uppercase text-white/40 mt-1">
          X LAYER · 2026
        </p>
      </div>

      {/* Bottom-right scroll indicator */}
      <div className="absolute bottom-8 md:bottom-12 right-4 sm:right-6 md:right-12 flex flex-col items-center gap-2 z-10">
        <p className="hidden sm:block font-sans text-[9px] md:text-[10px] tracking-ultrawide uppercase text-white/40">
          SCROLL TO DESCEND
        </p>
        <svg
          width="16"
          height="24"
          viewBox="0 0 16 24"
          fill="none"
          className="animate-float-down"
        >
          <path
            d="M8 0v20M1 15l7 7 7-7"
            stroke="currentColor"
            strokeWidth="1"
            className="text-white/40"
          />
        </svg>
      </div>
    </section>
  );
}
