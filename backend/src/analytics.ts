import { DatabaseClient } from './database';

export interface PerformanceMetrics {
  strategyId: number;
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  winningTrades: number;
  losingTrades: number;
}

export interface Trade {
  id: number;
  strategyId: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  timestamp: number;
}

export class PerformanceAnalytics {
  constructor(private dbClient: DatabaseClient) {}

  async calculateStrategyPerformance(strategyId: number): Promise<PerformanceMetrics> {
    // Fetch all orders for this strategy
    const orders = await this.getStrategyOrders(strategyId);

    if (orders.length === 0) {
      return this.getEmptyMetrics(strategyId);
    }

    // Calculate metrics
    const trades = this.pairOrdersToTrades(orders);
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const losingTrades = trades.filter(t => t.pnl < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const avgProfit = totalTrades > 0 ? totalPnL / totalTrades : 0;

    const maxDrawdown = this.calculateMaxDrawdown(trades);
    const sharpeRatio = this.calculateSharpeRatio(trades);
    const sortinoRatio = this.calculateSortinoRatio(trades);

    return {
      strategyId,
      totalTrades,
      winRate,
      avgProfit,
      totalPnL,
      maxDrawdown,
      sharpeRatio,
      sortinoRatio,
      winningTrades,
      losingTrades,
    };
  }

  private async getStrategyOrders(strategyId: number): Promise<any[]> {
    // This would query the database for all filled orders
    // For now, returning empty array as placeholder
    return [];
  }

  private pairOrdersToTrades(orders: any[]): Trade[] {
    const trades: Trade[] = [];
    const buyOrders = orders.filter(o => o.order_type === 'buy' && o.status === 'Filled');
    const sellOrders = orders.filter(o => o.order_type === 'sell' && o.status === 'Filled');

    // Simple pairing: match each buy with next sell
    for (let i = 0; i < Math.min(buyOrders.length, sellOrders.length); i++) {
      const buy = buyOrders[i];
      const sell = sellOrders[i];

      const pnl = (sell.fill_price - buy.fill_price) * buy.quantity;

      trades.push({
        id: buy.id,
        strategyId: buy.strategy_id,
        entryPrice: buy.fill_price,
        exitPrice: sell.fill_price,
        quantity: buy.quantity,
        pnl,
        timestamp: sell.filled_at,
      });
    }

    return trades;
  }

  private calculateMaxDrawdown(trades: Trade[]): number {
    if (trades.length === 0) return 0;

    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    for (const trade of trades) {
      cumulative += trade.pnl;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = ((peak - cumulative) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateSharpeRatio(trades: Trade[]): number {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.pnl);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Assuming risk-free rate of 0 for simplicity
    const sharpeRatio = avgReturn / stdDev;

    // Annualize (assuming daily trades)
    return sharpeRatio * Math.sqrt(252);
  }

  private calculateSortinoRatio(trades: Trade[]): number {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.pnl);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Only consider downside deviation (negative returns)
    const negativeReturns = returns.filter(r => r < 0);
    if (negativeReturns.length === 0) return 0;

    const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);

    if (downsideDeviation === 0) return 0;

    const sortinoRatio = avgReturn / downsideDeviation;

    // Annualize
    return sortinoRatio * Math.sqrt(252);
  }

  private getEmptyMetrics(strategyId: number): PerformanceMetrics {
    return {
      strategyId,
      totalTrades: 0,
      winRate: 0,
      avgProfit: 0,
      totalPnL: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      winningTrades: 0,
      losingTrades: 0,
    };
  }

  async savePerformanceSnapshot(metrics: PerformanceMetrics): Promise<void> {
    // Save to database
    await this.dbClient.cacheOrder({
      strategy_id: metrics.strategyId,
      total_trades: metrics.totalTrades,
      win_rate: metrics.winRate,
      total_pnl: metrics.totalPnL,
      max_drawdown: metrics.maxDrawdown,
      sharpe_ratio: metrics.sharpeRatio,
    });
  }

  async exportPerformanceData(strategyId: number, startDate?: Date, endDate?: Date): Promise<string> {
    const metrics = await this.calculateStrategyPerformance(strategyId);
    const orders = await this.getStrategyOrders(strategyId);

    // Generate CSV
    let csv = 'Strategy ID,Total Trades,Win Rate,Avg Profit,Total P&L,Max Drawdown,Sharpe Ratio,Sortino Ratio\n';
    csv += `${metrics.strategyId},${metrics.totalTrades},${metrics.winRate.toFixed(2)}%,${metrics.avgProfit.toFixed(2)},${metrics.totalPnL.toFixed(2)},${metrics.maxDrawdown.toFixed(2)}%,${metrics.sharpeRatio.toFixed(2)},${metrics.sortinoRatio.toFixed(2)}\n\n`;

    csv += 'Order ID,Type,Token,Quantity,Fill Price,Status,Timestamp\n';
    for (const order of orders) {
      csv += `${order.id},${order.order_type},${order.token},${order.quantity},${order.fill_price || 'N/A'},${order.status},${new Date(order.created_at).toISOString()}\n`;
    }

    return csv;
  }
}
