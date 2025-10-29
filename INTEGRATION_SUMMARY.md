# Linera Integration Fixes Summary

## What Was Wrong

### 1. **Backend Tried to Proxy Linera via HTTP**
   - **Wrong**: `LineraClient.ts` made HTTP POST requests to `/execute` and `/query` endpoints
   - **Why Wrong**: Linera doesn't expose HTTP REST APIs
   - **Reality**: Linera uses GraphQL over a specialized client library

### 2. **Missing Linera Client Package**
   - **Problem**: Frontend didn't have `@linera/client` dependency
   - **Impact**: Couldn't connect to Linera at all

### 3. **Architectural Misunderstanding**
   - **Wrong**: Backend → HTTP → Linera
   - **Correct**: Frontend → Linera WASM Client → GraphQL → Validators
   - **Correct (Backend)**: Backend → Shell Commands → Linera CLI → Validators

## What I Fixed

### 1. Added Linera Client Package
   - Added `@linera/client@0.15.3` to frontend dependencies
   - Added `graphql` and `graphql-request` for GraphQL queries

### 2. Created Proper Frontend Client
   - File: `frontend/src/lib/linera-client.ts`
   - Uses official Linera API from documentation
   - Calls `client.frontend().application(APP_ID)` to get backend
   - Uses `backend.query()` with Apollo Server POST format

### 3. Created Backend CLI Client
   - File: `backend/src/linera-client-cli.ts`
   - Uses `linera node execute` and `linera query` shell commands
   - Proper approach for backend services

### 4. Deprecated Legacy HTTP Client
   - File: `backend/src/linera-client-legacy.ts`
   - Throws errors explaining why HTTP REST doesn't work
   - Documents correct approach

### 5. Created React Hooks
   - File: `frontend/src/lib/linera-hooks.ts`
   - Provides `useLinera()`, `useSignals()`, `useStrategies()`, `useOrders()`
   - Easy React integration

### 6. Created Provider Component
   - File: `frontend/src/components/LineraProvider.tsx`
   - Wraps app with Linera context
   - Handles connection lifecycle

## How Linera Actually Works (from docs)

```
Browser (Frontend)
  ↓
Linera Client (WASM)
  ↓ syncs in real-time via gRPC-Web
Validators (Linera Network)
  ↓ executes operations
Microchain State Updated
  ↓ emits events
Validators notify Client
  ↓
Browser receives real-time updates
```

**Key Points**:
- Client runs as WASM in browser
- Syncs with validators automatically
- Provides GraphQL API via `backend.query()`
- No HTTP REST - only GraphQL
- Real-time via gRPC-Web

## Correct Integration Flow

### Frontend (User Actions)
1. User creates strategy
2. Frontend calls `lineraClient.createStrategy()`
3. Client submits to Linera via GraphQL mutation
4. Chain executes and updates state
5. Validators emit events
6. Client receives real-time notification
7. Frontend updates UI

### Backend (Tweet Processing)
1. Tweet ingestion service captures tweet
2. AI parser analyzes sentiment
3. Backend calls `lineraClient.submitSignal()` via CLI
4. Shell command `linera node execute` runs
5. Linera chain updates state
6. Relayer subscribes to events (via indexer)
7. Relayer executes trade on Solana
8. Backend calls `linera/l

