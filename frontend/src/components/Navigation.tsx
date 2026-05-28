"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "./ConnectWallet";

const links = [
  { href: "/#signals", label: "SIGNALS" },
  { href: "/swap", label: "SWAP" },
  { href: "/pool", label: "POOL" },
  { href: "/dashboard", label: "DASHBOARD" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-5 flex items-center justify-between backdrop-blur-sm bg-pegasus-dark/60 border-b border-white/5">
      <Link
        href="/"
        className="font-serif text-xl tracking-widest uppercase font-light"
      >
        Pegasus
      </Link>
      <div className="flex items-center gap-6 md:gap-10">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[10px] md:text-xs tracking-ultrawide uppercase transition-colors duration-300 font-sans ${
                isActive
                  ? "text-purple-glow"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <div className="hidden md:block">
          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
}
