import { NextResponse } from 'next/server';

interface ShitterToken {
  symbol: string;
  name: string;
  address: string;
  created_at: string;
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string | null;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number | null;
    base: number;
    quote: number;
  };
  fdv: number | null;
  marketCap: number | null;
  pairCreatedAt: number;
}

interface DexScreenerCandle {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
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
    
    // Enrich each token with DexScreener data
    const enrichedTokens: EnrichedToken[] = await Promise.all(
      tokens.map(async (token) => {
        try {
          const dsRes = await fetch(
            `https://api.dexscreener.com/token-pairs/v1/solana/${token.address}`,
            { next: { revalidate: 10 } }
          );
          
          if (!dsRes.ok) {
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
          
          const pairs: DexScreenerPair[] = await dsRes.json();
          const pair = pairs[0]; // Get the first pair (usually highest liquidity)
          
          if (!pair) {
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
          
          return {
            ...token,
            priceUsd: pair.priceUsd,
            priceNative: pair.priceNative,
            priceChange24h: pair.priceChange?.h24 || 0,
            priceChange1h: pair.priceChange?.h1 || 0,
            priceChange5m: pair.priceChange?.m5 || 0,
            volume24h: pair.volume?.h24 || 0,
            volume6h: pair.volume?.h6 || 0,
            volume1h: pair.volume?.h1 || 0,
            volume5m: pair.volume?.m5 || 0,
            liquidity: pair.liquidity?.usd || null,
            marketCap: pair.marketCap || null,
            fdv: pair.fdv || null,
            buys24h: pair.txns?.h24?.buys || 0,
            sells24h: pair.txns?.h24?.sells || 0,
            buys6h: pair.txns?.h6?.buys || 0,
            sells6h: pair.txns?.h6?.sells || 0,
            buys1h: pair.txns?.h1?.buys || 0,
            sells1h: pair.txns?.h1?.sells || 0,
            buys5m: pair.txns?.m5?.buys || 0,
            sells5m: pair.txns?.m5?.sells || 0,
            pairAddress: pair.pairAddress,
            dexId: pair.dexId,
            pairCreatedAt: pair.pairCreatedAt || null,
          };
        } catch (err) {
          console.error(`Error fetching DexScreener data for ${token.address}:`, err);
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