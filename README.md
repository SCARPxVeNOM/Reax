# LineraTrade AI

> **AI-powered, real-time trading infrastructure built on Linera microchains for the Linera Buildathon**

LineraTrade AI is a decentralized platform that tracks influencer tweets, uses AI to detect sentiment, and automatically executes trades on Solana DEXes. Built on Linera microchains for ultra-low latency and transparent state management.

## 🎯 Hackathon Category

**Market Infrastructure** - Demonstrating Linera's real-time state updates and event-driven architecture for building AI-powered market infrastructure.

## ✨ Features

- **Real-time Tweet Monitoring**: Tracks influencer Twitter accounts and captures tweets within seconds
- **AI Sentiment Analysis**: Uses GPT-4 to analyze tweet sentiment and extract trading signals
- **Linera Microchain State**: All signals, strategies, and orders stored on-chain for transparency
- **Automated Trade Execution**: Relayer service executes trades on Solana DEXes via Jupiter
- **Strategy Builder**: Create strategies using no-code forms or custom DSL
- **Live Dashboard**: Real-time updates via WebSocket showing signals, orders, and performance
- **Multi-Relayer Support**: High availability with multiple relayer instances

## 🏗️ Architecture

```
Tweet → AI Parser → Linera Chain → Relayer → Solana DEX → Fill Recording
                         ↓
                    Dashboard (WebSocket)
```

### Components

1. **Linera App Chain** (Rust) - Stores signals, strategies, orders with event emission
2. **Tweet Ingestion Service** (Node.js) - Monitors Twitter and streams tweets
3. **AI Tweet Parser** (OpenAI GPT-4) - Analyzes sentiment and extracts tokens
4. **Backend API** (Express.js) - REST API and WebSocket server
5. **Relayer Service** (Node.js) - Executes trades on Solana
6. **Frontend** (Next.js) - Dashboard and strategy builder
7. **DSL Parser** - Custom language for advanced trading strategies

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.86+ (for Linera)
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/linera-trade-ai.git
cd linera-trade-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. **Start infrastructure services**
```bash
docker-compose up -d
```

5. **Build Linera application**
```bash
cd linera-app
cargo build --release
# Deploy to local Linera network
linera project publish-and-create
```

6. **Start all services**
```bash
# Terminal 1: Backend API
npm run dev:backend

# Terminal 2: Relayer
npm run dev:relayer

# Terminal 3: Tweet Ingestion
cd ingestion && npm run dev

# Terminal 4: Frontend
npm run dev:frontend
```

7. **Open dashboard**
```
http://localhost:3000
```

## 📖 Usage

### Creating a Strategy (Form Mode)

1. Navigate to `/builder`
2. Select "Form Mode"
3. Fill in strategy parameters
4. Click "Create Strategy"

### Creating a Strategy (Code Mode)

1. Navigate to `/builder`
2. Select "Code Mode"
3. Write DSL code:

```javascript
strategy("RSI Trader") {
  if rsi(14) < 30 and token.volume > 1000000 {
    buy(token, qty=0.5, sl=2%, tp=5%)
  }
  if rsi(14) > 70 {
    sell()
  }
}
```

4. Click "Validate" then "Create Strategy"

## 📁 Project Structure

```
linera-trade-ai/
├── linera-app/          # Rust Linera application
├── backend/             # Express.js API server
├── relayer/             # Trade execution service
├── ingestion/           # Tweet monitoring service
├── parser/              # AI parser and DSL parser
├── frontend/            # Next.js dashboard
└── docker-compose.yml
```

## 🔐 Security Notes

⚠️ **EDUCATIONAL USE ONLY** ⚠️

This project is for educational and demonstration purposes. Do not use with real funds without proper security audits.

## 📄 Documentation

See `.kiro/specs/linera-trade-ai/` for detailed requirements, design, and implementation plan.

## 🏆 Hackathon Submission

This project demonstrates:
- ✅ Linera microchain state management
- ✅ Real-time event-driven architecture
- ✅ Ultra-low latency execution (<5 seconds)
- ✅ Transparent on-chain state
- ✅ AI integration for market intelligence
- ✅ Multi-service coordination

Built for the **Linera Buildathon** - Market Infrastructure category

## 📄 License

MIT

---

**Made with ❤️ for the Linera Buildathon**
