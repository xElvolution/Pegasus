import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Web3Provider } from "@/components/Web3Provider";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pegasus · Adaptive Dynamic Fees for Uniswap V4",
  description:
    "Uniswap gave you the unicorn. We gave it wings. AI-powered dynamic fee optimization on X Layer.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/android-chrome-192x192.png", sizes: "192x192" },
      { rel: "icon", url: "/android-chrome-512x512.png", sizes: "512x512" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Pegasus · Adaptive Dynamic Fees for Uniswap V4",
    description: "Uniswap gave you the unicorn. We gave it wings. Live on X Layer testnet.",
    images: [{ url: "/banner.png", width: 1500, height: 500, alt: "Pegasus" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pegasus · Adaptive Dynamic Fees for Uniswap V4",
    description: "Uniswap gave you the unicorn. We gave it wings. Live on X Layer testnet.",
    images: ["/banner.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased bg-pegasus-dark text-white">
        <Web3Provider>
          <SmoothScrollProvider>
            <BackgroundEffects />
            <div className="noise-overlay" aria-hidden="true" />
            <div className="relative z-10">{children}</div>
          </SmoothScrollProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
