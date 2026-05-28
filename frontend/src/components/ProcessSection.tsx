"use client";

import { useEffect, useRef } from "react";

const steps = [
  {
    n: "01",
    title: "Swap arrives",
    body: "A trader submits to a Uniswap V4 pool. Pegasus is registered as the beforeSwap hook.",
  },
  {
    n: "02",
    title: "Signals read",
    body: "Volatility window. Consecutive direction count. Swaps-in-block counter. All on-chain.",
  },
  {
    n: "03",
    title: "Fee computed",
    body: "Base × volatility multiplier + MEV surge + volume spike. Clamped to [0.01%, 1.00%].",
  },
  {
    n: "04",
    title: "Override flag",
    body: "Fee returned with OVERRIDE_FEE_FLAG. Applied to this swap only. No redeploy.",
  },
];

export function ProcessSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let ScrollTriggerModule: typeof import("gsap/ScrollTrigger").default | null = null;

    const init = async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      ScrollTriggerModule = ScrollTrigger;

      if (!sectionRef.current || !meterRef.current) return;

      gsap.to(meterRef.current, {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    };

    init();

    return () => {
      if (ScrollTriggerModule) {
        ScrollTriggerModule.getAll().forEach((t) => t.kill());
      }
    };
  }, []);

  return (
    <section
      id="process"
      ref={sectionRef}
      className="relative min-h-[300vh] px-6 md:px-12"
    >
      <div className="sticky top-0 h-screen flex items-center">
        <div className="w-full max-w-6xl mx-auto grid md:grid-cols-12 gap-8 relative">
          {/* Vertical meter */}
          <div className="hidden md:block md:col-span-1 h-[60vh] relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-white/10">
              <div
                ref={meterRef}
                className="w-full rounded-full bg-purple-glow"
                style={{
                  height: "0%",
                  boxShadow: "0 0 10px rgba(154, 101, 255, 0.4)",
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-11">
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40 mb-6">
              06 / 07 · EXECUTION
            </p>
            <h2 className="font-serif text-5xl md:text-7xl font-light mb-16">
              the loop
            </h2>

            <div className="space-y-12 max-w-3xl">
              {steps.map((s, i) => (
                <div
                  key={s.n}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  className="grid grid-cols-[auto_1fr] gap-8 items-start"
                >
                  <p className="font-serif text-3xl font-light text-purple-glow/60 mt-1">
                    {s.n}
                  </p>
                  <div>
                    <h3 className="font-serif text-2xl md:text-3xl font-light mb-3">
                      {s.title}
                    </h3>
                    <p className="font-sans text-white/50 text-sm md:text-base leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute top-0 right-0">
            <p className="font-sans text-[10px] tracking-ultrawide uppercase text-white/40">
              06 / 07 · EXECUTION
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
