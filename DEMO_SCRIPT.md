# LineraTrade AI - Demo Script

## Demo Video Outline (5-7 minutes)

### Introduction (30 seconds)
"Hi, I'm presenting LineraTrade AI - an AI-powered trading infrastructure built on Linera microchains for the Linera Buildathon. This platform demonstrates how Linera's ultra-low latency and event-driven architecture can power real-time market infrastructure."

### Problem Statement (30 seconds)
"Traditional trading platforms face three key challenges:
1. High latency between signal detection and execution
2. Lack of transparency in order execution
3. Complex setup for automated trading strategies

LineraTrade AI solves these using Linera microchains."

### Architecture Overview (1 minute)
**Show architecture diagram**

"The system has 5 main components:

1. **Tweet Ingestion** - Monitors influencer accounts in real-time
2. **AI Parser** - GPT-4 analyzes sentiment and extracts trading signals
3. **Linera Microchain** - Stores all state transparently with event emission
4. **Relayer** - Executes trades on Solana DEXes
5. **Dashboard** - Real-time updates via WebSocket

The key innovation is using Linera for deterministic state management and sub-second event propagation."

### Live Demo (3-4 minutes)

#### Part 1: Dashboard Overview (45 seconds)
**Show dashboard**

"Here's the live dashboard. You can see:
- Real-time signal feed from Twitter
- Active trading strategies
- Open positions and recent orders
- Performance metrics

Everything updates in real-time via WebSocket connected to the Linera indexer."

#### Part 2: Creating a Strategy - Form Mode (1 minute)
**Navigate to Strategy Builder**

"Let's create a simple strategy using the no-code form builder.

I'll set:
- Token: SOL/USDC
- Take Profit: 10%
- Stop Loss: 5%
- Trailing Stop: 3%

Click Create Strategy... and it's submitted to the Linera chain.

Notice the transaction confirmation and the strategy appearing in our list."

#### Part 3: Creating a Strategy - DSL Mode (1 minute)
**Switch to Code Mode**

"For advanced users, we have a custom DSL with Monaco Editor.

Let me write a strategy that buys when RSI is oversold:

```
strategy('RSI Oversold') {
  if rsi(14) < 30 and token.volume > 500000 {
    buy(token, qty=0.2, sl=3%, tp=8%)
  }
  if rsi(14) > 70 {
    sell()
  }
}
```

The editor provides syntax highlighting and real-time validation.

Click Validate... no errors. Create Strategy... and it's on-chain."

#### Part 4: Signal Flow (1 minute)
**Show signal processing**

"Now let's see the complete flow:

1. A tweet comes in from an influencer
2. AI Parser analyzes it - 'bullish on SOL' - confidence 0.92
3. Signal is submitted to Linera chain
4. Event is emitted and picked up by the relayer
5. Relayer evaluates active strategies
6. Match found! Order is created
7. Trade executes on Jupiter DEX
8. Fill is recorded back on Linera
9. Dashboard updates in real-time

Total time: under 5 seconds from tweet to execution."

#### Part 5: Linera Integration (45 seconds)
**Show Linera chain state**

"Let's look at the Linera integration:

```bash
linera query-application <app-id>
```

You can see all signals, strategies, and orders stored on-chain.

The state is completely transparent and deterministic.

Events are emitted for every state change, enabling real-time coordination between services."

### Key Technical Achievements (1 minute)

**Show code snippets**

"Key technical highlights:

1. **Linera SDK Integration** - Full Rust implementation with MapView state management
2. **Event-Driven Architecture** - Real-time event subscription via Linera indexer
3. **Sub-5-Second Latency** - From tweet to trade execution
4. **Multi-Relayer Support** - High availability with event deduplication
5. **Security** - Rate limiting, DSL sandboxing, replay protection
6. **Backtesting** - Test strategies on historical data before deployment"

### Why Linera? (30 seconds)

"Why Linera for this use case?

1. **Ultra-Low Latency** - Microchain architecture enables sub-second state updates
2. **Deterministic Execution** - Perfect for financial applications requiring transparency
3. **Event Emission** - Native support for event-driven systems
4. **Scalability** - Each strategy could run on its own microchain

Linera is ideal for real-time market infrastructure."

### Conclusion (30 seconds)

"LineraTrade AI demonstrates how Linera can power the next generation of market infrastructure:
- Real-time AI-driven trading
- Transparent on-chain state
- Ultra-low latency execution
- Scalable multi-service architecture

All code is open source and available on GitHub.

Thank you for watching, and I hope this inspires more builders to explore Linera's capabilities!"

---

## Presentation Slides Outline

### Slide 1: Title
- LineraTrade AI
- AI-Powered Market Infrastructure on Linera
- Linera Buildathon 2025

### Slide 2: Problem
- High latency in traditional trading systems
- Lack of transparency in order execution
- Complex setup for automated strategies

### Slide 3: Solution
- Real-time AI sentiment analysis
- Transparent Linera microchain state
- Automated execution with <5s latency

### Slide 4: Architecture
[Architecture diagram]
- Tweet Ingestion → AI Parser → Linera Chain → Relayer → DEX

### Slide 5: Key Features
- 🤖 AI Tweet Analysis (GPT-4)
- ⚡ Ultra-Low Latency (<5s)
- 🔗 Linera Microchains
- 📊 Dual Strategy Builders
- 📈 Live Dashboard
- 🔄 Multi-Relayer Support

### Slide 6: Linera Integration
- Full Rust SDK implementation
- MapView state management
- Event emission and subscription
- Query functions with pagination

### Slide 7: Technical Stack
**Frontend:** Next.js, TailwindCSS, Monaco Editor
**Backend:** Express.js, PostgreSQL, Redis
**Blockchain:** Linera SDK (Rust), Solana
**AI:** OpenAI GPT-4, Custom DSL Parser

### Slide 8: Performance Metrics
- Tweet to Signal: <3s
- Signal to Order: <1s
- Order to Execution: <5s
- Dashboard Updates: <2s
- Throughput: 100+ signals/min

### Slide 9: Security Features
- Rate limiting (100 req/min)
- DSL sandbox execution
- Replay protection
- Position size limits
- Mandatory stop-loss

### Slide 10: Demo Screenshots
[4 screenshots showing:]
- Dashboard with live signals
- Strategy builder (form mode)
- Strategy builder (code mode)
- Performance analytics

### Slide 11: Why Linera?
- ✅ Ultra-low latency microchains
- ✅ Deterministic execution
- ✅ Native event emission
- ✅ Horizontal scalability
- ✅ Perfect for financial infrastructure

### Slide 12: Future Roadmap
- Multi-chain support (Ethereum, Arbitrum)
- Social trading features
- Advanced ML models
- Mobile app
- DAO governance

### Slide 13: Thank You
- GitHub: github.com/yourusername/linera-trade-ai
- Demo: lineratrade.ai
- Twitter: @lineratrade
- Built with ❤️ for Linera Buildathon

---

## Recording Tips

### Before Recording
- [ ] Test all services are running
- [ ] Prepare sample tweets/signals
- [ ] Clear browser cache
- [ ] Close unnecessary tabs
- [ ] Test microphone and screen recording
- [ ] Have backup demo data ready

### During Recording
- Speak clearly and at moderate pace
- Show, don't just tell
- Highlight Linera-specific features
- Keep energy high
- Stay within time limit (5-7 minutes)

### After Recording
- [ ] Add captions/subtitles
- [ ] Add background music (optional)
- [ ] Add transitions between sections
- [ ] Export in 1080p
- [ ] Upload to YouTube
- [ ] Share link in submission

---

## Key Talking Points

### Linera Advantages
- "Linera's microchain architecture enables sub-second state updates"
- "Event emission is native to Linera, perfect for real-time systems"
- "Deterministic execution ensures transparent order processing"
- "Each strategy could run on its own microchain for isolation"

### Technical Achievements
- "Full integration with Linera SDK in Rust"
- "Real-time event subscription via Linera indexer"
- "Sub-5-second end-to-end latency"
- "Multi-relayer coordination with event deduplication"

### Market Fit
- "Demonstrates Linera's capability for market infrastructure"
- "Shows how AI and blockchain can work together"
- "Proves Linera can handle real-time financial applications"
- "Opens possibilities for decentralized trading platforms"

---

## Demo Environment Setup

```bash
# Start all services
docker-compose up -d
npm run dev

# Seed demo data
npm run seed:demo

# Open dashboard
open http://localhost:3000

# Monitor logs
docker-compose logs -f
```

## Backup Demo Plan

If live demo fails:
1. Have pre-recorded video segments
2. Use screenshots for each feature
3. Show code walkthrough instead
4. Demonstrate Linera chain state directly

---

**Remember**: The goal is to showcase Linera's capabilities for real-time market infrastructure!
