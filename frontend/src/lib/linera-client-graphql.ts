/**
 * Linera Client via Backend Proxy
 * 
 * Routes requests through the backend server to bypass CORS issues.
 * The backend proxies requests to the Linera service running on port 8081.
 * 
 * Reference: https://linera.dev/developers/frontend/interactivity.html
 */

import { GraphQLClient } from 'graphql-request';

export class LineraGraphQLClient {
  private proxyClient: GraphQLClient;
  private nodeProxyClient: GraphQLClient;
  private applicationId: string;
  private chainId: string;
  private backendUrl: string;

  constructor() {
    this.applicationId = process.env.NEXT_PUBLIC_LINERA_APP_ID || '';
    this.chainId = process.env.NEXT_PUBLIC_LINERA_CHAIN_ID || this.applicationId; // Default to appId if chainId not set
    this.backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

    // Use backend proxy for app-specific Linera requests
    this.proxyClient = new GraphQLClient(`${this.backendUrl}/api/linera/app`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Use backend proxy for node-level operations (executeOperation, etc.)
    this.nodeProxyClient = new GraphQLClient(`${this.backendUrl}/api/linera/node`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Linera GraphQL client initialized (via proxy):', {
      backendUrl: this.backendUrl,
      appId: this.applicationId ? this.applicationId.substring(0, 16) + '...' : 'NOT SET',
      chainId: this.chainId ? this.chainId.substring(0, 16) + '...' : 'NOT SET'
    });
  }

  /**
   * Raw GraphQL request method - uses backend app proxy
   */
  async request<T = any>(document: string, variables?: Record<string, any>): Promise<T> {
    return this.proxyClient.request<T>(document, variables);
  }

  /**
   * Node-level GraphQL request - for executeOperation mutations
   */
  async nodeRequest<T = any>(document: string, variables?: Record<string, any>): Promise<T> {
    return this.nodeProxyClient.request<T>(document, variables);
  }

  /**
   * Get the application ID
   */
  getApplicationId(): string {
    return this.applicationId;
  }

  /**
   * Get the chain ID
   */
  getChainId(): string {
    return this.chainId;
  }

  /**
   * Check Linera service status via backend
   */
  async checkStatus(): Promise<{ status: string; error?: string }> {
    try {
      const response = await fetch(`${this.backendUrl}/api/linera/status`);
      return await response.json();
    } catch (error) {
      return { status: 'disconnected', error: 'Backend unreachable' };
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
    const mutation = `
      mutation {
        submitSignal(signal: {
          influencer: "${signal.influencer}",
          token: "${signal.token}",
          contract: "${signal.contract}",
          sentiment: "${signal.sentiment}",
          confidence: ${signal.confidence},
          timestamp: ${signal.timestamp},
          tweetUrl: "${signal.tweet_url}"
        })
      }
    `;

    await this.proxyClient.request(mutation);
    return 1;
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
    const mutation = `
      mutation {
        createStrategy(strategy: {
          owner: "${strategy.owner}",
          name: "${strategy.name}",
          strategyType: ${JSON.stringify(strategy.strategy_type)},
          active: ${strategy.active},
          createdAt: ${strategy.created_at}
        })
      }
    `;

    await this.proxyClient.request(mutation);
    return 1;
  }

  /**
   * Activate a strategy
   */
  async activateStrategy(strategyId: number): Promise<void> {
    const mutation = `
      mutation {
        activateStrategy(strategyId: ${strategyId})
      }
    `;

    await this.proxyClient.request(mutation);
  }

  /**
   * Deactivate a strategy
   */
  async deactivateStrategy(strategyId: number): Promise<void> {
    const mutation = `
      mutation {
        deactivateStrategy(strategyId: ${strategyId})
      }
    `;

    await this.proxyClient.request(mutation);
  }

  /**
   * Query signals from Linera
   */
  async getSignals(limit: number = 50, offset: number = 0): Promise<any[]> {
    const query = `
      query {
        getSignals(limit: ${limit}, offset: ${offset})
      }
    `;

    try {
      const response = await this.proxyClient.request<{ getSignals: any[] }>(query);
      return response.getSignals || [];
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
    const ownerArg = owner ? `owner: "${owner}",` : '';
    const query = `
      query {
        getStrategies(${ownerArg} limit: ${limit}, offset: ${offset})
      }
    `;

    try {
      const response = await this.proxyClient.request<{ getStrategies: any[] }>(query);
      return response.getStrategies || [];
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
    const strategyArg = strategyId ? `strategyId: ${strategyId},` : '';
    const statusArg = status ? `status: "${status}",` : '';
    const query = `
      query {
        getOrders(${strategyArg} ${statusArg} limit: ${limit}, offset: ${offset})
      }
    `;

    try {
      const response = await this.proxyClient.request<{ getOrders: any[] }>(query);
      return response.getOrders || [];
    } catch (error) {
      console.error('Failed to get orders:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time events
   */
  async subscribeToEvents(callback: (event: any) => void): Promise<() => void> {
    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const signals = await this.getSignals(1, 0);
        signals.forEach(signal => callback({ type: 'SignalReceived', data: signal }));
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    intervalId = setInterval(poll, 1000);
    poll();

    return () => clearInterval(intervalId);
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    console.log('Linera client disconnected');
  }
}

// Singleton instance
let clientInstance: LineraGraphQLClient | null = null;

export function getLineraClient(): LineraGraphQLClient {
  if (!clientInstance) {
    clientInstance = new LineraGraphQLClient();
  }
  return clientInstance;
}

// Export singleton for direct use
export const lineraClient = getLineraClient();
