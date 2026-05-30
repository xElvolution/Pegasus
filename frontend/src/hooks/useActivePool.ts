"use client";

import { useSearchParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { isHex } from "viem";
import { CONTRACTS, POOL_KEY, DYNAMIC_FEE_FLAG } from "@/lib/chains";
import { PEGASUS_FACTORY_ABI } from "@/lib/abi";

export type PoolKey = {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
};

/**
 * Returns the active pool key based on the ?pool=poolId URL param.
 * Falls back to the default PEGA/PEGB pool when no param is set.
 *
 * For URL-specified pools, reads token addresses + tickSpacing from
 * the on-chain PegasusFactory registry.
 */
export function useActivePool(): {
  poolKey: PoolKey;
  poolId: `0x${string}` | undefined;
  isCustom: boolean;
  isLoading: boolean;
  notFound: boolean;
} {
  const search = useSearchParams();
  const raw = search.get("pool");

  const poolIdParam = raw && isHex(raw) && raw.length === 66 ? (raw as `0x${string}`) : undefined;
  const isCustom = !!poolIdParam;

  const { data: info, isLoading } = useReadContract({
    address: CONTRACTS.PEGASUS_FACTORY,
    abi: PEGASUS_FACTORY_ABI,
    functionName: "poolInfo",
    args: poolIdParam ? [poolIdParam] : undefined,
    query: { enabled: !!poolIdParam },
  });

  if (!poolIdParam) {
    return {
      poolKey: POOL_KEY as PoolKey,
      poolId: undefined,
      isCustom: false,
      isLoading: false,
      notFound: false,
    };
  }

  if (!info) {
    return {
      poolKey: POOL_KEY as PoolKey,
      poolId: poolIdParam,
      isCustom: true,
      isLoading: true,
      notFound: false,
    };
  }

  // poolInfo returns: [poolId, creator, currency0, currency1, fee, tickSpacing, hooks, createdAt]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arr = info as any;
  const poolIdFromChain = arr[0] as `0x${string}`;
  const currency0 = arr[2] as `0x${string}`;
  const currency1 = arr[3] as `0x${string}`;
  const fee = Number(arr[4]);
  const tickSpacing = Number(arr[5]);
  const hooks = arr[6] as `0x${string}`;

  // If poolId is zero, registry doesn't know about this pool
  if (poolIdFromChain === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    return {
      poolKey: POOL_KEY as PoolKey,
      poolId: poolIdParam,
      isCustom: true,
      isLoading: false,
      notFound: true,
    };
  }

  return {
    poolKey: {
      currency0,
      currency1,
      fee: fee || DYNAMIC_FEE_FLAG,
      tickSpacing: tickSpacing || 60,
      hooks,
    },
    poolId: poolIdParam,
    isCustom: true,
    isLoading: false,
    notFound: false,
  };
}
