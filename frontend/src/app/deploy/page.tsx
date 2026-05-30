"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContracts,
} from "wagmi";
import { parseUnits, decodeEventLog, formatUnits } from "viem";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { CONTRACTS, XLAYER_TESTNET } from "@/lib/chains";
import { PEGASUS_FACTORY_ABI, ERC20_ABI } from "@/lib/abi";

export default function DeployTokenPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongNetwork = isConnected && chainId !== XLAYER_TESTNET.id;
  const isConfigured =
    CONTRACTS.PEGASUS_FACTORY !== "0x0000000000000000000000000000000000000000";

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState("18");
  const [supply, setSupply] = useState("1000000");
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | undefined>();
  const [newlyCreated, setNewlyCreated] = useState<`0x${string}` | undefined>();

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } =
    useWaitForTransactionReceipt({ hash: lastTxHash });

  // Read user's tokens from factory
  const { data: myTokenAddrs, refetch: refetchMyTokens } = useReadContract({
    address: CONTRACTS.PEGASUS_FACTORY,
    abi: PEGASUS_FACTORY_ABI,
    functionName: "getTokensByCreator",
    args: address ? [address] : undefined,
    query: { enabled: isConfigured && !!address },
  });

  const tokenAddrs = (myTokenAddrs as `0x${string}`[] | undefined) ?? [];

  // Fetch symbol + balance for each of user's tokens
  const tokenReads = useReadContracts({
    contracts: tokenAddrs.flatMap((tok) => [
      { address: tok, abi: ERC20_ABI, functionName: "symbol" as const },
      { address: tok, abi: ERC20_ABI, functionName: "decimals" as const },
      {
        address: tok,
        abi: ERC20_ABI,
        functionName: "balanceOf" as const,
        args: address ? [address] : undefined,
      },
    ]),
    query: { enabled: tokenAddrs.length > 0 && !!address },
  });

  // Parse TokenCreated event from receipt to capture new token address
  useEffect(() => {
    if (!receipt || !isConfirmed) return;
    for (const log of receipt.logs) {
      try {
        const parsed = decodeEventLog({
          abi: PEGASUS_FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (parsed.eventName === "TokenCreated") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const args = parsed.args as any;
          setNewlyCreated(args.token);
          break;
        }
      } catch {
        // Not a factory event, skip
      }
    }
    refetchMyTokens();
  }, [receipt, isConfirmed, refetchMyTokens]);

  async function handleDeploy() {
    if (!address) return;
    if (!name.trim() || !symbol.trim()) return;

    let parsedDecimals: number;
    try {
      parsedDecimals = parseInt(decimals, 10);
      if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 18) return;
    } catch {
      return;
    }

    let parsedSupply: bigint;
    try {
      parsedSupply = parseUnits(supply || "0", parsedDecimals);
    } catch {
      return;
    }

    setNewlyCreated(undefined);
    const hash = await writeContractAsync({
      address: CONTRACTS.PEGASUS_FACTORY,
      abi: PEGASUS_FACTORY_ABI,
      functionName: "createToken",
      args: [name, symbol, parsedDecimals, parsedSupply],
    });
    setLastTxHash(hash);
  }

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
              00 / DEPLOY · X LAYER TESTNET
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-light leading-none">
              deploy
            </h1>
            <p className="font-sans text-sm text-white/50 mt-4 max-w-xl">
              Launch your own ERC20 on X Layer in seconds. Use it in a new
              Pegasus-hooked pool for live MEV-protected trading.
            </p>
          </motion.div>

          {!isConfigured && (
            <div className="border border-purple-glow/30 bg-purple-glow/5 px-6 py-5 mb-8 font-mono text-xs text-white/70">
              Factory not yet configured. Set NEXT_PUBLIC_PEGASUS_FACTORY in
              frontend/.env.local.
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
                Connect wallet to deploy a token.
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

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="border-t border-white/10 pt-12 mb-12"
          >
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6">
              NEW TOKEN
            </p>
            <div className="border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-5 md:space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                    NAME
                  </p>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Cool Token"
                    className="w-full bg-transparent border border-white/10 px-4 py-3 font-serif text-lg focus:outline-none focus:border-purple-glow/50"
                  />
                </div>
                <div>
                  <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                    SYMBOL
                  </p>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) =>
                      setSymbol(e.target.value.toUpperCase().slice(0, 11))
                    }
                    placeholder="MCT"
                    className="w-full bg-transparent border border-white/10 px-4 py-3 font-mono text-lg focus:outline-none focus:border-purple-glow/50"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                    DECIMALS
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={decimals}
                    onChange={(e) =>
                      setDecimals(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="w-full bg-transparent border border-white/10 px-4 py-3 font-mono text-lg focus:outline-none focus:border-purple-glow/50"
                  />
                </div>
                <div>
                  <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-2">
                    INITIAL SUPPLY
                  </p>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={supply}
                    onChange={(e) =>
                      setSupply(e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    placeholder="1000000"
                    className="w-full bg-transparent border border-white/10 px-4 py-3 font-mono text-lg focus:outline-none focus:border-purple-glow/50"
                  />
                </div>
              </div>

              <button
                onClick={handleDeploy}
                disabled={
                  !isConnected ||
                  wrongNetwork ||
                  !isConfigured ||
                  isWriting ||
                  isConfirming ||
                  !name.trim() ||
                  !symbol.trim()
                }
                className="w-full bg-purple-glow text-pegasus-dark py-4 font-sans text-xs tracking-ultrawide uppercase hover:bg-purple-glow/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isWriting || isConfirming
                  ? "DEPLOYING…"
                  : "DEPLOY TOKEN"}
              </button>
            </div>
          </motion.div>

          {/* Success state */}
          {newlyCreated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="border border-purple-glow/40 bg-purple-glow/5 px-6 py-5 mb-12"
            >
              <p className="font-sans text-[10px] tracking-ultrawide uppercase text-purple-glow mb-3">
                ✓ TOKEN DEPLOYED
              </p>
              <p className="font-mono text-xs text-white/70 break-all mb-4">
                {newlyCreated}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`${explorerBase}/address/${newlyCreated}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-sans text-[10px] tracking-ultrawide uppercase px-4 py-2 border border-white/20 text-white/80 hover:border-purple-glow hover:text-purple-glow transition-colors"
                >
                  VIEW ON EXPLORER →
                </a>
                <Link
                  href={`/create-pool?token=${newlyCreated}`}
                  className="font-sans text-[10px] tracking-ultrawide uppercase px-4 py-2 bg-purple-glow text-pegasus-dark hover:bg-purple-glow/90 transition-colors"
                >
                  CREATE POOL WITH THIS TOKEN →
                </Link>
              </div>
            </motion.div>
          )}

          {/* My tokens */}
          {tokenAddrs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="border-t border-white/10 pt-12"
            >
              <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6">
                MY TOKENS · {tokenAddrs.length}
              </p>
              <div className="space-y-2">
                {tokenAddrs.map((tok, i) => {
                  const sym = tokenReads.data?.[i * 3]?.result as string | undefined;
                  const dec = tokenReads.data?.[i * 3 + 1]?.result as number | undefined;
                  const bal = tokenReads.data?.[i * 3 + 2]?.result as bigint | undefined;
                  return (
                    <div
                      key={tok}
                      className="border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-lg text-white">
                          {sym ?? "..."}
                        </p>
                        <p className="font-mono text-[10px] text-white/40 truncate">
                          {tok}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs text-white/70">
                          {bal !== undefined && dec !== undefined
                            ? Number(formatUnits(bal, dec)).toLocaleString()
                            : "—"}
                        </p>
                        <Link
                          href={`/create-pool?token=${tok}`}
                          className="font-sans text-[9px] tracking-ultrawide uppercase text-purple-glow hover:underline"
                        >
                          USE IN POOL →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
}
