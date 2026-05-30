"use client";

import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, maxUint256, formatEther, zeroHash } from "viem";
import { Navigation } from "@/components/Navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { CONTRACTS, XLAYER_TESTNET } from "@/lib/chains";
import {
  ERC20_ABI,
  POOL_MODIFY_LIQUIDITY_TEST_ABI,
} from "@/lib/abi";
import { useActivePool } from "@/hooks/useActivePool";

const TICK_LOWER = -6000;
const TICK_UPPER = 6000;

export default function PoolPage() {
  return (
    <Suspense fallback={<main className="bg-pegasus-dark min-h-screen" />}>
      <PoolPageInner />
    </Suspense>
  );
}

function PoolPageInner() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { poolKey, poolId, isCustom, isLoading: poolLoading, notFound } = useActivePool();
  const TOKEN_0 = poolKey.currency0;
  const TOKEN_1 = poolKey.currency1;
  const wrongNetwork = isConnected && chainId !== XLAYER_TESTNET.id;
  const isConfigured =
    CONTRACTS.PEGASUS_HOOK !== "0x0000000000000000000000000000000000000000" &&
    CONTRACTS.POOL_MODIFY_LIQUIDITY_TEST !==
      "0x0000000000000000000000000000000000000000";

  const [mintAmount, setMintAmount] = useState("10000");
  const [lpAmount, setLpAmount] = useState("1000");
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | undefined>();

  const { data: snapshots, refetch: refetchSnapshots } = useReadContracts({
    contracts: [
      {
        address: TOKEN_0,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: TOKEN_1,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: TOKEN_0,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: address
          ? [address, CONTRACTS.POOL_MODIFY_LIQUIDITY_TEST]
          : undefined,
      },
      {
        address: TOKEN_1,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: address
          ? [address, CONTRACTS.POOL_MODIFY_LIQUIDITY_TEST]
          : undefined,
      },
      { address: TOKEN_0, abi: ERC20_ABI, functionName: "symbol" },
      { address: TOKEN_1, abi: ERC20_ABI, functionName: "symbol" },
    ],
    query: { enabled: isConfigured && !!address && !poolLoading },
  });

  const balanceA = (snapshots?.[0]?.result as bigint) ?? 0n;
  const balanceB = (snapshots?.[1]?.result as bigint) ?? 0n;
  const allowanceA = (snapshots?.[2]?.result as bigint) ?? 0n;
  const allowanceB = (snapshots?.[3]?.result as bigint) ?? 0n;
  const symA = (snapshots?.[4]?.result as string) ?? "PEGA";
  const symB = (snapshots?.[5]?.result as string) ?? "PEGB";

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: lastTxHash });

  useEffect(() => {
    if (isConfirmed) refetchSnapshots();
  }, [isConfirmed, refetchSnapshots]);

  // Clear stale tx hash when user changes inputs
  useEffect(() => {
    setLastTxHash(undefined);
  }, [mintAmount, lpAmount]);

  async function handleMint(token: `0x${string}`) {
    if (!address) return;
    let parsed: bigint;
    try {
      parsed = parseEther(mintAmount || "0");
    } catch {
      return;
    }
    if (parsed === 0n) return;
    const hash = await writeContractAsync({
      address: token,
      abi: ERC20_ABI,
      functionName: "mint",
      args: [address, parsed],
    });
    setLastTxHash(hash);
  }

  async function handleApprove(token: `0x${string}`) {
    const hash = await writeContractAsync({
      address: token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACTS.POOL_MODIFY_LIQUIDITY_TEST, maxUint256],
    });
    setLastTxHash(hash);
  }

  async function handleAddLiquidity() {
    let parsed: bigint;
    try {
      parsed = parseEther(lpAmount || "0");
    } catch {
      return;
    }
    if (parsed === 0n) return;
    const params = {
      tickLower: TICK_LOWER,
      tickUpper: TICK_UPPER,
      liquidityDelta: parsed,
      salt: zeroHash,
    };
    const hash = await writeContractAsync({
      address: CONTRACTS.POOL_MODIFY_LIQUIDITY_TEST,
      abi: POOL_MODIFY_LIQUIDITY_TEST_ABI,
      functionName: "modifyLiquidity",
      args: [poolKey, params, "0x", false, false],
      gas: 5_000_000n,
    });
    setLastTxHash(hash);
  }

  let lpParsed = 0n;
  try {
    lpParsed = parseEther(lpAmount || "0");
  } catch {}
  const needApproveA = allowanceA < lpParsed;
  const needApproveB = allowanceB < lpParsed;

  const txExplorerUrl = lastTxHash
    ? `${XLAYER_TESTNET.blockExplorers.default.url}/tx/${lastTxHash}`
    : null;

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
              02 / POOL · X LAYER TESTNET
              {isCustom && poolId && (
                <span className="ml-2 text-purple-glow">
                  · CUSTOM POOL {poolId.slice(0, 10)}…
                </span>
              )}
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-light leading-none">
              pool
            </h1>
          </motion.div>

          {!isConfigured && (
            <div className="border border-purple-glow/30 bg-purple-glow/5 px-6 py-5 mb-8 font-mono text-xs text-white/70">
              Set NEXT_PUBLIC_POOL_MODIFY_LIQUIDITY_TEST + token addresses in
              frontend/.env.local first.
            </div>
          )}
          {notFound && (
            <div className="border border-yellow-500/30 bg-yellow-500/5 px-6 py-5 mb-8 font-mono text-xs text-white/70">
              Pool {poolId?.slice(0, 10)}… not found in the on-chain registry. Showing default pool instead.
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
                Connect wallet to use the pool.
              </span>
              <ConnectWallet />
            </div>
          )}

          <div className="border border-white/10 bg-white/[0.02] px-6 py-4 mb-8 flex items-center justify-between gap-4">
            <span className="font-sans text-[10px] tracking-ultrawide uppercase text-white/50">
              NEED OKB FOR GAS?
            </span>
            <a
              href="https://web3.okx.com/xlayer/faucet"
              target="_blank"
              rel="noreferrer"
              className="font-sans text-[10px] tracking-ultrawide uppercase text-purple-glow hover:underline"
            >
              GET TESTNET OKB →
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="border-t border-white/10 pt-12 mb-12"
          >
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6">
              STEP 1 · MINT TEST TOKENS
            </p>
            <div className="border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-5 md:space-y-6">
              <div className="flex items-baseline gap-4">
                <input
                  type="text"
                  inputMode="decimal"
                  value={mintAmount}
                  onChange={(e) =>
                    setMintAmount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className="flex-1 bg-transparent font-serif text-3xl font-light leading-none focus:outline-none"
                />
                <span className="font-mono text-xs text-white/40">
                  EACH TOKEN
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleMint(TOKEN_0)}
                  disabled={!isConnected || wrongNetwork || isWriting}
                  className="border border-white/10 py-3 font-sans text-xs tracking-ultrawide uppercase hover:border-purple-glow hover:text-purple-glow transition-colors disabled:opacity-30"
                >
                  MINT {symA}
                </button>
                <button
                  onClick={() => handleMint(TOKEN_1)}
                  disabled={!isConnected || wrongNetwork || isWriting}
                  className="border border-white/10 py-3 font-sans text-xs tracking-ultrawide uppercase hover:border-purple-glow hover:text-purple-glow transition-colors disabled:opacity-30"
                >
                  MINT {symB}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-white/50">
                <div>
                  {symA} BAL: {formatEther(balanceA).slice(0, 12)}
                </div>
                <div>
                  {symB} BAL: {formatEther(balanceB).slice(0, 12)}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="border-t border-white/10 pt-12"
          >
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6">
              STEP 2 · ADD LIQUIDITY
            </p>
            <div className="border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-5 md:space-y-6">
              <div>
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-3">
                  LIQUIDITY UNITS
                </p>
                <input
                  type="text"
                  inputMode="decimal"
                  value={lpAmount}
                  onChange={(e) =>
                    setLpAmount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className="w-full bg-transparent font-serif text-3xl font-light leading-none focus:outline-none"
                />
                <p className="font-mono text-[10px] text-white/30 mt-2">
                  Tick range [{TICK_LOWER}, {TICK_UPPER}] · 1:1 baseline
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleApprove(TOKEN_0)}
                  disabled={
                    !isConnected ||
                    wrongNetwork ||
                    isWriting ||
                    !needApproveA
                  }
                  className="border border-white/10 py-3 font-sans text-xs tracking-ultrawide uppercase hover:border-purple-glow hover:text-purple-glow transition-colors disabled:opacity-30"
                >
                  {needApproveA ? `APPROVE ${symA}` : `${symA} APPROVED`}
                </button>
                <button
                  onClick={() => handleApprove(TOKEN_1)}
                  disabled={
                    !isConnected ||
                    wrongNetwork ||
                    isWriting ||
                    !needApproveB
                  }
                  className="border border-white/10 py-3 font-sans text-xs tracking-ultrawide uppercase hover:border-purple-glow hover:text-purple-glow transition-colors disabled:opacity-30"
                >
                  {needApproveB ? `APPROVE ${symB}` : `${symB} APPROVED`}
                </button>
              </div>
              <button
                onClick={handleAddLiquidity}
                disabled={
                  !isConnected ||
                  wrongNetwork ||
                  isWriting ||
                  isConfirming ||
                  needApproveA ||
                  needApproveB
                }
                className="w-full bg-purple-glow text-pegasus-dark py-4 font-sans text-xs tracking-ultrawide uppercase hover:bg-purple-glow/90 transition-colors disabled:opacity-30"
              >
                {isWriting || isConfirming ? "ADDING…" : "ADD LIQUIDITY"}
              </button>
            </div>
          </motion.div>

          {lastTxHash && (
            <div className="border-t border-white/10 pt-8 mt-12">
              <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                LAST TX
              </p>
              <a
                href={txExplorerUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-purple-glow hover:underline break-all"
              >
                {lastTxHash}
              </a>
              {isConfirmed && (
                <p className="font-sans text-[10px] tracking-ultrawide uppercase text-purple-glow mt-2">
                  CONFIRMED
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
