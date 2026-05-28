"use client";

import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { xLayerTestnet } from "@/lib/chains";

const wagmiConfig = createConfig({
  chains: [xLayerTestnet],
  transports: {
    [xLayerTestnet.id]: http("https://testrpc.xlayer.tech"),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

  if (!privyAppId) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#9a65ff",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        loginMethods: ["email", "wallet", "google", "twitter"],
        defaultChain: xLayerTestnet,
        supportedChains: [xLayerTestnet],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <ChainEnforcer>{children}</ChainEnforcer>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

import { useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

function ChainEnforcer({ children }: { children: ReactNode }) {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  useEffect(() => {
    if (!authenticated || wallets.length === 0) return;
    const wallet = wallets[0];
    wallet.switchChain(xLayerTestnet.id).catch((err) => {
      console.error("Failed to switch to X Layer Testnet:", err);
    });
  }, [authenticated, wallets]);

  return <>{children}</>;
}
