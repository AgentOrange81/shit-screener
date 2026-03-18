import { NextResponse } from 'next/server';

interface GeckoTerminalPool {
  id: string;
  type: string;
  attributes: {
    name: string;
    base_token_price_usd: string | null;
    price_change_percentage: {
      h24: string | null;
      h1: string | null;
      m5: string | null;
    };
    volume_usd: {
      h24: string | null;
      h6: string | null;
      h1: string | null;
      m5: string | null;
    };
    liquidity: {
      usd: string | null;
    };
    market_cap_usd: string | null;
    fdv_usd: string | null;
    transactions: {
      h24: { buys: number; sells: number };
      h6: { buys: number; sells: number };
      h1: { buys: number; sells: number };
      m5: { buys: number; sells: number };
    };
    pair_address: string;
    dex_id: string;
    base_token: {
      address: string;
      name: string;
      symbol: string;
    };
    quote_token: {
      address: string;
      name: string;
      symbol: string;
    };
    pool_created_at: string;
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
  info?: {
    imageUrl?: string;
    telegram?: string;
    twitter?: string;
    website?: string;
  };
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch top pools from GeckoTerminal (sorted by 24h volume, descending)
    const geckoRes = await fetch(
      'https://api.geckoterminal.com/api/v2/networks/solana/pools?sort=-h24_volume_usd&page=1',
      { next: { revalidate: 10 } }
    );

    if (!geckoRes.ok) {
      throw new Error(`GeckoTerminal API error: ${geckoRes.status}`);
    }

    const geckoData = await geckoRes.json();
    const pools: GeckoTerminalPool[] = geckoData.data || [];

    // Transform to our enriched token format
    const enrichedTokens: EnrichedToken[] = pools.map((pool: GeckoTerminalPool) => {
      const attrs = pool.attributes;

      return {
        symbol: attrs.base_token?.symbol || '???',
        name: attrs.base_token?.name || 'Unknown',
        address: attrs.base_token?.address || 'unknown',
        priceUsd: attrs.base_token_price_usd,
        priceNative: null, // GeckoTerminal doesn't provide native price directly
        priceChange24h: attrs.price_change_percentage?.h24
          ? parseFloat(attrs.price_change_percentage.h24)
          : 0,
        priceChange1h: attrs.price_change_percentage?.h1
          ? parseFloat(attrs.price_change_percentage.h1)
          : 0,
        priceChange5m: attrs.price_change_percentage?.m5
          ? parseFloat(attrs.price_change_percentage.m5)
          : 0,
        volume24h: attrs.volume_usd?.h24 ? parseFloat(attrs.volume_usd.h24) : 0,
        volume6h: attrs.volume_usd?.h6 ? parseFloat(attrs.volume_usd.h6) : 0,
        volume1h: attrs.volume_usd?.h1 ? parseFloat(attrs.volume_usd.h1) : 0,
        volume5m: attrs.volume_usd?.m5 ? parseFloat(attrs.volume_usd.m5) : 0,
        liquidity: attrs.liquidity?.usd ? parseFloat(attrs.liquidity.usd) : null,
        marketCap: attrs.market_cap_usd ? parseFloat(attrs.market_cap_usd) : null,
        fdv: attrs.fdv_usd ? parseFloat(attrs.fdv_usd) : null,
        buys24h: attrs.transactions?.h24?.buys || 0,
        sells24h: attrs.transactions?.h24?.sells || 0,
        buys6h: attrs.transactions?.h6?.buys || 0,
        sells6h: attrs.transactions?.h6?.sells || 0,
        buys1h: attrs.transactions?.h1?.buys || 0,
        sells1h: attrs.transactions?.h1?.sells || 0,
        buys5m: attrs.transactions?.m5?.buys || 0,
        sells5m: attrs.transactions?.m5?.sells || 0,
        pairAddress: attrs.pair_address || null,
        dexId: attrs.dex_id || null,
        pairCreatedAt: attrs.pool_created_at ? new Date(attrs.pool_created_at).getTime() : null,
      };
    });

    // Filter out pools with no price data
    const validTokens = enrichedTokens.filter(t => t.priceUsd && parseFloat(t.priceUsd) > 0);

    // Enrich with social links from DexScreener (batch up to 30 addresses)
    const addresses = validTokens.slice(0, 30).map(t => t.address);
    if (addresses.length > 0) {
      try {
        const dexRes = await fetch(
          `https://api.dexscreener.com/tokens/v1/solana/${addresses.join(',')}`,
          { next: { revalidate: 60 } }
        );
        
        if (dexRes.ok) {
          const dexData = await dexRes.json();
          const tokens: any[] = dexData.tokens || [];
          
          // Create lookup map
          const socialMap = new Map<string, { imageUrl?: string; telegram?: string; twitter?: string; website?: string }>();
          tokens.forEach((t: any) => {
            if (t?.address) {
              socialMap.set(t.address, {
                imageUrl: t.info?.imageUrl,
                telegram: t.info?.telegram,
                twitter: t.info?.twitter,
                website: t.info?.website,
              });
            }
          });
          
          // Merge social data into tokens
          validTokens.forEach((token, i) => {
            const social = socialMap.get(token.address);
            if (social) {
              token.info = social;
            }
          });
        }
      } catch (err) {
        console.error('DexScreener enrichment failed:', err);
        // Continue without social data
      }
    }

    return NextResponse.json(validTokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500 }
    );
  }
}
