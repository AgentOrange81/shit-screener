import { NextResponse } from 'next/server';

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
    // Fetch from DexScreener API
    const dexRes = await fetch(
      'https://api.dexscreener.com/latest/dex/search?q=solana',
      { next: { revalidate: 10 } }
    );
    
    if (!dexRes.ok) {
      throw new Error(`DexScreener API error: ${dexRes.status}`);
    }
    
    const dexData = await dexRes.json();
    const pairs: any[] = dexData.pairs || [];
    
    // Filter to Solana network only and sort by volume
    const solanaPairs = pairs
      .filter((p: any) => p.chainId === 'solana')
      .sort((a: any, b: any) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
      .slice(0, 50); // Top 50
    
    // Transform to our format
    const enrichedTokens: EnrichedToken[] = solanaPairs.map((pair: any) => ({
      symbol: pair.baseToken?.symbol || '???',
      name: pair.baseToken?.name || 'Unknown',
      address: pair.baseToken?.address || 'unknown',
      priceUsd: pair.priceUsd || null,
      priceNative: pair.priceNative || null,
      priceChange24h: pair.priceChange?.h24 || 0,
      priceChange1h: pair.priceChange?.h1 || 0,
      priceChange5m: pair.priceChange?.m5 || 0,
      volume24h: pair.volume?.h24 || 0,
      volume6h: pair.volume?.h6 || 0,
      volume1h: pair.volume?.h1 || 0,
      volume5m: pair.volume?.m5 || 0,
      liquidity: pair.liquidity?.usd || null,
      marketCap: null, // DexScreener doesn't provide market cap directly
      fdv: pair.fdv || null,
      buys24h: pair.txns?.h24?.buys || 0,
      sells24h: pair.txns?.h24?.sells || 0,
      buys6h: pair.txns?.h6?.buys || 0,
      sells6h: pair.txns?.h6?.sells || 0,
      buys1h: pair.txns?.h1?.buys || 0,
      sells1h: pair.txns?.h1?.sells || 0,
      buys5m: pair.txns?.m5?.buys || 0,
      sells5m: pair.txns?.m5?.sells || 0,
      pairAddress: pair.pairAddress || null,
      dexId: pair.dexId || null,
      pairCreatedAt: pair.pairCreatedAt || null,
    }));
    
    return NextResponse.json(enrichedTokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500 }
    );
  }
}
