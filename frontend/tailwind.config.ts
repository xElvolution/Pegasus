import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pegasus: {
          dark: "#060610",
          deeper: "#0a0a1a",
          surface: "#111125",
        },
        purple: {
          glow: "#9a65ff",
          deep: "#7c2df0",
          dim: "#5620a4",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-space)", "Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        hero: "clamp(5rem, 14vw, 11rem)",
        "hero-sm": "clamp(2.5rem, 8vw, 5rem)",
      },
      letterSpacing: {
        widest: "0.2em",
        ultrawide: "0.3em",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".text-glow-purple": {
          "text-shadow":
            "0 0 40px rgba(154, 101, 255, 0.3), 0 0 80px rgba(154, 101, 255, 0.1)",
        },
        ".box-glow-purple": {
          "box-shadow":
            "0 0 30px rgba(124, 45, 240, 0.15), inset 0 0 30px rgba(124, 45, 240, 0.05)",
        },
      });
    }),
  ],
};

export default config;
