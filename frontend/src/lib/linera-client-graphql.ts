/**
 * Linera Client via GraphQL (Direct Approach)
 * 
 * Based on official Linera documentation:
 * - Linera service runs on port 8080
 * - Provides GraphQL API at http://localhost:8080
 * - Can be queried directly via graphql-request
 * 
 * This is the CORRECT approach for production until @linera/client WASM package is published.
 * 
 * Reference: https://linera.dev/developers/frontend/interactivity.html
 */

import { GraphQLClient } from 'graphql-request';

export class LineraGraphQLClient {
  private client: GraphQLClient;
  private applicationId: string;

  constructor() {
    this.applicationId = process.env.NEXT_PUBLIC_LINERA_APP_ID || '';
    const serviceUrl = process.env.NEXT_PUBLIC_LINERA_SERVICE_URL || 'http://localhost:8080';
    
    this.client = new GraphQLClient(serviceUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Submit a signal to Linera chain
   * This creates a mutation that proposes a new block
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
      mutation SubmitSignal {
        executeOperation(
          applicationId: "${this.applicationId}",
          operation: ${JSON.stringify({ SubmitSignal: { signal } })}
        ) {
          __typename
        }
      }
    `;

    const response = await this.client.request<{ executeOperation: any }>(mutation);
    return 1; // Return signal ID - would need proper response parsing
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
      mutation CreateStrategy {
        executeOperation(
          applicationId: "${this.applicationId}",
          operation: ${JSON.stringify({ CreateStrategy: { strategy } })}
        ) {
          __typename
        }
      }
    `;

    const response = await this.client.request(mutation);
    return 1; // Would need proper response parsing
  }

  /**
   * Activate a strategy
   */
  async activateStrategy(strategyId: number): Promise<void> {
    const mutation = `
      mutation ActivateStrategy {
        executeOperation(
          applicationId: "${this.applicationId}",
          operation: ${JSON.stringify({ ActivateStrategy: { strategy_id: strategyId } })}
        )
      }
    `;

    await this.client.request(mutation);
  }

  /**
   * Deactivate a strategy
   */
  async deactivateStrategy(strategyId: number): Promise<void> {
    const mutation = `
      mutation DeactivateStrategy {
        executeOperation(
          applicationId: "${this.applicationId}",
          operation: ${JSON.stringify({ DeactivateStrategy: { strategy_id: strategyId } })}
        )
      }
    `;

    await this.client.request(mutation);
  }

  /**
   * Query signals from Linera
   */
  async getSignals(limit: number = 50, offset: number = 0): Promise<any[]> {
    const query = `
      query GetSignals {
        queryApplication(
          applicationId: "${this.applicationId}",
          query: ${JSON.stringify({ GetSignals: { limit, offset } })}
        )
      }
    `;

    const response = await this.client.request<{ queryApplication: string }>(query);
    const appResult = JSON.parse(response.queryApplication);
    return appResult.Signals || [];
  }

  /**
   * Query strategies
   */
  async getStrategies(
    owner?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const query = `
      query GetStrategies {
        queryApplication(
          applicationId: "${this.applicationId}",
          query: ${JSON.stringify({ 
            GetStrategies: { owner, limit, offset } 
          })}
        )
      }
    `;

    const response = await this.client.request<{ queryApplication: string }>(query);
    const appResult = JSON.parse(response.queryApplication);
    return appResult.Strategies || [];
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
    const query = `
      query GetOrders {
        queryApplication(
          applicationId: "${this.applicationId}",
          query: ${JSON.stringify({ 
            GetOrders: {
              strategy_id: strategyId,
              status,
              limit,
              offset
            } 
          })}
        )
      }
    `;

    const response = await this.client.request<{ queryApplication: string }>(query);
    const appResult = JSON.parse(response.queryApplication);
    return appResult.Orders || [];
  }

  /**
   * Subscribe to real-time events
   * Note: For real-time, you'd need WebSocket or polling
   * Linera service doesn't expose WebSocket in this version
   */
  async subscribeToEvents(callback: (event: any) => void): Promise<() => void> {
    // Polling approach - query every 1 second
    let intervalId: NodeJS.Timeout;
    
    const poll = async () => {
      try {
        const signals = await this.getSignals(1, 0);
        // Emit new signals
        signals.forEach(signal => callback({ type: 'SignalReceived', data: signal }));
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    intervalId = setInterval(poll, 1000);
    poll(); // Initial poll

    return () => clearInterval(intervalId);
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    // No persistent connection to close
    console.log('Linera client disconnected');
  }
}

// Singleton instance
let lineraClient: LineraGraphQLClient | null = null;

export function getLineraClient(): LineraGraphQLClient {
  if (!lineraClient) {
    lineraClient = new LineraGraphQLClient();
  }
  return lineraClient;
}

