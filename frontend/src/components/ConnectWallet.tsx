"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectWallet() {
  return (
    <ConnectButton
      label="Connect"
      showBalance={false}
      chainStatus="icon"
      accountStatus="address"
    />
  );
}
