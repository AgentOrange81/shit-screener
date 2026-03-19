import { NextResponse } from 'next/server';

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Timeframe mapping to GeckoTerminal API format
const timeframeMap: Record<string, { geckoTimeframe: string; aggregate: number }> = {
  '15': { geckoTimeframe: 'minute', aggregate: 15 },
  '60': { geckoTimeframe: 'hour', aggregate: 1 },
  '240': { geckoTimeframe: 'hour', aggregate: 4 },
  '1440': { geckoTimeframe: 'day', aggregate: 1 },
};

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const timeframe = searchParams.get('timeframe') || '15';
  
  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
  }
  
  try {
    
    const tfConfig = timeframeMap[timeframe] || timeframeMap['15'];
    
    // First, get the token info to find the top pool
    const tokenRes = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${address}?include=top_pools`,
      { next: { revalidate: 300 } }
    );
    
    let poolAddress: string | null = null;
    
    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      // Get the most liquid pool (top_pools[0])
      const topPool = tokenData.included?.find((i: { type?: string }) => i.type === 'pool');
      if (topPool) {
        poolAddress = topPool.id.replace('solana_', '');
      }
    }
    
    if (!poolAddress) {
      // No pool found, fall back to DexScreener for base price and generate mock candles
      try {
        const basePriceRes = await fetch(
          `https://api.dexscreener.com/token-pairs/v1/solana/${address}`,
          { next: { revalidate: 10 } }
        );
        
        if (basePriceRes.ok) {
          const pairs = await basePriceRes.json();
          const pair = pairs[0];
          const basePrice = parseFloat(pair?.priceUsd || '0.01') || 0.01;
          return NextResponse.json({ candles: generateFallbackCandles(basePrice, timeframe) });
        }
      } catch {
        // Ignore, return empty
      }
      return NextResponse.json({ candles: [] });
    }
    
    // Fetch OHLCV from GeckoTerminal
    const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/ohlcv/${tfConfig.geckoTimeframe}?aggregate=${tfConfig.aggregate}&limit=100`;
    
    const candlesRes = await fetch(url, { next: { revalidate: 60 } });
    
    if (!candlesRes.ok) {
      // Fallback: generate mock data for tokens without candle history
      const basePriceRes = await fetch(
        `https://api.dexscreener.com/token-pairs/v1/solana/${address}`,
        { next: { revalidate: 10 } }
      );
      
      if (basePriceRes.ok) {
        const pairs = await basePriceRes.json();
        const pair = pairs[0];
        const basePrice = parseFloat(pair?.priceUsd || '0.01') || 0.01;
        return NextResponse.json({ candles: generateFallbackCandles(basePrice, timeframe) });
      }
      
      return NextResponse.json({ candles: [] });
    }
    
    const candlesData = await candlesRes.json();
    
    // Transform GeckoTerminal candle format to lightweight-charts format
    const candles: Candle[] = (candlesData.data.attributes.ohlcv_list || []).map((c: [number, string, string, string, string, string]) => ({
      timestamp: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));
    
    return NextResponse.json({ candles });
  } catch (error) {
    console.error('Error in /api/candles:', error);
    // Fallback: generate mock data using the timeframe variable from outer scope
    try {
      const basePriceRes = await fetch(
        `https://api.dexscreener.com/token-pairs/v1/solana/${address}`,
        { next: { revalidate: 10 } }
      );
      
      if (basePriceRes.ok) {
        const pairs = await basePriceRes.json();
        const pair = pairs[0];
        const basePrice = parseFloat(pair?.priceUsd || '0.01') || 0.01;
        return NextResponse.json({ candles: generateFallbackCandles(basePrice, timeframe) });
      }
    } catch {
      // Ignore, return empty
    }
    
    return NextResponse.json({ candles: [] });
  }
}

function generateFallbackCandles(basePrice: number, timeframe: string): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice * 0.8;
  const now = Math.floor(Date.now() / 1000);
  
  // Generate enough candles to fill reasonable time range
  let interval = 900; // 15 min default
  if (timeframe === '60') interval = 3600;
  if (timeframe === '240') interval = 14400;
  if (timeframe === '1440') interval = 86400;
  
  const count = 100;
  const startTime = now - count * interval;
  
  for (let i = 0; i < count; i++) {
    const t = startTime + i * interval;
    const volatility = price * 0.02;
    const open = price;
    const close = open + (Math.random() - 0.48) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.random() * 10000;
    
    candles.push({
      timestamp: t,
      open,
      high,
      low,
      close,
      volume,
    });
    
    price = close;
  }
  
  return candles;
}
