/**
 * Linera Client via Shell Commands
 * 
 * This is the CORRECT way to interact with Linera from a backend service.
 * 
 * According to Linera documentation:
 * - Use `linera` CLI commands for operations
 * - Operations modify state on the chain
 * - Queries read from chain state
 * 
 * Usage:
 * 1. Backend processes tweets/AI
 * 2. Backend invokes `linera node execute` via shell
 * 3. Linera chain updates state
 * 4. Events emitted to indexer
 * 5. Frontend receives updates via real-time sync
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Signal {
  id?: number;
  influencer: string;
  token: string;
  contract: string;
  sentiment: string;
  confidence: number;
  timestamp: number;
  tweet_url: string;
}

export interface Strategy {
  id?: number;
  owner: string;
  name: string;
  strategy_type: any;
  active: boolean;
  created_at: number;
}

export class LineraClientCLI {
  private chainId: string;
  private applicationId: string;
  private walletPath: string;

  constructor() {
    this.chainId = process.env.LINERA_CHAIN_ID || '';
    this.applicationId = process.env.LINERA_APP_ID || '';
    this.walletPath = process.env.LINERA_WALLET || '$HOME/.linera/wallet.json';
  }

  /**
   * Submit a signal to Linera chain
   */
  async submitSignal(signal: Signal): Promise<number> {
    const operation = {
      SubmitSignal: { signal },
    };

    const command = `linera node execute \\
      --chain-id ${this.chainId} \\
      --application-id ${this.applicationId} \\
      --operation '${JSON.stringify(operation)}'`;

    try {
      const { stdout } = await execAsync(command);
      const result = JSON.parse(stdout);
      return result.signal_id || 0;
    } catch (error: any) {
      console.error('Linera command failed:', error.message);
      throw new Error(`Failed to submit signal: ${error.message}`);
    }
  }

  /**
   * Create a strategy
   */
  async createStrategy(strategy: Strategy): Promise<number> {
    const operation = {
      CreateStrategy: { strategy },
    };

    const command = `linera node execute \\
      --chain-id ${this.chainId} \\
      --application-id ${this.applicationId} \\
      --operation '${JSON.stringify(operation)}'`;

    try {
      const { stdout } = await execAsync(command);
      const result = JSON.parse(stdout);
      return result.strategy_id || 0;
    } catch (error: any) {
      console.error('Linera command failed:', error.message);
      throw new Error(`Failed to create strategy: ${error.message}`);
    }
  }

  /**
   * Activate a strategy
   */
  async activateStrategy(strategyId: number): Promise<void> {
    const operation = {
      ActivateStrategy: { strategy_id: strategyId },
    };

    const command = `linera node execute \\
      --chain-id ${this.chainId} \\
      --application-id ${this.applicationId} \\
      --operation '${JSON.stringify(operation)}'`;

    try {
      await execAsync(command);
    } catch (error: any) {
      console.error('Linera command failed:', error.message);
      throw new Error(`Failed to activate strategy: ${error.message}`);
    }
  }

  /**
   * Deactivate a strategy
   */
  async deactivateStrategy(strategyId: number): Promise<void> {
    const operation = {
      DeactivateStrategy: { strategy_id: strategyId },
    };

    const command = `linera node execute \\
      --chain-id ${this.chainId} \\
      --application-id ${this.applicationId} \\
      --operation '${JSON.stringify(operation)}'`;

    try {
      await execAsync(command);
    } catch (error: any) {
      console.error('Linera command failed:', error.message);
      throw new Error(`Failed to deactivate strategy: ${error.message}`);
    }
  }

  /**
   * Query signals using Linera CLI
   */
  async getSignals(limit: number = 50, offset: number = 0): Promise<Signal[]> {
    const query = {
      GetSignals: { limit, offset },
    };

    const command = `linera query \\
      --chain-id ${this.chainId} \\
      --application-id ${this.applicationId} \\
      '${JSON.stringify(query)}'`;

    try {
      const { stdout } = await execAsync(command);
      const result = JSON.parse(stdout);
      return result.Signals || [];
    } catch (error: any) {
      console.error('Linera query failed:', error.message);
      throw new Error(`Failed to query signals: ${error.message}`);
    }
  }

  /**
   * Query strategies
   */
  async getStrategies(
    owner?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Strategy[]> {
    const query = {
      GetStrategies: { owner, limit, offset },
    };

    const command = `linera query \\
      --chain-id ${this.chainId} \\
      --application-id ${this.applicationId} \\
      '${JSON.stringify(query)}'`;

    try {
      const { stdout } = await execAsync(command);
      const result = JSON.parse(stdout);
      return result.Strategies || [];
    } catch (error: any) {
      console.error('Linera query failed:', error.message);
      throw new Error(`Failed to query strategies: ${error.message}`);
    }
  }

  /**
   * Create and record an order
   */
  async createOrder(order: any): Promise<number> {
    const operation = {
      CreateOrder: { order },
    };

    const command = `linera node execute \\
      --chain-id ${this.chainId} \\
      --application-id ${this.applicationId} \\
      --operation '${JSON.stringify(operation)}'`;

    try {
      const { stdout } = await execAsync(command);
      const result = JSON.parse(stdout);
      return result.order_id || 0;
    } catch (error: any) {
      console.error('Linera command failed:', error.message);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Record order fill
   */
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

    const command = `linera node execute \\
      --chain-id ${this.chainId} \\
      --application-id ${this.applicationId} \\
      --operation '${JSON.stringify(operation)}'`;

    try {
      await execAsync(command);
    } catch (error: any) {
      console.error('Linera command failed:', error.message);
      throw new Error(`Failed to record order fill: ${error.message}`);
    }
  }
}

