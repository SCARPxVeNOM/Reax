# Next.js Setup for Linera Client

## Problem

The `@linera/client` package is a WASM module that needs special configuration for Next.js bundler.

## Solution

The documentation shows you need an import map. However, Next.js doesn't support import maps in its HTML output.

## Two Options

### Option 1: Use GraphQL Directly (Recommended for now)

Since Next.js can't easily load WASM modules with import maps, use the GraphQL client instead:

```typescript
import { getLineraClient } from './lib/linera-client-graphql';
```

This directly queries the Linera service GraphQL API at `localhost:8080`.

### Option 2: Use WASM Client (Future)

When Linera's WASM client is better integrated with bundlers:

1. Add to `next.config.js`:
```javascript
module.exports = {
  webpack: (config) => {
    config.experiments = { asyncWebAssembly: true };
    return config;
  },
};
```

2. Import dynamically:
```typescript
const LineraClient = (await import('@linera/client')).default;
```

## Current Recommendation

Use `linera-client-graphql.ts` which connects directly to the Linera service's GraphQL endpoint. This is simpler and more compatible with Next.js.

