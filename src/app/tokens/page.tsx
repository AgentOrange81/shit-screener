'use client';

import { useState, useEffect } from 'react';

interface Token {
  symbol: string;
  name: string;
  address: string;
  priceUsd: string | null;
  priceNative: string | null;
  priceChange24h: number;
  priceChange1h: number;
  priceChange5m: number;
  volume24h: number;
  volume6h: number;
  volume1h: number;
  volume5m: number;
  liquidity: number | null;
  marketCap: number | null;
  fdv: number | null;
  buys24h: number;
  sells24h: number;
  buys6h: number;
  sells6h: number;
  buys1h: number;
  sells1h: number;
  buys5m: number;
  sells5m: number;
  pairAddress: string | null;
  dexId: string | null;
  pairCreatedAt: number | null;
}

type SortKey = 'name' | 'symbol' | 'priceUsd' | 'priceChange24h' | 'volume24h' | 'liquidity' | 'fdv' | 'marketCap';
type SortDir = 'asc' | 'desc';

function formatNumber(num: number | null | undefined, decimals = 2): string {
  if (num === null || num === undefined) return '-';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
  return `$${num.toFixed(decimals)}`;
}

function formatPrice(price: string | null): string {
  if (!price) return '-';
  const num = parseFloat(price);
  if (num === 0) return '$0.00';
  if (num < 0.00001) return `$${num.toExponential(2)}`;
  if (num < 0.01) return `$${num.toFixed(6)}`;
  if (num < 1) return `$${num.toFixed(4)}`;
  return `$${num.toFixed(2)}`;
}

export default function TokensPage() {
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
        if (data.length === 0) {
          setTokens([]);
        } else {
          setTokens(data);
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.error('Tokens fetch error:', err);
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
    t.address.includes(search)
  );

  const sortedTokens = [...filteredTokens].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    
    if (sortKey === 'name' || sortKey === 'symbol') {
      aVal = (aVal as string)?.toLowerCase() || '';
      bVal = (bVal as string)?.toLowerCase() || '';
      return sortDir === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    }
    
    aVal = aVal as number || 0;
    bVal = bVal as number || 0;
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
    <span className="ml-1">{active ? (dir === 'asc' ? '▲' : '▼') : '○'}</span>
  );

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
    <div className="min-h-screen bg-shit-darker p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-cream mb-6">
          <span className="text-glass">💩</span> Token Screener
        </h1>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-shit-brown/5 border border-shit-brown/30 rounded-lg text-cream placeholder-shit-medium focus:outline-none focus:border-glass focus:ring-1 focus:ring-glass transition-all"
          />
        </div>

        <div className="overflow-x-auto bg-shit-brown/10 border border-shit-brown/30 rounded-xl shadow-lifted">
          <table className="w-full">
            <thead>
              <tr className="border-b border-shit-brown/30 text-left text-shit-medium text-sm">
                <th className="py-3 px-2">Name</th>
                <th className="py-3 px-2">Symbol</th>
                <th 
                  className="py-3 px-2 cursor-pointer hover:text-glass transition-colors"
                  onClick={() => handleSort('priceUsd')}
                >
                  Price <SortIcon active={sortKey === 'priceUsd'} dir={sortDir} />
                </th>
                <th 
                  className="py-3 px-2 cursor-pointer hover:text-glass transition-colors"
                  onClick={() => handleSort('priceChange24h')}
                >
                  24h % <SortIcon active={sortKey === 'priceChange24h'} dir={sortDir} />
                </th>
                <th 
                  className="py-3 px-2 cursor-pointer hover:text-glass transition-colors"
                  onClick={() => handleSort('volume24h')}
                >
                  Volume <SortIcon active={sortKey === 'volume24h'} dir={sortDir} />
                </th>
                <th 
                  className="py-3 px-2 cursor-pointer hover:text-glass transition-colors"
                  onClick={() => handleSort('liquidity')}
                >
                  Liquidity <SortIcon active={sortKey === 'liquidity'} dir={sortDir} />
                </th>
                <th className="py-3 px-2">Market Cap</th>
                <th className="py-3 px-2">FDV</th>
              </tr>
            </thead>
            <tbody>
              {sortedTokens.map(token => (
                <tr 
                  key={token.address}
                  className="border-b border-shit-brown/20 hover:bg-shit-brown/20 cursor-pointer transition-colors"
                  onClick={() => window.location.href = `/token/${token.address}`}
                >
                  <td className="py-3 px-2 text-cream">{token.name}</td>
                  <td className="py-3 px-2 text-glass font-medium">{token.symbol}</td>
                  <td className="py-3 px-2 text-cream">{formatPrice(token.priceUsd)}</td>
                  <td className={`py-3 px-2 ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                  </td>
                  <td className="py-3 px-2 text-cream">{formatNumber(token.volume24h)}</td>
                  <td className="py-3 px-2 text-cream">{formatNumber(token.liquidity)}</td>
                  <td className="py-3 px-2 text-cream">{formatNumber(token.marketCap)}</td>
                  <td className="py-3 px-2 text-cream">{formatNumber(token.fdv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedTokens.length === 0 && (
          <div className="text-center py-8 text-shit-medium">No tokens found</div>
        )}
      </div>
    </div>
  );
}