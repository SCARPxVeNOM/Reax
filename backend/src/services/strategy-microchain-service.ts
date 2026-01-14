/**
 * Strategy Microchain Service
 * Handles the flow: Strategy Creation → Social Publishing → Microchain Deployment → Trade Execution → Analytics
 */

import { LineraClient } from '../linera-client';
import { pool } from '../database/connection';
import { DEXRouter } from './dex-router';
import { DEX, SwapParams, SwapResult } from '../models/dex';

export interface StrategyDeployment {
  strategyId: string;
  userId: string;
  microchainId?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPLOYED' | 'ACTIVE' | 'PAUSED';
  publishedAt?: Date;
  deployedAt?: Date;
}

export interface TradeExecution {
  strategyId: string;
  microchainId: string;
  dex: DEX;
  inputToken: string;
  outputToken: string;
  amount: number;
  result: SwapResult;
  timestamp: Date;
}

export class StrategyMicrochainService {
  private lineraClient: LineraClient;
  private dexRouter: DEXRouter;

  constructor(
    lineraClient: LineraClient,
    dexRouter: DEXRouter
  ) {
    this.lineraClient = lineraClient;
    this.dexRouter = dexRouter;
  }

  /**
   * Step 1: Create strategy and publish to social feed
   */
  async createAndPublishStrategy(strategy: {
    userId: string;
    name: string;
    type: 'PINESCRIPT' | 'VISUAL';
    code?: string;
    visualData?: any;
    description?: string;
  }): Promise<{ strategyId: string; published: boolean }> {
    try {
      // Create strategy on Linera microchain
      const strategyId = await this.lineraClient.createStrategy({
        owner: strategy.userId,
        name: strategy.name,
        strategy_type: strategy.type === 'PINESCRIPT' 
          ? { DSL: strategy.code || '' }
          : { Form: strategy.visualData || {} },
        active: false, // Start as inactive until deployed
        created_at: Date.now(),
      });

      // Cache in database
      await pool.query(
        `INSERT INTO strategies (id, user_id, name, type, code, visual_data, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT')
         ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
        [
          strategyId.toString(),
          strategy.userId,
          strategy.name,
          strategy.type,
          strategy.code || null,
          strategy.visualData ? JSON.stringify(strategy.visualData) : null,
        ]
      );
        id: strategyId.toString(),
        owner: strategy.userId,
        name: strategy.name,
        strategy_type: strategy.type === 'PINESCRIPT' 
          ? { DSL: strategy.code || '' }
          : { Form: strategy.visualData || {} },
        active: false,
      });

      // Strategy is automatically available on social page (via database query)
      return {
        strategyId: strategyId.toString(),
        published: true,
      };
    } catch (error: any) {
      console.error('Error creating strategy:', error);
      throw new Error(`Failed to create strategy: ${error.message}`);
    }
  }

  /**
   * Step 2: Deploy strategy to microchain (creates account on microchain)
   */
  async deployStrategyToMicrochain(
    strategyId: string,
    userId: string
  ): Promise<{ microchainId: string; accountCreated: boolean }> {
    try {
      // Create or get microchain for this user
      const microchainId = await this.createMicrochainForUser(userId);

      // Deploy strategy to the microchain
      await this.lineraClient.activateStrategy(parseInt(strategyId));

      // Update strategy status in database
      await pool.query(
        `UPDATE strategies 
         SET microchain_id = $1, status = 'ACTIVE', deployed_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [microchainId, strategyId]
      );

      return {
        microchainId,
        accountCreated: true,
      };
    } catch (error: any) {
      console.error('Error deploying strategy:', error);
      throw new Error(`Failed to deploy strategy: ${error.message}`);
    }
  }

  /**
   * Create a microchain for a user (or get existing one)
   */
  private async createMicrochainForUser(userId: string): Promise<string> {
    // Check if user already has a microchain
    const existing = await pool.query(
      `SELECT microchain_id FROM user_microchains WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0].microchain_id;
    }

    // Create new microchain ID (in production, this would call Linera API)
    const microchainId = `microchain_${userId}_${Date.now()}`;

    // Store microchain mapping
    await pool.query(
      `INSERT INTO user_microchains (user_id, microchain_id, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET microchain_id = $2`,
      [userId, microchainId]
    );

    return microchainId;
  }

  /**
   * Step 3: Execute trade on trading page and record on microchain
   */
  async executeTradeOnMicrochain(
    strategyId: string,
    tradeParams: {
      dex: DEX;
      inputToken: string;
      outputToken: string;
      amount: number;
      slippageBps: number;
      priorityFee?: number;
      walletAddress: string;
    }
  ): Promise<TradeExecution> {
    try {
      // Get strategy and microchain info
      const strategy = await pool.query(
        `SELECT microchain_id FROM strategies WHERE id = $1`,
        [strategyId]
      );

      if (strategy.rows.length === 0) {
        throw new Error('Strategy not found');
      }

      const microchainId = strategy.rows[0].microchain_id;
      if (!microchainId) {
        throw new Error('Strategy not deployed to microchain');
      }

      // Get quote and execute swap
      const quote = await this.dexRouter.getBestQuote({
        inputMint: tradeParams.inputToken,
        outputMint: tradeParams.outputToken,
        amount: tradeParams.amount,
        slippageBps: tradeParams.slippageBps,
        dexes: [tradeParams.dex],
      });

      const swapResult = await this.dexRouter.executeSwap({
        quote,
        walletAddress: tradeParams.walletAddress,
        priorityFee: tradeParams.priorityFee,
      });

      // Record trade on Linera microchain
      const orderId = await this.lineraClient.createOrder({
        strategy_id: parseInt(strategyId),
        signal_id: 0, // Can be linked to signal if available
        order_type: 'MARKET',
        token: tradeParams.outputToken,
        quantity: swapResult.outputAmount,
        status: swapResult.status === 'confirmed' ? 'FILLED' : 'PENDING',
        tx_hash: swapResult.signature,
        fill_price: quote.outputAmount / quote.inputAmount,
        created_at: Date.now(),
      });

      // If trade is confirmed, record fill
      if (swapResult.status === 'confirmed' && swapResult.signature !== 'pending') {
        await this.lineraClient.recordOrderFill(
          orderId,
          swapResult.signature,
          quote.outputAmount / quote.inputAmount,
          Date.now()
        );
      }

      // Store trade execution in database for analytics
      await pool.query(
        `INSERT INTO trade_executions 
         (strategy_id, microchain_id, dex, input_token, output_token, 
          input_amount, output_amount, tx_hash, status, executed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
        [
          strategyId,
          microchainId,
          tradeParams.dex,
          tradeParams.inputToken,
          tradeParams.outputToken,
          tradeParams.amount,
          swapResult.outputAmount,
          swapResult.signature,
          swapResult.status,
        ]
      );

      return {
        strategyId,
        microchainId,
        dex: tradeParams.dex,
        inputToken: tradeParams.inputToken,
        outputToken: tradeParams.outputToken,
        amount: tradeParams.amount,
        result: swapResult,
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('Error executing trade:', error);
      throw new Error(`Failed to execute trade: ${error.message}`);
    }
  }

  /**
   * Step 4: Get analytics aggregated from multiple microchains
   */
  async getMicrochainAnalytics(
    strategyId?: string,
    microchainId?: string,
    timeframe: '1H' | '24H' | '7D' | '30D' = '24H'
  ): Promise<{
    totalVolume: number;
    totalTrades: number;
    activeStrategies: number;
    avgWinRate: number;
    totalReturn: number;
    sharpeRatio: number;
    trades: any[];
  }> {
    try {
      const timeWindow = this.getTimeWindow(timeframe);
      
      let query = `
        SELECT 
          COUNT(*) as total_trades,
          SUM(input_amount) as total_volume,
          COUNT(DISTINCT strategy_id) as active_strategies,
          AVG(CASE WHEN output_amount > input_amount THEN 1 ELSE 0 END) * 100 as avg_win_rate
        FROM trade_executions
        WHERE executed_at >= $1
      `;
      
      const params: any[] = [timeWindow];

      if (strategyId) {
        query += ` AND strategy_id = $2`;
        params.push(strategyId);
      }

      if (microchainId) {
        query += ` ${strategyId ? 'AND' : 'AND'} microchain_id = $${params.length + 1}`;
        params.push(microchainId);
      }

      const stats = await pool.query(query, params);

      // Get recent trades
      const tradesQuery = `
        SELECT * FROM trade_executions
        WHERE executed_at >= $1
        ${strategyId ? 'AND strategy_id = $2' : ''}
        ${microchainId ? `AND microchain_id = $${strategyId ? '3' : '2'}` : ''}
        ORDER BY executed_at DESC
        LIMIT 100
      `;
      
      const trades = await pool.query(
        tradesQuery,
        strategyId || microchainId ? [timeWindow, strategyId || microchainId] : [timeWindow]
      );

      // Calculate returns and Sharpe ratio (simplified)
      const returns = trades.rows.map((t: any) => 
        t.output_amount && t.input_amount 
          ? ((t.output_amount - t.input_amount) / t.input_amount) * 100
          : 0
      );
      
      const avgReturn = returns.length > 0
        ? returns.reduce((a: number, b: number) => a + b, 0) / returns.length
        : 0;

      const variance = returns.length > 0
        ? returns.reduce((sum: number, r: number) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
        : 0;

      const sharpeRatio = variance > 0 ? avgReturn / Math.sqrt(variance) : 0;

      return {
        totalVolume: parseFloat(stats.rows[0]?.total_volume || '0'),
        totalTrades: parseInt(stats.rows[0]?.total_trades || '0'),
        activeStrategies: parseInt(stats.rows[0]?.active_strategies || '0'),
        avgWinRate: parseFloat(stats.rows[0]?.avg_win_rate || '0'),
        totalReturn: avgReturn,
        sharpeRatio: sharpeRatio || 0,
        trades: trades.rows,
      };
    } catch (error: any) {
      console.error('Error getting analytics:', error);
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  private getTimeWindow(timeframe: '1H' | '24H' | '7D' | '30D'): Date {
    const now = new Date();
    const hours = timeframe === '1H' ? 1 : timeframe === '24H' ? 24 : timeframe === '7D' ? 168 : 720;
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }
}

