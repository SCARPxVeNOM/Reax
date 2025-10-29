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

  async subscribeToEvents(callback: (event: any) => void): Promise<void> {
    // Implementation for subscribing to Linera indexer events
    // This would use WebSocket or polling depending on Linera's indexer API
    console.log('Event subscription not yet implemented');
  }
}
