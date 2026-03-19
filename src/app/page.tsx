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
  pairCreatedAt: number | null;
  dexId: string | null;
}

type ViewTab = 'hot' | 'new' | 'gainers';

type SortKey = 'name' | 'symbol' | 'priceUsd' | 'priceChange24h' | 'volume24h' | 'liquidity' | 'marketCap' | 'pairCreatedAt';
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

function calculatePairAge(timestamp: number | null): string {
  if (!timestamp) return '-';
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 30) return `${Math.floor(days / 30)}mo`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return '<1h';
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
  const [viewTab, setViewTab] = useState<ViewTab>('hot');
  const [newTokensOnly, setNewTokensOnly] = useState(false);
  const [dexFilter, setDexFilter] = useState<string>('all');
  const [mcFilter, setMcFilter] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    // Initialize from localStorage during render (acceptable for initial state)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shit-screener-favorites');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
    return new Set();
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only using dynamic values after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('shit-screener-favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(address)) {
      newFavorites.delete(address);
    } else {
      newFavorites.add(address);
    }
    setFavorites(newFavorites);
  };

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

  // Get unique DEX IDs for filter dropdown
  const dexOptions = Array.from(new Set(tokens.map(t => t.dexId).filter(Boolean) as string[]))
    .sort();

  // Filter by DEX
  const filteredByDex = dexFilter === 'all'
    ? filteredTokens
    : filteredTokens.filter(t => t.dexId === dexFilter);

  // Filter by "new tokens" (created in last 7 days)
  const sevenDaysAgo = mounted ? Date.now() - (7 * 24 * 60 * 60 * 1000) : 0;
  const filteredByNew = mounted && newTokensOnly
    ? filteredByDex.filter(t => t.pairCreatedAt && t.pairCreatedAt > sevenDaysAgo)
    : filteredByDex;

  // Filter by market cap
  const mcRanges: Record<string, [number, number] | null> = {
    'all': null,
    'under1m': [0, 1e6],
    '1m-10m': [1e6, 1e7],
    '10m-100m': [1e7, 1e8],
    '100m-1b': [1e8, 1e9],
    'over1b': [1e9, Infinity],
  };
  const [mcMin, mcMax] = mcRanges[mcFilter] || [0, Infinity];
  const filteredByMc = mcFilter === 'all'
    ? filteredByNew
    : filteredByNew.filter(t => {
        const mc = t.marketCap || 0;
        return mc >= mcMin && mc < mcMax;
      });

  // Filter by favorites
  const filteredByFav = showFavoritesOnly
    ? filteredByMc.filter(t => favorites.has(t.address))
    : filteredByMc;

  // Sort based on view tab
  const sortedTokens = [...filteredByFav].sort((a, b) => {
    let aVal: string | number | null | undefined;
    let bVal: string | number | null | undefined;

    // Use tab-specific default sorting
    if (viewTab === 'gainers') {
      aVal = a.priceChange24h || 0;
      bVal = b.priceChange24h || 0;
    } else if (viewTab === 'new') {
      // Newest first
      aVal = a.pairCreatedAt || 0;
      bVal = b.pairCreatedAt || 0;
    } else {
      // Hot: use selected sort key
      aVal = a[sortKey];
      bVal = b[sortKey];
    }

    if (sortKey === 'name' || sortKey === 'symbol') {
      const aStr = String(aVal || '');
      const bStr = String(bVal || '');
      return sortDir === 'asc'
        ? aStr.toLowerCase().localeCompare(bStr.toLowerCase())
        : bStr.toLowerCase().localeCompare(aStr.toLowerCase());
    }

    aVal = aVal || 0;
    bVal = bVal || 0;
    return sortDir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
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
          {/* View Tabs */}
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {[
              { id: 'hot', label: '🔥 Hot', defaultSort: 'volume24h' as SortKey },
              { id: 'new', label: '✨ New', defaultSort: 'pairCreatedAt' as SortKey },
              { id: 'gainers', label: '📈 Gainers', defaultSort: 'priceChange24h' as SortKey },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setViewTab(tab.id as ViewTab);
                  setSortKey(tab.defaultSort);
                  setSortDir('desc');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewTab === tab.id
                    ? 'bg-glass text-shit-darker shadow-glow'
                    : 'bg-shit-brown/20 text-cream hover:bg-shit-brown/40 border border-shit-brown/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* New Tokens Toggle */}
          <div className="mb-4 flex justify-center">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={newTokensOnly}
                  onChange={(e) => setNewTokensOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-shit-brown/30 peer-checked:bg-glass rounded-full transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-cream rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
              <span className="text-cream text-sm">New tokens only (7 days)</span>
            </label>
          </div>

          {/* Favorites Toggle */}
          <div className="mb-4 flex justify-center">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-shit-brown/30 peer-checked:bg-glass rounded-full transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-cream rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
              <span className="text-cream text-sm">⭐ Favorites only ({favorites.size})</span>
            </label>
          </div>

          {/* DEX Filter */}
          {dexOptions.length > 0 && (
            <div className="mb-4 flex justify-center">
              <select
                value={dexFilter}
                onChange={(e) => setDexFilter(e.target.value)}
                className="px-4 py-2 bg-shit-brown/5 border border-shit-brown/30 rounded-xl text-cream focus:outline-none focus:border-glass focus:ring-1 focus:ring-glass transition-all cursor-pointer"
              >
                <option value="all">All DEXes</option>
                {dexOptions.map(dex => (
                  <option key={dex} value={dex}>
                    {dex.charAt(0).toUpperCase() + dex.slice(1).replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Market Cap Filter */}
          <div className="mb-4 flex justify-center">
            <select
              value={mcFilter}
              onChange={(e) => setMcFilter(e.target.value)}
              className="px-4 py-2 bg-shit-brown/5 border border-shit-brown/30 rounded-xl text-cream focus:outline-none focus:border-glass focus:ring-1 focus:ring-glass transition-all cursor-pointer"
            >
              <option value="all">All Market Caps</option>
              <option value="under1m">Under $1M</option>
              <option value="1m-10m">$1M - $10M</option>
              <option value="10m-100m">$10M - $100M</option>
              <option value="100m-1b">$100M - $1B</option>
              <option value="over1b">Over $1B</option>
            </select>
          </div>

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

          {/* Token Count */}
          <div className="mb-6 text-center">
            <p className="text-sm text-muted">
              Showing {sortedTokens.length} token{sortedTokens.length !== 1 ? 's' : ''}
            </p>
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
                    <th
                      className="py-3 px-2 md:px-4 cursor-pointer hover:text-glass transition-colors hidden xl:table-cell"
                      onClick={() => handleSort('pairCreatedAt')}
                    >
                      Age <SortIcon active={sortKey === 'pairCreatedAt'} dir={sortDir} />
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleFavorite(token.address, e)}
                            className="text-lg hover:scale-125 transition-transform focus:outline-none"
                            title={favorites.has(token.address) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {favorites.has(token.address) ? '⭐' : '☆'}
                          </button>
                          <div>
                            <div className="font-bold text-cream text-sm md:text-base">{token.name}</div>
                            <div className="text-shit-medium text-xs font-mono">{token.address.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 md:px-4 font-bold text-gold text-sm md:text-base">{token.symbol}</td>
                      <td className="py-3 px-2 md:px-4 text-cream text-sm md:text-base">{formatPrice(token.priceUsd)}</td>
                      <td className={`py-3 px-2 md:px-4 font-bold text-sm md:text-base ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {token.priceChange24h.toFixed(2)}%
                      </td>
                      <td className="py-3 px-2 md:px-4 text-cream text-sm md:text-base hidden sm:table-cell">{formatNumber(token.volume24h)}</td>
                      <td className="py-3 px-2 md:px-4 text-cream text-sm md:text-base hidden md:table-cell">{formatNumber(token.liquidity)}</td>
                      <td className="py-3 px-2 md:px-4 text-cream text-sm md:text-base hidden lg:table-cell">{formatNumber(token.marketCap)}</td>
                      <td className="py-3 px-2 md:px-4 text-cream text-sm md:text-base hidden xl:table-cell">
                        {calculatePairAge(token.pairCreatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
