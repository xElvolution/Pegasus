import Image from "next/image";

export function Footer() {
  return (
    <footer className="px-6 md:px-12 py-10 border-t border-white/5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Pegasus"
            width={20}
            height={20}
            className="object-contain opacity-60"
          />
          <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/30">
            PEGASUS
          </p>
        </div>
        <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/30">
          ADAPTIVE FEE HOOK · UNISWAP V4 · X LAYER
        </p>
        <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/30">
          HOOK THE FUTURE &copy; 2026
        </p>
      </div>
    </footer>
  );
}
