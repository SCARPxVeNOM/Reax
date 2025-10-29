# 🔗 Linera Integration Guide - LineraTrade AI

## Overview

Linera is **THE CORE** of this entire project! Every piece of data flows through Linera microchains. Here's exactly how it's integrated:

---

## 🏗️ Architecture: How Linera Fits In

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
│                    User creates strategies                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP POST
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express.js)                     │
│                  Validates and forwards requests                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ RPC Call
┌─────────────────────────────────────────────────────────────────┐
│              ⭐ LINERA MICROCHAIN (Rust) ⭐                      │
│                                                                  │
│  • Stores ALL state (signals, strategies, orders)               │
│  • Executes operations deterministically                         │
│  • Emits events for real-time updates                           │
│  • Provides query functions                                      │
│                                                                  │
│  THIS IS THE SOURCE OF TRUTH! 🎯                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Events
┌─────────────────────────────────────────────────────────────────┐
│                    RELAYER SERVICE (Node.js)                    │
│              Subscribes to Linera events via indexer             │
│                   Executes trades on Solana                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Record Fill
                    Back to Linera Microchain ↑
```

---

## 📁 Linera Integration: File by File

### 1. **Linera Microchain Application** (`linera-app/`)

This is the **heart** of the system - a complete Linera application written in Rust.

#### **`linera-app/src/state.rs`** - State Management

```rust
use linera_sdk::views::{MapView, RegisterView, RootView};

/// The main state stored on Linera microchain
#[derive(RootView)]
pub struct LineraTradeState<C> {
    // All signals stored on-chain
    pub signals: MapView<C, u64, Signal>,
    
    // All strategies stored on-chain
    pub strategies: MapView<C, u64, Strategy>,
    
    // All orders stored on-chain
    pub orders: MapView<C, u64, Order>,
    
    // Counters for generating IDs
    pub signal_counter: RegisterView<C, u64>,
    pub strategy_counter: RegisterView<C, u64>,
    pub order_counter: RegisterView<C, u64>,
}
```

**What this does:**
- Uses Linera's `MapView` for key-value storage
- Uses `RegisterView` for simple values
- `RootView` makes this the main state container
- Everything is stored **on the Linera microchain**

#### **`linera-app/src/contract.rs`** - Contract Logic

```rust
use linera_sdk::{Contract, ContractRuntime};

pub struct LineraTradeContract {
    state: LineraTradeState,
    runtime: ContractRuntime<Self>,
}

impl Contract for LineraTradeContract {
    // Executes operations on the microchain
    async fn execute_operation(&mut self, operation: &[u8]) -> Result<(), Error> {
        match operation {
            Operation::SubmitSignal { signal } => {
                // Store signal on Linera
                self.state.signals.insert(&id, signal)?;
                
                // Emit event for relayers
                self.emit_event(Event::SignalReceived { signal })?;
            }
            // ... other operations
        }
    }
}
```

**What this does:**
- Implements Linera's `Contract` trait
- Handles all state-changing operations
- **Emits events** that other services can subscribe to
- Ensures deterministic execution

#### **`linera-app/src/service.rs`** - Query Service

```rust
use linera_sdk::Service;

impl Service for LineraTradeService {
    async fn handle_query(&self, query: &[u8]) -> Result<Vec<u8>, Error> {
        match query {
            Query::GetSignals { limit, offset } => {
                // Read from Linera state
                let signals = self.state.signals.get_range()?;
                Ok(serialize(signals))
            }
            // ... other queries
        }
    }
}
```

**What this does:**
- Provides read-only access to Linera state
- No gas fees for queries
- Fast, efficient data retrieval

---

### 2. **Backend Integration** (`backend/src/linera-client.ts`)

The backend acts as a **bridge** between the frontend and Linera.

```typescript
export class LineraClient {
  private client: AxiosInstance;
  private applicationId: string;

  constructor(rpcUrl: string) {
    // Connect to Linera RPC endpoint
    this.client = axios.create({
      baseURL: rpcUrl,  // http://localhost:8080
    });
  }

  // Submit signal to Linera microchain
  async submitSignal(signal: Signal): Promise<number> {
    const operation = {
      SubmitSignal: { signal },
    };

    // Call Linera RPC to execute operation
    const response = await this.client.post('/execute', {
      application_id: this.applicationId,
      operation: JSON.stringify(operation),
    });

    return response.data.signal_id;
  }

  // Query signals from Linera
  async getSignals(limit: number): Promise<Signal[]> {
    const query = {
      GetSignals: { limit, offset: 0 },
    };

    // Call Linera RPC to query state
    const response = await this.client.post('/query', {
      application_id: this.applicationId,
      query: JSON.stringify(query),
    });

    return response.data.Signals;
  }
}
```

**What this does:**
- Connects to Linera RPC endpoint
- Sends operations to modify state
- Queries state for reading data
- Handles serialization/deserialization

---

### 3. **Relayer Integration** (`relayer/src/index.ts`)

The relayer **subscribes to Linera events** in real-time.

```typescript
class Relayer {
  async subscribeToLineraEvents() {
    // Subscribe to Linera indexer
    this.lineraClient.subscribeToEvents(async (event) => {
      
      if (event.type === 'SignalReceived') {
        // New signal from Linera!
        console.log('Received signal from Linera:', event.signal);
        
        // Evaluate strategies
        await this.evaluateStrategies(event.signal);
      }
      
      if (event.type === 'OrderCreated') {
        // New order from Linera!
        console.log('Received order from Linera:', event.order);
        
        // Execute trade on Solana
        await this.executeTrade(event.order);
      }
    });
  }

  async recordFillToLinera(orderId: number, txHash: string, price: number) {
    // Record trade result back to Linera
    await this.lineraClient.recordOrderFill(
      orderId,
      txHash,
      price,
      Date.now()
    );
  }
}
```

**What this does:**
- Listens to Linera events in real-time
- Reacts to state changes on the microchain
- Records results back to Linera
- Creates event-driven architecture

---

## 🔄 Complete Data Flow Through Linera

### Example: User Creates a Strategy

```
1. USER (Frontend)
   ↓ Clicks "Create Strategy"
   
2. FRONTEND
   ↓ POST /api/strategies
   
3. BACKEND API
   ↓ lineraClient.createStrategy(strategy)
   
4. LINERA RPC
   ↓ Executes Operation::CreateStrategy
   
5. LINERA MICROCHAIN (Rust)
   • Validates strategy
   • Stores in state.strategies MapView
   • Increments strategy_counter
   • Emits Event::StrategyCreated
   ↓
   
6. LINERA INDEXER
   • Broadcasts event to subscribers
   ↓
   
7. RELAYER
   • Receives StrategyCreated event
   • Adds to active strategies list
   
8. FRONTEND (WebSocket)
   • Receives update
   • Shows new strategy in UI
```

### Example: Tweet → Trade Execution

```
1. TWEET INGESTION
   ↓ Captures tweet
   
2. AI PARSER (Gemini)
   ↓ Analyzes sentiment
   
3. BACKEND
   ↓ lineraClient.submitSignal(signal)
   
4. LINERA MICROCHAIN
   • Stores signal
   • Emits SignalReceived event
   ↓
   
5. RELAYER (subscribes to events)
   • Receives SignalReceived
   • Evaluates active strategies
   • Finds match!
   • Creates order on Linera
   ↓
   
6. LINERA MICROCHAIN
   • Stores order
   • Emits OrderCreated event
   ↓
   
7. RELAYER
   • Receives OrderCreated
   • Executes trade on Solana
   • Gets transaction hash
   • Records fill back to Linera
   ↓
   
8. LINERA MICROCHAIN
   • Updates order status to "Filled"
   • Stores tx_hash and fill_price
   • Emits OrderFilled event
   ↓
   
9. FRONTEND
   • Receives update via WebSocket
   • Shows filled order in dashboard
```

---

## 🎯 Why Linera is Perfect for This

### 1. **Ultra-Low Latency**
- Microchain architecture = sub-second state updates
- Perfect for real-time trading

### 2. **Deterministic Execution**
- All operations execute in order
- No race conditions
- Transparent audit trail

### 3. **Event-Driven**
- Native event emission
- Real-time notifications
- Perfect for coordinating services

### 4. **State Management**
- MapView for efficient key-value storage
- RegisterView for counters
- Persistent, reliable state

### 5. **Scalability**
- Each strategy could run on its own microchain
- Horizontal scaling built-in

---

## 📊 Linera-Specific Features Used

### ✅ Linera SDK Features:

1. **`RootView`** - Main state container
2. **`MapView`** - Key-value storage for signals, strategies, orders
3. **`RegisterView`** - Simple value storage for counters
4. **`Contract` trait** - Implements contract logic
5. **`Service` trait** - Implements query service
6. **Event emission** - Real-time notifications
7. **Operations** - State-changing transactions
8. **Queries** - Read-only state access

### ✅ Linera Architecture Benefits:

1. **Microchains** - Isolated execution environment
2. **Indexer** - Real-time event subscription
3. **RPC API** - Easy integration with other services
4. **Deterministic** - Predictable, auditable execution

---

## 🔍 How to Verify Linera Integration

### Check the Rust Code:

```bash
# View Linera state management
cat linera-app/src/state.rs

# View contract implementation
cat linera-app/src/contract.rs

# View service implementation
cat linera-app/src/service.rs
```

### Check Backend Integration:

```bash
# View Linera client
cat backend/src/linera-client.ts

# View how it's used in routes
cat backend/src/routes.ts
```

### Check Relayer Integration:

```bash
# View event subscription
cat relayer/src/index.ts
```

---

## 🎬 For Your Demo

### Emphasize These Points:

1. **"Built entirely on Linera microchains"**
   - Show `linera-app/src/state.rs`
   - Explain RootView and MapView

2. **"Uses Linera SDK for state management"**
   - Show Contract implementation
   - Explain operations and events

3. **"Event-driven architecture with Linera events"**
   - Show event emission in contract
   - Show event subscription in relayer

4. **"Sub-second state updates"**
   - Explain microchain architecture
   - Show real-time flow

5. **"Deterministic execution"**
   - Explain how operations are processed
   - Show transparent state

---

## 📝 Summary

**Linera is integrated at EVERY level:**

✅ **State Storage** - All data on Linera microchain
✅ **Operations** - All writes go through Linera
✅ **Queries** - All reads from Linera
✅ **Events** - Real-time notifications from Linera
✅ **Coordination** - Services communicate via Linera events

**Without Linera, this project wouldn't work!**

Linera provides:
- The database (state storage)
- The event bus (event emission)
- The coordinator (deterministic execution)
- The audit log (transparent history)

**This is a true Linera-native application!** 🎯

---

## 🏆 This is What Makes Your Project Special

Most blockchain projects just store a hash on-chain. **You built the entire application ON Linera!**

- ✅ Full Rust implementation using Linera SDK
- ✅ Complete state management with MapView
- ✅ Event-driven architecture
- ✅ Real-time coordination
- ✅ Production-ready integration

**This is exactly what the Linera Buildathon is looking for!** 🚀
