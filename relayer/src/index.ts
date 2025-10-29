import dotenv from 'dotenv';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import axios from 'axios';

dotenv.config();

interface Signal {
  id: number;
  influencer: string;
  token: string;
  contract: string;
  sentiment: string;
  confidence: number;
  timestamp: number;
  tweet_url: string;
}

interface Strategy {
  id: number;
  owner: string;
  name: string;
  strategy_type: any;
  active: boolean;
  created_at: number;
}

interface Order {
  id: number;
  strategy_id: number;
  signal_id: number;
  order_type: string;
  token: string;
  quantity: number;
  status: string;
}

class RelayerService {
  private lineraRpcUrl: string;
  private solanaConnection: Connection;
  private wallet: Keypair;
  private jupiterApiUrl: string;
  private isRunning: boolean;
  private seenEventIds: Set<string>;

  constructor() {
    this.lineraRpcUrl = process.env.LINERA_RPC_URL || 'http://localhost:8080';
    this.solanaConnection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
    
    // Load wallet from private key
    const privateKey = process.env.WALLET_PRIVATE_KEY || '';
    if (!privateKey) {
      throw new Error('WALLET_PRIVATE_KEY environment variable is required');
    }
    this.wallet = Keypair.fromSecretKey(bs58.decode(privateKey));
    
    this.jupiterApiUrl = 'https://quote-api.jup.ag/v6';
    this.isRunning = false;
    this.seenEventIds = new Set();

    console.log('Relayer initialized with wallet:', this.wallet.publicKey.toBase58());
  }

  async start() {
    console.log('Starting Relayer Service...');
    this.isRunning = true;
    await this.subscribeToEvents();
  }

  stop() {
    console.log('Stopping Relayer Service...');
    this.isRunning = false;
  }

  private async subscribeToEvents() {
    console.log('Subscribing to Linera events...');
    
    // Poll for events (in production, use WebSocket or Linera indexer)
    while (this.isRunning) {
      try {
        await this.pollForSignals();
        await this.sleep(1000); // Poll every second
      } catch (error) {
        console.error('Error polling for events:', error);
        await this.sleep(5000); // Back off on error
      }
    }
  }

  private async pollForSignals() {
    try {
      // Fetch recent signals from Linera
      const response = await axios.post(`${this.lineraRpcUrl}/query`, {
        application_id: process.env.LINERA_APP_ID,
        query: JSON.stringify({
          GetSignals: { limit: 10, offset: 0 },
        }),
      });

      const signals = response.data.Signals || [];

      for (const signal of signals) {
        const eventId = `signal-${signal.id}`;
        
        // Skip if already processed
        if (this.seenEventIds.has(eventId)) {
          continue;
        }

        this.seenEventIds.add(eventId);
        await this.handleSignal(signal);
      }
    } catch (error: any) {
      console.error('Error polling signals:', error.message);
    }
  }

  private async handleSignal(signal: Signal) {
    console.log(`Processing signal ${signal.id}: ${signal.sentiment} on ${signal.token}`);

    try {
      // Fetch active strategies
      const strategies = await this.getActiveStrategies();

      for (const strategy of strategies) {
        const shouldTrade = this.evaluateStrategy(strategy, signal);

        if (shouldTrade) {
          console.log(`Strategy ${strategy.id} matched signal ${signal.id}`);
          await this.executeTrade(strategy, signal);
        }
      }
    } catch (error) {
      console.error(`Error handling signal ${signal.id}:`, error);
    }
  }

  private async getActiveStrategies(): Promise<Strategy[]> {
    try {
      const response = await axios.post(`${this.lineraRpcUrl}/query`, {
        application_id: process.env.LINERA_APP_ID,
        query: JSON.stringify({
          GetStrategies: { owner: null, limit: 100, offset: 0 },
        }),
      });

      const strategies = response.data.Strategies || [];
      return strategies.filter((s: Strategy) => s.active);
    } catch (error) {
      console.error('Error fetching strategies:', error);
      return [];
    }
  }

  private evaluateStrategy(strategy: Strategy, signal: Signal): boolean {
    // Simple evaluation logic
    if (strategy.strategy_type.Form) {
      return this.evaluateFormStrategy(strategy.strategy_type.Form, signal);
    } else if (strategy.strategy_type.DSL) {
      return this.evaluateDSLStrategy(strategy.strategy_type.DSL, signal);
    }
    return false;
  }

  private evaluateFormStrategy(formParams: any, signal: Signal): boolean {
    // Check if token matches
    if (formParams.token_pair && !formParams.token_pair.includes(signal.token)) {
      return false;
    }

    // Check sentiment
    if (signal.sentiment === 'bullish' && signal.confidence >= 0.7) {
      return true;
    }

    return false;
  }

  private evaluateDSLStrategy(dslCode: string, signal: Signal): boolean {
    // Simplified DSL evaluation
    // In production, use proper parser
    const code = dslCode.toLowerCase();
    
    if (code.includes('tweet.contains') && code.includes(signal.token.toLowerCase())) {
      return signal.confidence >= 0.7;
    }

    return false;
  }

  private async executeTrade(strategy: Strategy, signal: Signal) {
    let orderId: number | null = null;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        // Create order on Linera
        orderId = await this.createOrder(strategy, signal);
        console.log(`Created order ${orderId} for strategy ${strategy.id}`);

        // Get swap route from Jupiter
        const route = await this.getJupiterRoute(signal.contract, 0.1); // 0.1 SOL

        if (!route) {
          throw new Error('No route found from Jupiter');
        }

        // Execute swap
        const txHash = await this.executeSwap(route);
        console.log(`Trade executed: ${txHash}`);

        // Wait for confirmation
        await this.solanaConnection.confirmTransaction(txHash, 'confirmed');

        // Record fill on Linera
        await this.recordOrderFill(orderId, txHash, route.outAmount / route.inAmount);

        console.log(`Order ${orderId} filled successfully`);
        return;

      } catch (error: any) {
        retries++;
        console.error(`Trade execution attempt ${retries} failed:`, error.message);

        if (retries >= maxRetries) {
          console.error(`Order ${orderId} failed after ${maxRetries} attempts`);
          if (orderId) {
            await this.recordOrderFailure(orderId, error.message);
          }
        } else {
          // Exponential backoff
          await this.sleep(Math.pow(2, retries) * 1000);
        }
      }
    }
  }

  private async createOrder(strategy: Strategy, signal: Signal): Promise<number> {
    const order = {
      strategy_id: strategy.id,
      signal_id: signal.id,
      order_type: signal.sentiment === 'bullish' ? 'buy' : 'sell',
      token: signal.token,
      quantity: 0.1, // Default quantity
      status: 'Pending',
      created_at: Date.now(),
    };

    const response = await axios.post(`${this.lineraRpcUrl}/execute`, {
      application_id: process.env.LINERA_APP_ID,
      operation: JSON.stringify({
        CreateOrder: { order },
      }),
    });

    return response.data.order_id;
  }

  private async getJupiterRoute(outputMint: string, amount: number): Promise<any> {
    try {
      // Input mint is SOL
      const inputMint = 'So11111111111111111111111111111111111111112';
      const amountLamports = Math.floor(amount * 1e9);

      const response = await axios.get(`${this.jupiterApiUrl}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: amountLamports,
          slippageBps: 50, // 0.5% slippage
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Jupiter API error:', error.message);
      return null;
    }
  }

  private async executeSwap(route: any): Promise<string> {
    // Get swap transaction
    const response = await axios.post(`${this.jupiterApiUrl}/swap`, {
      quoteResponse: route,
      userPublicKey: this.wallet.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
    });

    const { swapTransaction } = response.data;

    // Deserialize and sign transaction
    const transactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = Transaction.from(transactionBuf);
    transaction.sign(this.wallet);

    // Send transaction
    const txHash = await this.solanaConnection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      }
    );

    return txHash;
  }

  private async recordOrderFill(orderId: number, txHash: string, fillPrice: number) {
    await axios.post(`${this.lineraRpcUrl}/execute`, {
      application_id: process.env.LINERA_APP_ID,
      operation: JSON.stringify({
        RecordOrderFill: {
          order_id: orderId,
          tx_hash: txHash,
          fill_price: fillPrice,
          filled_at: Date.now(),
        },
      }),
    });
  }

  private async recordOrderFailure(orderId: number, reason: string) {
    console.log(`Recording failure for order ${orderId}: ${reason}`);
    // In production, emit OrderFailed event
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Start relayer
const relayer = new RelayerService();

process.on('SIGINT', () => {
  relayer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  relayer.stop();
  process.exit(0);
});

relayer.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
