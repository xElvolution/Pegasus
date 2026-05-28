"use client";

import { useEffect, useRef } from "react";

export function BackgroundEffects() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let rafId = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Dot grid backdrop */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(154, 101, 255, 0.18) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
        }}
      />

      {/* Cursor spotlight */}
      <div
        ref={spotlightRef}
        className="fixed top-0 left-0 w-[700px] h-[700px] pointer-events-none z-[1] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(154, 101, 255, 0.10) 0%, rgba(124, 45, 240, 0.04) 35%, transparent 70%)",
          transform: "translate(-50%, -50%)",
        }}
      />
    </>
  );
}
