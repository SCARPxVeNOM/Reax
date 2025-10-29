# Design Document: LineraTrade AI

## Overview

LineraTrade AI is a real-time, event-driven trading infrastructure built on Linera microchains that combines AI-powered sentiment analysis with automated trade execution. The system monitors influencer tweets, extracts trading signals using LLMs, stores state on Linera microchains, and executes trades on Solana DEXes through off-chain relayers. Users can create trading strategies using either no-code form builders or a custom DSL, with all activity tracked in a real-time dashboard.

### Key Design Principles

1. **Event-Driven Architecture**: Linera microchain events drive all system actions
2. **Separation of Concerns**: Clear boundaries between ingestion, analysis, state management, execution, and presentation
3. **Real-Time Performance**: Sub-5-second latency from tweet to trade execution
4. **Transparency**: All signals, strategies, and orders recorded on-chain
5. **Extensibility**: Modular design allows adding new data sources, chains, and strategy types

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  Dashboard   │  │   Strategy   │  │  Wallet Connect    │   │
│  │   (Next.js)  │  │   Builder    │  │  (RainbowKit)      │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket / RPC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Tweet      │  │   AI Tweet   │  │   API Gateway      │   │
│  │  Ingestion   │─▶│   Parser     │  │   (Express.js)     │   │
│  │   Service    │  │   (LLM)      │  │                    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ submit_signal()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Linera Microchain Layer                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Linera App Chain (Rust)                     │  │
│  │  • Signals Storage    • Strategies Storage               │  │
│  │  • Orders Storage     • Event Emission                   │  │
│  │  • State Management   • Indexer Integration              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Events (SignalReceived, OrderCreated)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Execution Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Relayer    │─▶│   Jupiter    │─▶│   Solana RPC       │   │
│  │  (Node.js)   │  │   DEX API    │  │   (Devnet/Mainnet) │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ record_order_fill()
                              ▼
                    Back to Linera App Chain
```

### Data Flow Sequence

1. **Tweet Capture**: Tweet Ingestion Service monitors Twitter → captures new tweets
2. **AI Analysis**: AI Tweet Parser analyzes sentiment → extracts token/contract → generates signal JSON
3. **Signal Submission**: Backend calls `submit_signal()` → Linera App Chain stores signal
4. **Event Emission**: Linera emits `SignalReceived` event → Linera Indexer broadcasts
5. **Strategy Evaluation**: Relayer receives event → evaluates active strategies → determines if conditions match
6. **Trade Execution**: Relayer queries Jupiter API → builds transaction → submits to Solana
7. **Fill Recording**: Relayer calls `record_order_fill()` → Linera updates order status
8. **Dashboard Update**: Frontend polls/subscribes to Linera state → displays updated data

## Components and Interfaces

### 1. Tweet Ingestion Service

**Technology**: Node.js with Twitter API v2 or Puppeteer for scraping

**Responsibilities**:
- Monitor configured influencer accounts
- Capture tweets in real-time
- Stream tweets to AI Parser
- Handle rate limiting and reconnection

**Configuration**:
```typescript
interface IngestionConfig {
  influencers: string[];        // Twitter handles to monitor
  pollInterval: number;          // Milliseconds between checks
  twitterApiKey: string;
  twitterApiSecret: string;
  webhookUrl?: string;           // Optional webhook for real-time
}
```

**Output**:
```typescript
interface RawTweet {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  url: string;
}
```

### 2. AI Tweet Parser

**Technology**: OpenAI GPT-4 or local LLM (Llama 3)

**Responsibilities**:
- Analyze tweet sentiment (bullish/bearish/neutral)
- Extract token mentions
- Resolve token contract addresses
- Generate structured signals

**LLM Prompt Template**:
```
Analyze the following tweet for cryptocurrency trading signals:

Tweet: "{tweet_text}"
Author: "{author}"

Extract:
1. Sentiment: bullish, bearish, or neutral
2. Confidence: 0.0 to 1.0
3. Token mentions: list of token symbols
4. Contract addresses: if mentioned or known

Output as JSON:
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0.95,
  "tokens": [{"symbol": "TRUMP", "contract": "0x..."}]
}
```

**Output**:
```typescript
interface TradingSignal {
  influencer: string;
  token: string;
  contract: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timestamp: number;
  tweetUrl: string;
}
```

### 3. Linera App Chain (Rust)

**Technology**: Linera SDK (Rust), following https://linera.dev/developers/getting_started.html

**State Structure**:
```rust
use linera_sdk::{base::*, views::*};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Signal {
    pub id: u64,
    pub influencer: String,
    pub token: String,
    pub contract: String,
    pub sentiment: String,
    pub confidence: f64,
    pub timestamp: u64,
    pub tweet_url: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Strategy {
    pub id: u64,
    pub owner: Owner,
    pub name: String,
    pub strategy_type: StrategyType,
    pub parameters: StrategyParams,
    pub active: bool,
    pub created_at: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum StrategyType {
    Form(FormStrategy),
    DSL(String),
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FormStrategy {
    pub token_pair: String,
    pub buy_price: f64,
    pub sell_target: f64,
    pub trailing_stop_pct: f64,
    pub take_profit_pct: f64,
    pub max_loss_pct: f64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Order {
    pub id: u64,
    pub strategy_id: u64,
    pub signal_id: u64,
    pub order_type: String,  // "buy" or "sell"
    pub token: String,
    pub quantity: f64,
    pub status: OrderStatus,
    pub tx_hash: Option<String>,
    pub fill_price: Option<f64>,
    pub created_at: u64,
    pub filled_at: Option<u64>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum OrderStatus {
    Pending,
    Submitted,
    Filled,
    Failed,
    Cancelled,
}

#[derive(RootView)]
pub struct LineraTradeState {
    pub signals: MapView<u64, Signal>,
    pub strategies: MapView<u64, Strategy>,
    pub orders: MapView<u64, Order>,
    pub signal_counter: RegisterView<u64>,
    pub strategy_counter: RegisterView<u64>,
    pub order_counter: RegisterView<u64>,
}
```

**Operations**:
```rust
#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    SubmitSignal { signal: Signal },
    CreateStrategy { strategy: Strategy },
    ActivateStrategy { strategy_id: u64 },
    DeactivateStrategy { strategy_id: u64 },
    CreateOrder { order: Order },
    RecordOrderFill { 
        order_id: u64, 
        tx_hash: String, 
        fill_price: f64,
        filled_at: u64,
    },
}
```

**Events**:
```rust
#[derive(Debug, Deserialize, Serialize)]
pub enum Event {
    SignalReceived { signal: Signal },
    StrategyCreated { strategy_id: u64, owner: Owner },
    StrategyActivated { strategy_id: u64 },
    StrategyDeactivated { strategy_id: u64 },
    OrderCreated { order: Order },
    OrderFilled { 
        order_id: u64, 
        tx_hash: String, 
        fill_price: f64 
    },
    OrderFailed { order_id: u64, reason: String },
}
```

**Application Logic**:
```rust
impl Application for LineraTradeApp {
    async fn execute_operation(&mut self, operation: Operation) -> Result<(), Error> {
        match operation {
            Operation::SubmitSignal { signal } => {
                let id = self.state.signal_counter.get() + 1;
                self.state.signal_counter.set(id);
                self.state.signals.insert(&id, signal.clone())?;
                self.emit_event(Event::SignalReceived { signal });
                Ok(())
            }
            Operation::CreateStrategy { strategy } => {
                let id = self.state.strategy_counter.get() + 1;
                self.state.strategy_counter.set(id);
                self.state.strategies.insert(&id, strategy.clone())?;
                self.emit_event(Event::StrategyCreated { 
                    strategy_id: id, 
                    owner: strategy.owner 
                });
                Ok(())
            }
            Operation::RecordOrderFill { order_id, tx_hash, fill_price, filled_at } => {
                let mut order = self.state.orders.get(&order_id)?
                    .ok_or(Error::OrderNotFound)?;
                order.status = OrderStatus::Filled;
                order.tx_hash = Some(tx_hash.clone());
                order.fill_price = Some(fill_price);
                order.filled_at = Some(filled_at);
                self.state.orders.insert(&order_id, order)?;
                self.emit_event(Event::OrderFilled { 
                    order_id, 
                    tx_hash, 
                    fill_price 
                });
                Ok(())
            }
            // ... other operations
        }
    }
}
```

### 4. Relayer Service

**Technology**: Node.js with TypeScript

**Responsibilities**:
- Subscribe to Linera indexer for events
- Evaluate strategies against signals
- Execute trades on Solana DEXes
- Record fills back to Linera

**Architecture**:
```typescript
class Relayer {
  private lineraClient: LineraClient;
  private solanaConnection: Connection;
  private jupiterApi: JupiterApi;
  private wallet: Keypair;
  
  async start() {
    // Subscribe to Linera events
    await this.subscribeToEvents();
  }
  
  private async subscribeToEvents() {
    this.lineraClient.subscribeToEvents(async (event) => {
      if (event.type === 'SignalReceived') {
        await this.handleSignal(event.signal);
      }
    });
  }
  
  private async handleSignal(signal: Signal) {
    // Fetch all active strategies
    const strategies = await this.lineraClient.getActiveStrategies();
    
    // Evaluate each strategy
    for (const strategy of strategies) {
      const shouldTrade = this.evaluateStrategy(strategy, signal);
      
      if (shouldTrade) {
        await this.executeTrade(strategy, signal);
      }
    }
  }
  
  private evaluateStrategy(strategy: Strategy, signal: Signal): boolean {
    if (strategy.strategy_type === 'Form') {
      return this.evaluateFormStrategy(strategy.parameters, signal);
    } else {
      return this.evaluateDSLStrategy(strategy.dsl_code, signal);
    }
  }
  
  private async executeTrade(strategy: Strategy, signal: Signal) {
    try {
      // Create order on Linera
      const orderId = await this.lineraClient.createOrder({
        strategy_id: strategy.id,
        signal_id: signal.id,
        order_type: signal.sentiment === 'bullish' ? 'buy' : 'sell',
        token: signal.token,
        quantity: strategy.parameters.quantity,
      });
      
      // Get swap route from Jupiter
      const route = await this.jupiterApi.getRoute({
        inputMint: 'USDC',
        outputMint: signal.contract,
        amount: strategy.parameters.quantity,
      });
      
      // Execute swap
      const txHash = await this.jupiterApi.executeSwap(route, this.wallet);
      
      // Wait for confirmation
      await this.solanaConnection.confirmTransaction(txHash);
      
      // Record fill on Linera
      await this.lineraClient.recordOrderFill({
        order_id: orderId,
        tx_hash: txHash,
        fill_price: route.outAmount / route.inAmount,
        filled_at: Date.now(),
      });
      
    } catch (error) {
      console.error('Trade execution failed:', error);
      // Record failure on Linera
    }
  }
}
```

### 5. Strategy Builder (Frontend)

**Technology**: Next.js, React, TailwindCSS, Monaco Editor, ShadCN UI

**Form Mode Component**:
```typescript
interface FormStrategyProps {
  onSubmit: (strategy: FormStrategy) => void;
}

export function FormStrategyBuilder({ onSubmit }: FormStrategyProps) {
  const [formData, setFormData] = useState<FormStrategy>({
    token_pair: '',
    buy_price: 0,
    sell_target: 0,
    trailing_stop_pct: 2.0,
    take_profit_pct: 5.0,
    max_loss_pct: 2.0,
  });
  
  const handleSubmit = async () => {
    // Validate inputs
    if (formData.trailing_stop_pct < 0 || formData.trailing_stop_pct > 100) {
      toast.error('Trailing stop must be between 0-100%');
      return;
    }
    
    // Submit to Linera
    await lineraClient.createStrategy({
      name: `Form Strategy - ${formData.token_pair}`,
      strategy_type: 'Form',
      parameters: formData,
      active: false,
    });
    
    onSubmit(formData);
  };
  
  return (
    <form className="space-y-4">
      <Input 
        label="Token Pair" 
        value={formData.token_pair}
        onChange={(e) => setFormData({...formData, token_pair: e.target.value})}
      />
      <Input 
        label="Buy Price" 
        type="number"
        value={formData.buy_price}
        onChange={(e) => setFormData({...formData, buy_price: parseFloat(e.target.value)})}
      />
      {/* ... other fields */}
      <Button onClick={handleSubmit}>Create Strategy</Button>
    </form>
  );
}
```

**Code Mode Component**:
```typescript
export function DSLStrategyBuilder({ onSubmit }: DSLStrategyProps) {
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<ParseError[]>([]);
  
  const handleValidate = async () => {
    try {
      const ast = parseDSL(code);
      setErrors([]);
      return true;
    } catch (error) {
      setErrors(error.errors);
      return false;
    }
  };
  
  const handleSubmit = async () {
    const isValid = await handleValidate();
    if (!isValid) return;
    
    await lineraClient.createStrategy({
      name: extractStrategyName(code),
      strategy_type: 'DSL',
      dsl_code: code,
      active: false,
    });
    
    onSubmit(code);
  };
  
  return (
    <div className="h-full flex flex-col">
      <MonacoEditor
        language="linera-dsl"
        value={code}
        onChange={setCode}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
        }}
      />
      {errors.length > 0 && (
        <ErrorPanel errors={errors} />
      )}
      <div className="flex gap-2 mt-4">
        <Button onClick={handleValidate}>Validate</Button>
        <Button onClick={handleSubmit}>Create Strategy</Button>
      </div>
    </div>
  );
}
```

### 6. Dashboard

**Technology**: Next.js, React, TailwindCSS, Recharts, Framer Motion

**Main Dashboard Layout**:
```typescript
export function Dashboard() {
  const { signals } = useSignals();
  const { strategies } = useStrategies();
  const { orders } = useOrders();
  const { positions } = usePositions();
  
  return (
    <div className="grid grid-cols-12 gap-4 p-6">
      {/* Live Signal Feed */}
      <div className="col-span-4">
        <Card title="Live Signals">
          <SignalFeed signals={signals} />
        </Card>
      </div>
      
      {/* Active Strategies */}
      <div className="col-span-4">
        <Card title="Active Strategies">
          <StrategyList strategies={strategies} />
        </Card>
      </div>
      
      {/* Open Positions */}
      <div className="col-span-4">
        <Card title="Open Positions">
          <PositionList positions={positions} />
        </Card>
      </div>
      
      {/* Performance Chart */}
      <div className="col-span-8">
        <Card title="Portfolio Performance">
          <PerformanceChart data={positions} />
        </Card>
      </div>
      
      {/* Recent Orders */}
      <div className="col-span-4">
        <Card title="Recent Orders">
          <OrderList orders={orders} />
        </Card>
      </div>
    </div>
  );
}
```

## Data Models

### Database Schema (PostgreSQL for off-chain indexing)

```sql
-- Cached signals for quick dashboard access
CREATE TABLE signals (
  id BIGSERIAL PRIMARY KEY,
  influencer VARCHAR(255) NOT NULL,
  token VARCHAR(50) NOT NULL,
  contract VARCHAR(255),
  sentiment VARCHAR(20) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  timestamp BIGINT NOT NULL,
  tweet_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cached strategies
CREATE TABLE strategies (
  id BIGSERIAL PRIMARY KEY,
  owner VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  strategy_type VARCHAR(20) NOT NULL,
  parameters JSONB,
  dsl_code TEXT,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cached orders
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  strategy_id BIGINT REFERENCES strategies(id),
  signal_id BIGINT REFERENCES signals(id),
  order_type VARCHAR(10) NOT NULL,
  token VARCHAR(50) NOT NULL,
  quantity DECIMAL(20,8) NOT NULL,
  status VARCHAR(20) NOT NULL,
  tx_hash VARCHAR(255),
  fill_price DECIMAL(20,8),
  created_at TIMESTAMP DEFAULT NOW(),
  filled_at TIMESTAMP
);

-- Performance metrics
CREATE TABLE performance_snapshots (
  id BIGSERIAL PRIMARY KEY,
  strategy_id BIGINT REFERENCES strategies(id),
  total_trades INT NOT NULL,
  win_rate DECIMAL(5,2),
  total_pnl DECIMAL(20,8),
  max_drawdown DECIMAL(5,2),
  sharpe_ratio DECIMAL(5,2),
  snapshot_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_signals_timestamp ON signals(timestamp DESC);
CREATE INDEX idx_orders_strategy ON orders(strategy_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### DSL Grammar (PEG.js)

```pegjs
Strategy
  = "strategy" "(" name:String ")" "{" rules:Rule+ "}"

Rule
  = Condition "{" actions:Action+ "}"

Condition
  = "if" expr:Expression

Expression
  = left:Term op:Operator right:Term
  / FunctionCall
  / Comparison

Term
  = "tweet.contains" "(" text:String ")"
  / "token.volume"
  / "price"
  / TechnicalIndicator

TechnicalIndicator
  = "rsi" "(" period:Number ")"
  / "sma" "(" period:Number ")"
  / "ema" "(" period:Number ")"

Action
  = "buy" "(" params:Parameters ")"
  / "sell" "(" params:Parameters ")"

Parameters
  = param:Parameter ("," param:Parameter)*

Parameter
  = key:Identifier "=" value:Value

Value
  = Number / String / Percentage

Percentage
  = num:Number "%"

Operator
  = ">" / "<" / ">=" / "<=" / "==" / "and" / "or"
```

## Error Handling

### Error Categories

1. **Ingestion Errors**
   - Twitter API rate limits → exponential backoff
   - Connection failures → automatic reconnection
   - Invalid tweet format → log and skip

2. **AI Parsing Errors**
   - LLM timeout → retry up to 3 times
   - Low confidence (<0.7) → mark signal as low-confidence
   - Token resolution failure → use symbol only

3. **Linera Chain Errors**
   - Invalid operation → return error to caller
   - Insufficient permissions → reject with auth error
   - State corruption → panic and restart

4. **Relayer Errors**
   - Jupiter API failure → try alternative DEX
   - Transaction failure → record as failed order
   - Insufficient balance → skip and log

5. **Frontend Errors**
   - RPC connection loss → show reconnecting banner
   - Invalid form input → inline validation errors
   - DSL parse error → highlight line with error message

### Error Response Format

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

// Example error codes
enum ErrorCode {
  INVALID_SIGNAL = 'INVALID_SIGNAL',
  STRATEGY_NOT_FOUND = 'STRATEGY_NOT_FOUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRADE_EXECUTION_FAILED = 'TRADE_EXECUTION_FAILED',
  DSL_PARSE_ERROR = 'DSL_PARSE_ERROR',
}
```

## Testing Strategy

### Unit Tests

1. **Linera App Chain**
   - Test signal submission and storage
   - Test strategy creation and activation
   - Test order lifecycle (create → fill → complete)
   - Test event emission

2. **DSL Parser**
   - Test valid DSL syntax parsing
   - Test error detection and reporting
   - Test AST generation

3. **Strategy Evaluator**
   - Test form strategy evaluation logic
   - Test DSL strategy execution
   - Test technical indicator calculations

### Integration Tests

1. **End-to-End Signal Flow**
   - Mock tweet → AI parser → Linera → relayer → mock DEX
   - Verify signal stored correctly
   - Verify order created and filled

2. **Strategy Execution**
   - Create test strategy
   - Submit matching signal
   - Verify order execution

3. **Dashboard Updates**
   - Submit signal via API
   - Verify dashboard reflects new data within 2 seconds

### Performance Tests

1. **Latency Benchmarks**
   - Tweet to signal: < 3 seconds
   - Signal to order creation: < 1 second
   - Order to execution: < 5 seconds

2. **Load Tests**
   - 100 signals per minute
   - 50 concurrent strategies
   - 10 relayers processing same events

### Security Tests

1. **Authentication**
   - Verify wallet signature validation
   - Test unauthorized access rejection

2. **Input Validation**
   - Test SQL injection in DSL
   - Test XSS in strategy names
   - Test integer overflow in quantities

3. **Rate Limiting**
   - Verify 10 orders/minute limit enforced
   - Test rate limit bypass attempts

## Deployment Architecture

### Development Environment

```yaml
services:
  linera-node:
    image: linera/linera-service:latest
    ports:
      - "8080:8080"
    volumes:
      - ./linera-app:/app
    command: linera service --port 8080
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: lineratrade
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
  
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      LINERA_RPC: http://linera-node:8080
      DATABASE_URL: postgresql://admin:password@postgres:5432/lineratrade
      OPENAI_API_KEY: ${OPENAI_API_KEY}
  
  relayer:
    build: ./relayer
    environment:
      LINERA_RPC: http://linera-node:8080
      SOLANA_RPC: https://api.devnet.solana.com
      WALLET_PRIVATE_KEY: ${WALLET_PRIVATE_KEY}
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NEXT_PUBLIC_LINERA_RPC: http://localhost:8080
```

### Production Considerations

1. **Linera Node**: Deploy on dedicated infrastructure with high availability
2. **Relayers**: Multiple instances across different regions
3. **Database**: PostgreSQL with read replicas for dashboard queries
4. **Frontend**: Deploy on Vercel or similar CDN
5. **Backend**: Containerized on Kubernetes with auto-scaling
6. **Monitoring**: Prometheus + Grafana for metrics, Sentry for errors

## Security Considerations

### Key Management

- Relayer private keys stored in AWS KMS or HashiCorp Vault
- Never log or expose private keys
- Rotate keys every 90 days

### Rate Limiting

- API endpoints: 100 requests/minute per IP
- Order creation: 10 orders/minute per user
- Signal submission: 50 signals/minute globally

### Input Sanitization

- Validate all numeric inputs for range and type
- Sanitize strategy names and descriptions
- Sandbox DSL execution (no eval, no file system access)

### Audit Logging

- Log all state-changing operations with timestamps
- Log all trade executions with full details
- Retain logs for 1 year minimum

## Performance Optimizations

1. **Caching**: Redis cache for frequently accessed strategies and signals
2. **Indexing**: PostgreSQL indexes on timestamp, strategy_id, status
3. **Batch Processing**: Group multiple signals for batch evaluation
4. **Connection Pooling**: Reuse database and RPC connections
5. **Lazy Loading**: Dashboard loads data incrementally

## Future Enhancements

1. **Multi-Chain Support**: Extend to Ethereum, Arbitrum, Base
2. **Social Trading**: Follow and copy successful traders
3. **Advanced Analytics**: ML-based strategy recommendations
4. **Mobile App**: React Native app for iOS/Android
5. **Governance**: DAO for platform parameters and fee distribution
