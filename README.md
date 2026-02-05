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

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/reax.git
cd reax

# Start all services
docker compose up --build

# Or use the convenience script
bash docker-start.sh
```

> ⚠️ **Note**: First build takes 10-20 minutes (Linera Rust compilation)

### Option 2: Start Script (Local Development)

```bash
# Requires: Node.js, Rust, Linera CLI installed
bash start-all.sh
```

---

## 🐳 Docker Setup

### Services

| Service | Port | Container | Description |
|---------|------|-----------|-------------|
| 🎨 Frontend | 3000 | `reax-frontend` | Next.js web app |
| 🔧 Backend | 3003 | `reax-backend` | Express API server |
| ⛓️ Linera | 8081 | `reax-linera` | GraphQL microchain service |
| 🐘 PostgreSQL | 5432 | `reax-postgres` | Database |
| 🔴 Redis | 6379 | `reax-redis` | Cache |

### Docker Commands

```bash
# Start all services (foreground)
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f              # All services
docker compose logs -f frontend     # Frontend only
docker compose logs -f backend      # Backend only
docker compose logs -f linera       # Linera only

# Stop all services
docker compose down

# Stop and remove data volumes
docker compose down -v

# Rebuild after code changes
docker compose up --build
```

### What Happens Automatically

1. ✅ **PostgreSQL & Redis** start with health checks
2. ✅ **Linera wallet** initializes with Conway Testnet faucet
3. ✅ **WASM contract** compiles and deploys to microchain
4. ✅ **Environment files** auto-generated for frontend/backend
5. ✅ **All services** start with proper configuration

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
│   │   Port 3000     │    │    Port 3003    │    │    Port 8081    │        │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│           │                      │                      │                   │
│           ▼                      ▼                      ▼                   │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                    Linera Microchain App (WASM)                  │      │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │      │
│   │  │  Strategies │  │   Orders    │  │  Trade Replication      │  │      │
│   │  │  & Signals  │  │ & DEX Swaps │  │  & Social Following     │  │      │
│   │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           External Integrations                             │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │  Jupiter DEX    │    │  Raydium DEX    │    │  Solana RPC     │        │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js 20+** and npm
- **Rust** with `wasm32-unknown-unknown` target
- **Linera CLI** (v0.15.7+)
- **Docker** (optional, for containerized setup)

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Start Development Servers

```bash
# Start all services with the script
bash start-all.sh

# Or manually:
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
│   │   │   ├── trading/        # DEX trading interface
│   │   │   ├── strategies/     # Strategy builder
│   │   │   ├── social/         # Swipe discovery
│   │   │   ├── microchains/    # Profile management
│   │   │   └── analytics/      # Leaderboards
│   │   └── components/
│   │       ├── ui/             # Glass cards, buttons, inputs
│   │       ├── Navigation.tsx  # App navigation
│   │       └── MicrochainContext.tsx  # Profile state
│   └── Dockerfile
│
├── backend/                     # Express.js API Server
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   │   ├── jupiter.ts      # Jupiter DEX routes
│   │   │   ├── raydium.ts      # Raydium DEX routes
│   │   │   └── linera.ts       # Linera proxy routes
│   │   └── services/
│   │       ├── jupiter-service.ts
│   │       └── raydium-service.ts
│   └── Dockerfile
│
├── linera-app/                  # Linera WASM Microchain App
│   ├── abi/src/lib.rs          # ABI definitions
│   ├── trade-ai/src/
│   │   ├── contract.rs         # Main contract logic
│   │   ├── service.rs          # Query service
│   │   └── state.rs            # On-chain state
│   └── Dockerfile
│
├── docker/
│   └── linera-entrypoint.sh    # Linera service startup
│
├── docker-compose.yml           # Container orchestration
├── docker-start.sh              # Docker convenience script
├── start-all.sh                 # Local development startup
└── README.md
```

---

## 🔌 API Endpoints

### Backend REST API (Port 3003)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/jupiter/quote` | Get Jupiter swap quote |
| POST | `/api/jupiter/swap` | Execute Jupiter swap |
| GET | `/api/raydium/pools` | List Raydium pools |
| POST | `/api/raydium/swap` | Execute Raydium swap |
| GET | `/api/linera/status` | Linera connection status |

### Linera GraphQL (Port 8081)

```graphql
query {
  strategies(owner: "0x...", limit: 10) {
    id
    name
    active
  }
  
  orders(strategyId: 1, status: "Filled") {
    id
    token
    quantity
    txHash
  }
}
```

---

## 🛡️ Safety Features

- **Position Limits**: Max size per token and total exposure
- **Slippage Protection**: Configurable max slippage (basis points)
- **Stop-Loss Requirements**: Optionally require stop-loss on all orders
- **Fail-Safe Mode**: Auto-halt execution if max loss exceeded
- **Order Validation**: Every order validated against safety config

---

## 🔗 External Integrations

| Integration | Description | Documentation |
|-------------|-------------|---------------|
| **Jupiter DEX** | Aggregated liquidity, best price routing | [Docs](https://station.jup.ag/docs) |
| **Raydium DEX** | Concentrated liquidity AMM | [Docs](https://raydium.gitbook.io) |
| **Linera** | Microchain infrastructure (Conway Testnet) | [Docs](https://linera.dev) |

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
