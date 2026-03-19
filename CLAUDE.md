# CLAUDE.md - Shitscreener

**Solana memecoin analytics dashboard** (DexScreener-inspired).

## Project
- **URL:** screener.shitter.io
- **Repo:** https://github.com/AgentOrange81/shit-screener
- **Stack:** Next.js 16, TypeScript, Tailwind 4, lightweight-charts
- **Deployed:** ✅ Vercel (auto-deploy on push to main)

---

## Architecture

```
shit-screener/
├── src/app/
│   ├── page.tsx              # Main token list (sortable table)
│   ├── token/[address]/      # Token detail page (chart + stats)
│   └── api/
│       ├── tokens/route.ts    # GET /api/tokens — token list with prices
│       └── candles/route.ts  # GET /api/candles?address=X&timeframe=15 — OHLCV data
├── src/components/
│   ├── Navbar.tsx
│   └── Footer.tsx
└── CLAUDE.md
```

---

## Data Sources

### Primary: GeckoTerminal API (free, no key)
- **Token list:** `GET https://api.geckoterminal.com/api/v2/networks/solana/pools?sort=h24_volume_usd_desc&page=1`
- **Token info:** `GET https://api.geckoterminal.com/api/v2/networks/solana/tokens/{address}?include=top_pools`
- **OHLCV:** `GET https://api.geckoterminal.com/api/v2/networks/solana/pools/{pool}/ohlcv/{timeframe}?aggregate=N&limit=100`
- **Rate limit:** Unknown (use caching, be respectful)
- **Cache:** 10-60s revalidate via `next: { revalidate: N }`

### Enrichment: DexScreener API (free, no key)
- **Social links:** `GET https://api.dexscreener.com/tokens/v1/solana/{addresses}` (batch up to 30)
- **Fallback candles:** When GeckoTerminal lacks history, fetch price from DexScreener then generate mock OHLCV
- **Cache:** 60s revalidate

---

## Features

### Implemented ✅
| Feature | Status |
|---------|--------|
| Token list with live prices | ✅ |
| Sortable columns (volume, market cap, change) | ✅ |
| 24h/6h/1h/5m buy/sell tx counts | ✅ |
| Social links (Twitter, Telegram, Website) | ✅ |
| Copy address button | ✅ |
| Mobile responsive table | ✅ |
| Dynamic token discovery (GeckoTerminal) | ✅ |
| OHLCV charts (lightweight-charts) | ✅ |
| Multiple timeframes (15m, 1h, 4h, 1d) | ✅ |

### Data Per Token
- Price (USD), 24h/1h/5m change %
- Volume (24h, 6h, 1h, 5m)
- Liquidity (USD), Market Cap, FDV
- Buy/Sell tx count (24h, 6h, 1h, 5m)
- Pair age, DEX, social links

---

## UI Design

### Theme (Gold/Black)
```css
--gold: #D4AF37
--gold-light: #E5C76B
--shit-darker: #1a1a1a
--shit-dark: #2d2d2d
--shit: #3d3d3d
--shit-light: #5a5a5a
--cream: #f5f5dc
```

### Color Signals
| Change | Color |
|--------|-------|
| Positive | Green (#22c55e) |
| Negative | Red (#ef4444) |
| Neutral | Gray (#6b7280) |

---

## API Reference

### GET /api/tokens
Returns top 30 Solana pools by 24h volume, enriched with DexScreener social data.

```json
[{
  "symbol": "BOME",
  "name": "BOOK OF MEME",
  "address": "7GSn5...",
  "priceUsd": "0.00912",
  "priceChange24h": 15.4,
  "volume24h": 5200000,
  "liquidity": 1200000,
  "marketCap": 91000000,
  "buys24h": 12400,
  "sells24h": 9800,
  "info": { "twitter": "...", "telegram": "...", "website": "..." }
}]
```

### GET /api/candles?address={addr}&timeframe={15|60|240|1440}
Returns OHLCV data for charting.

```json
{
  "candles": [{
    "timestamp": 1710801000,
    "open": 0.009,
    "high": 0.0095,
    "low": 0.0088,
    "close": 0.0092,
    "volume": 45000
  }]
}
```

---

## Deployment

- **Vercel:** Connected to `AgentOrange81/shit-screener`
- **Branch:** `main` — auto-deploys on push
- **Env vars:** None required (all APIs are free)

---

## Development

```bash
cd ~/.openclaw/workspace/shit-screener
npm run dev      # Local dev at localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
```

---

## TODO — Features to Build

### High Priority
| # | Feature | Description |
|---|---------|-------------|
| 1 | **Token search** | Search bar to filter tokens by symbol/address/name |
| 2 | **New tokens filter** | Toggle to show only recently created tokens (pair age) |
| 3 | **Trending tokens** | Show tokens with biggest 24h volume or price change |
| 4 | **Mobile optimization** | Full mobile-friendly layout, bottom nav |
| 5 | **Pull-to-refresh** | Refresh token data on mobile |

### Medium Priority
| # | Feature | Description |
|---|---------|-------------|
| 6 | **Multi-chain support** | Add Ethereum, Base, BSC support (toggle chain) |
| 7 | **Token alerts** | Price alert system (above/below threshold) |
| 8 | **Favorites/watchlist** | Save tokens to localStorage |
| 9 | **DEX filter** | Filter by DEX (Raydium, Orca, Pump.fun, etc.) |
| 10 | **Market cap filter** | Filter by min/max market cap |

### Nice to Have
| # | Feature | Description |
|---|---------|-------------|
| 11 | **Portfolio tracker** | Enter wallet address, see holdings |
| 12 | **Copy + deploy** | One-click copy token, or deploy your own |
| 13 | **Dark/light theme** | Theme toggle |
| 14 | **Historical charts** | Longer timeframe (7d, 30d, all) |
| 15 | **Token comparison** | Compare 2-3 tokens side by side |

### Data Enrichment
| # | Feature | Description |
|---|---------|-------------|
| 16 | **Buy/sell bot detection** | Flag known bot activity |
| 17 | **Rug check** | Show rug risk indicators (honeypot, owner %) |
| 18 | **Top holders %** | Show holder concentration |
| 19 | **Volume anomaly detection** | Alert on unusual volume spikes |

---

## Recent Commits
- `ad9116f` — Fix page title format
- `9f5b39d` — GeckoTerminal sort param fix
- `b1546b1` — Mobile responsive table
- `81d7804` — Social links via DexScreener enrichment
- `03cebd7` — Copy address button
- `da999e2` — Dynamic token discovery + nav + footer
- `f05ebcc` — Real market cap from DexScreener

---
*Updated 2026-03-19*
