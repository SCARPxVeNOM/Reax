import { LineraClient } from './linera-client';
import { TradingSignal } from '../parser/src/ai-parser';
import { suggestionEngine } from './suggestion-engine';

interface AutoOrderConfig {
  enabled: boolean;
  minConfidence: number;
  maxTradeSize: number;
  maxSlippage: number;
  paperTradeOnly: boolean; // If true, only create paper trades (safer for testing)
}

export class AutoOrderService {
  private lineraClient: LineraClient;
  private config: AutoOrderConfig;

  constructor(lineraClient: LineraClient, config?: Partial<AutoOrderConfig>) {
    this.lineraClient = lineraClient;
    this.config = {
      enabled: config?.enabled ?? process.env.AUTO_ORDER_ENABLED === 'true',
      minConfidence: config?.minConfidence ?? parseFloat(process.env.AUTO_ORDER_MIN_CONFIDENCE || '0.7'),
      maxTradeSize: config?.maxTradeSize ?? parseFloat(process.env.AUTO_ORDER_MAX_SIZE || '100'),
      maxSlippage: config?.maxSlippage ?? parseFloat(process.env.AUTO_ORDER_MAX_SLIPPAGE || '3.0'),
      paperTradeOnly: config?.paperTradeOnly ?? process.env.AUTO_ORDER_PAPER_ONLY === 'true',
    };
  }

  /**
   * Automatically create order when buy signal is detected
   */
  async processBuySignal(signal: TradingSignal, signalId: number): Promise<{
    orderCreated: boolean;
    orderId?: number;
    suggestionId?: string;
    reason?: string;
  }> {
    // Check if auto-ordering is enabled
    if (!this.config.enabled) {
      return {
        orderCreated: false,
        reason: 'Auto-ordering is disabled',
      };
    }

    // Only process bullish signals
    if (signal.sentiment !== 'bullish') {
      return {
        orderCreated: false,
        reason: 'Signal is not bullish',
      };
    }

    // Check confidence threshold
    if (signal.confidence < this.config.minConfidence) {
      return {
        orderCreated: false,
        reason: `Confidence ${signal.confidence} below threshold ${this.config.minConfidence}`,
      };
    }

    try {
      // Generate suggestions for this signal
      const suggestions = await suggestionEngine.generateSuggestions(signal, {
        maxTradeSize: this.config.maxTradeSize,
        maxSlippage: this.config.maxSlippage,
        preferredRoute: 'DEX',
      });

      if (suggestions.length === 0) {
        return {
          orderCreated: false,
          reason: 'No viable suggestions generated',
        };
      }

      // Take the top-ranked suggestion
      const topSuggestion = suggestions[0];

      // Check if suggestion meets criteria
      if (topSuggestion.expectedSlippage > this.config.maxSlippage) {
        return {
          orderCreated: false,
          reason: `Slippage ${topSuggestion.expectedSlippage.toFixed(2)}% exceeds max ${this.config.maxSlippage}%`,
        };
      }

      // Create order on Linera
      const order = {
        strategy_id: 0, // Direct signal order (no strategy)
        signal_id: signalId,
        order_type: 'buy',
        token: topSuggestion.token,
        quantity: topSuggestion.size,
        status: 'Pending',
        created_at: Date.now(),
      };

      const orderId = await this.lineraClient.createOrder(order);

      console.log(`🤖 Auto-order created! Order ID: ${orderId}`);
      console.log(`   Token: ${topSuggestion.token}`);
      console.log(`   Size: $${topSuggestion.size.toFixed(2)}`);
      console.log(`   Entry: $${topSuggestion.entry.toFixed(4)}`);
      console.log(`   SL: $${topSuggestion.stopLoss.toFixed(4)}`);
      console.log(`   TP: $${topSuggestion.takeProfit.toFixed(4)}`);
      console.log(`   Route: ${topSuggestion.route.type}`);
      console.log(`   Expected P&L: $${topSuggestion.expectedPnL.toFixed(2)}`);

      return {
        orderCreated: true,
        orderId,
        suggestionId: topSuggestion.id,
      };
    } catch (error: any) {
      console.error('Error creating auto-order:', error);
      return {
        orderCreated: false,
        reason: error.message,
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoOrderConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AutoOrderConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('Auto-order config updated:', this.config);
  }
}

