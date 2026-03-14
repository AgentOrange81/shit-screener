'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';

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
  liquidity: number | null;
  marketCap: number | null;
  fdv: number | null;
  buys24h: number;
  sells24h: number;
  pairAddress: string | null;
  dexId: string | null;
}

function formatNumber(num: number | null | undefined, decimals = 2): string {
  if (num === null || num === undefined) return '-';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
  return `$${num.toFixed(decimals)}`;
}

function formatPrice(price: string | null): string {
  if (!price) return '$0.00';
  const num = parseFloat(price);
  if (num === 0) return '$0.00';
  if (num < 0.00001) return `$${num.toExponential(2)}`;
  if (num < 0.01) return `$${num.toFixed(6)}`;
  if (num < 1) return `$${num.toFixed(4)}`;
  return `$${num.toFixed(2)}`;
}

// Generate mock candlestick data for demo
function generateMockCandles(basePrice: number): CandlestickData[] {
  const candles: CandlestickData[] = [];
  let price = basePrice * 0.8;
  const now = Math.floor(Date.now() / 1000);
  const dayAgo = now - 24 * 60 * 60;
  const interval = 15 * 60; // 15 min candles
  
  for (let t = dayAgo; t <= now; t += interval) {
    const volatility = price * 0.02;
    const open = price;
    const close = open + (Math.random() - 0.48) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({
      time: t as Time,
      open,
      high,
      low,
      close,
    });
    
    price = close;
  }
  
  return candles;
}

export default function TokenPage({ params }: { params: { address: string } }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tokens`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const found = data.find((t: Token) => t.address === params.address);
        if (!found) throw new Error('Token not found');
        setToken(found);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.address]);

  useEffect(() => {
    if (!chartContainerRef.current || !token?.priceUsd) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#f5f5dc',
      },
      grid: {
        vertLines: { color: '#2d2d2d' },
        horzLines: { color: '#2d2d2d' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // @ts-ignore - lightweight-charts v5 typing issue
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#D4AF37',
      downColor: '#ff4444',
      borderUpColor: '#D4AF37',
      borderDownColor: '#ff4444',
      wickUpColor: '#D4AF37',
      wickDownColor: '#ff4444',
    });

    const basePrice = parseFloat(token.priceUsd) || 0.01;
    const candles = generateMockCandles(basePrice);
    candlestickSeries.setData(candles);

    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [token?.priceUsd]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error || 'Token not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <a href="/tokens" className="text-gold hover:text-gold-light mb-4 inline-block">
          ← Back to Tokens
        </a>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-cream">{token.name}</h1>
          <p className="text-gold text-xl">{token.symbol}</p>
          <p className="text-shit-light text-sm">{token.address}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-shit-dark p-4 rounded">
            <div className="text-shit-light text-sm">Price</div>
            <div className="text-3xl text-cream">{formatPrice(token.priceUsd)}</div>
            <div className="text-shit-light text-sm">SOL: {token.priceNative || '-'}</div>
          </div>
          
          <div className="bg-shit-dark p-4 rounded">
            <div className="text-shit-light text-sm">24h Change</div>
            <div className={`text-3xl ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
            </div>
            <div className="text-shit-light text-sm">1h: {token.priceChange1h >= 0 ? '+' : ''}{token.priceChange1h?.toFixed(1) || 0}%</div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-cream mb-4">Price Chart</h2>
          <div ref={chartContainerRef} className="w-full bg-shit-darker rounded" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-shit-dark p-4 rounded">
            <div className="text-shit-light text-sm">24h Volume</div>
            <div className="text-cream font-bold">{formatNumber(token.volume24h)}</div>
          </div>
          
          <div className="bg-shit-dark p-4 rounded">
            <div className="text-shit-light text-sm">Liquidity</div>
            <div className="text-cream font-bold">{formatNumber(token.liquidity)}</div>
          </div>
          
          <div className="bg-shit-dark p-4 rounded">
            <div className="text-shit-light text-sm">Market Cap</div>
            <div className="text-cream font-bold">{formatNumber(token.marketCap)}</div>
          </div>
          
          <div className="bg-shit-dark p-4 rounded">
            <div className="text-shit-light text-sm">FDV</div>
            <div className="text-cream font-bold">{formatNumber(token.fdv)}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-shit-dark p-4 rounded">
            <div className="text-shit-light text-sm">24h Buys</div>
            <div className="text-green-400 font-bold">{token.buys24h.toLocaleString()}</div>
          </div>
          
          <div className="bg-shit-dark p-4 rounded">
            <div className="text-shit-light text-sm">24h Sells</div>
            <div className="text-red-400 font-bold">{token.sells24h.toLocaleString()}</div>
          </div>
        </div>

        {token.pairAddress && (
          <div className="mt-6">
            <a 
              href={`https://dexscreener.com/solana/${token.pairAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold-light"
            >
              View on DexScreener →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}