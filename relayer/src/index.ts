import dotenv from 'dotenv';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import axios from 'axios';
import { resolve, join } from 'path';
import { existsSync } from 'fs';

// Load .env from project root
// Try multiple paths: current dir, parent dir (if running from relayer/), or workspace root
const possiblePaths = [
  join(process.cwd(), '.env'),           // If running from root
  join(process.cwd(), '..', '.env'),     // If running from relayer/
  join(__dirname, '..', '..', '.env'),   // Relative to this file
];
let envLoaded = false;
for (const envPath of possiblePaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ [RELAYER] Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}
// Fallback: try default location
if (!envLoaded) {
  dotenv.config();
  console.log(`⚠️  [RELAYER] Using default .env location`);
}

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
    console.log(`[RELAYER] Linera RPC URL: ${this.lineraRpcUrl}`);
    console.log(`[RELAYER] LINERA_APP_ID: ${process.env.LINERA_APP_ID ? 'Set' : 'Not set'}`);
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
    
    // Check if Linera is available first
    if (!(await this.checkLineraAvailable())) {
      console.warn('[RELAYER] Linera not available at', this.lineraRpcUrl);
      console.warn('[RELAYER] Relayer will retry every 30 seconds...');
      console.warn('[RELAYER] Start Linera network to enable relayer functionality');
    }
    
    let consecutiveErrors = 0;
    let lastErrorLog = 0;
    const ERROR_LOG_INTERVAL = 60000; // Log errors at most once per minute
    
    // Poll for events (in production, use WebSocket or Linera indexer)
    while (this.isRunning) {
      try {
        await this.pollForSignals();
        consecutiveErrors = 0; // Reset error count on success
        await this.sleep(5000); // Poll every 5 seconds (reduced from 1 second)
      } catch (error: any) {
        consecutiveErrors++;
        
        // Only log errors occasionally to avoid spam
        const now = Date.now();
        if (now - lastErrorLog > ERROR_LOG_INTERVAL || consecutiveErrors === 1) {
          if (error.code === 'ECONNREFUSED') {
            console.warn(`[RELAYER] Linera not available (${this.lineraRpcUrl})`);
            console.warn('[RELAYER] Will retry silently...');
          } else {
            console.error('[RELAYER] Error polling for events:', error.message);
          }
          lastErrorLog = now;
        }
        
        // Exponential backoff: 5s, 10s, 20s, max 60s
        const backoffTime = Math.min(5000 * Math.pow(2, consecutiveErrors - 1), 60000);
        await this.sleep(backoffTime);
      }
    }
  }
  
  private async checkLineraAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(this.lineraRpcUrl, { timeout: 2000 });
      return response.status === 200;
    } catch {
      return false;
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
        timeout: 5000, // 5 second timeout
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
      // Re-throw connection errors so they're handled by the outer loop with backoff
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        throw error; // Let outer loop handle with exponential backoff
      }
      // For other errors, just log and continue
      console.error('[RELAYER] Error polling signals:', error.message);
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

        // Determine trade size (use signal position_size or default)
        const tradeSizeUSD = signal.position_size || 10; // Default $10

        // Get best route from Jupiter with simulation
        const route = await this.getJupiterRoute(signal.contract, tradeSizeUSD, 50); // 0.5% slippage

        if (!route) {
          throw new Error('No route found from Jupiter');
        }

        // Check price impact threshold (abort if > 3%)
        if (route.priceImpact > 3.0) {
          throw new Error(`Price impact too high: ${route.priceImpact.toFixed(2)}%`);
        }

        // Simulate swap to get transaction
        const simulation = await this.simulateSwap(route, this.wallet.publicKey.toBase58());

        if (!simulation) {
          throw new Error('Swap simulation failed');
        }

        // Execute swap
        const txHash = await this.executeSwapFromTransaction(simulation.swapTransaction);
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

  /**
   * Get best route from Jupiter with simulation
   */
  private async getJupiterRoute(
    outputMint: string,
    amountUSD: number,
    slippageBps: number = 50
  ): Promise<{
    quote: any;
    priceImpact: number;
    estimatedGas: number;
    estimatedFee: number;
  } | null> {
    try {
      // Input mint is SOL
      const inputMint = 'So11111111111111111111111111111111111111112';
      
      // Get current SOL price (in production, use price oracle)
      const solPrice = 100; // Mock: $100 per SOL
      const amountSOL = amountUSD / solPrice;
      const amountLamports = Math.floor(amountSOL * 1e9);

      // Get quote from Jupiter
      const quoteResponse = await axios.get(`${this.jupiterApiUrl}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: amountLamports,
          slippageBps,
          onlyDirectRoutes: false, // Allow multi-hop routes
        },
      });

      const quote = quoteResponse.data;

      if (!quote || !quote.outAmount) {
        return null;
      }

      // Calculate price impact
      const inputAmount = parseFloat(quote.inAmount) / 1e9; // Convert to SOL
      const outputAmount = parseFloat(quote.outAmount) / 1e9; // Convert to output token
      const expectedOutput = inputAmount * solPrice; // Simplified
      const actualOutput = outputAmount * (quote.outAmount / quote.inAmount); // Simplified
      const priceImpact = Math.abs((expectedOutput - actualOutput) / expectedOutput) * 100;

      // Estimate gas (in SOL)
      const estimatedGas = 0.000005; // ~5000 lamports per swap

      // Estimate fee (Jupiter fee + protocol fees)
      const estimatedFee = (amountUSD * 0.003) + (estimatedGas * solPrice); // 0.3% + gas

      return {
        quote,
        priceImpact: Math.min(priceImpact, 5.0), // Cap at 5%
        estimatedGas,
        estimatedFee,
      };
    } catch (error: any) {
      console.error('Jupiter API error:', error.message);
      return null;
    }
  }

  /**
   * Simulate swap to get realistic execution price
   */
  private async simulateSwap(route: any, userWallet: string): Promise<{
    swapTransaction: string;
    expectedOutput: number;
    priceImpact: number;
  } | null> {
    try {
      const response = await axios.post(`${this.jupiterApiUrl}/swap`, {
        quoteResponse: route.quote,
        userPublicKey: userWallet,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      });

      return {
        swapTransaction: response.data.swapTransaction,
        expectedOutput: parseFloat(route.quote.outAmount) / 1e9,
        priceImpact: route.priceImpact,
      };
    } catch (error: any) {
      console.error('Jupiter swap simulation error:', error.message);
      return null;
    }
  }

  /**
   * Execute swap from pre-simulated transaction
   */
  private async executeSwapFromTransaction(swapTransactionBase64: string): Promise<string> {
    // Deserialize transaction
    const transactionBuf = Buffer.from(swapTransactionBase64, 'base64');
    const transaction = Transaction.from(transactionBuf);
    
    // Sign transaction
    transaction.sign(this.wallet);

    // Send with multiple RPC endpoints for better reliability
    const rpcEndpoints = [
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'https://api.mainnet-beta.solana.com', // Fallback
    ];

    let lastError: Error | null = null;
    for (const endpoint of rpcEndpoints) {
      try {
        const connection = new Connection(endpoint, 'confirmed');
        const txHash = await connection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3,
        });

        // Wait for confirmation
        await connection.confirmTransaction(txHash, 'confirmed');
        return txHash;
      } catch (error: any) {
        lastError = error;
        console.warn(`Failed to send via ${endpoint}:`, error.message);
        continue;
      }
    }

    throw lastError || new Error('All RPC endpoints failed');
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

// Start relayer only if WALLET_PRIVATE_KEY is available
const privateKey = process.env.WALLET_PRIVATE_KEY || '';

if (!privateKey) {
  console.warn('[RELAYER] WALLET_PRIVATE_KEY not found. Relayer service skipped.');
  console.warn('[RELAYER] To enable relayer, add WALLET_PRIVATE_KEY to .env file');
  console.warn('[RELAYER] Relayer is optional - frontend and backend will work without it.');
  // Exit gracefully without error
  process.exit(0);
}

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
