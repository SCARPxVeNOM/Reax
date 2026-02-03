import axios, { AxiosInstance } from 'axios';

export interface Signal {
  id: number;
  influencer: string;
  token: string;
  contract: string;
  sentiment: string;
  confidence: number;
  timestamp: number;
  tweet_url: string;
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  position_size?: number;
  leverage?: number;
  platform?: string;
}

export interface Strategy {
  id: number;
  owner: string;
  name: string;
  strategy_type: any;
  active: boolean;
  created_at: number;
}

export interface Order {
  id: number;
  strategy_id: number;
  signal_id: number;
  order_type: string;
  token: string;
  quantity: number;
  status: string;
  tx_hash?: string;
  fill_price?: number;
  created_at: number;
  filled_at?: number;
}

export class LineraClient {
  private client: AxiosInstance;
  private applicationId: string;

  constructor(rpcUrl: string, applicationId?: string) {
    this.client = axios.create({
      baseURL: rpcUrl,
      timeout: 10000,
    });
    this.applicationId = applicationId || process.env.LINERA_APP_ID || '';
  }

  async submitSignal(signal: Omit<Signal, 'id'>): Promise<number> {
    // If Linera not configured, return a mock ID for development
    if (!this.applicationId || this.applicationId === 'placeholder') {
      return Date.now(); // Mock ID
    }

    try {
      const operation = {
        SubmitSignal: { signal },
      };

      const response = await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });

      return response.data.signal_id;
    } catch (error: any) {
      console.warn('Linera not available, using mock ID:', error.message);
      return Date.now(); // Return mock ID on error
    }
  }

  async createStrategy(strategy: Omit<Strategy, 'id'>): Promise<number> {
    // If Linera not configured, return a mock ID for development
    if (!this.applicationId || this.applicationId === 'placeholder') {
      return Date.now(); // Mock ID
    }

    try {
      const operation = {
        CreateStrategy: { strategy },
      };

      const response = await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });

      return response.data.strategy_id;
    } catch (error: any) {
      console.warn('Linera not available, using mock ID:', error.message);
      return Date.now(); // Return mock ID on error
    }
  }

  async activateStrategy(strategyId: number): Promise<void> {
    if (!this.applicationId || this.applicationId === 'placeholder') return;

    try {
      const operation = {
        ActivateStrategy: { strategy_id: strategyId },
      };

      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
    } catch (error: any) {
      // Silent fail - Linera not available
    }
  }

  async deactivateStrategy(strategyId: number): Promise<void> {
    if (!this.applicationId || this.applicationId === 'placeholder') return;

    try {
      const operation = {
        DeactivateStrategy: { strategy_id: strategyId },
      };

      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
    } catch (error: any) {
      // Silent fail - Linera not available
    }
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<number> {
    if (!this.applicationId || this.applicationId === 'placeholder') {
      return Date.now(); // Mock ID
    }

    try {
      const operation = {
        CreateOrder: { order },
      };

      const response = await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });

      return response.data.order_id;
    } catch (error: any) {
      return Date.now(); // Return mock ID on error
    }
  }

  async recordOrderFill(
    orderId: number,
    txHash: string,
    fillPrice: number,
    filledAt: number
  ): Promise<void> {
    if (!this.applicationId || this.applicationId === 'placeholder') return;

    try {
      const operation = {
        RecordOrderFill: {
          order_id: orderId,
          tx_hash: txHash,
          fill_price: fillPrice,
          filled_at: filledAt,
        },
      };

      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
    } catch (error: any) {
      // Silent fail
    }
  }

  async getSignals(limit: number = 50, offset: number = 0): Promise<Signal[]> {
    if (!this.applicationId || this.applicationId === 'placeholder') {
      return []; // Return empty array when Linera not configured
    }

    try {
      const query = {
        GetSignals: { limit, offset },
      };

      const response = await this.client.post('/query', {
        application_id: this.applicationId,
        query: JSON.stringify(query),
      });

      return response.data.Signals || [];
    } catch (error: any) {
      return []; // Return empty on error
    }
  }

  async getStrategies(owner?: string, limit: number = 50, offset: number = 0): Promise<Strategy[]> {
    if (!this.applicationId || this.applicationId === 'placeholder') {
      return []; // Return empty array when Linera not configured
    }

    try {
      const query = {
        GetStrategies: { owner, limit, offset },
      };

      const response = await this.client.post('/query', {
        application_id: this.applicationId,
        query: JSON.stringify(query),
      });

      return response.data.Strategies || [];
    } catch (error: any) {
      return []; // Return empty on error
    }
  }

  async getOrders(
    strategyId?: number,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Order[]> {
    if (!this.applicationId || this.applicationId === 'placeholder') {
      return []; // Return empty array when Linera not configured
    }

    try {
      const query = {
        GetOrders: {
          strategy_id: strategyId,
          status,
          limit,
          offset,
        },
      };

      const response = await this.client.post('/query', {
        application_id: this.applicationId,
        query: JSON.stringify(query),
      });

      return response.data.Orders || [];
    } catch (error: any) {
      return []; // Return empty on error
    }
  }

  // ============================================
  // PHASE 1: SAFETY & VALIDATION
  // ============================================

  async createSafetyConfig(config: SafetyConfig): Promise<void> {
    if (!this.applicationId || this.applicationId === 'placeholder') return;

    try {
      const operation = { CreateSafetyConfig: { config } };
      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
    } catch (error: any) {
      console.warn('Failed to create safety config:', error.message);
    }
  }

  async updateSafetyConfig(config: SafetyConfig): Promise<void> {
    if (!this.applicationId || this.applicationId === 'placeholder') return;

    try {
      const operation = { UpdateSafetyConfig: { config } };
      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
    } catch (error: any) {
      console.warn('Failed to update safety config:', error.message);
    }
  }

  async getSafetyConfig(owner: string): Promise<SafetyConfig | null> {
    if (!this.applicationId || this.applicationId === 'placeholder') return null;

    try {
      const query = { GetSafetyConfig: { owner } };
      const response = await this.client.post('/query', {
        application_id: this.applicationId,
        query: JSON.stringify(query),
      });
      return response.data.SafetyConfig || null;
    } catch (error: any) {
      return null;
    }
  }

  async validateOrder(orderId: number): Promise<ValidatedOrder | null> {
    if (!this.applicationId || this.applicationId === 'placeholder') return null;

    try {
      const operation = { ValidateOrder: { order_id: orderId } };
      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });

      // Get validation result
      const query = { GetOrderValidation: { order_id: orderId } };
      const response = await this.client.post('/query', {
        application_id: this.applicationId,
        query: JSON.stringify(query),
      });
      return response.data.OrderValidation || null;
    } catch (error: any) {
      return null;
    }
  }

  // ============================================
  // PHASE 2: STRATEGY ENHANCEMENTS
  // ============================================

  async updateStrategy(strategy: Strategy, changeReason?: string): Promise<void> {
    if (!this.applicationId || this.applicationId === 'placeholder') return;

    try {
      const operation = { UpdateStrategy: { strategy, change_reason: changeReason } };
      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
    } catch (error: any) {
      console.warn('Failed to update strategy:', error.message);
    }
  }

  async getStrategyVersions(strategyId: number): Promise<any[]> {
    if (!this.applicationId || this.applicationId === 'placeholder') return [];

    try {
      const query = { GetStrategyVersions: { strategy_id: strategyId } };
      const response = await this.client.post('/query', {
        application_id: this.applicationId,
        query: JSON.stringify(query),
      });
      return response.data.StrategyVersions || [];
    } catch (error: any) {
      return [];
    }
  }

  // ============================================
  // PHASE 3: EXECUTION ENGINE
  // ============================================

  async createMultiHopOrder(order: DEXOrder): Promise<number> {
    if (!this.applicationId || this.applicationId === 'placeholder') {
      return Date.now();
    }

    try {
      const operation = { CreateMultiHopOrder: { order } };
      const response = await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
      return response.data.order_id || Date.now();
    } catch (error: any) {
      return Date.now();
    }
  }

  async triggerConditionalOrder(orderId: number): Promise<void> {
    if (!this.applicationId || this.applicationId === 'placeholder') return;

    try {
      const operation = { TriggerConditionalOrder: { order_id: orderId } };
      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
    } catch (error: any) {
      console.warn('Failed to trigger conditional order:', error.message);
    }
  }

  async cancelConditionalOrder(orderId: number): Promise<void> {
    if (!this.applicationId || this.applicationId === 'placeholder') return;

    try {
      const operation = { CancelConditionalOrder: { order_id: orderId } };
      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
    } catch (error: any) {
      console.warn('Failed to cancel conditional order:', error.message);
    }
  }

  // ============================================
  // PHASE 4: PREDICTION MARKETS
  // ============================================

  async createPredictionMarket(market: PredictionMarket): Promise<number> {
    if (!this.applicationId || this.applicationId === 'placeholder') {
      return Date.now();
    }

    try {
      const operation = { CreatePredictionMarket: { market } };
      const response = await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
      return response.data.market_id || Date.now();
    } catch (error: any) {
      return Date.now();
    }
  }

  async updateMarketProbability(marketId: number, probability: number): Promise<void> {
    if (!this.applicationId || this.applicationId === 'placeholder') return;

    try {
      const operation = { UpdateMarketProbability: { market_id: marketId, probability } };
      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
    } catch (error: any) {
      console.warn('Failed to update market probability:', error.message);
    }
  }

  async resolvePredictionMarket(marketId: number, outcome: boolean): Promise<void> {
    if (!this.applicationId || this.applicationId === 'placeholder') return;

    try {
      const operation = { ResolvePredictionMarket: { market_id: marketId, outcome } };
      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
    } catch (error: any) {
      console.warn('Failed to resolve market:', error.message);
    }
  }

  async getPredictionMarkets(limit: number = 50, offset: number = 0): Promise<PredictionMarket[]> {
    if (!this.applicationId || this.applicationId === 'placeholder') return [];

    try {
      const query = { GetPredictionMarkets: { limit, offset } };
      const response = await this.client.post('/query', {
        application_id: this.applicationId,
        query: JSON.stringify(query),
      });
      return response.data.PredictionMarkets || [];
    } catch (error: any) {
      return [];
    }
  }

  async linkStrategyToMarket(link: StrategyMarketLink): Promise<void> {
    if (!this.applicationId || this.applicationId === 'placeholder') return;

    try {
      const operation = { LinkStrategyToMarket: { link } };
      await this.client.post('/execute', {
        application_id: this.applicationId,
        operation: JSON.stringify(operation),
      });
    } catch (error: any) {
      console.warn('Failed to link strategy to market:', error.message);
    }
  }

  async subscribeToEvents(callback: (event: any) => void): Promise<void> {
    // Implementation for subscribing to Linera indexer events
    // This would use WebSocket or polling depending on Linera's indexer API
    console.log('Event subscription not yet implemented');
  }
}

// ============================================
// NEW TYPE DEFINITIONS FOR PHASES 1-4
// ============================================

export interface SafetyConfig {
  owner: string;
  max_position_per_token: number;
  max_portfolio_exposure: number;
  slippage_tolerance_bps: number;
  max_slippage_bps: number;
  require_stop_loss: boolean;
  require_take_profit: boolean;
  enable_auto_validation: boolean;
}

export interface ValidatedOrder {
  order_id: number;
  validation_status: 'Pending' | 'Approved' | { Rejected: { reason: string } };
  checks_passed: string[];
  checks_failed: string[];
  validated_at: number;
}

export interface DEXOrder {
  id: number;
  strategy_id: number;
  dex: 'Raydium' | 'Jupiter' | 'Binance';
  input_mint: string;
  output_mint: string;
  input_amount: number;
  output_amount: number;
  slippage_bps: number;
  priority_fee: number;
  status: string;
  tx_signature?: string;
  created_at: number;
  executed_at?: number;
  route_path: RouteHop[];
  is_multi_hop: boolean;
  conditional_trigger?: ConditionalTrigger;
  execution_mode: 'Immediate' | 'Conditional' | { Scheduled: { execute_at: number } };
}

export interface RouteHop {
  dex: 'Raydium' | 'Jupiter' | 'Binance';
  input_mint: string;
  output_mint: string;
  pool_address?: string;
  expected_output: number;
}

export interface ConditionalTrigger {
  trigger_type: 'PriceThreshold' | 'MarketProbability' | 'TimeBasedTrigger' | 'VolumeThreshold';
  threshold: number;
  comparison: 'GreaterThan' | 'LessThan' | 'GreaterThanOrEqual' | 'LessThanOrEqual' | 'Equal';
  active: boolean;
  triggered_at?: number;
}

export interface PredictionMarket {
  id: number;
  question: string;
  description: string;
  creator: string;
  probability: number;
  outcome?: boolean;
  created_at: number;
  resolved_at?: number;
}

export interface StrategyMarketLink {
  strategy_id: number;
  market_id: number;
  trigger_on_probability: number;
  trigger_above: boolean;
  enabled: boolean;
}
