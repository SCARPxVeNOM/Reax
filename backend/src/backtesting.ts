import { DatabaseClient } from './database';
import { PerformanceAnalytics } from './analytics';

export interface BacktestResult {
  strategyId: number;
  startDate: Date;
  endDate: Date;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  simulatedTrades: SimulatedTrade[];
}

export interface SimulatedTrade {
  signalId: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  timestamp: number;
}

export class BacktestingEngine {
  constructor(
    private dbClient: DatabaseClient,
    private analytics: PerformanceAnalytics
  ) {}

  async runBacktest(
    strategyId: number,
    startDate: Date,
    endDate: Date
  ): Promise<BacktestResult> {
    // Fetch historical signals in date range
    const signals = await this.getHistoricalSignals(startDate, endDate);

    // Fetch strategy configuration
    const strategy = await this.getStrategy(strategyId);

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    // Simulate trades
    const simulatedTrades: SimulatedTrade[] = [];
    let capital = 10000; // Starting capital
    let position: any = null;

    for (const signal of signals) {
      // Check if strategy matches signal
      const shouldTrade = this.evaluateStrategy(strategy, signal);

      if (shouldTrade && !position) {
        // Open position (buy)
        const quantity = capital * 0.1 / signal.price; // Use 10% of capital
        position = {
          signalId: signal.id,
          entryPrice: signal.price,
          quantity,
          timestamp: signal.timestamp,
        };
      } else if (position && this.shouldExit(strategy, signal, position)) {
        // Close position (sell)
        const pnl = (signal.price - position.entryPrice) * position.quantity;
        capital += pnl;

        simulatedTrades.push({
          signalId: position.signalId,
          entryPrice: position.entryPrice,
          exitPrice: signal.price,
          quantity: position.quantity,
          pnl,
          timestamp: signal.timestamp,
        });

        position = null;
      }
    }

    // Calculate performance metrics
    const totalReturn = ((capital - 10000) / 10000) * 100;
    const winningTrades = simulatedTrades.filter(t => t.pnl > 0).length;
    const winRate = simulatedTrades.length > 0 ? (winningTrades / simulatedTrades.length) * 100 : 0;
    const maxDrawdown = this.calculateMaxDrawdown(simulatedTrades);
    const sharpeRatio = this.calculateSharpeRatio(simulatedTrades);

    return {
      strategyId,
      startDate,
      endDate,
      totalReturn,
      winRate,
      maxDrawdown,
      sharpeRatio,
      totalTrades: simulatedTrades.length,
      simulatedTrades,
    };
  }

  private async getHistoricalSignals(startDate: Date, endDate: Date): Promise<any[]> {
    // Query database for signals in date range
    // Placeholder implementation
    return [];
  }

  private async getStrategy(strategyId: number): Promise<any> {
    // Fetch strategy from database
    // Placeholder implementation
    return null;
  }

  private evaluateStrategy(strategy: any, signal: any): boolean {
    // Evaluate if strategy conditions match signal
    if (strategy.strategy_type === 'Form') {
      const params = strategy.parameters;
      
      // Simple form strategy evaluation
      if (signal.sentiment === 'bullish' && signal.confidence > 0.7) {
        return true;
      }
    } else if (strategy.strategy_type === 'DSL') {
      // Would use DSL parser here
      // Placeholder: return true for bullish signals
      return signal.sentiment === 'bullish' && signal.confidence > 0.7;
    }

    return false;
  }

  private shouldExit(strategy: any, signal: any, position: any): boolean {
    // Check exit conditions
    const currentPrice = signal.price;
    const entryPrice = position.entryPrice;
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

    if (strategy.strategy_type === 'Form') {
      const params = strategy.parameters;
      
      // Take profit
      if (pnlPercent >= params.take_profit_pct) {
        return true;
      }

      // Stop loss
      if (pnlPercent <= -params.max_loss_pct) {
        return true;
      }

      // Bearish signal
      if (signal.sentiment === 'bearish' && signal.confidence > 0.7) {
        return true;
      }
    }

    return false;
  }

  private calculateMaxDrawdown(trades: SimulatedTrade[]): number {
    if (trades.length === 0) return 0;

    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    for (const trade of trades) {
      cumulative += trade.pnl;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak > 0 ? ((peak - cumulative) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateSharpeRatio(trades: SimulatedTrade[]): number {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.pnl);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    return (avgReturn / stdDev) * Math.sqrt(252); // Annualized
  }
}
