"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

export function ConnectWallet() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fallback if Privy not configured
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return (
      <div className="px-4 py-2 text-xs font-sans tracking-ultrawide uppercase bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
        PRIVY APP ID MISSING
      </div>
    );
  }

  // Don't render until mounted (avoid SSR mismatch)
  if (!mounted) {
    return (
      <button
        disabled
        className="px-4 py-2 text-xs font-sans tracking-ultrawide uppercase bg-white/10 text-white/40 cursor-not-allowed"
      >
        LOADING...
      </button>
    );
  }

  return <ConnectWalletInner />;
}

function ConnectWalletInner() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <button
        disabled
        className="px-4 py-2 text-xs font-sans tracking-ultrawide uppercase bg-white/10 text-white/40 cursor-not-allowed"
      >
        LOADING...
      </button>
    );
  }

  if (authenticated) {
    return (
      <button
        onClick={logout}
        className="px-4 py-2 text-xs font-sans tracking-ultrawide uppercase bg-purple-glow text-pegasus-dark hover:bg-purple-glow/90 transition-colors"
      >
        {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)} · DISCONNECT
      </button>
    );
  }

  return (
    <button
      onClick={login}
      className="px-4 py-2 text-xs font-sans tracking-ultrawide uppercase bg-purple-glow text-pegasus-dark hover:bg-purple-glow/90 transition-colors"
    >
      CONNECT
    </button>
  );
}
