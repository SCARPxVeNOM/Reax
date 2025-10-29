/**
 * LEGACY: Linera Client via Backend Proxy
 * 
 * ⚠️ This is NOT the correct way to integrate with Linera
 * 
 * According to Linera documentation:
 * - Frontend should connect DIRECTLY to Linera
 * - Use @linera/client package
 * - Linera provides GraphQL APIs
 * - Client runs in browser (WASM)
 * 
 * This file exists only for backward compatibility.
 * 
 * The correct approach is in frontend/src/lib/linera-client.ts
 */

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

/**
 * DEPRECATED: Do not use HTTP REST for Linera
 * 
 * Instead, the backend should:
 * 1. Process tweets and AI parsing
 * 2. Return processed data to frontend
 * 3. Let frontend submit directly to Linera via @linera/client
 * 
 * OR use shell commands to invoke `linera node` CLI
 */
export class LineraClientLegacy {
  private client: AxiosInstance;
  private applicationId: string;

  constructor(rpcUrl: string, applicationId?: string) {
    console.warn('⚠️ Using legacy HTTP REST approach. This does NOT work with Linera.');
    console.warn('Linera does not expose HTTP REST APIs.');
    console.warn('Use @linera/client in frontend instead.');
    
    this.client = axios.create({
      baseURL: rpcUrl,
      timeout: 10000,
    });
    this.applicationId = applicationId || process.env.LINERA_APP_ID || '';
  }

  async submitSignal(signal: Omit<Signal, 'id'>): Promise<number> {
    // This will NOT work with Linera
    // Linera doesn't expose HTTP /execute endpoint
    throw new Error(
      'HTTP REST approach not supported by Linera. ' +
      'Use @linera/client in frontend or shell commands in backend.'
    );
  }

  async createStrategy(strategy: Omit<Strategy, 'id'>): Promise<number> {
    throw new Error('Use Linera client in frontend instead');
  }

  async activateStrategy(strategyId: number): Promise<void> {
    throw new Error('Use Linera client in frontend instead');
  }

  async deactivateStrategy(strategyId: number): Promise<void> {
    throw new Error('Use Linera client in frontend instead');
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<number> {
    throw new Error('Use Linera client in frontend instead');
  }

  async recordOrderFill(
    orderId: number,
    txHash: string,
    fillPrice: number,
    filledAt: number
  ): Promise<void> {
    throw new Error('Use Linera client in frontend instead');
  }

  async getSignals(limit: number = 50, offset: number = 0): Promise<Signal[]> {
    throw new Error('Use Linera GraphQL queries in frontend instead');
  }

  async getStrategies(owner?: string, limit: number = 50, offset: number = 0): Promise<Strategy[]> {
    throw new Error('Use Linera GraphQL queries in frontend instead');
  }

  async getOrders(
    strategyId?: number,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Order[]> {
    throw new Error('Use Linera GraphQL queries in frontend instead');
  }

  async subscribeToEvents(callback: (event: any) => void): Promise<void> {
    throw new Error('Use Linera client real-time sync in frontend instead');
  }
}

