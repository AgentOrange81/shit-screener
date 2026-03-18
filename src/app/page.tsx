'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Token {
  symbol: string;
  name: string;
  address: string;
  priceUsd: string | null;
  priceChange24h: number;
  volume24h: number;
  liquidity: number | null;
  marketCap: number | null;
}

type SortKey = 'name' | 'symbol' | 'priceUsd' | 'priceChange24h' | 'volume24h' | 'liquidity' | 'marketCap';
type SortDir = 'asc' | 'desc';

function formatPrice(price: string | null): string {
  if (!price) return '-';
  const num = parseFloat(price);
  if (num === 0) return '$0.00';
  if (num < 0.00001) return `$${num.toExponential(2)}`;
  if (num < 0.01) return `$${num.toFixed(6)}`;
  if (num < 1) return `$${num.toFixed(4)}`;
  return `$${num.toFixed(2)}`;
}

function formatNumber(num: number | null | undefined, decimals = 2): string {
  if (num === null || num === undefined) return '-';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
  return `$${num.toFixed(decimals)}`;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="ml-1 text-xs">
      {active ? (dir === 'asc' ? '▲' : '▼') : '○'}
    </span>
  );
}

export default function Home() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('volume24h');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    
    fetch('/api/tokens', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid response format');
        setTokens(data);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load tokens');
      })
      .finally(() => setLoading(false));
    
    return () => controller.abort();
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredTokens = tokens.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.address.toLowerCase().includes(search.toLowerCase())
  );

  const sortedTokens = [...filteredTokens].sort((a, b) => {
    let aVal: any = a[sortKey];
    let bVal: any = b[sortKey];
    
    if (sortKey === 'name' || sortKey === 'symbol') {
      aVal = (aVal || '').toLowerCase();
      bVal = (bVal || '').toLowerCase();
      return sortDir === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    }
    
    aVal = aVal || 0;
    bVal = bVal || 0;
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-shit-darker flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-glass mx-auto mb-4"></div>
          <p className="text-cream">Loading tokens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-shit-darker flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="text-6xl mb-4">💥</div>
          <h2 className="text-xl font-bold mb-2 text-cream">Failed to Load</h2>
          <p className="text-shit-medium mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-glass hover:bg-gold text-shit-darker font-bold rounded-xl transition-all shadow-glow"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-shit-darker">
      {/* Navbar */}
      <nav className="bg-[#3d2f21]/95 backdrop-blur-md text-[#f5f0e6] px-4 py-3 md:px-6 md:py-4 sticky top-0 z-50 border-b border-[#5c4a32]/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-bold flex items-center gap-2 group">
            <span className="text-2xl md:text-3xl group-hover:animate-bounce inline-block">💩</span> 
            <span style={{ color: '#f4d03f' }}>SCREENER</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-shit text-cream py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            Hot <span className="text-gold">Tokens</span>
          </h1>
          <p className="text-lg md:text-xl text-shit-light">
            Trending Solana memecoins right now
          </p>
        </div>
      </section>

      {/* Token Table */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-6 flex justify-center">
            <input
              type="text"
              placeholder="Search by name, symbol, or address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-3 bg-shit-brown/5 border border-shit-brown/30 rounded-xl text-cream placeholder:text-shit-medium focus:outline-none focus:border-glass focus:ring-1 focus:ring-glass transition-all"
            />
          </div>

          {sortedTokens.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🐸</div>
              <h2 className="text-2xl font-bold mb-2 text-cream">No Tokens Yet</h2>
              <p className="text-shit-medium">No tokens being tracked yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-shit-brown/10 border border-shit-brown/30 rounded-xl shadow-lifted">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-shit-brown/30 text-left text-shit-medium text-xs md:text-sm">
                    <th className="py-3 px-2 md:px-4">Name</th>
                    <th className="py-3 px-2 md:px-4">Symbol</th>
                    <th 
                      className="py-3 px-2 md:px-4 cursor-pointer hover:text-glass transition-colors"
                      onClick={() => handleSort('priceUsd')}
                    >
                      Price <SortIcon active={sortKey === 'priceUsd'} dir={sortDir} />
                    </th>
                    <th 
                      className="py-3 px-2 md:px-4 cursor-pointer hover:text-glass transition-colors"
                      onClick={() => handleSort('priceChange24h')}
                    >
                      24h % <SortIcon active={sortKey === 'priceChange24h'} dir={sortDir} />
                    </th>
                    <th 
                      className="py-3 px-2 md:px-4 cursor-pointer hover:text-glass transition-colors hidden sm:table-cell"
                      onClick={() => handleSort('volume24h')}
                    >
                      Volume <SortIcon active={sortKey === 'volume24h'} dir={sortDir} />
                    </th>
                    <th 
                      className="py-3 px-2 md:px-4 cursor-pointer hover:text-glass transition-colors hidden md:table-cell"
                      onClick={() => handleSort('liquidity')}
                    >
                      Liquidity <SortIcon active={sortKey === 'liquidity'} dir={sortDir} />
                    </th>
                    <th 
                      className="py-3 px-2 md:px-4 cursor-pointer hover:text-glass transition-colors hidden lg:table-cell"
                      onClick={() => handleSort('marketCap')}
                    >
                      Market Cap <SortIcon active={sortKey === 'marketCap'} dir={sortDir} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTokens.map((token) => (
                    <tr
                      key={token.address}
                      className="border-b border-shit-brown/20 hover:bg-shit-brown/5 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/token/${token.address}`}
                    >
                      <td className="py-3 px-2 md:px-4">
                        <div className="font-bold text-cream text-sm md:text-base">{token.name}</div>
                        <div className="text-shit-medium text-xs font-mono">{token.address.slice(0, 8)}...</div>
                      </td>
                      <td className="py-3 px-2 md:px-4 font-bold text-gold text-sm md:text-base">{token.symbol}</td>
                      <td className="py-3 px-2 md:px-4 text-cream text-sm md:text-base">{formatPrice(token.priceUsd)}</td>
                      <td className={`py-3 px-2 md:px-4 font-bold text-sm md:text-base ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {token.priceChange24h.toFixed(2)}%
                      </td>
                      <td className="py-3 px-2 md:px-4 text-cream text-sm md:text-base hidden sm:table-cell">{formatNumber(token.volume24h)}</td>
                      <td className="py-3 px-2 md:px-4 text-cream text-sm md:text-base hidden md:table-cell">{formatNumber(token.liquidity)}</td>
                      <td className="py-3 px-2 md:px-4 text-cream text-sm md:text-base hidden lg:table-cell">{formatNumber(token.marketCap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-shit-darker text-shit-light py-10 md:py-12 px-4 md:px-6 border-t border-shit-dark/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gold font-bold text-xl flex items-center gap-2">
            <span className="text-3xl">💩</span> 
            <span className="hidden sm:inline">SHITTER</span>
          </div>
          <div className="flex gap-6 md:gap-8">
            <a href="#" className="hover:text-gold transition-colors text-sm md:text-base">
              Twitter
            </a>
            <a href="#" className="hover:text-gold transition-colors text-sm md:text-base">
              Telegram
            </a>
            <a href="#" className="hover:text-gold transition-colors text-sm md:text-base">
              Discord
            </a>
          </div>
          <div className="text-sm text-shit-medium">
            😂 2026 Shitter. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
