# REAX

<div align="center">

**🚀 AI-Powered Trading Infrastructure on Linera Microchains**

*Real-time trading signals powered by AI sentiment analysis and executed on decentralized exchanges*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

**REAX** is a cutting-edge, decentralized trading infrastructure platform that combines AI-powered sentiment analysis with blockchain-based execution. Built on Linera microchains, REAX provides ultra-low latency trading signals, transparent on-chain state management, and automated trade execution on Solana DEXes.

### Key Capabilities

- **AI-Powered Signal Generation**: Real-time monitoring of social media feeds with GPT-4 sentiment analysis
- **On-Chain State Management**: All strategies, signals, and orders stored transparently on Linera microchains
- **Automated Execution**: High-performance relayer service for instant trade execution on Solana DEXes
- **Strategy Builder**: Create trading strategies using intuitive forms or custom DSL
- **Backtesting Engine**: Test strategies against historical data before live deployment
- **Live Dashboard**: Real-time WebSocket updates with performance analytics

## ✨ Features

### 🤖 AI & Intelligence
- **Real-time Tweet Monitoring**: Tracks influencer accounts with sub-5-second latency
- **Advanced Sentiment Analysis**: GPT-4 powered analysis extracting trading signals and token mentions
- **Multi-Source Ingestion**: Extensible architecture for various data sources (Twitter, Discord, Telegram)

### 🔗 Blockchain Integration
- **Linera Microchains**: Transparent, on-chain storage of all trading state
- **Solana DEX Integration**: Automated execution via Jupiter aggregator
- **Wallet Management**: Secure wallet connection and management
- **Event-Driven Architecture**: Real-time updates via WebSocket connections

### 📊 Trading Features
- **Dual Strategy Builder**:
  - **Form Mode**: No-code strategy creation with intuitive UI
  - **Code Mode**: Advanced DSL for complex trading logic
- **Backtesting**: Historical data simulation with detailed analytics
- **Performance Tracking**: Real-time P&L, win rate, and performance metrics
- **Risk Management**: Built-in stop-loss, take-profit, and position sizing

### 🎨 User Experience
- **Modern Dashboard**: Beautiful, responsive Next.js interface
- **Real-time Updates**: Live signal feed with WebSocket integration
- **Performance Charts**: Interactive visualizations with Recharts
- **Code Editor**: Monaco-based editor for DSL strategy writing

## 🏗️ Architecture

```
┌─────────────────┐
│  Social Media   │
│   (Twitter)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐      ┌─────────────┐
│   Ingestion     │─────▶│  AI Parser   │─────▶│ Linera App  │
│    Service      │      │   (GPT-4)    │      │  (Rust)     │
└─────────────────┘      └──────────────┘      └──────┬───────┘
                                                       │
                                                       ▼
┌─────────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend      │◀────▶│   Backend    │◀────▶│   Relayer   │
│   (Next.js)     │      │  (Express)   │      │  Service    │
└─────────────────┘      └──────────────┘      └──────┬───────┘
                                                       │
                                                       ▼
                                              ┌─────────────┐
                                              │  Solana DEX │
                                              │   (Jupiter) │
                                              └─────────────┘
```

### Component Overview

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Linera App** | Rust | On-chain state management, event emission |
| **Backend API** | Express.js + TypeScript | REST API, WebSocket server, business logic |
| **Frontend** | Next.js + React + TailwindCSS | User dashboard and strategy builder |
| **Ingestion** | Node.js | Social media monitoring and streaming |
| **Parser** | Node.js + OpenAI | AI sentiment analysis and signal extraction |
| **Relayer** | Node.js | Trade execution on Solana DEXes |
| **Database** | PostgreSQL | Persistent data storage |
| **Cache** | Redis | High-performance caching layer |

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **State Management**: Zustand
- **Code Editor**: Monaco Editor
- **Real-time**: Socket.io Client
- **GraphQL**: GraphQL Request

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **WebSocket**: Socket.io
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Validation**: Zod

### Blockchain
- **Chain**: Linera Microchains (Rust)
- **DEX**: Solana (Jupiter Aggregator)
- **Wallet**: Linera Wallet SDK

### Infrastructure
- **Containers**: Docker & Docker Compose
- **Process Management**: Concurrently (dev mode)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher (or **yarn** / **pnpm**)
- **Rust** 1.86.0 or higher (for Linera development)
- **Docker** and **Docker Compose**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SCARPxVeNOM/Reax.git
   cd Reax
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   This will install dependencies for all workspaces (backend, frontend, relayer, parser, ingestion).

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL=postgresql://admin:password@localhost:5432/lineratrade
   REDIS_URL=redis://localhost:6379
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Linera
   LINERA_NETWORK_URL=http://localhost:8080
   LINERA_PRIVATE_KEY=your_linera_private_key
   
   # Solana
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   SOLANA_PRIVATE_KEY=your_solana_private_key
   
   # Twitter (if using)
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token
   ```

4. **Start infrastructure services**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up -d postgres redis
   
   # Or using npm script
   npm run docker:up
   ```

5. **Set up Linera network** (if not using Docker)
   ```bash
   # In WSL or Linux environment
   linera net up --with-faucet --faucet-port 8080
   ```

6. **Build Linera application** (if deploying)
   ```bash
   cd linera-app
   cargo build --release
   linera project publish-and-create
   cd ..
   ```

7. **Start all services**
   
   **Option A: Unified Script (PowerShell)**
   ```powershell
   .\start.ps1
   ```
   
   **Option B: Unified Script (Bash)**
   ```bash
   ./start.sh
   ```
   
   **Option C: Manual (using npm scripts)**
   ```bash
   # Start all services concurrently
   npm run dev
   
   # Or start individually:
   npm run dev:backend   # Backend API on :3001
   npm run dev:relayer   # Relayer service
   npm run dev:frontend  # Frontend on :3000
   ```

8. **Access the application**
   - Frontend Dashboard: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health: http://localhost:3001/health

## 📁 Project Structure

```
Reax/
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── index.ts         # Server entry point
│   │   ├── routes.ts        # API routes
│   │   ├── database.ts      # PostgreSQL client
│   │   ├── redis-client.ts  # Redis client
│   │   ├── linera-client.ts # Linera integration
│   │   ├── analytics.ts     # Analytics & metrics
│   │   └── backtesting.ts   # Backtesting engine
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # Next.js dashboard
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StrategyBuilder.tsx
│   │   │   ├── BacktestingUI.tsx
│   │   │   ├── SignalFeed.tsx
│   │   │   └── ...
│   │   └── lib/             # Utility functions
│   │       └── linera-client.ts
│   ├── public/              # Static assets
│   ├── package.json
│   └── next.config.js
│
├── ingestion/               # Tweet monitoring service
│   ├── src/
│   │   └── index.ts
│   └── package.json
│
├── parser/                  # AI parser & DSL parser
│   ├── src/
│   │   ├── ai-parser.ts     # GPT-4 integration
│   │   ├── dsl-parser.ts    # Custom DSL parser
│   │   └── index.ts
│   └── package.json
│
├── relayer/                 # Trade execution service
│   ├── src/
│   │   └── index.ts
│   └── package.json
│
├── linera-app/              # Linera blockchain application
│   ├── src/
│   │   ├── lib.rs           # Application entry
│   │   ├── state.rs         # State management
│   │   ├── contract.rs      # Contract logic
│   │   └── service.rs       # Service endpoints
│   ├── Cargo.toml
│   └── linera-protocol/     # Linera SDK (submodule)
│
├── docker-compose.yml       # Infrastructure services
├── package.json             # Root workspace config
├── .env.example             # Environment template
├── .gitignore
└── README.md
```

## 💻 Usage

### Creating a Strategy (Form Mode)

1. Navigate to http://localhost:3000/builder
2. Select **"Form Mode"** tab
3. Fill in strategy parameters:
   - Strategy name and description
   - Entry conditions (sentiment score, token filters)
   - Position sizing and risk parameters
   - Stop-loss and take-profit levels
4. Click **"Create Strategy"** to deploy

### Creating a Strategy (Code Mode)

1. Navigate to http://localhost:3000/builder
2. Select **"Code Mode"** tab
3. Write your strategy using the REAX DSL:

```javascript
strategy("RSI Momentum") {
  // Entry condition
  if sentiment > 0.8 and token.volume > 1000000 {
    buy(
      token: token.address,
      qty: 0.5 SOL,
      stopLoss: 2%,
      takeProfit: 5%
    )
  }
  
  // Exit condition
  if rsi(14) > 70 {
    sell(position: current)
  }
  
  // Risk management
  if position.pnl < -10% {
    close(position: all)
  }
}
```

4. Click **"Validate"** to check syntax
5. Click **"Create Strategy"** to deploy on-chain

### Viewing Signals & Performance

- **Dashboard**: http://localhost:3000 - Real-time signal feed
- **Strategies**: View all active strategies and their performance
- **Orders**: Monitor executed trades and fills
- **Analytics**: Charts showing P&L, win rate, and metrics

### Running Backtests

1. Navigate to the Backtesting UI
2. Select a strategy or create a test strategy
3. Choose historical data range
4. Run backtest and review:
   - Total return
   - Sharpe ratio
   - Maximum drawdown
   - Win rate
   - Trade distribution

## ⚙️ Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- **Database**: PostgreSQL connection string
- **Cache**: Redis connection URL
- **Blockchain**: Linera network URL and private keys
- **APIs**: OpenAI, Twitter, Solana RPC endpoints
- **Security**: API keys and secrets

### Docker Configuration

Modify `docker-compose.yml` to adjust:
- Database ports and credentials
- Redis configuration
- Linera node settings
- Volume mounts

### Frontend Configuration

- `frontend/next.config.js`: Next.js configuration
- `frontend/tailwind.config.ts`: TailwindCSS customization
- `frontend/src/lib/linera-client.ts`: Linera client settings

## 📚 API Documentation

### REST Endpoints

#### Strategies
- `GET /api/strategies` - List all strategies
- `POST /api/strategies` - Create new strategy
- `GET /api/strategies/:id` - Get strategy details
- `PUT /api/strategies/:id` - Update strategy
- `DELETE /api/strategies/:id` - Delete strategy

#### Signals
- `GET /api/signals` - List recent signals
- `GET /api/signals/:id` - Get signal details
- `POST /api/signals` - Create signal (usually auto-generated)

#### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/strategy/:strategyId` - Get orders for strategy

#### Analytics
- `GET /api/analytics/performance` - Overall performance metrics
- `GET /api/analytics/strategy/:id` - Strategy-specific analytics
- `POST /api/analytics/backtest` - Run backtest

### WebSocket Events

**Client → Server:**
- `subscribe:signals` - Subscribe to signal updates
- `subscribe:orders` - Subscribe to order updates
- `subscribe:strategies` - Subscribe to strategy updates

**Server → Client:**
- `signal:new` - New trading signal detected
- `order:created` - New order created
- `order:filled` - Order executed on DEX
- `order:failed` - Order execution failed
- `strategy:updated` - Strategy state changed

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following the code style
4. **Test thoroughly** before submitting
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure code passes linting

### Code Style

- **TypeScript**: Use strict mode
- **Formatting**: Prettier (if configured)
- **Linting**: ESLint for JavaScript/TypeScript
- **Rust**: Follow rustfmt standards

## ⚠️ Security & Disclaimer

**⚠️ EDUCATIONAL USE ONLY ⚠️**

This project is for educational and demonstration purposes. It is NOT intended for production use with real funds. Key security considerations:

- ⚠️ Do not use with real funds without comprehensive security audits
- ⚠️ Private keys should never be committed to the repository
- ⚠️ API keys must be kept secure and rotated regularly
- ⚠️ Always use test networks for development
- ⚠️ Review all smart contract code before deployment

**Use at your own risk. The developers are not responsible for any financial losses.**

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">

**Built with ❤️ for the Linera Ecosystem**

[GitHub](https://github.com/SCARPxVeNOM/Reax) • [Issues](https://github.com/SCARPxVeNOM/Reax/issues) • [Discussions](https://github.com/SCARPxVeNOM/Reax/discussions)

</div>
