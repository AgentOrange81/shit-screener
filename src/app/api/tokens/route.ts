import { NextResponse } from 'next/server';

interface ShitterToken {
  symbol: string;
  name: string;
  address: string;
  created_at: string;
}

interface GeckoTerminalToken {
  id: string;
  type: string;
  attributes: {
    address: string;
    name: string;
    symbol: string;
    price_usd: string;
    fdv_usd: string;
    total_reserve_in_usd: string;
    volume_usd: {
      h24: string;
    };
    market_cap_usd: string;
  };
  relationships: {
    top_pools: {
      data: Array<{
        id: string;
        type: string;
      }>;
    };
  };
}

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
      m15: { buys: number; sells: number; buyers: number; sellers: number };
      m30: { buys: number; sells: number; buyers: number; sellers: number };
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
}

interface EnrichedToken extends ShitterToken {
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
    // Fetch shitter tokens
    const tokensRes = await fetch('https://larry.tailfb3d02.ts.net/tokens', {
      next: { revalidate: 10 }
    });
    
    if (!tokensRes.ok) {
      throw new Error('Failed to fetch tokens');
    }
    
    const tokens: ShitterToken[] = await tokensRes.json();
    
    // Enrich each token with GeckoTerminal data
    const enrichedTokens: EnrichedToken[] = await Promise.all(
      tokens.map(async (token) => {
        try {
          // First, get token info to find top pools
          const tokenRes = await fetch(
            `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${token.address}?include=top_pools`,
            { next: { revalidate: 10 } }
          );
          
          let topPoolAddress: string | null = null;
          let tokenPriceUsd: string | null = null;
          
          if (tokenRes.ok) {
            const tokenData: { data: GeckoTerminalToken; included?: GeckoTerminalPool[] } = await tokenRes.json();
            tokenPriceUsd = tokenData.data.attributes.price_usd || null;
            
            // Get the first/top pool from the relationships
            const topPool = tokenData.data.relationships.top_pools.data[0];
            if (topPool) {
              topPoolAddress = topPool.id.replace('solana_', '');
            }
            
            // Also check included pools for more details
            if (tokenData.included && tokenData.included.length > 0) {
              const firstPool = tokenData.included[0];
              if (firstPool.type === 'pool') {
                topPoolAddress = firstPool.id.replace('solana_', '');
              }
            }
          }
          
          // If we have a pool address, fetch the full pool data
          let poolData: GeckoTerminalPool | null = null;
          if (topPoolAddress) {
            try {
              const poolRes = await fetch(
                `https://api.geckoterminal.com/api/v2/networks/solana/pools/${topPoolAddress}`,
                { next: { revalidate: 10 } }
              );
              
              if (poolRes.ok) {
                const poolResponse: { data: GeckoTerminalPool } = await poolRes.json();
                poolData = poolResponse.data;
              }
            } catch (e) {
              // Ignore pool fetch errors
            }
          }
          
          // If we have a token price but no pool data, use token-level data
          if (!poolData && tokenPriceUsd) {
            // Need to re-fetch to get FDV since it's on the token response
            let fdv: number | null = null;
            try {
              const tokenRes2 = await fetch(
                `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${token.address}`,
                { next: { revalidate: 10 } }
              );
              if (tokenRes2.ok) {
                const tokenData2: { data: { attributes: { fdv_usd: string } } } = await tokenRes2.json();
                fdv = parseFloat(tokenData2.data.attributes.fdv_usd || '0');
              }
            } catch (e) {
              // Ignore
            }
            return {
              ...token,
              priceUsd: tokenPriceUsd,
              priceNative: null,
              priceChange24h: 0,
              priceChange1h: 0,
              priceChange5m: 0,
              volume24h: 0,
              volume6h: 0,
              volume1h: 0,
              volume5m: 0,
              liquidity: null,
              marketCap: null,
              fdv: fdv,
              buys24h: 0,
              sells24h: 0,
              buys6h: 0,
              sells6h: 0,
              buys1h: 0,
              sells1h: 0,
              buys5m: 0,
              sells5m: 0,
              pairAddress: null,
              dexId: null,
              pairCreatedAt: null,
            };
          }
          
          // Use pool data if available
          if (poolData) {
            const pool = poolData;
            
            // Parse transaction volumes
            const txns = pool.attributes.transactions;
            const vols = pool.attributes.volume_usd;
            
            return {
              ...token,
              priceUsd: pool.attributes.base_token_price_usd || tokenPriceUsd,
              priceNative: null,
              priceChange24h: parseFloat(pool.attributes.price_change_percentage.h24) || 0,
              priceChange1h: parseFloat(pool.attributes.price_change_percentage.h1) || 0,
              priceChange5m: parseFloat(pool.attributes.price_change_percentage.m5) || 0,
              volume24h: parseFloat(vols.h24) || 0,
              volume6h: parseFloat(vols.h6) || 0,
              volume1h: parseFloat(vols.h1) || 0,
              volume5m: parseFloat(vols.m5) || 0,
              liquidity: parseFloat(pool.attributes.reserve_in_usd) || null,
              marketCap: pool.attributes.market_cap_usd ? parseFloat(pool.attributes.market_cap_usd) : null,
              fdv: pool.attributes.fdv_usd ? parseFloat(pool.attributes.fdv_usd) : null,
              buys24h: txns.h24.buys || 0,
              sells24h: txns.h24.sells || 0,
              buys6h: txns.h6.buys || 0,
              sells6h: txns.h6.sells || 0,
              buys1h: txns.h1.buys || 0,
              sells1h: txns.h1.sells || 0,
              buys5m: txns.m5.buys || 0,
              sells5m: txns.m5.sells || 0,
              pairAddress: pool.attributes.address,
              dexId: 'geckoterminal',
              pairCreatedAt: pool.attributes.pool_created_at ? new Date(pool.attributes.pool_created_at).getTime() : null,
            };
          }
          
          // Fallback if no pool data
          return {
            ...token,
            priceUsd: tokenPriceUsd,
            priceNative: null,
            priceChange24h: 0,
            priceChange1h: 0,
            priceChange5m: 0,
            volume24h: 0,
            volume6h: 0,
            volume1h: 0,
            volume5m: 0,
            liquidity: null,
            marketCap: null,
            fdv: null,
            buys24h: 0,
            sells24h: 0,
            buys6h: 0,
            sells6h: 0,
            buys1h: 0,
            sells1h: 0,
            buys5m: 0,
            sells5m: 0,
            pairAddress: null,
            dexId: null,
            pairCreatedAt: null,
          };
        } catch (err) {
          console.error(`Error fetching GeckoTerminal data for ${token.address}:`, err);
          return {
            ...token,
            priceUsd: null,
            priceNative: null,
            priceChange24h: 0,
            priceChange1h: 0,
            priceChange5m: 0,
            volume24h: 0,
            volume6h: 0,
            volume1h: 0,
            volume5m: 0,
            liquidity: null,
            marketCap: null,
            fdv: null,
            buys24h: 0,
            sells24h: 0,
            buys6h: 0,
            sells6h: 0,
            buys1h: 0,
            sells1h: 0,
            buys5m: 0,
            sells5m: 0,
            pairAddress: null,
            dexId: null,
            pairCreatedAt: null,
          };
        }
      })
    );
    
    // Sort by volume (highest first)
    enrichedTokens.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
    
    return NextResponse.json(enrichedTokens);
  } catch (error) {
    console.error('Error in /api/tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500 }
    );
  }
}