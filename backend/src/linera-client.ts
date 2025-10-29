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
    const operation = {
      SubmitSignal: { signal },
    };

    const response = await this.client.post('/execute', {
      application_id: this.applicationId,
      operation: JSON.stringify(operation),
    });

    return response.data.signal_id;
  }

  async createStrategy(strategy: Omit<Strategy, 'id'>): Promise<number> {
    const operation = {
      CreateStrategy: { strategy },
    };

    const response = await this.client.post('/execute', {
      application_id: this.applicationId,
      operation: JSON.stringify(operation),
    });

    return response.data.strategy_id;
  }

  async activateStrategy(strategyId: number): Promise<void> {
    const operation = {
      ActivateStrategy: { strategy_id: strategyId },
    };

    await this.client.post('/execute', {
      application_id: this.applicationId,
      operation: JSON.stringify(operation),
    });
  }

  async deactivateStrategy(strategyId: number): Promise<void> {
    const operation = {
      DeactivateStrategy: { strategy_id: strategyId },
    };

    await this.client.post('/execute', {
      application_id: this.applicationId,
      operation: JSON.stringify(operation),
    });
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<number> {
    const operation = {
      CreateOrder: { order },
    };

    const response = await this.client.post('/execute', {
      application_id: this.applicationId,
      operation: JSON.stringify(operation),
    });

    return response.data.order_id;
  }

  async recordOrderFill(
    orderId: number,
    txHash: string,
    fillPrice: number,
    filledAt: number
  ): Promise<void> {
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
  }

  async getSignals(limit: number = 50, offset: number = 0): Promise<Signal[]> {
    const query = {
      GetSignals: { limit, offset },
    };

    const response = await this.client.post('/query', {
      application_id: this.applicationId,
      query: JSON.stringify(query),
    });

    return response.data.Signals || [];
  }

  async getStrategies(owner?: string, limit: number = 50, offset: number = 0): Promise<Strategy[]> {
    const query = {
      GetStrategies: { owner, limit, offset },
    };

    const response = await this.client.post('/query', {
      application_id: this.applicationId,
      query: JSON.stringify(query),
    });

    return response.data.Strategies || [];
  }

  async getOrders(
    strategyId?: number,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Order[]> {
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
  }

  async subscribeToEvents(callback: (event: any) => void): Promise<void> {
    // Implementation for subscribing to Linera indexer events
    // This would use WebSocket or polling depending on Linera's indexer API
    console.log('Event subscription not yet implemented');
  }
}
