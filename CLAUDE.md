# CLAUDE.md - Shitscreener

Token price tracking dashboard (DexScreener clone).

## Project
- **URL:** screener.shitter.io (separate subdomain deployment)
- **Repo:** https://github.com/AgentOrange81/shit-screener
- **Tech:** Next.js 16, TypeScript, Tailwind
- **Deployed:** ✅ Vercel
- **Architecture:** Standalone app, separate from main shitter.io

---

## Features (MVP)

### Core
1. **Token List** - Table of all shitter tokens with live prices
2. **Search** - Find token by address/symbol
3. **Token Detail Page** - Charts, trades, pair info

### Data Points Per Token
- Price (USD + SOL)
- 24h Change (%)
- Volume
- Liquidity
- Market Cap
- FDV
- Buy/Sell tx count (5m, 1h, 6h, 24h)
- Pair age
- Boost status

---

## Data Source: DexScreener API (Free)

### Endpoints (Rate: 300 req/min)

**1. Get token pairs by address**
```
GET https://api.dexscreener.com/token-pairs/v1/{chainId}/{tokenAddress}
```

**2. Get token profiles**
```
GET https://api.dexscreener.com/tokens/v1/{chainId}/{tokenAddresses}
```

**3. Search pairs**
```
GET https://api.dexscreener.com/latest/dex/search?q={query}&chainId=solana
```

**4. Get single pair**
```
GET https://api.dexscreener.com/latest/dex/pairs/{chainId}/{pairId}
```

### Supported Chains
`solana`, `ethereum`, `bsc`, `base`, `avalanche`, `polygon`, `arbitrum`, `optimism`, and more.

### Response Shape
```json
{
  "chainId": "solana",
  "dexId": "pumpswap",
  "pairAddress": "...",
  "baseToken": {
    "address": "...",
    "name": "Bobby The Cat",
    "symbol": "BTC"
  },
  "quoteToken": {
    "address": "So11111111111111111111111111111111111111112",
    "name": "Wrapped SOL",
    "symbol": "SOL"
  },
  "priceNative": "0.0001138",
  "priceUsd": "0.01694",
  "txns": {
    "m5": { "buys": 51, "sells": 117 },
    "h1": { "buys": 996, "sells": 1042 },
    "h6": { "buys": 5813, "sells": 4525 },
    "h24": { "buys": 23145, "sells": 20659 }
  },
  "volume": { "h24": 5660277.98, "h6": 1028249.73, "h1": 211612.76, "m5": 14427.5 },
  "priceChange": { "m5": 5.09, "h1": 27.86, "h6": 117, "h24": 152 },
  "liquidity": { "usd": 469656.26 },
  "fdv": 16946619,
  "marketCap": 16946619,
  "pairCreatedAt": 1751316067000,
  "info": {
    "imageUrl": "https://...",
    "websites": [{ "label": "Website", "url": "https://..." }],
    "socials": [{ "type": "twitter", "url": "https://x.com/..." }]
  }
}
```

---

## Token Source

Shitter tokens are stored in:
- **Local:** `~/vanity-api/tokens.json`
- **API:** `https://larry.tailfb3d02.ts.net/tokens`

Use shitter token addresses to query DexScreener API for price data.

---

## UI Design

### Theme (Gold/Shit)
```css
--gold: #D4AF37
--gold-light: #E5C76B
--shit-darker: #1a1a1a
--shit-dark: #2d2d2d
--shit: #3d3d3d
--shit-light: #5a5a5a
--cream: #f5f5dc
```

### Layout
- Dark theme (shit-darker bg)
- Gold accents for prices/buttons
- Table layout for token list
- Sparkline or TradingView chart on detail page

### Components
- TokenTable - sortable columns
- TokenRow - individual token display
- PriceChange - colored +/-
- TokenSearch - search input
- PairChart - price history (use lightweight-charts or TradingView)

---

## Implementation Priority

1. **Setup** - Install deps (lightweight-charts for charts)
2. **API Route** - `/api/tokens` fetches from shitter + enriches with DexScreener
3. **Token List Page** - `/tokens` with table
4. **Search** - Filter tokens
5. **Detail Page** - `/token/[address]` with chart + details

---

## Dependencies

```bash
npm install lightweight-charts @solana/web3.js
```

---

## Notes
- DexScreener API is free, no key needed
- Rate limit: 300/min (plenty for MVP)
- Cache responses server-side (5-10s TTL) to reduce API calls
- Start with Solana-only, add chains later
- Link to DexScreener for full charts (or build incrementally)

---
*Updated 2026-03-14*