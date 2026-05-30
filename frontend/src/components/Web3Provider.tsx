"use client";

import { ReactNode, useEffect } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider as PrivyWagmiProvider, createConfig as createPrivyWagmiConfig } from "@privy-io/wagmi";
import { WagmiProvider, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { xLayerTestnet } from "@/lib/chains";

// Privy-wagmi config (used when Privy App ID is configured)
const privyWagmiConfig = createPrivyWagmiConfig({
  chains: [xLayerTestnet],
  transports: {
    [xLayerTestnet.id]: http("https://testrpc.xlayer.tech"),
  },
});

// Plain wagmi config (used as fallback when no Privy App ID — keeps build working)
const fallbackWagmiConfig = createConfig({
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
        <WagmiProvider config={fallbackWagmiConfig}>
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
        <PrivyWagmiProvider config={privyWagmiConfig}>
          <ChainEnforcer>{children}</ChainEnforcer>
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

function ChainEnforcer({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (!isConnected) return;
    if (chainId === xLayerTestnet.id) return;
    // Attempt automatic switch
    try {
      switchChain({ chainId: xLayerTestnet.id });
    } catch (err) {
      console.error("Auto-switch to X Layer failed:", err);
    }
  }, [isConnected, chainId, switchChain]);

  return <>{children}</>;
}
