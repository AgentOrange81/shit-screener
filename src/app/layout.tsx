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
        {/* Navigation */}
        <nav className="bg-shit-darker/95 backdrop-blur-md text-cream px-4 py-3 md:px-6 md:py-4 sticky top-0 z-50 border-b border-shit-brown/30 shadow-glow">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/tokens" className="text-xl md:text-2xl font-bold text-glass flex items-center gap-2 group">
              <span className="text-2xl md:text-3xl group-hover:animate-pulse inline-block">💩</span> 
              <span className="hidden sm:inline">SHITSCREENER</span>
            </Link>
            
            <div className="flex gap-4 md:gap-6 items-center">
              <Link href="/tokens" className="hover:text-glass transition-colors font-medium">
                Tokens
              </Link>
              <a
                href="https://launch.shitter.io"
                className="bg-glass text-shit-darker px-4 md:px-5 py-2 rounded-lg font-bold hover:bg-gold-light hover:scale-105 transition-all shadow-glow"
              >
                Launch Token
              </a>
            </div>
          </div>
        </nav>
        
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