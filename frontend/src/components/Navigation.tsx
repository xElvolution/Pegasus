"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ConnectWallet } from "./ConnectWallet";

const links = [
  { href: "/#signals", label: "SIGNALS" },
  { href: "/swap", label: "SWAP" },
  { href: "/pool", label: "POOL" },
  { href: "/dashboard", label: "DASHBOARD" },
];

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 md:px-12 py-4 md:py-5 flex items-center justify-between backdrop-blur-sm bg-pegasus-dark/60 border-b border-white/5">
        <Link
          href="/"
          className="flex items-center gap-2 md:gap-3 font-serif text-lg md:text-xl tracking-widest uppercase font-light"
        >
          <Image
            src="/logo.png"
            alt="Pegasus"
            width={28}
            height={28}
            className="object-contain w-7 h-7 md:w-8 md:h-8"
            priority
          />
          <span>Pegasus</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 lg:gap-10">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[10px] lg:text-xs tracking-ultrawide uppercase transition-colors duration-300 font-sans ${
                  isActive ? "text-purple-glow" : "text-white/40 hover:text-white/70"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <ConnectWallet />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-[1px] bg-white transition-transform ${
              open ? "translate-y-[6px] rotate-45" : ""
            }`}
          />
          <span
            className={`block w-5 h-[1px] bg-white transition-opacity ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-[1px] bg-white transition-transform ${
              open ? "-translate-y-[6px] -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu drawer */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-pegasus-dark/95 backdrop-blur-md transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center min-h-screen gap-10 px-6">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`font-serif text-3xl font-light tracking-wide uppercase transition-colors ${
                  isActive ? "text-purple-glow" : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="mt-8">
            <ConnectWallet />
          </div>
        </div>
      </div>
    </>
  );
}
