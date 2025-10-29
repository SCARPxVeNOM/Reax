/**
 * Linera Client for Frontend - Interactive Implementation
 * 
 * Based on official Linera documentation:
 * https://linera.dev/developers/frontend/interactivity.html
 * 
 * Uses backend API for all operations
 * Note: @linera/client WASM module is not yet published, so we use backend API
 */

export class FrontendLineraClient {
  private client: any; // Linera WASM client (optional, not yet available)
  private applicationId: string;
  private backend: any;
  private connected: boolean = false;
  private notificationCallbacks: Set<(event: any) => void> = new Set();
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.applicationId = process.env.NEXT_PUBLIC_LINERA_APP_ID || '';
  }

  /**
   * Initialize Linera client
   * Uses backend API as @linera/client is not yet published
   */
  async connect(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Linera client must run in browser');
    }

    try {
      // @linera/client is not yet published on npm
      // For now, we use the backend API which proxies to Linera
      // In the future, when @linera/client is available, we can optionally use it:
      // 
      // try {
      //   const linera = await import('@linera/client');
      //   await linera.default?.();
      //   this.client = linera;
      //   const frontend = this.client.frontend();
      //   this.backend = await frontend.application(this.applicationId);
      // } catch (e) {
      //   // Fallback to backend API
      // }
      
      this.client = null;
      this.connected = true;
      console.log('✅ Connected to Linera application via backend API:', this.applicationId);
    } catch (error) {
      console.error('Failed to initialize Linera client:', error);
      this.connected = true; // Still connected via backend API
    }
  }

  /**
   * Execute an operation on the Linera chain
   * Uses backend API to proxy operations to Linera
   */
  async executeOperation(operation: any): Promise<number> {
    if (!this.connected) {
      await this.connect();
    }

    // Use backend API to execute operation
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/linera/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.result || 0;
    } catch (error) {
      console.error('Failed to execute operation:', error);
      throw error;
    }
  }

  /**
   * Submit a signal to Linera chain
   */
  async submitSignal(signal: {
    influencer: string;
    token: string;
    contract: string;
    sentiment: string;
    confidence: number;
    timestamp: number;
    tweet_url: string;
  }): Promise<number> {
    const operation = {
      SubmitSignal: {
        signal: {
          ...signal,
          id: 0, // Will be assigned by contract
        }
      }
    };

    return await this.executeOperation(operation);
  }

  /**
   * Create a strategy
   */
  async createStrategy(strategy: {
    owner: string;
    name: string;
    strategy_type: any;
    active: boolean;
    created_at: number;
  }): Promise<number> {
    const operation = {
      CreateStrategy: {
        strategy: {
          ...strategy,
          id: 0, // Will be assigned by contract
        }
      }
    };

    return await this.executeOperation(operation);
  }

  /**
   * Activate a strategy
   */
  async activateStrategy(strategyId: number): Promise<void> {
    const operation = {
      ActivateStrategy: {
        strategy_id: strategyId
      }
    };

    await this.executeOperation(operation);
  }

  /**
   * Deactivate a strategy
   */
  async deactivateStrategy(strategyId: number): Promise<void> {
    const operation = {
      DeactivateStrategy: {
        strategy_id: strategyId
      }
    };

    await this.executeOperation(operation);
  }

  /**
   * Create an order
   */
  async createOrder(order: {
    strategy_id: number;
    signal_id: number;
    order_type: string;
    token: string;
    quantity: number;
    status: string;
    created_at: number;
  }): Promise<number> {
    const operation = {
      CreateOrder: {
        order: {
          ...order,
          id: 0,
          tx_hash: null,
          fill_price: null,
          filled_at: null,
        }
      }
    };

    return await this.executeOperation(operation);
  }

  /**
   * Query signals using backend API
   */
  async getSignals(limit: number = 50, offset: number = 0): Promise<any[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/signals?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.signals || [];
    } catch (error) {
      console.error('Failed to get signals:', error);
      return [];
    }
  }

  /**
   * Query strategies
   */
  async getStrategies(
    owner?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/strategies`);
      if (owner) url.searchParams.set('owner', owner);
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('offset', offset.toString());
      
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.strategies || [];
    } catch (error) {
      console.error('Failed to get strategies:', error);
      return [];
    }
  }

  /**
   * Query orders
   */
  async getOrders(
    strategyId?: number,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/orders`);
      if (strategyId) url.searchParams.set('strategyId', strategyId.toString());
      if (status) url.searchParams.set('status', status);
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('offset', offset.toString());
      
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error('Failed to get orders:', error);
      return [];
    }
  }

  /**
   * Subscribe to events (polling-based for real-time updates)
   */
  subscribeToEvents(callback: (event: any) => void): () => void {
    this.notificationCallbacks.add(callback);

    // Start polling if not already started
    if (!this.pollInterval) {
      this.pollInterval = setInterval(async () => {
        try {
          // Get latest data
          const [signals, strategies, orders] = await Promise.all([
            this.getSignals(10, 0),
            this.getStrategies(undefined, 10, 0),
            this.getOrders(undefined, undefined, 10, 0)
          ]);

          // Notify all callbacks
          this.notificationCallbacks.forEach(cb => {
            cb({ 
              type: 'update', 
              data: { signals, strategies, orders },
              timestamp: Date.now()
            });
          });
        } catch (error) {
          console.error('Error polling for updates:', error);
        }
      }, 3000); // Poll every 3 seconds
    }

    // Return unsubscribe function
    return () => {
      this.notificationCallbacks.delete(callback);
      if (this.notificationCallbacks.size === 0 && this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    };
  }

  /**
   * Disconnect from Linera
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.notificationCallbacks.clear();
    console.log('Linera client disconnected');
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
let lineraClient: FrontendLineraClient | null = null;

export function getLineraClient(): FrontendLineraClient {
  if (!lineraClient) {
    lineraClient = new FrontendLineraClient();
  }
  return lineraClient;
}
