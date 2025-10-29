# Linera Integration Fix Plan

## Objective
Make LineraTrade AI actually work with Linera's infrastructure by fixing critical integration issues.

---

## Phase 1: Research & Understanding (Days 1-3)

### Tasks
1. **Study Linera Documentation**
   - Read: https://github.com/linera-io/linera-documentation
   - Understand Linera's execution model
   - Learn about operations vs queries
   - Understand event subscription

2. **Review Linera Protocol**
   - Clone linera-protocol repository
   - Study examples/ folder for reference implementations
   - Understand service vs contract architecture

3. **Set Up Local Environment**
   ```bash
   # Install Linera CLI
   cargo install linera-service linera
   
   # Start local network
   linera net up --testing-prng-seed 37
   
   # Create wallet
   linera wallet init
   ```

### Deliverables
- [ ] Understanding document of how Linera works
- [ ] List of available Linera APIs and commands
- [ ] Working local Linera network

---

## Phase 2: Fix Linera Client Integration (Days 4-7)

### Current Problem
`LineraClient.ts` makes HTTP calls to non-existent endpoints.

### Solution: Use Linera CLI or Service

**Approach A: Shell Command Wrapper** (Simpler)
```typescript
// backend/src/linera-client-cli.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class LineraClientCLI {
  private chainId: string;
  private appId: string;
  
  async submitSignal(signal: Signal): Promise<number> {
    const operation = JSON.stringify({
      SubmitSignal: { signal }
    });
    
    const command = `linera node execute \
      --chain-id ${this.chainId} \
      --operation '${operation}'`;
    
    const { stdout } = await execAsync(command);
    const result = JSON.parse(stdout);
    return result.signal_id;
  }
  
  async querySignals(limit: number, offset: number): Promise<Signal[]> {
    const command = `linera query \
      --chain-id ${this.chainId} \
      --application-id ${this.appId} \
      GetSignals ${limit} ${offset}`;
    
    const { stdout } = await execAsync(command);
    const response = JSON.parse(stdout);
    return response.Signals || [];
  }
}
```

**Approach B: HTTP Service** (Better, but needs setup)
```typescript
// backend/src/linera-client-http.ts
import axios from 'axios';

export class LineraClientHTTP {
  private baseURL: string;
  private appId: string;
  
  async submitSignal(signal: Signal): Promise<number> {
    // Use linera-client HTTP API if available
    const response = await axios.post(`${this.baseURL}/operations`, {
      applicationId: this.appId,
      operation: { SubmitSignal: { signal } }
    });
    return response.data.signal_id;
  }
  
  async querySignals(limit: number, offset: number): Promise<Signal[]> {
    const response = await axios.post(`${this.baseURL}/queries`, {
      applicationId: this.appId,
      query: { GetSignals: { limit, offset } }
    });
    return response.data.Signals || [];
  }
}
```

### Implementation Steps
1. Replace `LineraClient` with `LineraClientCLI`
2. Test signal submission
3. Test query functionality
4. Handle errors gracefully

---

## Phase 3: Deploy Linera Application (Days 8-10)

### Current Problem
Docker Compose starts Linera but never deploys your app.

### Solution: Add Deployment Scripts

**Create**: `scripts/deploy.sh`
```bash
#!/bin/bash

# Start Linera network
echo "Starting Linera network..."
linera net up --testing-prng-seed 37

# Deploy application
echo "Deploying Linera application..."
cd linera-app
linera project publish-and-create

# Get application ID
APP_ID=$(linera node execute --query "GetAppId")
echo "Application ID: $APP_ID"

# Save to .env
echo "LINERA_APP_ID=$APP_ID" >> ../../.env
echo "LINERA_CHAIN_ID=$(linera wallet show | grep Chain | awk '{print $2}')" >> ../../.env

echo "Deployment complete!"
```

**Update**: `docker-compose.yml`
```yaml
services:
  linera-app-deploy:
    image: ghcr.io/linera-io/linera-service:latest
    volumes:
      - ./linera-app:/app
    command: /bin/bash /app/deploy.sh
    
  linera-service:
    image: ghcr.io/linera-io/linera-service:latest
    ports:
      - "8080:8080"
    environment:
      - LINERA_APP_ID=${LINERA_APP_ID}
    command: linera service --port 8080
```

### Implementation Steps
1. Create deployment scripts
2. Test local deployment
3. Capture application ID
4. Update environment variables

---

## Phase 4: Event Subscription (Days 11-14)

### Current Problem
Relayer polls every second instead of subscribing to events.

### Solution: Linera Indexer Integration

**Option 1: Use Linera Indexer** (If available)
```typescript
// relayer/src/index.ts

import { io } from 'socket.io-client';

class EventSubscription {
  private ws: any;
  
  async connect() {
    this.ws = io(LINERA_INDEXER_URL);
    
    this.ws.on('connect', () => {
      this.ws.emit('subscribe', {
        applicationId: process.env.LINERA_APP_ID,
        eventTypes: ['SignalReceived', 'OrderCreated', 'OrderFilled']
      });
    });
    
    this.ws.on('event', (event: any) => {
      if (event.type === 'SignalReceived') {
        this.handleSignal(event.data);
      }
    });
  }
}
```

**Option 2: Periodic Query with Timestamps** (Fallback)
```typescript
class EventSubscription {
  private lastSignalId: number = 0;
  
  async pollForNewSignals() {
    const signals = await lineraClient.getSignals(10, 0);
    
    for (const signal of signals) {
      if (signal.id > this.lastSignalId) {
        this.handleSignal(signal);
        this.lastSignalId = signal.id;
      }
    }
  }
}
```

### Implementation Steps
1. Research Linera indexer availability
2. Implement WebSocket or improved polling
3. Test event delivery latency
4. Ensure <5s end-to-end latency

---

## Phase 5: Complete DSL Evaluation (Days 15-17)

### Current Problem
DSL evaluator is a placeholder that doesn't actually parse or evaluate.

### Solution: Use Actual DSL Parser

```typescript
// relayer/src/index.ts

import { DSLParser, DSLEvaluator } from '../../parser/src/dsl-parser';

class RelayerService {
  private parser = new DSLParser();
  private evaluator = new DSLEvaluator();
  
  private evaluateDSLStrategy(dslCode: string, signal: Signal): boolean {
    try {
      // Parse DSL code
      const strategy = this.parser.parse(dslCode);
      
      // Get market data
      const marketData = await this.getMarketData(signal.token);
      
      // Evaluate strategy
      return this.evaluator.evaluate(strategy, signal, marketData);
    } catch (error) {
      console.error('DSL evaluation error:', error);
      return false;
    }
  }
  
  private async getMarketData(token: string): Promise<any> {
    // Fetch price from Jupiter
    // Fetch volume from chain
    // Calculate indicators
    return {
      price: await this.getPrice(token),
      volume: await this.getVolume(token),
      prices: await this.getHistoricalPrices(token, 100)
    };
  }
}
```

### Implementation Steps
1. Connect DSL parser to relayer
2. Implement market data fetching
3. Test DSL evaluation
4. Handle errors gracefully

---

## Phase 6: Integration Testing (Days 18-20)

### Test Scenarios

1. **End-to-End Flow**
   ```
   Tweet → AI Parser → Linera Chain → Relayer → Jupiter → Fill Recorded → Dashboard Update
   ```
   
2. **Strategy Evaluation**
   ```
   Signal → Evaluate 3 Strategies → Match 2 → Execute 2 Trades → Record Both
   ```
   
3. **Error Handling**
   ```
   Network Error → Retry 3x → Still Fail → Mark Order Failed → Emit Event
   ```

4. **Performance**
   ```
   100 Tweets → 30 Signals → 15 Matches → 15 Executions → < 5s Total
   ```

### Test Infrastructure
```typescript
// tests/integration/signal-flow.test.ts

describe('Signal Flow', () => {
  test('tweet creates signal on Linera', async () => {
    const tweet = { /* mock tweet */ };
    const result = await fetch('/api/tweets/process', {
      method: 'POST',
      body: JSON.stringify(tweet)
    });
    
    expect(result.status).toBe(200);
    
    const signal = await lineraClient.getSignals(1, 0);
    expect(signal[0].influencer).toBe(tweet.author);
  });
});
```

---

## Phase 7: Production Deployment (Days 21-25)

### Production Checklist

- [ ] Linera testnet account created
- [ ] Application deployed to testnet
- [ ] Environment variables configured
- [ ] Database backups configured
- [ ] Monitoring set up
- [ ] Error tracking (Sentry)
- [ ] Rate limiting verified
- [ ] Security audit completed

### Deployment Scripts
```bash
# deploy/testnet.sh
#!/bin/bash
set -e

# Build Rust app
cd linera-app
cargo build --release

# Deploy to testnet
linera project publish-and-create

# Get application ID
APP_ID=$(linera node execute --query "GetAppId")

# Update production .env
echo "LINERA_APP_ID=$APP_ID" > .env.production
echo "LINERA_RPC_URL=https://testnet.linera.net" >> .env.production

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

---

## Resource Requirements

### Team
- 1 Backend developer (Linera integration)
- 1 DevOps engineer (deployment)
- 1 QA engineer (testing)

### Infrastructure
- Linera testnet access
- Solana devnet (for testing)
- Twitter API credentials
- Gemini API key
- Database hosting
- Redis hosting

### Budget
- Linera testnet: Free
- Twitter API: $100/month (Basic)
- Gemini API: Free tier
- Infrastructure: ~$50/month

---

## Risk Assessment

### High Risk
1. **Linera API documentation incomplete**
   - Mitigation: Join Linera Discord, ask questions
   
2. **No prior examples of TypeScript + Linera**
   - Mitigation: Use shell commands as bridge

3. **Latency requirements may not be met**
   - Mitigation: Optimize with parallel processing

### Medium Risk
1. **Jupiter API rate limits**
   - Mitigation: Implement rate limiting and caching

2. **Twitter API rate limits**
   - Mitigation: Increase polling interval if needed

---

## Success Criteria

### Functional
- ✅ Signals stored on Linera chain
- ✅ Strategies deployed and active
- ✅ Orders executed via Jupiter
- ✅ Fills recorded on chain
- ✅ Dashboard shows real-time updates

### Performance
- ✅ Tweet → Signal: < 3s
- ✅ Signal → Order: < 1s
- ✅ Order → Execution: < 5s
- ✅ Dashboard Update: < 2s

### Quality
- ✅ 95%+ uptime
- ✅ < 1% error rate
- ✅ Comprehensive error handling
- ✅ Security audit passed

---

## Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Research | 3 days | None |
| Phase 2: Fix Client | 4 days | Phase 1 |
| Phase 3: Deploy App | 3 days | Phase 2 |
| Phase 4: Events | 4 days | Phase 3 |
| Phase 5: DSL | 3 days | Phase 4 |
| Phase 6: Testing | 3 days | Phase 5 |
| Phase 7: Deployment | 5 days | Phase 6 |

**Total**: ~25 days (5 weeks) of focused development

---

## Priority Order

1. **URGENT**: Fix Linera client integration (Phase 2)
2. **HIGH**: Deploy application (Phase 3)
3. **MEDIUM**: Implement event subscription (Phase 4)
4. **MEDIUM**: Complete DSL evaluation (Phase 5)
5. **LOW**: Integration testing (Phase 6)
6. **LOW**: Production deployment (Phase 7)

---

## Next Immediate Steps

1. Clone Linera documentation repository
2. Study Linera CLI commands
3. Test local deployment
4. Fix `LineraClient.ts` to use shell commands
5. Deploy app locally and get app ID
6. Test signal submission

**Estimated time to first working integration**: 1 week


