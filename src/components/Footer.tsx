import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-shit-brown/10 border-t border-shit-brown/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">💩</span>
              <span className="text-lg font-bold text-glass">Shitscreener</span>
            </div>
            <p className="text-shit-medium text-sm">
              Track Solana meme token prices, volume, and liquidity. Part of the Shitter ecosystem.
            </p>
          </div>

          {/* Ecosystem Links */}
          <div>
            <h3 className="text-cream font-bold mb-4">Ecosystem</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-shit-medium hover:text-glass transition-colors">
                  Screener
                </Link>
              </li>
              <li>
                <a
                  href="https://launch.shitter.io"
                  className="text-shit-medium hover:text-glass transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Launch Token
                </a>
              </li>
              <li>
                <a
                  href="https://social.shitter.io"
                  className="text-shit-medium hover:text-glass transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Shitter Social
                </a>
              </li>
              <li>
                <a
                  href="https://www.shitter.io"
                  className="text-shit-medium hover:text-glass transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Landing
                </a>
              </li>
            </ul>
          </div>

          {/* External Links */}
          <div>
            <h3 className="text-cream font-bold mb-4">External</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://dexscreener.com"
                  className="text-shit-medium hover:text-glass transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DexScreener
                </a>
              </li>
              <li>
                <a
                  href="https://geckoterminal.com"
                  className="text-shit-medium hover:text-glass transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GeckoTerminal
                </a>
              </li>
              <li>
                <a
                  href="https://solana.com"
                  className="text-shit-medium hover:text-glass transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solana
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-shit-brown/30 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-shit-medium">
          <p>© 2026 Shitter. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Built with Next.js + Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
