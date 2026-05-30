"use client";

import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useAccount,
  useChainId,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isAddress, encodeAbiParameters, keccak256 } from "viem";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { CONTRACTS, XLAYER_TESTNET, DYNAMIC_FEE_FLAG } from "@/lib/chains";
import {
  PEGASUS_FACTORY_ABI,
  POOL_MANAGER_ABI,
  ERC20_ABI,
} from "@/lib/abi";

const SQRT_PRICE_X96_1_TO_1 = 79228162514264337593543950336n;
const TICK_SPACING = 60;

function computePoolId(
  currency0: `0x${string}`,
  currency1: `0x${string}`,
  fee: number,
  tickSpacing: number,
  hooks: `0x${string}`
): `0x${string}` {
  const encoded = encodeAbiParameters(
    [
      { type: "address" },
      { type: "address" },
      { type: "uint24" },
      { type: "int24" },
      { type: "address" },
    ],
    [currency0, currency1, fee, tickSpacing, hooks]
  );
  return keccak256(encoded);
}

export default function CreatePoolPage() {
  return (
    <Suspense fallback={<main className="bg-pegasus-dark min-h-screen" />}>
      <CreatePoolPageInner />
    </Suspense>
  );
}

function CreatePoolPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetToken = searchParams.get("token");

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongNetwork = isConnected && chainId !== XLAYER_TESTNET.id;
  const isConfigured =
    CONTRACTS.PEGASUS_FACTORY !== "0x0000000000000000000000000000000000000000" &&
    CONTRACTS.POOL_MANAGER !== "0x0000000000000000000000000000000000000000" &&
    CONTRACTS.PEGASUS_HOOK !== "0x0000000000000000000000000000000000000000";

  const [tokenA, setTokenA] = useState(presetToken ?? "");
  const [tokenB, setTokenB] = useState("");
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | undefined>();
  const [step, setStep] = useState<"idle" | "initializing" | "registering" | "done">("idle");
  const [createdPoolId, setCreatedPoolId] = useState<`0x${string}` | undefined>();

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: lastTxHash });

  // Read user's tokens for the picker
  const { data: myTokenAddrs } = useReadContract({
    address: CONTRACTS.PEGASUS_FACTORY,
    abi: PEGASUS_FACTORY_ABI,
    functionName: "getTokensByCreator",
    args: address ? [address] : undefined,
    query: { enabled: isConfigured && !!address },
  });
  const tokenAddrs = (myTokenAddrs as `0x${string}`[] | undefined) ?? [];

  const tokenSymbolReads = useReadContracts({
    contracts: tokenAddrs.map((tok) => ({
      address: tok,
      abi: ERC20_ABI,
      functionName: "symbol" as const,
    })),
    query: { enabled: tokenAddrs.length > 0 },
  });

  // Resolve symbols for picked tokens
  const tokenAIsValid = isAddress(tokenA);
  const tokenBIsValid = isAddress(tokenB);
  const tokensDifferent = tokenA.toLowerCase() !== tokenB.toLowerCase();

  const pickedReads = useReadContracts({
    contracts: [
      ...(tokenAIsValid
        ? [{ address: tokenA as `0x${string}`, abi: ERC20_ABI, functionName: "symbol" as const }]
        : []),
      ...(tokenBIsValid
        ? [{ address: tokenB as `0x${string}`, abi: ERC20_ABI, functionName: "symbol" as const }]
        : []),
    ],
    query: { enabled: tokenAIsValid || tokenBIsValid },
  });

  const symA = tokenAIsValid ? (pickedReads.data?.[0]?.result as string | undefined) : undefined;
  const symB =
    tokenBIsValid
      ? (pickedReads.data?.[tokenAIsValid ? 1 : 0]?.result as string | undefined)
      : undefined;

  // Sort currencies (V4 requires currency0 < currency1)
  const sortedCurrencies =
    tokenAIsValid && tokenBIsValid && tokensDifferent
      ? BigInt(tokenA) < BigInt(tokenB)
        ? [tokenA, tokenB]
        : [tokenB, tokenA]
      : null;

  // Predict poolId for display
  const predictedPoolId =
    sortedCurrencies !== null
      ? computePoolId(
          sortedCurrencies[0] as `0x${string}`,
          sortedCurrencies[1] as `0x${string}`,
          DYNAMIC_FEE_FLAG,
          TICK_SPACING,
          CONTRACTS.PEGASUS_HOOK
        )
      : undefined;

  async function handleInitialize() {
    if (!address || !sortedCurrencies || !predictedPoolId) return;

    const poolKey = {
      currency0: sortedCurrencies[0] as `0x${string}`,
      currency1: sortedCurrencies[1] as `0x${string}`,
      fee: DYNAMIC_FEE_FLAG,
      tickSpacing: TICK_SPACING,
      hooks: CONTRACTS.PEGASUS_HOOK,
    };

    try {
      setStep("initializing");
      const initHash = await writeContractAsync({
        address: CONTRACTS.POOL_MANAGER,
        abi: POOL_MANAGER_ABI,
        functionName: "initialize",
        args: [poolKey, SQRT_PRICE_X96_1_TO_1],
      });
      setLastTxHash(initHash);
    } catch (err) {
      console.error("Initialize failed:", err);
      setStep("idle");
    }
  }

  // After init confirms, register in factory
  useEffect(() => {
    if (step !== "initializing" || !isConfirmed || !sortedCurrencies || !predictedPoolId)
      return;

    (async () => {
      try {
        setStep("registering");
        const regHash = await writeContractAsync({
          address: CONTRACTS.PEGASUS_FACTORY,
          abi: PEGASUS_FACTORY_ABI,
          functionName: "registerPool",
          args: [
            predictedPoolId,
            sortedCurrencies[0] as `0x${string}`,
            sortedCurrencies[1] as `0x${string}`,
            DYNAMIC_FEE_FLAG,
            TICK_SPACING,
            CONTRACTS.PEGASUS_HOOK,
          ],
        });
        setLastTxHash(regHash);
      } catch (err) {
        // Registration is optional — pool is still initialized
        console.warn("Pool register failed (pool still initialized):", err);
        setCreatedPoolId(predictedPoolId);
        setStep("done");
      }
    })();
  }, [step, isConfirmed, sortedCurrencies, predictedPoolId, writeContractAsync]);

  useEffect(() => {
    if (step === "registering" && isConfirmed && predictedPoolId) {
      setCreatedPoolId(predictedPoolId);
      setStep("done");
    }
  }, [step, isConfirmed, predictedPoolId]);

  const explorerBase = XLAYER_TESTNET.blockExplorers.default.url;

  return (
    <main className="bg-pegasus-dark text-white min-h-screen">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-12 px-4 sm:px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-4">
              02b / CREATE POOL · X LAYER TESTNET
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-light leading-none">
              create pool
            </h1>
            <p className="font-sans text-sm text-white/50 mt-4 max-w-xl">
              Initialize a Uniswap V4 pool with the Pegasus hook attached.
              Any pool you create gets adaptive fees + MEV protection automatically.
            </p>
          </motion.div>

          {!isConfigured && (
            <div className="border border-purple-glow/30 bg-purple-glow/5 px-6 py-5 mb-8 font-mono text-xs text-white/70">
              Set NEXT_PUBLIC_PEGASUS_FACTORY / NEXT_PUBLIC_POOL_MANAGER /
              NEXT_PUBLIC_PEGASUS_HOOK in frontend/.env.local first.
            </div>
          )}

          {wrongNetwork && (
            <div className="border border-yellow-500/30 bg-yellow-500/5 px-6 py-5 mb-8 font-mono text-xs text-white/70 flex items-center justify-between gap-4">
              <span>Wrong network. Switch to X Layer Testnet (1952).</span>
              <ConnectWallet />
            </div>
          )}

          {!isConnected && (
            <div className="border border-white/10 bg-white/5 px-6 py-5 mb-8 flex items-center justify-between gap-4">
              <span className="font-mono text-xs text-white/70">
                Connect wallet to create a pool.
              </span>
              <ConnectWallet />
            </div>
          )}

          {/* Token pickers */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="border-t border-white/10 pt-12 mb-12"
          >
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6">
              TOKEN PAIR
            </p>
            <div className="border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-5 md:space-y-6">
              <div>
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                  TOKEN A
                  {symA && (
                    <span className="ml-2 text-purple-glow">
                      · {symA}
                    </span>
                  )}
                </p>
                <input
                  type="text"
                  value={tokenA}
                  onChange={(e) => setTokenA(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-transparent border border-white/10 px-4 py-3 font-mono text-sm focus:outline-none focus:border-purple-glow/50"
                />
                {tokenAddrs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tokenAddrs.map((tok, i) => {
                      const sym =
                        (tokenSymbolReads.data?.[i]?.result as string | undefined) ?? "...";
                      return (
                        <button
                          key={tok}
                          onClick={() => setTokenA(tok)}
                          className="font-sans text-[10px] tracking-ultrawide uppercase px-3 py-1 border border-white/10 text-white/60 hover:border-purple-glow hover:text-purple-glow transition-colors"
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                  TOKEN B
                  {symB && (
                    <span className="ml-2 text-purple-glow">
                      · {symB}
                    </span>
                  )}
                </p>
                <input
                  type="text"
                  value={tokenB}
                  onChange={(e) => setTokenB(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-transparent border border-white/10 px-4 py-3 font-mono text-sm focus:outline-none focus:border-purple-glow/50"
                />
                {tokenAddrs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tokenAddrs.map((tok, i) => {
                      const sym =
                        (tokenSymbolReads.data?.[i]?.result as string | undefined) ?? "...";
                      return (
                        <button
                          key={tok}
                          onClick={() => setTokenB(tok)}
                          className="font-sans text-[10px] tracking-ultrawide uppercase px-3 py-1 border border-white/10 text-white/60 hover:border-purple-glow hover:text-purple-glow transition-colors"
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {tokenAIsValid && tokenBIsValid && !tokensDifferent && (
                <p className="font-mono text-[10px] text-yellow-500">
                  Token A and Token B must be different.
                </p>
              )}

              {predictedPoolId && (
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40">
                    POOL PREVIEW
                  </p>
                  <p className="font-mono text-[10px] text-white/60 break-all">
                    poolId: {predictedPoolId}
                  </p>
                  <p className="font-mono text-[10px] text-white/40">
                    fee: 0x800000 (dynamic) · tickSpacing: {TICK_SPACING} ·
                    hook: {CONTRACTS.PEGASUS_HOOK.slice(0, 10)}…
                  </p>
                </div>
              )}

              <button
                onClick={handleInitialize}
                disabled={
                  !isConnected ||
                  wrongNetwork ||
                  !isConfigured ||
                  isWriting ||
                  isConfirming ||
                  !tokenAIsValid ||
                  !tokenBIsValid ||
                  !tokensDifferent ||
                  step !== "idle"
                }
                className="w-full bg-purple-glow text-pegasus-dark py-4 font-sans text-xs tracking-ultrawide uppercase hover:bg-purple-glow/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {step === "initializing"
                  ? "INITIALIZING POOL…"
                  : step === "registering"
                  ? "REGISTERING…"
                  : "INITIALIZE POOL"}
              </button>
            </div>
          </motion.div>

          {/* Success */}
          {step === "done" && createdPoolId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="border border-purple-glow/40 bg-purple-glow/5 px-6 py-5"
            >
              <p className="font-sans text-[10px] tracking-ultrawide uppercase text-purple-glow mb-3">
                ✓ POOL CREATED
              </p>
              <p className="font-mono text-[10px] text-white/70 break-all mb-4">
                {createdPoolId}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/pool?pool=${createdPoolId}`}
                  className="font-sans text-[10px] tracking-ultrawide uppercase px-4 py-2 bg-purple-glow text-pegasus-dark hover:bg-purple-glow/90 transition-colors"
                >
                  ADD LIQUIDITY →
                </Link>
                <Link
                  href={`/swap?pool=${createdPoolId}`}
                  className="font-sans text-[10px] tracking-ultrawide uppercase px-4 py-2 border border-white/20 text-white/80 hover:border-purple-glow hover:text-purple-glow transition-colors"
                >
                  SWAP →
                </Link>
                <Link
                  href={`/dashboard?pool=${createdPoolId}`}
                  className="font-sans text-[10px] tracking-ultrawide uppercase px-4 py-2 border border-white/20 text-white/80 hover:border-purple-glow hover:text-purple-glow transition-colors"
                >
                  VIEW LIVE METRICS →
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
}
