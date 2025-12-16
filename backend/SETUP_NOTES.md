# Backend Setup Notes

## Dependencies

### Raydium SDK v2

The `@raydium-io/raydium-sdk-v2` package is **not yet published to npm**. 

This implementation uses the **Raydium Transaction API** directly instead, which provides the same functionality without requiring the SDK package.

**API Endpoints Used:**
- `https://transaction-v1.raydium.io/compute/swap-base-in` - Get swap quotes
- `https://transaction-v1.raydium.io/transaction/swap-base-in` - Execute swaps
- `https://api-v3.raydium.io/main/priority-fee` - Get priority fees

**Documentation:** https://docs.raydium.io/raydium/trading/trade-api

### Installation

```bash
npm install
```

All other dependencies will install correctly.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Solana RPC (required for Raydium)
RAYDIUM_RPC_URL=https://api.mainnet-beta.solana.com

# Jupiter API (optional, has free tier)
JUPITER_API_KEY=your_key_here

# Binance API (optional)
BINANCE_API_KEY=your_key_here
BINANCE_API_SECRET=your_secret_here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trading_platform
DB_USER=postgres
DB_PASSWORD=your_password
```

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Notes

- The Raydium service works without the SDK by using their public API
- Jupiter API has a free tier for development
- Binance API is optional for testing
- All services have mock/fallback modes for development
