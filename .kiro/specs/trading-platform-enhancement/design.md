# Design Document: Trading Platform Enhancement

## Overview

This design outlines the architecture for enhancing the Linera Trade AI application with multi-DEX integration (Raydium, Jupiter, Binance), PineScript strategy support, visual strategy builder, social trading on microchains, and an improved frontend. The system will enable traders to create, deploy, share, and follow trading strategies across multiple exchanges with real-time execution on Linera microchains.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Dashboard  │  │   Strategy   │  │    Social    │          │
│  │              │  │   Builder    │  │   Trading    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  DEX Router  │  │  PineScript  │  │   Strategy   │          │
│  │   Service    │  │  Interpreter │  │   Manager    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Linera Microchain Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Strategy   │  │    Social    │  │   Execution  │          │
│  │  Microchain  │  │   Trading    │  │   Microchain │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External APIs Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Raydium    │  │   Jupiter    │  │   Binance    │          │
│  │     API      │  │     API      │  │     API      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Frontend Layer**:
- React/Next.js application with TypeScript
- Real-time chart visualization with TradingView widgets
- Strategy builder with drag-and-drop interface
- Social trading feed and follower management
- Wallet integration (Phantom, Solflare, MetaMask)

**Backend Services Layer**:
- DEX Router: Aggregates quotes and routes trades
- PineScript Interpreter: Compiles and executes strategies
- Strategy Manager: Deploys and monitors strategies
- WebSocket server for real-time updates

**Linera Microchain Layer**:
- Strategy execution contracts
- Social trading subscription system
- Event streaming for trade replication
- State management for positions and orders

**External APIs Layer**:
- Raydium SDK v2 integration
- Jupiter API v6 integration
- Binance REST and WebSocket APIs
- Price feed aggregation

## Components and Interfaces

### 1. DEX Router Service

**Purpose**: Aggregate quotes from multiple DEXes and route trades optimally

**Interface**:
```typescript
interface DEXRouter {
  getQuote(params: QuoteParams): Promise<Quote>;
  executeSwap(params: SwapParams): Promise<Transaction>;
  compareRoutes(quotes: Quote[]): Quote;
}

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
  dexes: DEX[];
}

interface Quote {
  dex: DEX;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
  route: string[];
}

enum DEX {
  RAYDIUM = 'raydium',
  JUPITER = 'jupiter',
  BINANCE = 'binance'
}
```

**Implementation**:
- Parallel API calls to all DEXes
- Quote comparison with net price calculation
- Automatic fallback on API failures
- Caching layer for token metadata

### 2. Raydium Integration

**API Endpoints**:
- Quote: `GET https://transaction-v1.raydium.io/compute/swap-base-in`
- Transaction: `POST https://transaction-v1.raydium.io/transaction/swap-base-in`
- Priority Fee: `GET https://api-v3.raydium.io/main/auto-fee`

**Implementation**:
```typescript
class RaydiumService {
  async getSwapQuote(params: RaydiumQuoteParams): Promise<SwapCompute> {
    const response = await axios.get(
      `${API_URLS.SWAP_HOST}/compute/swap-base-in`,
      { params }
    );
    return response.data;
  }

  async getSwapTransaction(params: RaydiumTxParams): Promise<Transaction> {
    const priorityFee = await this.getPriorityFee();
    const response = await axios.post(
      `${API_URLS.SWAP_HOST}/transaction/swap-base-in`,
      {
        ...params,
        computeUnitPriceMicroLamports: String(priorityFee.data.default.h)
      }
    );
    return this.deserializeTransaction(response.data);
  }

  async getPriorityFee(): Promise<PriorityFeeResponse> {
    return axios.get(`${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`);
  }
}
```

### 3. Jupiter Integration

**API Endpoints**:
- Quote: `GET https://quote-api.jup.ag/v6/quote`
- Swap: `POST https://quote-api.jup.ag/v6/swap`
- Price: `GET https://price.jup.ag/v4/price`

**Implementation**:
```typescript
class JupiterService {
  private apiKey: string;

  async getQuote(params: JupiterQuoteParams): Promise<JupiterQuote> {
    const response = await axios.get('https://quote-api.jup.ag/v6/quote', {
      params: {
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amount,
        slippageBps: params.slippageBps,
      },
      headers: {
        'X-API-KEY': this.apiKey
      }
    });
    return response.data;
  }

  async getSwapTransaction(quote: JupiterQuote, userPublicKey: string): Promise<Transaction> {
    const response = await axios.post('https://quote-api.jup.ag/v6/swap', {
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
    });
    return VersionedTransaction.deserialize(
      Buffer.from(response.data.swapTransaction, 'base64')
    );
  }
}
```

### 4. Binance Integration

**API Endpoints**:
- Order: `POST /api/v3/order`
- Account: `GET /api/v3/account`
- Price: `GET /api/v3/ticker/price`
- WebSocket: `wss://stream.binance.com:9443/ws`

**Implementation**:
```typescript
class BinanceService {
  private apiKey: string;
  private apiSecret: string;

  async placeOrder(params: BinanceOrderParams): Promise<BinanceOrder> {
    const timestamp = Date.now();
    const signature = this.generateSignature(params, timestamp);
    
    const response = await axios.post(
      'https://api.binance.com/api/v3/order',
      {
        ...params,
        timestamp,
        signature
      },
      {
        headers: { 'X-MBX-APIKEY': this.apiKey }
      }
    );
    return response.data;
  }

  subscribeToPrice(symbol: string, callback: (price: number) => void): void {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
    ws.on('message', (data) => {
      const trade = JSON.parse(data);
      callback(parseFloat(trade.p));
    });
  }

  private generateSignature(params: any, timestamp: number): string {
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&') + `&timestamp=${timestamp}`;
    return crypto.createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }
}
```

### 5. PineScript Interpreter

**Purpose**: Parse, compile, and execute PineScript strategies

**Architecture**:
```typescript
class PineScriptInterpreter {
  parse(code: string): AST;
  compile(ast: AST): CompiledStrategy;
  execute(strategy: CompiledStrategy, data: OHLCV[]): Signal[];
}

interface AST {
  indicators: IndicatorNode[];
  conditions: ConditionNode[];
  actions: ActionNode[];
}

interface CompiledStrategy {
  indicators: Map<string, IndicatorFunction>;
  entryCondition: () => boolean;
  exitCondition: () => boolean;
  stopLoss: number;
  takeProfit: number;
}
```

**Supported Functions**:
- Technical Indicators: `ta.sma()`, `ta.ema()`, `ta.rsi()`, `ta.macd()`, `ta.bb()`
- Math Functions: `math.max()`, `math.min()`, `math.abs()`, `math.avg()`
- Logical Operators: `and`, `or`, `not`
- Comparison: `>`, `<`, `>=`, `<=`, `==`, `!=`
- Cross Functions: `ta.crossover()`, `ta.crossunder()`

**Example PineScript**:
```pinescript
//@version=5
strategy("RSI Strategy", overlay=true)

// Inputs
rsiLength = input(14, "RSI Length")
rsiOverbought = input(70, "RSI Overbought")
rsiOversold = input(30, "RSI Oversold")

// Calculate RSI
rsi = ta.rsi(close, rsiLength)

// Entry Conditions
longCondition = ta.crossover(rsi, rsiOversold)
shortCondition = ta.crossunder(rsi, rsiOverbought)

// Execute Trades
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.entry("Short", strategy.short)
```

### 6. Visual Strategy Builder

**Components**:
- Block Library: Indicators, Conditions, Actions
- Canvas: Drag-and-drop workspace
- Connection System: Link blocks with data flow
- Code Generator: Convert visual to executable code

**Block Types**:
```typescript
interface Block {
  id: string;
  type: BlockType;
  inputs: BlockInput[];
  outputs: BlockOutput[];
  config: BlockConfig;
}

enum BlockType {
  INDICATOR = 'indicator',
  CONDITION = 'condition',
  ACTION = 'action',
  LOGIC = 'logic'
}

interface IndicatorBlock extends Block {
  indicator: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB';
  period: number;
  source: 'open' | 'high' | 'low' | 'close';
}

interface ConditionBlock extends Block {
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  leftInput: BlockOutput;
  rightInput: BlockOutput | number;
}

interface ActionBlock extends Block {
  action: 'BUY' | 'SELL' | 'CLOSE';
  quantity: number | 'ALL';
}
```

**Visual to Code Conversion**:
```typescript
class StrategyCodeGenerator {
  generate(blocks: Block[], connections: Connection[]): string {
    const indicators = this.generateIndicators(blocks);
    const conditions = this.generateConditions(blocks, connections);
    const actions = this.generateActions(blocks);
    
    return `
      ${indicators}
      
      if (${conditions.entry}) {
        ${actions.entry}
      }
      
      if (${conditions.exit}) {
        ${actions.exit}
      }
    `;
  }
}
```

## Data Models

### Strategy Model

```rust
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Strategy {
    pub id: u64,
    pub owner: String,
    pub name: String,
    pub strategy_type: StrategyType,
    pub code: String,
    pub microchain_id: Option<ChainId>,
    pub active: bool,
    pub public: bool,
    pub performance: PerformanceMetrics,
    pub created_at: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum StrategyType {
    PineScript,
    Visual,
    Form,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub total_trades: u64,
    pub winning_trades: u64,
    pub losing_trades: u64,
    pub total_pnl: f64,
    pub roi_percentage: f64,
    pub max_drawdown: f64,
    pub sharpe_ratio: f64,
}
```

### DEX Order Model

```rust
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DEXOrder {
    pub id: u64,
    pub strategy_id: u64,
    pub dex: DEX,
    pub order_type: OrderType,
    pub input_mint: String,
    pub output_mint: String,
    pub input_amount: u64,
    pub output_amount: u64,
    pub slippage_bps: u16,
    pub priority_fee: u64,
    pub status: OrderStatus,
    pub tx_signature: Option<String>,
    pub created_at: u64,
    pub executed_at: Option<u64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum DEX {
    Raydium,
    Jupiter,
    Binance,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum OrderType {
    Market,
    Limit { price: f64 },
    StopLoss { trigger_price: f64 },
}
```

### Social Trading Model

```rust
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StrategyFollower {
    pub follower_id: String,
    pub strategy_id: u64,
    pub allocation_percentage: f64,
    pub max_position_size: f64,
    pub auto_follow: bool,
    pub followed_at: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TradeReplication {
    pub original_order_id: u64,
    pub follower_order_id: u64,
    pub follower_id: String,
    pub scale_factor: f64,
    pub status: ReplicationStatus,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum ReplicationStatus {
    Pending,
    Executed,
    Failed { reason: String },
    Skipped { reason: String },
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: DEX quote consistency
*For any* token pair and amount, when quotes are fetched from multiple DEXes, the selected DEX SHALL have the best net output amount after fees.
**Validates: Requirements 13.1, 13.2**

### Property 2: Transaction serialization round-trip
*For any* swap transaction from Raydium or Jupiter, serializing then deserializing SHALL produce an equivalent transaction.
**Validates: Requirements 1.2, 1.3, 2.3**

### Property 3: Priority fee ordering
*For any* set of priority fee levels (vh, h, m), the computeUnitPriceMicroLamports SHALL be ordered: vh > h > m.
**Validates: Requirements 4.2, 4.3**

### Property 4: SOL wrapping consistency
*For any* swap where input is SOL, wrapSol SHALL be true, and for any swap where output is SOL, unwrapSol SHALL be true.
**Validates: Requirements 11.1, 11.2**

### Property 5: PineScript compilation determinism
*For any* valid PineScript code, compiling it multiple times SHALL produce identical compiled strategies.
**Validates: Requirements 5.2**

### Property 6: Visual strategy equivalence
*For any* visual strategy, the generated code SHALL produce the same trading signals as the visual representation.
**Validates: Requirements 6.5**

### Property 7: Strategy microchain isolation
*For any* two strategies deployed on separate microchains, operations on one microchain SHALL NOT affect the state of the other.
**Validates: Requirements 7.5**

### Property 8: Trade replication proportionality
*For any* followed strategy trade, the replicated trade amount SHALL equal the original amount multiplied by the follower's scale factor.
**Validates: Requirements 9.2**

### Property 9: Follower risk limit enforcement
*For any* follower with maximum position size set, no replicated trade SHALL cause the total position to exceed this limit.
**Validates: Requirements 9.3**

### Property 10: Slippage protection
*For any* swap with slippage tolerance S, the actual execution price SHALL NOT deviate more than S basis points from the quoted price.
**Validates: Requirements 1.1, 2.1**

### Property 11: API authentication security
*For any* Binance API call, the signature SHALL be generated using HMAC-SHA256 with the user's API secret.
**Validates: Requirements 3.2**

### Property 12: Strategy performance accuracy
*For any* strategy, the displayed performance metrics SHALL match the sum of all executed trades for that strategy.
**Validates: Requirements 8.2**

## Error Handling

### DEX Integration Errors

1. **API Rate Limiting**
   - Cause: Exceeding DEX API rate limits
   - Handling: Implement exponential backoff with jitter
   - Recovery: Queue requests and retry with increasing delays

2. **Insufficient Liquidity**
   - Cause: Requested swap amount exceeds available liquidity
   - Handling: Display error with maximum tradeable amount
   - Recovery: Suggest splitting into smaller trades or using different DEX

3. **Slippage Exceeded**
   - Cause: Price moved beyond slippage tolerance during execution
   - Handling: Reject transaction and display new quote
   - Recovery: Allow user to adjust slippage or retry

4. **Transaction Timeout**
   - Cause: Transaction not confirmed within expected time
   - Handling: Monitor transaction status and notify user
   - Recovery: Provide option to increase priority fee and retry

### PineScript Errors

1. **Syntax Error**
   - Cause: Invalid PineScript syntax
   - Handling: Display error with line number and description
   - Recovery: Provide syntax highlighting and auto-completion

2. **Runtime Error**
   - Cause: Division by zero, array out of bounds, etc.
   - Handling: Catch error and display context
   - Recovery: Suggest fixes and provide debugging tools

3. **Indicator Calculation Error**
   - Cause: Insufficient data for indicator calculation
   - Handling: Display minimum required data points
   - Recovery: Wait for more data or adjust indicator period

### Social Trading Errors

1. **Replication Failure**
   - Cause: Follower has insufficient balance
   - Handling: Skip trade and notify follower
   - Recovery: Suggest reducing allocation percentage

2. **Microchain Sync Error**
   - Cause: Follower microchain out of sync with leader
   - Handling: Pause replication and resync
   - Recovery: Resume replication after sync complete

## Testing Strategy

### Unit Testing

1. **DEX Router Tests**
   - Test quote comparison logic
   - Test route selection algorithm
   - Test error handling for API failures

2. **PineScript Interpreter Tests**
   - Test parsing of valid and invalid syntax
   - Test compilation of common strategies
   - Test execution with historical data

3. **Strategy Builder Tests**
   - Test block connection validation
   - Test code generation from visual blocks
   - Test strategy execution equivalence

### Integration Testing

1. **End-to-End Swap Test**
   - Create test wallet with SOL
   - Execute swap on each DEX
   - Verify output token received

2. **Strategy Deployment Test**
   - Create test strategy
   - Deploy to microchain
   - Verify contract is callable

3. **Social Trading Test**
   - Create leader strategy
   - Create follower subscription
   - Execute trade and verify replication

### Property-Based Testing

**Testing Framework**: We will use `quickcheck` for Rust and `fast-check` for TypeScript property-based testing.

**Test Configuration**: Each property test will run a minimum of 100 iterations.

**Property Test Tagging**: Each test will include:
```rust
// Feature: trading-platform-enhancement, Property N: <description>
```

1. **Property Test 1: DEX Quote Consistency**
   - Generate: Random token pairs and amounts
   - Test: Selected DEX has best net output
   - Validates: Property 1

2. **Property Test 2: Transaction Round-Trip**
   - Generate: Random swap parameters
   - Test: Serialize/deserialize produces equivalent transaction
   - Validates: Property 2

3. **Property Test 3: Trade Replication Proportionality**
   - Generate: Random trades and scale factors
   - Test: Replicated amount equals original × scale
   - Validates: Property 8

## Implementation Notes

### Technology Stack

**Frontend**:
- Next.js 14 with App Router
- TypeScript
- TailwindCSS for styling
- TradingView Lightweight Charts
- React Flow for visual builder
- Zustand for state management
- React Query for data fetching

**Backend**:
- Node.js with Express
- TypeScript
- WebSocket (ws library)
- Bull for job queues
- Redis for caching
- PostgreSQL for persistent data

**Blockchain**:
- Linera SDK 0.15.6
- Solana Web3.js
- Anchor framework (optional)

**External SDKs**:
- @raydium-io/raydium-sdk-v2
- Jupiter API v6
- Binance Connector

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel/Netlify                       │
│                    (Frontend Deployment)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AWS/GCP/Azure                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Backend    │  │   WebSocket  │  │    Redis     │      │
│  │   Service    │  │    Server    │  │    Cache     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Linera Network                          │
│                   (Microchain Deployment)                    │
└─────────────────────────────────────────────────────────────┘
```

### Security Considerations

1. **API Key Management**
   - Store encrypted in database
   - Use environment variables for service keys
   - Implement key rotation

2. **Wallet Security**
   - Never store private keys on server
   - Use client-side signing only
   - Implement transaction simulation before signing

3. **Rate Limiting**
   - Implement per-user rate limits
   - Use Redis for distributed rate limiting
   - Graceful degradation on limit exceeded

4. **Input Validation**
   - Validate all user inputs
   - Sanitize PineScript code
   - Prevent injection attacks

### Performance Optimization

1. **Caching Strategy**
   - Cache token metadata (24 hours)
   - Cache DEX quotes (10 seconds)
   - Cache strategy performance (5 minutes)

2. **Database Optimization**
   - Index frequently queried fields
   - Use connection pooling
   - Implement read replicas for queries

3. **WebSocket Optimization**
   - Use rooms for targeted updates
   - Implement heartbeat for connection health
   - Batch updates to reduce messages

4. **Frontend Optimization**
   - Code splitting by route
   - Lazy load charts and heavy components
   - Use virtual scrolling for large lists
   - Implement service worker for offline support
