# Required Setup Steps

## What I Fixed

I've updated your project to use the **correct** Linera integration based on official documentation. Here's what changed and what you need to do next.

## Files Created/Modified

1. ✅ `frontend/src/lib/linera-client.ts` - Proper Linera client using official API
2. ✅ `frontend/src/lib/linera-hooks.ts` - React hooks for easy integration
3. ✅ `frontend/src/components/LineraProvider.tsx` - Context provider
4. ✅ `backend/src/linera-client-cli.ts` - Shell command client for backend
5. ✅ `backend/src/linera-client-legacy.ts` - Deprecated HTTP client (throwing errors)
6. ✅ `frontend/package.json` - Added `@linera/client`, `graphql`, `graphql-request`
7. ✅ `frontend/src/app/layout.tsx` - Added import map for Linera WASM

## Next Steps

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Deploy Linera App

You need to publish your Linera application and get the application ID:

```bash
cd linera-app

# Build the app
cargo build --release

# Deploy to local network
linera project publish-and-create

# This will print an application ID like: e7c5d06b123a75c7...
# Save this ID!
```

### 3. Configure Environment Variables

Create `.env.local` in the frontend directory:

```bash
NEXT_PUBLIC_LINERA_APP_ID=<your-application-id-here>
NEXT_PUBLIC_LINERA_SERVICE_URL=http://localhost:8080
```

### 4. Update Relayer

The relayer needs to subscribe to Linera events. Update `relayer/src/index.ts` to use:

- Linera indexer for event subscription (not polling)
- Proper DSL evaluator from parser
- Real market data fetching

### 5. Start Linera Service

```bash
# Start Linera service
linera service start

# This exposes GraphQL IDE at http://localhost:8080
```

### 6. Test Integration

```bash
# Start frontend
cd frontend && npm run dev

# Start backend
cd backend && npm run dev

# Start relayer
cd relayer && npm run dev
```

## Architecture After Fix

```
┌─────────────────────────────────────────┐
│         FRONTEND (Next.js)              │
│                                         │
│  @linera/client (WASM)                 │
│  ↓ Syncs with validators               │
│  ↓ GraphQL queries                     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      LINERA VALIDATORS                  │
│  - Accepts GraphQL mutations            │
│  - Updates microchain state             │
│  - Emits events                         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         LINERA APP (Rust)                │
│  - contract.rs: Operations              │
│  - service.rs: GraphQL queries         │
│  - state.rs: MapView storage            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│       BACKEND (Shell Commands)          │
│  linera node execute                    │
│  linera query                           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      RELAYER (Event Subscriber)         │
│  - Subscribes to Linera events          │
│  - Executes trades on Solana            │
└─────────────────────────────────────────┘
```

## Key Changes Explained

### Why HTTP REST Didn't Work

**Your original approach**:
```typescript
// This is WRONG - Linera doesn't have HTTP REST API
const response = await axios.post('/execute', {
  application_id: this.applicationId,
  operation: JSON.stringify(operation),
});
```

**Correct approach (Frontend)**:
```typescript
// Linera client (WASM) connects directly
const backend = await client.frontend().application(APP_ID);
const response = await backend.query(JSON.stringify({query: '...'}));
```

**Correct approach (Backend)**:
```typescript
// Use shell commands
const {stdout} = await execAsync('linera node execute ...');
```

### How Linera Client Works

According to official documentation:

1. **Client is WASM** - Rust compiled to WebAssembly
2. **Syncs in real-time** - Via gRPC-Web with validators
3. **Provides GraphQL** - Via `backend.query()` method
4. **No HTTP REST** - Only GraphQL queries/mutations

## Testing Checklist

- [ ] Install frontend dependencies
- [ ] Deploy Linera app (get app ID)
- [ ] Configure environment variables
- [ ] Test frontend connection to Linera
- [ ] Test signal submission
- [ ] Test strategy creation
- [ ] Test GraphQL queries
- [ ] Test real-time event subscription
- [ ] Update relayer to use indexer
- [ ] Test end-to-end flow

## Resources

- Linera Documentation: https://linera.dev
- Frontend Guide: https://linera.dev/developers/frontend/interactivity.html
- GraphQL API: http://localhost:8080 (when linera service running)
- GitHub: https://github.com/linera-io/linera-protocol

## Summary

**Before**: Backend tried to call non-existent HTTP endpoints
**After**: Frontend uses WASM client with GraphQL, Backend uses CLI commands

**Status**: ✅ Integration code fixed, needs deployment and testing

