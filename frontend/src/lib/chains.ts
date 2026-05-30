import { defineChain } from "viem";

export const xLayerTestnet = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testrpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: {
      name: "OKX Explorer",
      url: "https://www.okx.com/en-us/web3/explorer/xlayer-test",
    },
  },
  testnet: true,
});

export const XLAYER_TESTNET = xLayerTestnet;

export const CONTRACTS = {
  PEGASUS_HOOK: (process.env.NEXT_PUBLIC_PEGASUS_HOOK ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  POOL_MANAGER: (process.env.NEXT_PUBLIC_POOL_MANAGER ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  POOL_SWAP_TEST: (process.env.NEXT_PUBLIC_POOL_SWAP_TEST ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  POOL_MODIFY_LIQUIDITY_TEST: (process.env.NEXT_PUBLIC_POOL_MODIFY_LIQUIDITY_TEST ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  TOKEN_A: (process.env.NEXT_PUBLIC_TOKEN_A ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  TOKEN_B: (process.env.NEXT_PUBLIC_TOKEN_B ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  PEGASUS_FACTORY: (process.env.NEXT_PUBLIC_PEGASUS_FACTORY ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

export const POOL_KEY = {
  currency0: CONTRACTS.TOKEN_A,
  currency1: CONTRACTS.TOKEN_B,
  fee: 0x800000,
  tickSpacing: 60,
  hooks: CONTRACTS.PEGASUS_HOOK,
} as const;

export const DYNAMIC_FEE_FLAG = 0x800000;
