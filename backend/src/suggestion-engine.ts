import { TradingSignal } from '../parser/src/ai-parser';

export interface SuggestedTrade {
  id: string;
  signalId: number;
  token: string;
  contract: string;
  entry: number;
  size: number; // in USD
  stopLoss: number;
  takeProfit: number;
  route: TradeRoute;
  confidence: number;
  expectedSlippage: number; // percentage
  expectedPnL: number; // expected profit/loss in USD
  rationale: string;
  createdAt: number;
}

export interface TradeRoute {
  type: 'Jupiter' | 'Raydium' | 'Serum' | 'CEX';
  estimatedGas: number;
  estimatedFee: number;
  routeDetails?: any; // Jupiter route details
}

export interface LiquidityData {
  poolDepth: number; // USD
  volume24h: number; // USD
  priceImpact: number; // percentage for trade size
}

export interface InfluencerScore {
  influencer: string;
  hitRate: number; // 0-1
  avgReturn: number; // percentage
  totalSignals: number;
  recentPerformance: number; // 0-1
}

export class SuggestionEngine {
  private influencerScores: Map<string, InfluencerScore>;
  private liquidityCache: Map<string, LiquidityData>;
  private blacklist: Set<string>;

  constructor() {
    this.influencerScores = new Map();
    this.liquidityCache = new Map();
    this.blacklist = new Set();
    this.initializeBlacklist();
  }

  private initializeBlacklist() {
    // Known honeypot contracts or risky tokens
    // In production, maintain a dynamic blacklist
    this.blacklist.add('HONEYPOT_CONTRACT_1');
  }

  /**
   * Generate ranked trading suggestions from a signal
   */
  async generateSuggestions(
    signal: TradingSignal,
    userRiskProfile?: {
      maxTradeSize: number;
      maxSlippage: number;
      preferredRoute?: 'DEX' | 'CEX';
    }
  ): Promise<SuggestedTrade[]> {
    const suggestions: SuggestedTrade[] = [];

    // Fast rule filter
    if (!(await this.passesFastFilter(signal))) {
      return suggestions;
    }

    // Extract features
    const features = await this.extractFeatures(signal);

    // Score the signal
    const score = this.computeScore(signal, features);

    // Only proceed if score meets threshold
    if (score < 0.5) {
      return suggestions;
    }

    // Determine trade parameters
    const entry = signal.entry_price || features.currentPrice || 0;
    const stopLoss = signal.stop_loss || this.computeATRStopLoss(entry, features);
    const takeProfit = signal.take_profit || this.computeTakeProfit(entry, features);
    const size = this.computePositionSize(
      signal.position_size,
      userRiskProfile?.maxTradeSize || 100,
      features
    );

    // Simulate impact for different routes
    const routes = await this.evaluateRoutes(signal, size, userRiskProfile);

    // Generate suggestion for each viable route
    for (const route of routes) {
      if (route.estimatedSlippage <= (userRiskProfile?.maxSlippage || 5.0)) {
        const suggestion: SuggestedTrade = {
          id: `sug_${signal.timestamp}_${routes.indexOf(route)}`,
          signalId: signal.id || 0,
          token: signal.token,
          contract: signal.contract,
          entry: entry,
          size: size,
          stopLoss: stopLoss,
          takeProfit: takeProfit,
          route: route.route,
          confidence: score,
          expectedSlippage: route.estimatedSlippage,
          expectedPnL: this.computeExpectedPnL(entry, stopLoss, takeProfit, size, route.estimatedSlippage),
          rationale: this.generateRationale(signal, features, score),
          createdAt: Date.now(),
        };
        suggestions.push(suggestion);
      }
    }

    // Rank by expected ROI
    return suggestions.sort((a, b) => {
      const roiA = (a.expectedPnL / a.size) * 100;
      const roiB = (b.expectedPnL / b.size) * 100;
      return roiB - roiA;
    });
  }

  /**
   * Fast rule-based filter
   */
  private async passesFastFilter(signal: TradingSignal): Promise<boolean> {
    // Check blacklist
    if (this.blacklist.has(signal.contract)) {
      return false;
    }

    // Check liquidity threshold (min $1000 in pool)
    const liquidity = await this.getLiquidity(signal.contract);
    if (liquidity.poolDepth < 1000) {
      return false;
    }

    // Check sentiment (only bullish for now)
    if (signal.sentiment !== 'bullish') {
      return false;
    }

    // Check confidence threshold
    if (signal.confidence < 0.6) {
      return false;
    }

    return true;
  }

  /**
   * Extract features for ML scoring
   */
  private async extractFeatures(signal: TradingSignal): Promise<{
    liquidity: LiquidityData;
    influencerScore: number;
    currentPrice: number;
    volatility: number;
    volumeSpike: number;
    tokenAge: number;
  }> {
    const liquidity = await this.getLiquidity(signal.contract);
    const influencerScore = this.getInfluencerScore(signal.influencer);

    // Mock feature extraction (in production, fetch from on-chain or APIs)
    return {
      liquidity,
      influencerScore,
      currentPrice: 0, // Would fetch from price oracle
      volatility: 0.05, // Mock
      volumeSpike: 1.5, // Mock - 1.5x normal volume
      tokenAge: 365, // Mock - days since token creation
    };
  }

  /**
   * Compute weighted score for signal
   */
  private computeScore(
    signal: TradingSignal,
    features: Awaited<ReturnType<typeof this.extractFeatures>>
  ): number {
    // Weighted scoring: 0.35*influencer + 0.25*liquidity + 0.2*sentiment + 0.2*volume
    const influencerWeight = 0.35;
    const liquidityWeight = 0.25;
    const sentimentWeight = 0.2;
    const volumeWeight = 0.2;

    const influencerScore = features.influencerScore;
    const liquidityScore = Math.min(features.liquidity.poolDepth / 100000, 1.0); // Normalize to 0-1
    const sentimentScore = signal.confidence;
    const volumeScore = Math.min(features.volumeSpike / 3.0, 1.0); // Normalize to 0-1

    const score =
      influencerWeight * influencerScore +
      liquidityWeight * liquidityScore +
      sentimentWeight * sentimentScore +
      volumeWeight * volumeScore;

    return Math.min(Math.max(score, 0), 1); // Clamp to 0-1
  }

  /**
   * Evaluate different execution routes
   */
  private async evaluateRoutes(
    signal: TradingSignal,
    size: number,
    userRiskProfile?: { maxSlippage?: number; preferredRoute?: 'DEX' | 'CEX' }
  ): Promise<Array<{ route: TradeRoute; estimatedSlippage: number }>> {
    const routes: Array<{ route: TradeRoute; estimatedSlippage: number }> = [];

    // Jupiter route (default for DEX)
    const jupiterRoute = await this.simulateJupiterRoute(signal.contract, size);
    if (jupiterRoute) {
      routes.push({
        route: {
          type: 'Jupiter',
          estimatedGas: jupiterRoute.estimatedGas || 0.001,
          estimatedFee: jupiterRoute.estimatedFee || 0.003,
          routeDetails: jupiterRoute,
        },
        estimatedSlippage: jupiterRoute.priceImpact || 0.5,
      });
    }

    // Raydium direct pool (if available)
    const raydiumRoute = await this.simulateRaydiumRoute(signal.contract, size);
    if (raydiumRoute) {
      routes.push({
        route: {
          type: 'Raydium',
          estimatedGas: 0.001,
          estimatedFee: 0.0025,
        },
        estimatedSlippage: raydiumRoute.priceImpact || 1.0,
      });
    }

    // CEX route (if preferred)
    if (userRiskProfile?.preferredRoute === 'CEX') {
      routes.push({
        route: {
          type: 'CEX',
          estimatedGas: 0,
          estimatedFee: 0.001, // Lower fees on CEX
        },
        estimatedSlippage: 0.1, // Lower slippage on CEX
      });
    }

    return routes;
  }

  /**
   * Simulate Jupiter swap route
   */
  private async simulateJupiterRoute(
    outputMint: string,
    sizeUSD: number
  ): Promise<{ priceImpact?: number; estimatedGas?: number; estimatedFee?: number } | null> {
    try {
      // In production, call Jupiter API
      // For now, return mock data
      const priceImpact = Math.min(sizeUSD / 10000, 2.0); // Mock: 2% max impact
      return {
        priceImpact,
        estimatedGas: 0.001,
        estimatedFee: 0.003,
      };
    } catch (error) {
      console.error('Jupiter simulation error:', error);
      return null;
    }
  }

  /**
   * Simulate Raydium direct pool swap
   */
  private async simulateRaydiumRoute(
    outputMint: string,
    sizeUSD: number
  ): Promise<{ priceImpact?: number } | null> {
    // Mock implementation
    return {
      priceImpact: Math.min(sizeUSD / 5000, 3.0),
    };
  }

  /**
   * Get liquidity data for token
   */
  private async getLiquidity(contract: string): Promise<LiquidityData> {
    // Check cache first
    if (this.liquidityCache.has(contract)) {
      return this.liquidityCache.get(contract)!;
    }

    // Mock liquidity data (in production, fetch from DEX APIs)
    const liquidity: LiquidityData = {
      poolDepth: 50000, // Mock: $50k in pool
      volume24h: 100000, // Mock: $100k 24h volume
      priceImpact: 0.5, // Mock: 0.5% impact for $100 trade
    };

    // Cache for 5 minutes
    this.liquidityCache.set(contract, liquidity);
    setTimeout(() => this.liquidityCache.delete(contract), 5 * 60 * 1000);

    return liquidity;
  }

  /**
   * Get influencer performance score
   */
  private getInfluencerScore(influencer: string): number {
    if (this.influencerScores.has(influencer)) {
      const score = this.influencerScores.get(influencer)!;
      return score.hitRate * 0.7 + score.recentPerformance * 0.3;
    }

    // Default score for unknown influencers
    return 0.5;
  }

  /**
   * Update influencer score (called after trades complete)
   */
  updateInfluencerScore(influencer: string, hit: boolean, returnPct: number) {
    const existing = this.influencerScores.get(influencer) || {
      influencer,
      hitRate: 0.5,
      avgReturn: 0,
      totalSignals: 0,
      recentPerformance: 0.5,
    };

    existing.totalSignals += 1;
    existing.hitRate = (existing.hitRate * (existing.totalSignals - 1) + (hit ? 1 : 0)) / existing.totalSignals;
    existing.avgReturn = (existing.avgReturn * (existing.totalSignals - 1) + returnPct) / existing.totalSignals;
    existing.recentPerformance = hit ? Math.min(existing.recentPerformance + 0.1, 1.0) : Math.max(existing.recentPerformance - 0.1, 0);

    this.influencerScores.set(influencer, existing);
  }

  /**
   * Compute position size based on risk profile
   */
  private computePositionSize(
    suggestedSize: number | undefined,
    maxSize: number,
    features: Awaited<ReturnType<typeof this.extractFeatures>>
  ): number {
    if (suggestedSize) {
      return Math.min(suggestedSize, maxSize);
    }

    // Default: 2% of max size, adjusted by confidence
    const baseSize = maxSize * 0.02;
    const confidenceMultiplier = features.influencerScore;
    return Math.min(baseSize * (1 + confidenceMultiplier), maxSize);
  }

  /**
   * Compute ATR-based stop loss
   */
  private computeATRStopLoss(entry: number, features: Awaited<ReturnType<typeof this.extractFeatures>>): number {
    // Mock: 2% below entry (in production, use ATR)
    return entry * 0.98;
  }

  /**
   * Compute take profit level
   */
  private computeTakeProfit(entry: number, features: Awaited<ReturnType<typeof this.extractFeatures>>): number {
    // Mock: 6% above entry (in production, use model-based prediction)
    return entry * 1.06;
  }

  /**
   * Compute expected P&L
   */
  private computeExpectedPnL(
    entry: number,
    stopLoss: number,
    takeProfit: number,
    size: number,
    slippage: number
  ): number {
    // Risk-reward ratio
    const risk = entry - stopLoss;
    const reward = takeProfit - entry;
    const riskRewardRatio = reward / risk;

    // Expected value: (win_prob * reward) - (loss_prob * risk)
    // Assuming 50% win rate for simplicity
    const winProb = 0.5;
    const expectedValue = winProb * reward - (1 - winProb) * risk;

    // Adjust for slippage
    const adjustedValue = expectedValue * (1 - slippage / 100);

    // Scale by position size
    return (adjustedValue / entry) * size;
  }

  /**
   * Generate human-readable rationale
   */
  private generateRationale(
    signal: TradingSignal,
    features: Awaited<ReturnType<typeof this.extractFeatures>>,
    score: number
  ): string {
    const parts: string[] = [];

    if (features.influencerScore > 0.7) {
      parts.push(`Strong track record from ${signal.influencer}`);
    }

    if (features.liquidity.poolDepth > 50000) {
      parts.push('High liquidity pool');
    }

    if (features.volumeSpike > 1.5) {
      parts.push('Volume spike detected');
    }

    if (signal.confidence > 0.8) {
      parts.push('High confidence signal');
    }

    return parts.join('. ') || 'Moderate opportunity based on signal analysis';
  }
}

// Export singleton
export const suggestionEngine = new SuggestionEngine();

