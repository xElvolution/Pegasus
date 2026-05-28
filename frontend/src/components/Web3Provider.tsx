"use client";

import { ReactNode, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

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

const config = getDefaultConfig({
  appName: "Pegasus",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "pegasus-hackathon",
  chains: [xLayerTestnet],
  transports: {
    [xLayerTestnet.id]: http("https://testrpc.xlayer.tech"),
  },
  ssr: true,
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#9a65ff", borderRadius: "none" })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
