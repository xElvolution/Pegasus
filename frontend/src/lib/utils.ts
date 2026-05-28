import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFee(fee: number): string {
  return (fee / 10000).toFixed(2) + "%";
}

export function formatFeeBips(fee: number): string {
  return (fee / 100).toFixed(1) + " bps";
}

export function getFeeColor(fee: number): string {
  if (fee <= 1000) return "text-green-400";
  if (fee <= 3000) return "text-pegasus-300";
  if (fee <= 5000) return "text-yellow-400";
  return "text-red-400";
}

export function getFeeLabel(fee: number): string {
  if (fee <= 1000) return "Low";
  if (fee <= 3000) return "Normal";
  if (fee <= 5000) return "Elevated";
  return "High (MEV Protection)";
}

export function shortenAddress(address: string): string {
  return address.slice(0, 6) + "..." + address.slice(-4);
}
