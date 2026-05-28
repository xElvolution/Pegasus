"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReadContract, useWatchContractEvent, useChainId, useAccount } from "wagmi";
import { Navigation } from "@/components/Navigation";
import { FeeChart } from "@/components/FeeChart";
import { PoolMetrics } from "@/components/PoolMetrics";
import { ConnectWallet } from "@/components/ConnectWallet";
import { CONTRACTS, POOL_KEY, XLAYER_TESTNET } from "@/lib/chains";
import { PEGASUS_HOOK_ABI } from "@/lib/abi";

function formatFee(fee: number) {
  return (fee / 10000).toFixed(2) + "%";
}

function feeLabel(fee: number) {
  if (fee <= 1000) return "LOW";
  if (fee <= 3500) return "BASE";
  if (fee <= 6000) return "ELEVATED";
  return "SURGE";
}

export default function DashboardPage() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const feeRef = useRef<HTMLSpanElement>(null);

  const isHookConfigured =
    CONTRACTS.PEGASUS_HOOK !== "0x0000000000000000000000000000000000000000";
  const wrongNetwork = isConnected && chainId !== XLAYER_TESTNET.id;

  const { data: currentFeeRaw, refetch: refetchFee } = useReadContract({
    address: CONTRACTS.PEGASUS_HOOK,
    abi: PEGASUS_HOOK_ABI,
    functionName: "getCurrentFee",
    args: [POOL_KEY],
    query: { enabled: isHookConfigured, refetchInterval: 5000 },
  });

  const { data: metricsRaw, refetch: refetchMetrics } = useReadContract({
    address: CONTRACTS.PEGASUS_HOOK,
    abi: PEGASUS_HOOK_ABI,
    functionName: "getPoolMetrics",
    args: [POOL_KEY],
    query: { enabled: isHookConfigured, refetchInterval: 5000 },
  });

  useWatchContractEvent({
    address: CONTRACTS.PEGASUS_HOOK,
    abi: PEGASUS_HOOK_ABI,
    eventName: "FeeUpdated",
    enabled: isHookConfigured,
    onLogs: () => {
      refetchFee();
      refetchMetrics();
    },
  });

  useWatchContractEvent({
    address: CONTRACTS.PEGASUS_HOOK,
    abi: PEGASUS_HOOK_ABI,
    eventName: "SwapAnalyzed",
    enabled: isHookConfigured,
    onLogs: () => {
      refetchFee();
      refetchMetrics();
    },
  });

  const currentFee = currentFeeRaw !== undefined ? Number(currentFeeRaw) : 3000;

  useEffect(() => {
    if (feeRef.current) {
      gsap.fromTo(
        feeRef.current,
        { opacity: 0.5, y: -10 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [currentFee]);

  const metrics = metricsRaw
    ? {
        swapCount: Number(metricsRaw[0]),
        consecutiveDirection: Number(metricsRaw[1]),
        blockSwapCount: Number(metricsRaw[2]),
        volatility: Number(metricsRaw[4]),
      }
    : { swapCount: 0, consecutiveDirection: 0, blockSwapCount: 0, volatility: 0 };

  const feePct = (currentFee / 10000) * 100;

  return (
    <main className="bg-pegasus-dark text-white min-h-screen">
      <Navigation />

      <section className="pt-32 pb-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20"
          >
            <div>
              <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-4">
                LIVE / X LAYER TESTNET · CHAIN 1952
              </p>
              <h1 className="font-serif text-5xl md:text-7xl font-light leading-none">
                dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-purple-glow animate-pulse" />
              <span className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40">
                {isHookConfigured
                  ? "READING ON-CHAIN STATE"
                  : "AWAITING HOOK DEPLOYMENT"}
              </span>
            </div>
          </motion.div>

          {!isHookConfigured && (
            <div className="border border-purple-glow/30 bg-purple-glow/5 px-6 py-5 mb-12 font-mono text-xs text-white/70">
              Hook address not yet configured. Set NEXT_PUBLIC_PEGASUS_HOOK in
              frontend/.env.local after deploying the hook to X Layer testnet.
            </div>
          )}

          {wrongNetwork && (
            <div className="border border-yellow-500/30 bg-yellow-500/5 px-6 py-5 mb-12 font-mono text-xs text-white/70 flex items-center justify-between gap-4">
              <span>Connected to chain {chainId}. Switch to X Layer Testnet (1952) to view live state.</span>
              <ConnectWallet />
            </div>
          )}

          <div className="border border-white/10 bg-white/[0.02] px-6 py-4 mb-12 flex items-center justify-between gap-4">
            <span className="font-sans text-[10px] tracking-ultrawide uppercase text-white/50">
              NEED TESTNET OKB?
            </span>
            <a
              href="https://web3.okx.com/xlayer/faucet"
              target="_blank"
              rel="noreferrer"
              className="font-sans text-[10px] tracking-ultrawide uppercase text-purple-glow hover:underline"
            >
              X LAYER FAUCET →
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="border-t border-white/10 pt-12 mb-20"
          >
            <div className="grid md:grid-cols-12 gap-8 items-end">
              <div className="md:col-span-7">
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6">
                  CURRENT FEE
                </p>
                <div className="flex items-baseline gap-8">
                  <span
                    ref={feeRef}
                    className="font-serif text-hero-sm font-light leading-none text-glow-purple"
                  >
                    {formatFee(currentFee)}
                  </span>
                  <span className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40">
                    {feeLabel(currentFee)}
                  </span>
                </div>
              </div>
              <div className="md:col-span-5">
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                  RANGE
                </p>
                <div className="relative h-[2px] bg-white/10 mb-2">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-purple-glow"
                    animate={{ width: `${feePct}%` }}
                    transition={{ duration: 0.4 }}
                    style={{ boxShadow: "0 0 8px rgba(154, 101, 255, 0.6)" }}
                  />
                  <div
                    className="absolute top-[-3px] w-[2px] h-[8px] bg-white/30"
                    style={{ left: "30%" }}
                  />
                </div>
                <div className="flex justify-between text-[10px] tracking-ultrawide uppercase text-white/30 font-sans">
                  <span>0.01%</span>
                  <span style={{ marginLeft: "calc(30% - 1rem)" }}>BASE</span>
                  <span>1.00%</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="border-t border-white/10 pt-12 mb-20"
          >
            <div className="flex items-center justify-between mb-8">
              <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40">
                FEE EVOLUTION
              </p>
              <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/30">
                LAST 30 SAMPLES
              </p>
            </div>
            <FeeChart currentFee={currentFee} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="border-t border-white/10 pt-12"
          >
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-8">
              POOL TELEMETRY
            </p>
            <PoolMetrics metrics={metrics} currentFee={currentFee} />
          </motion.div>
        </div>
      </section>
    </main>
  );
}
