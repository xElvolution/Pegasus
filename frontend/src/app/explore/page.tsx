"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useReadContract, useReadContracts } from "wagmi";
import { Navigation } from "@/components/Navigation";
import { CONTRACTS, XLAYER_TESTNET } from "@/lib/chains";
import { PEGASUS_FACTORY_ABI, ERC20_ABI } from "@/lib/abi";

export default function ExplorePage() {
  const isConfigured =
    CONTRACTS.PEGASUS_FACTORY !== "0x0000000000000000000000000000000000000000";

  const { data: totalPoolsRaw } = useReadContract({
    address: CONTRACTS.PEGASUS_FACTORY,
    abi: PEGASUS_FACTORY_ABI,
    functionName: "totalPools",
    query: { enabled: isConfigured, refetchInterval: 10000 },
  });

  const { data: totalTokensRaw } = useReadContract({
    address: CONTRACTS.PEGASUS_FACTORY,
    abi: PEGASUS_FACTORY_ABI,
    functionName: "totalTokens",
    query: { enabled: isConfigured, refetchInterval: 10000 },
  });

  const totalPools = totalPoolsRaw ? Number(totalPoolsRaw) : 0;
  const totalTokens = totalTokensRaw ? Number(totalTokensRaw) : 0;

  const { data: poolsRaw } = useReadContract({
    address: CONTRACTS.PEGASUS_FACTORY,
    abi: PEGASUS_FACTORY_ABI,
    functionName: "getPools",
    args: [0n, 50n],
    query: { enabled: isConfigured && totalPools > 0, refetchInterval: 10000 },
  });

  const { data: tokensRaw } = useReadContract({
    address: CONTRACTS.PEGASUS_FACTORY,
    abi: PEGASUS_FACTORY_ABI,
    functionName: "getTokens",
    args: [0n, 50n],
    query: { enabled: isConfigured && totalTokens > 0, refetchInterval: 10000 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pools = (poolsRaw as any[] | undefined) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokens = (tokensRaw as any[] | undefined) ?? [];

  // Fetch symbols for all pool currencies
  const allPoolCurrencies = pools.flatMap((p) => [p.currency0, p.currency1]);
  const symbolReads = useReadContracts({
    contracts: allPoolCurrencies.map((addr) => ({
      address: addr as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "symbol" as const,
    })),
    query: { enabled: allPoolCurrencies.length > 0 },
  });

  const explorerBase = XLAYER_TESTNET.blockExplorers.default.url;

  return (
    <main className="bg-pegasus-dark text-white min-h-screen">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-12 px-4 sm:px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-4">
              EXPLORE · X LAYER TESTNET
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-light leading-none">
              explore
            </h1>
            <p className="font-sans text-sm text-white/50 mt-4 max-w-xl">
              Every token deployed and every pool created via the Pegasus
              factory. Click any pool to trade or view live metrics.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            <div className="border border-white/10 bg-white/[0.02] p-5">
              <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                TOTAL POOLS
              </p>
              <p className="font-serif text-4xl font-light text-purple-glow">
                {totalPools}
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.02] p-5">
              <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                TOTAL TOKENS DEPLOYED
              </p>
              <p className="font-serif text-4xl font-light text-purple-glow">
                {totalTokens}
              </p>
            </div>
          </div>

          {/* Pools */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="border-t border-white/10 pt-12 mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40">
                POOLS
              </p>
              <Link
                href="/create-pool"
                className="font-sans text-[10px] tracking-ultrawide uppercase text-purple-glow hover:underline"
              >
                + CREATE POOL
              </Link>
            </div>
            {pools.length === 0 ? (
              <p className="font-mono text-xs text-white/40">
                No custom pools yet. Be the first to create one.
              </p>
            ) : (
              <div className="space-y-2">
                {pools.map((p, i) => {
                  const sym0 =
                    (symbolReads.data?.[i * 2]?.result as string | undefined) ?? "?";
                  const sym1 =
                    (symbolReads.data?.[i * 2 + 1]?.result as string | undefined) ?? "?";
                  return (
                    <div
                      key={p.poolId}
                      className="border border-white/10 bg-white/[0.02] px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-lg text-white">
                          {sym0} / {sym1}
                        </p>
                        <p className="font-mono text-[10px] text-white/40 truncate">
                          {p.poolId}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/swap?pool=${p.poolId}`}
                          className="font-sans text-[9px] tracking-ultrawide uppercase px-3 py-1.5 bg-purple-glow text-pegasus-dark hover:bg-purple-glow/90"
                        >
                          SWAP
                        </Link>
                        <Link
                          href={`/pool?pool=${p.poolId}`}
                          className="font-sans text-[9px] tracking-ultrawide uppercase px-3 py-1.5 border border-white/20 text-white/70 hover:border-purple-glow hover:text-purple-glow"
                        >
                          LP
                        </Link>
                        <Link
                          href={`/dashboard?pool=${p.poolId}`}
                          className="font-sans text-[9px] tracking-ultrawide uppercase px-3 py-1.5 border border-white/20 text-white/70 hover:border-purple-glow hover:text-purple-glow"
                        >
                          METRICS
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Tokens */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="border-t border-white/10 pt-12"
          >
            <div className="flex items-center justify-between mb-6">
              <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40">
                TOKENS
              </p>
              <Link
                href="/deploy"
                className="font-sans text-[10px] tracking-ultrawide uppercase text-purple-glow hover:underline"
              >
                + DEPLOY TOKEN
              </Link>
            </div>
            {tokens.length === 0 ? (
              <p className="font-mono text-xs text-white/40">
                No tokens deployed yet. Be the first.
              </p>
            ) : (
              <div className="space-y-2">
                {tokens.map((t) => (
                  <div
                    key={t.token}
                    className="border border-white/10 bg-white/[0.02] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-lg text-white">
                        {t.symbol}{" "}
                        <span className="font-sans text-xs text-white/40">
                          · {t.name}
                        </span>
                      </p>
                      <p className="font-mono text-[10px] text-white/40 truncate">
                        {t.token}
                      </p>
                    </div>
                    <a
                      href={`${explorerBase}/address/${t.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-sans text-[9px] tracking-ultrawide uppercase px-3 py-1.5 border border-white/20 text-white/70 hover:border-purple-glow hover:text-purple-glow"
                    >
                      EXPLORER →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
