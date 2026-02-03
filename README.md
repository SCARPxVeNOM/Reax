# ReaX - Microchain Social Trading Platform

<p align="center">
  <img src="https://img.shields.io/badge/Linera-Microchains-purple?style=for-the-badge" alt="Linera" />
  <img src="https://img.shields.io/badge/Solana-DEX%20Trading-00D4AA?style=for-the-badge" alt="Solana" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
</p>

**ReaX** is a social trading platform that combines **Linera microchains** for isolated strategy execution with **Solana DEX integrations** (Jupiter & Raydium) for real token swaps. Create strategies, follow top traders, and execute trades—all with on-chain verification.

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| ⛓️ **Microchain Profiles** | Create isolated on-chain identities on Linera |
| 📊 **Strategy Builder** | Visual, Image-based, or PineScript strategy creation |
| 👥 **Social Discovery** | Tinder-like swipe interface to discover and follow traders |
| 🔄 **Trade Replication** | Automatically copy trades from followed strategies |
| 💱 **DEX Integration** | Execute swaps on Jupiter & Raydium DEXs |
| 🛡️ **Safety Controls** | Position limits, stop-loss requirements, fail-safes |
| 📈 **Analytics** | Real-time leaderboards and performance tracking |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ReaX Platform                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │    Frontend     │    │     Backend     │    │  Linera Service │        │
│   │   (Next.js 14)  │◄──►│    (Express)    │◄──►│   (GraphQL)     │        │
│   │   Port 3000     │    │    Port 3001    │    │    Port 8081    │        │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│           │                      │                      │                   │
│           ▼                      ▼                      ▼                   │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                    Linera Microchain App (WASM)                  │      │
│   │                                                                  │      │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │      │
│   │  │  Strategies │  │   Orders    │  │  Trade Replication      │  │      │
│   │  │  & Signals  │  │ & DEX Swaps │  │  & Social Following     │  │      │
│   │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │      │
│   │                                                                  │      │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │      │
│   │  │   Safety    │  │  Prediction │  │  Strategy Versioning    │  │      │
│   │  │   Controls  │  │   Markets   │  │  & History              │  │      │
│   │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           External Integrations                             │
│                                                                             │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │  Jupiter DEX    │    │  Raydium DEX    │    │  Solana RPC     │        │
│   │  (Aggregator)   │    │  (AMM Pools)    │    │  (Blockchain)   │        │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                            Infrastructure                                   │
│                                                                             │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │   PostgreSQL    │    │     Redis       │    │  Linera Wallet  │        │
│   │   (Database)    │    │    (Cache)      │    │   (Keystore)    │        │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Linera Microchain Contract

The core of ReaX is a **Linera WASM smart contract** that provides:

### On-Chain Operations

| Operation | Description |
|-----------|-------------|
| `CreateStrategy` | Deploy a new trading strategy to your microchain |
| `ActivateStrategy` | Enable a strategy for live trading |
| `CreateDEXOrder` | Submit a swap order (Jupiter/Raydium) |
| `ExecuteDEXOrder` | Record swap execution with tx signature |
| `FollowStrategy` | Subscribe to another trader's strategy |
| `ReplicateTrade` | Copy a trade with custom scaling |
| `CreateSafetyConfig` | Set position limits and risk controls |
| `ValidateOrder` | Run safety checks before execution |
| `CreatePredictionMarket` | Create markets for strategy triggers |

### Data Structures

```rust
// Strategy with versioning and risk parameters
pub struct Strategy {
    pub id: u64,
    pub owner: String,
    pub name: String,
    pub strategy_type: StrategyType,  // Form-based or DSL
    pub version: u64,                  // Auto-incremented
    pub source: StrategySource,        // Manual, Community, Curated
    pub risk_percentage: f64,          // Max % to risk per trade
    pub max_exposure: f64,             // Max total exposure (USD)
    pub slippage_bps: u16,             // Max slippage tolerance
}

// DEX Order with multi-hop routing
pub struct DEXOrder {
    pub id: u64,
    pub dex: DEX,                      // Jupiter, Raydium
    pub input_mint: String,
    pub output_mint: String,
    pub route_path: Vec<RouteHop>,     // Multi-hop support
    pub conditional_trigger: Option<ConditionalTrigger>,
    pub execution_mode: ExecutionMode, // Immediate, Conditional, Scheduled
}

// Safety configuration
pub struct SafetyConfig {
    pub max_position_per_token: f64,
    pub max_total_exposure: f64,
    pub max_slippage_bps: u16,
    pub max_loss_percentage: f64,
    pub require_stop_loss: bool,
    pub fail_safe_enabled: bool,
}
```

### Events Emitted

The contract emits events for real-time tracking:
- `StrategyCreated`, `StrategyActivated`, `StrategyUpdated`
- `DEXOrderCreated`, `DEXOrderExecuted`
- `StrategyFollowed`, `TradeReplicated`
- `OrderValidated`, `SafetyConfigCreated`
- `PredictionMarketCreated`, `MarketProbabilityUpdated`

---

## 🐳 Docker Quick Start

The easiest way to run ReaX is with Docker Compose:

```bash
# Clone the repository
git clone https://github.com/your-org/reax.git
cd reax

# Start all services
docker-compose up -d

# Watch startup logs (first run takes 10-20 min)
docker-compose logs -f reax-app
```

### What Happens Automatically

1. ✅ **PostgreSQL & Redis** start with health checks
2. ✅ **Linera wallet** initializes with Conway Testnet faucet
3. ✅ **WASM contract** compiles and deploys to microchain
4. ✅ **Environment files** auto-generated for frontend/backend
5. ✅ **All services** start with proper configuration

### Services Available

| Service | URL | Description |
|---------|-----|-------------|
| 🎨 Frontend | http://localhost:3000 | Next.js web app |
| 🔧 Backend | http://localhost:3001 | Express API |
| ⛓️ Linera | http://localhost:8081 | GraphQL service |

### Docker Commands

```bash
# Start in foreground
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f reax-app

# Stop all services
docker-compose down

# Stop and remove data volumes
docker-compose down -v

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d
```

### Environment Variables

Create a `.env` file in the root directory for production:

```env
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Jupiter API (optional, for higher rate limits)
JUPITER_API_KEY=your-api-key

# Wallet for automated trading (KEEP SECRET!)
WALLET_PRIVATE_KEY=your-base58-private-key
```

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js 18+** and npm
- **Rust** with `wasm32-unknown-unknown` target
- **Linera CLI** (v0.15.7+)

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env.local
```

Edit the `.env` files with your configuration.

### 3. Initialize Linera (Optional)

```bash
# Initialize wallet with testnet faucet
linera wallet init --faucet https://faucet.testnet-conway.linera.net/

# Request a chain
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net/

# Build and deploy the contract
cd linera-app
cargo build --release --target wasm32-unknown-unknown
linera project publish-and-create . reax-microchain
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Open http://localhost:3000

---

## 📁 Project Structure

```
reax/
├── frontend/                    # Next.js 14 Application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── page.tsx        # Home/Dashboard
│   │   │   ├── trading/        # DEX trading interface
│   │   │   ├── strategies/     # Strategy builder
│   │   │   ├── social/         # Swipe discovery
│   │   │   ├── microchains/    # Profile management
│   │   │   └── analytics/      # Leaderboards
│   │   ├── components/
│   │   │   ├── ui/             # Glass cards, buttons, inputs
│   │   │   ├── Navigation.tsx  # App navigation
│   │   │   └── LineraProvider  # Blockchain context
│   │   └── lib/
│   │       └── microchain-service.ts  # Linera API client
│   └── package.json
│
├── backend/                     # Express.js API Server
│   ├── src/
│   │   ├── index.ts            # Server entry point
│   │   ├── routes/             # API endpoints
│   │   │   ├── jupiter.ts      # Jupiter DEX routes
│   │   │   ├── raydium.ts      # Raydium DEX routes
│   │   │   └── linera.ts       # Linera proxy routes
│   │   └── services/
│   │       ├── jupiter-service.ts   # Jupiter swap logic
│   │       └── raydium-service.ts   # Raydium swap logic
│   └── package.json
│
├── linera-app/                  # Linera WASM Microchain App
│   ├── abi/
│   │   └── src/lib.rs          # ABI definitions (Operations, Events, Queries)
│   ├── trade-ai/
│   │   └── src/
│   │       ├── contract.rs     # Main contract logic
│   │       ├── service.rs      # Query service
│   │       └── state.rs        # On-chain state
│   ├── Cargo.toml
│   └── rust-toolchain.toml
│
├── docker-compose.yml           # Container orchestration
├── Dockerfile                   # Multi-stage build
├── docker-entrypoint-testnet.sh # Startup script
└── README.md                    # This file
```

---

## 🔌 API Endpoints

### Backend REST API (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/jupiter/quote` | Get Jupiter swap quote |
| POST | `/api/jupiter/swap` | Execute Jupiter swap |
| GET | `/api/raydium/pools` | List Raydium pools |
| POST | `/api/raydium/swap` | Execute Raydium swap |
| GET | `/api/linera/status` | Linera connection status |

### Linera GraphQL (Port 8081)

The Linera service exposes a GraphQL endpoint for querying microchain state:

```graphql
query {
  strategies(owner: "0x...", limit: 10) {
    id
    name
    active
    version
  }
  
  orders(strategyId: 1, status: "Filled") {
    id
    token
    quantity
    fillPrice
    txHash
  }
}
```

---

## 🛡️ Safety Features

ReaX includes built-in safety controls:

- **Position Limits**: Max size per token and total exposure
- **Slippage Protection**: Configurable max slippage (basis points)
- **Stop-Loss Requirements**: Optionally require stop-loss on all orders
- **Fail-Safe Mode**: Auto-halt execution if max loss exceeded
- **Order Validation**: Every order validated against safety config
- **Minimum Balance**: Ensure sufficient gas before execution

---

## 🔗 External Integrations

### Jupiter DEX
- Aggregated liquidity across Solana DEXs
- Best price routing
- Docs: https://station.jup.ag/docs

### Raydium DEX
- Concentrated liquidity AMM
- Direct pool swaps
- Docs: https://raydium.gitbook.io

### Linera
- Microchain infrastructure
- Conway Testnet
- Docs: https://linera.dev

---

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend lint
cd frontend && npm run lint

# Linera contract tests
cd linera-app && cargo test
```

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

<p align="center">
  Built with ⛓️ Linera Microchains & 💜 by the ReaX Team
</p>
