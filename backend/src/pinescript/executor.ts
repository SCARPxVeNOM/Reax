/**
 * PineScript Executor - Executes compiled strategies
 */

import { CompiledStrategy, ExecutionContext, StrategySignal } from './compiler';

export interface BacktestResult {
  signals: StrategySignal[];
  performance: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  equity: number[];
}

export interface Position {
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  entryTime: number;
  quantity: number;
}

export class Executor {
  private strategy: CompiledStrategy;
  private initialCapital: number;

  constructor(strategy: CompiledStrategy, initialCapital: number = 10000) {
    this.strategy = strategy;
    this.initialCapital = initialCapital;
  }

  /**
   * Backtest strategy on historical data
   */
  backtest(context: ExecutionContext): BacktestResult {
    const signals = this.strategy.execute(context);
    const performance = this.calculatePerformance(signals, context);
    const equity = this.calculateEquityCurve(signals, context);

    return {
      signals,
      performance,
      equity,
    };
  }

  /**
   * Execute strategy on real-time data
   */
  executeRealtime(context: ExecutionContext): StrategySignal[] {
    try {
      return this.strategy.execute(context);
    } catch (error) {
      throw new Error(`Runtime error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate strategy performance metrics
   */
  private calculatePerformance(signals: StrategySignal[], context: ExecutionContext): BacktestResult['performance'] {
    let capital = this.initialCapital;
    let position: Position | null = null;
    let trades: { profit: number; return: number }[] = [];
    let equity: number[] = [capital];
    let maxEquity = capital;
    let maxDrawdown = 0;

    for (const signal of signals) {
      if (signal.type === 'BUY' && !position) {
        // Open long position
        const quantity = capital / signal.price;
        position = {
          type: 'LONG',
          entryPrice: signal.price,
          entryTime: signal.timestamp,
          quantity,
        };
      } else if (signal.type === 'SELL' && !position) {
        // Open short position (simplified)
        const quantity = capital / signal.price;
        position = {
          type: 'SHORT',
          entryPrice: signal.price,
          entryTime: signal.timestamp,
          quantity,
        };
      } else if (signal.type === 'CLOSE' && position) {
        // Close position
        let profit: number;
        if (position.type === 'LONG') {
          profit = (signal.price - position.entryPrice) * position.quantity;
        } else {
          profit = (position.entryPrice - signal.price) * position.quantity;
        }

        capital += profit;
        const returnPct = (profit / (position.entryPrice * position.quantity)) * 100;
        
        trades.push({ profit, return: returnPct });
        equity.push(capital);

        // Update max drawdown
        if (capital > maxEquity) {
          maxEquity = capital;
        }
        const drawdown = ((maxEquity - capital) / maxEquity) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }

        position = null;
      }
    }

    // Calculate metrics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profit > 0).length;
    const losingTrades = trades.filter(t => t.profit < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const totalReturn = ((capital - this.initialCapital) / this.initialCapital) * 100;

    // Calculate Sharpe Ratio
    const returns = trades.map(t => t.return);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    ) || 1;
    const sharpeRatio = (avgReturn / stdDev) * Math.sqrt(252); // Annualized

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalReturn,
      maxDrawdown,
      sharpeRatio,
    };
  }

  /**
   * Calculate equity curve over time
   */
  private calculateEquityCurve(signals: StrategySignal[], context: ExecutionContext): number[] {
    let capital = this.initialCapital;
    let position: Position | null = null;
    const equity: number[] = new Array(context.close.length).fill(this.initialCapital);

    let signalIndex = 0;

    for (let i = 0; i < context.close.length; i++) {
      const currentPrice = context.close[i];
      const currentTime = context.timestamp[i];

      // Check for signals at this timestamp
      while (signalIndex < signals.length && signals[signalIndex].timestamp <= currentTime) {
        const signal = signals[signalIndex];

        if (signal.type === 'BUY' && !position) {
          const quantity = capital / signal.price;
          position = {
            type: 'LONG',
            entryPrice: signal.price,
            entryTime: signal.timestamp,
            quantity,
          };
        } else if (signal.type === 'SELL' && !position) {
          const quantity = capital / signal.price;
          position = {
            type: 'SHORT',
            entryPrice: signal.price,
            entryTime: signal.timestamp,
            quantity,
          };
        } else if (signal.type === 'CLOSE' && position) {
          let profit: number;
          if (position.type === 'LONG') {
            profit = (signal.price - position.entryPrice) * position.quantity;
          } else {
            profit = (position.entryPrice - signal.price) * position.quantity;
          }
          capital += profit;
          position = null;
        }

        signalIndex++;
      }

      // Calculate current equity
      if (position) {
        let unrealizedPnL: number;
        if (position.type === 'LONG') {
          unrealizedPnL = (currentPrice - position.entryPrice) * position.quantity;
        } else {
          unrealizedPnL = (position.entryPrice - currentPrice) * position.quantity;
        }
        equity[i] = capital + unrealizedPnL;
      } else {
        equity[i] = capital;
      }
    }

    return equity;
  }

  /**
   * Validate strategy before execution
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.strategy.name) {
      errors.push('Strategy must have a name');
    }

    if (!this.strategy.execute) {
      errors.push('Strategy must have an execute function');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
