"use client";

import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, maxUint256, formatEther } from "viem";
import { Navigation } from "@/components/Navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import {
  CONTRACTS,
  XLAYER_TESTNET,
} from "@/lib/chains";
import {
  PEGASUS_HOOK_ABI,
  ERC20_ABI,
  POOL_SWAP_TEST_ABI,
} from "@/lib/abi";
import { useActivePool } from "@/hooks/useActivePool";

const MIN_SQRT_PRICE = 4295128739n + 1n;
const MAX_SQRT_PRICE =
  1461446703485210103287273052203988822378723970342n - 1n;

function formatFee(fee: number) {
  return (fee / 10000).toFixed(2) + "%";
}

export default function SwapPage() {
  return (
    <Suspense fallback={<main className="bg-pegasus-dark min-h-screen" />}>
      <SwapPageInner />
    </Suspense>
  );
}

function SwapPageInner() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { poolKey, poolId, isCustom, notFound } = useActivePool();
  const TOKEN_0 = poolKey.currency0;
  const TOKEN_1 = poolKey.currency1;
  const wrongNetwork = isConnected && chainId !== XLAYER_TESTNET.id;
  const isConfigured =
    CONTRACTS.PEGASUS_HOOK !== "0x0000000000000000000000000000000000000000" &&
    CONTRACTS.POOL_SWAP_TEST !== "0x0000000000000000000000000000000000000000";

  const [amount, setAmount] = useState("10");
  const [zeroForOne, setZeroForOne] = useState(true);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | undefined>();

  // Parsed input amount as bigint (0n if invalid)
  let parsedAmount: bigint = 0n;
  try {
    parsedAmount = parseEther(amount || "0");
  } catch {
    parsedAmount = 0n;
  }

  const fromToken = zeroForOne ? TOKEN_0 : TOKEN_1;
  const toToken = zeroForOne ? TOKEN_1 : TOKEN_0;

  const { data: tokenInfo } = useReadContracts({
    contracts: [
      { address: TOKEN_0, abi: ERC20_ABI, functionName: "symbol" },
      { address: TOKEN_1, abi: ERC20_ABI, functionName: "symbol" },
    ],
    query: { enabled: isConfigured },
  });

  const symA = (tokenInfo?.[0]?.result as string) ?? "PEGA";
  const symB = (tokenInfo?.[1]?.result as string) ?? "PEGB";
  const fromSymbol = zeroForOne ? symA : symB;
  const toSymbol = zeroForOne ? symB : symA;

  const { data: balances, refetch: refetchBalances } = useReadContracts({
    contracts: [
      {
        address: fromToken,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: fromToken,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: address ? [address, CONTRACTS.POOL_SWAP_TEST] : undefined,
      },
    ],
    query: { enabled: isConfigured && !!address },
  });

  const balance = (balances?.[0]?.result as bigint) ?? 0n;
  const allowance = (balances?.[1]?.result as bigint) ?? 0n;

  const { data: currentFeeRaw } = useReadContract({
    address: CONTRACTS.PEGASUS_HOOK,
    abi: PEGASUS_HOOK_ABI,
    functionName: "getCurrentFee",
    args: [poolKey],
    query: { enabled: isConfigured, refetchInterval: 5000 },
  });
  const currentFee = currentFeeRaw !== undefined ? Number(currentFeeRaw) : 3000;

  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: lastTxHash });

  useEffect(() => {
    if (isConfirmed) refetchBalances();
  }, [isConfirmed, refetchBalances]);

  useEffect(() => {
    setNeedsApproval(allowance < parsedAmount && parsedAmount > 0n);
  }, [parsedAmount, allowance]);

  // Clear stale tx hash when user changes input/direction
  useEffect(() => {
    setLastTxHash(undefined);
  }, [amount, zeroForOne]);

  const hasInsufficientBalance = parsedAmount > 0n && parsedAmount > balance;
  const amountIsZero = parsedAmount === 0n;

  async function handleApprove() {
    if (!address) return;
    const hash = await writeContractAsync({
      address: fromToken,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACTS.POOL_SWAP_TEST, maxUint256],
    });
    setLastTxHash(hash);
  }

  async function handleSwap() {
    if (!address) return;
    let parsed: bigint;
    try {
      parsed = parseEther(amount || "0");
    } catch {
      return;
    }
    if (parsed === 0n) return;

    const params = {
      zeroForOne,
      amountSpecified: -parsed,
      sqrtPriceLimitX96: zeroForOne ? MIN_SQRT_PRICE : MAX_SQRT_PRICE,
    };
    const testSettings = { takeClaims: false, settleUsingBurn: false };

    const hash = await writeContractAsync({
      address: CONTRACTS.POOL_SWAP_TEST,
      abi: POOL_SWAP_TEST_ABI,
      functionName: "swap",
      args: [poolKey, params, testSettings, "0x"],
      gas: 5_000_000n,
    });
    setLastTxHash(hash);
  }

  const txExplorerUrl = lastTxHash
    ? `${XLAYER_TESTNET.blockExplorers.default.url}/tx/${lastTxHash}`
    : null;

  return (
    <main className="bg-pegasus-dark text-white min-h-screen">
      <Navigation />
      <section className="pt-28 md:pt-32 pb-12 px-4 sm:px-6 md:px-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-4">
              01 / SWAP · X LAYER TESTNET
              {isCustom && poolId && (
                <span className="ml-2 text-purple-glow">
                  · CUSTOM POOL {poolId.slice(0, 10)}…
                </span>
              )}
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-light leading-none">
              swap
            </h1>
          </motion.div>

          {!isConfigured && (
            <div className="border border-purple-glow/30 bg-purple-glow/5 px-6 py-5 mb-8 font-mono text-xs text-white/70">
              Set NEXT_PUBLIC_PEGASUS_HOOK / NEXT_PUBLIC_POOL_SWAP_TEST /
              NEXT_PUBLIC_TOKEN_A / NEXT_PUBLIC_TOKEN_B in frontend/.env.local
              after deployment.
            </div>
          )}
          {wrongNetwork && (
            <div className="border border-yellow-500/30 bg-yellow-500/5 px-6 py-5 mb-8 font-mono text-xs text-white/70 flex items-center justify-between gap-4">
              <span>
                Wrong network. Switch to X Layer Testnet (chain 1952).
              </span>
              <ConnectWallet />
            </div>
          )}
          {!isConnected && (
            <div className="border border-white/10 bg-white/5 px-6 py-5 mb-8 flex items-center justify-between gap-4">
              <span className="font-mono text-xs text-white/70">
                Connect wallet to swap.
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
            transition={{ duration: 0.8, delay: 0.2 }}
            className="border-t border-white/10 pt-12"
          >
            <div className="border border-white/10 bg-white/[0.02] p-5 md:p-8 space-y-6 md:space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40">
                    FROM
                  </span>
                  <span className="font-sans text-[10px] tracking-ultrawide uppercase text-white/30">
                    BALANCE: {formatEther(balance).slice(0, 10)}
                  </span>
                </div>
                <div className="flex items-baseline gap-4">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    className="flex-1 min-w-0 bg-transparent font-serif text-3xl md:text-5xl font-light leading-none focus:outline-none"
                    placeholder="0"
                  />
                  <span className="font-serif text-xl md:text-2xl text-white/70">
                    {fromSymbol}
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setZeroForOne(!zeroForOne)}
                  className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 hover:text-purple-glow transition-colors"
                >
                  ↓ FLIP DIRECTION
                </button>
              </div>

              <div className="border-t border-white/10 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40">
                    TO
                  </span>
                  <span className="font-sans text-[10px] tracking-ultrawide uppercase text-white/30">
                    EST. AT POOL RATE
                  </span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="flex-1 min-w-0 truncate font-serif text-3xl md:text-5xl font-light leading-none text-white/30">
                    {amount || "0"}
                  </span>
                  <span className="font-serif text-xl md:text-2xl text-white/70">
                    {toSymbol}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6 grid grid-cols-3 gap-3 md:gap-4">
                <div>
                  <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-1">
                    DYNAMIC FEE
                  </p>
                  <p className="font-serif text-xl text-purple-glow">
                    {formatFee(currentFee)}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-1">
                    HOOK
                  </p>
                  <p className="font-mono text-xs text-white/70 truncate">
                    {CONTRACTS.PEGASUS_HOOK.slice(0, 8)}…
                    {CONTRACTS.PEGASUS_HOOK.slice(-4)}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-1">
                    DIRECTION
                  </p>
                  <p className="font-mono text-xs text-white/70">
                    {zeroForOne ? "0 → 1" : "1 → 0"}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                {needsApproval ? (
                  <button
                    onClick={handleApprove}
                    disabled={!isConnected || wrongNetwork || isWriting || isConfirming || amountIsZero || hasInsufficientBalance}
                    className="w-full border border-purple-glow text-purple-glow py-4 font-sans text-xs tracking-ultrawide uppercase hover:bg-purple-glow/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {hasInsufficientBalance
                      ? `INSUFFICIENT ${fromSymbol} BALANCE`
                      : amountIsZero
                      ? "ENTER AN AMOUNT"
                      : isWriting || isConfirming
                      ? "APPROVING…"
                      : `APPROVE ${fromSymbol}`}
                  </button>
                ) : (
                  <button
                    onClick={handleSwap}
                    disabled={
                      !isConnected ||
                      wrongNetwork ||
                      !isConfigured ||
                      isWriting ||
                      isConfirming ||
                      amountIsZero ||
                      hasInsufficientBalance
                    }
                    className="w-full bg-purple-glow text-pegasus-dark py-4 font-sans text-xs tracking-ultrawide uppercase hover:bg-purple-glow/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {hasInsufficientBalance
                      ? `INSUFFICIENT ${fromSymbol} BALANCE`
                      : amountIsZero
                      ? "ENTER AN AMOUNT"
                      : isWriting || isConfirming
                      ? "SWAPPING…"
                      : "SWAP"}
                  </button>
                )}
              </div>

              {lastTxHash && (
                <div className="border-t border-white/10 pt-6">
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
                  {isConfirming && (
                    <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mt-2">
                      CONFIRMING…
                    </p>
                  )}
                  {isConfirmed && (
                    <p className="font-sans text-[10px] tracking-ultrawide uppercase text-purple-glow mt-2">
                      CONFIRMED · CHECK DASHBOARD FOR HOOK STATE CHANGES
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/30 mt-8 text-center">
            Tip — execute three swaps in the same direction to trigger the MEV
            surge.
          </p>
        </div>
      </section>
    </main>
  );
}
