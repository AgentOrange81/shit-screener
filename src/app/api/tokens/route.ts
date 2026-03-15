import { NextResponse } from 'next/server';

interface GeckoTerminalPool {
  id: string;
  type: string;
  attributes: {
    base_token_price_usd: string;
    address: string;
    name: string;
    pool_created_at: string;
    fdv_usd: string;
    market_cap_usd: string | null;
    price_change_percentage: {
      m5: string;
      m15: string;
      m30: string;
      h1: string;
      h6: string;
      h24: string;
    };
    transactions: {
      m5: { buys: number; sells: number; buyers: number; sellers: number };
      h1: { buys: number; sells: number; buyers: number; sellers: number };
      h6: { buys: number; sells: number; buyers: number; sellers: number };
      h24: { buys: number; sells: number; buyers: number; sellers: number };
    };
    volume_usd: {
      m5: string;
      m15: string;
      m30: string;
      h1: string;
      h6: string;
      h24: string;
    };
    reserve_in_usd: string;
  };
  relationships: {
    base_token: {
      data: {
        id: string;
        symbol: string;
        name: string;
      };
    };
    dex: {
      data: {
        id: string;
      };
    };
  };
}

interface EnrichedToken {
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

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch top pools from GeckoTerminal directly
    const poolsRes = await fetch(
      'https://api.geckoterminal.com/api/v2/networks/solana/pools?page=1&sort=h24_volume_usd_desc',
      { next: { revalidate: 10 } }
    );
    
    if (!poolsRes.ok) {
      throw new Error(`GeckoTerminal API error: ${poolsRes.status}`);
    }
    
    const poolsData = await poolsRes.json();
    const pools: GeckoTerminalPool[] = poolsData.data;
    
    // Transform to our format
    const enrichedTokens: EnrichedToken[] = pools.map((pool) => {
      const attrs = pool.attributes;
      const baseToken = pool.relationships.base_token.data;
      
      return {
        symbol: baseToken.symbol || attrs.name.split('/')[0].trim(),
        name: baseToken.name || attrs.name,
        address: baseToken.id.replace('solana_', ''),
        priceUsd: attrs.base_token_price_usd,
        priceNative: null,
        priceChange24h: parseFloat(attrs.price_change_percentage.h24) || 0,
        priceChange1h: parseFloat(attrs.price_change_percentage.h1) || 0,
        priceChange5m: parseFloat(attrs.price_change_percentage.m5) || 0,
        volume24h: parseFloat(attrs.volume_usd.h24) || 0,
        volume6h: parseFloat(attrs.volume_usd.h6) || 0,
        volume1h: parseFloat(attrs.volume_usd.h1) || 0,
        volume5m: parseFloat(attrs.volume_usd.m5) || 0,
        liquidity: parseFloat(attrs.reserve_in_usd) || null,
        marketCap: attrs.market_cap_usd ? parseFloat(attrs.market_cap_usd) : null,
        fdv: parseFloat(attrs.fdv_usd) || null,
        buys24h: attrs.transactions.h24.buys,
        sells24h: attrs.transactions.h24.sells,
        buys6h: attrs.transactions.h6.buys,
        sells6h: attrs.transactions.h6.sells,
        buys1h: attrs.transactions.h1.buys,
        sells1h: attrs.transactions.h1.sells,
        buys5m: attrs.transactions.m5.buys,
        sells5m: attrs.transactions.m5.sells,
        pairAddress: attrs.address,
        dexId: pool.relationships.dex.data.id,
        pairCreatedAt: new Date(attrs.pool_created_at).getTime(),
      };
    });
    
    return NextResponse.json(enrichedTokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500 }
    );
  }
}