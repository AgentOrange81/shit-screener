import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "💩 Shitscreener",
  description: "Track Solana token prices, volume, and liquidity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
        
        {/* Footer */}
        <footer className="bg-shit-darker text-shit-medium py-8 md:py-10 px-4 md:px-6 border-t border-shit-brown/30 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-glass font-bold text-xl flex items-center gap-2">
              <span className="text-3xl">💩</span> 
              <span className="hidden sm:inline">SHITSCREENER</span>
            </div>
            <div className="flex gap-6 md:gap-8 text-sm">
              <a href="https://launch.shitter.io" className="hover:text-glass transition-colors">
                Launch
              </a>
              <a href="https://social.shitter.io" className="hover:text-glass transition-colors">
                Social
              </a>
              <a href="https://shitter.io" className="hover:text-glass transition-colors">
                Main
              </a>
            </div>
            <div className="text-sm text-shit-medium">
              😂 2026 Shitter. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}