/**
 * API Client for Backend Services
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// DEX API
export const dexApi = {
  async getQuote(params: {
    dex: 'RAYDIUM' | 'JUPITER' | 'BINANCE';
    inputToken: string;
    outputToken: string;
    amount: number;
    slippageBps?: number;
  }) {
    const { data } = await apiClient.post('/api/dex/quote', params);
    return data;
  },

  async compareQuotes(params: {
    inputToken: string;
    outputToken: string;
    amount: number;
    slippageBps?: number;
  }) {
    const { data } = await apiClient.post('/api/dex/compare', params);
    return data;
  },

  async executeSwap(params: {
    dex: 'RAYDIUM' | 'JUPITER' | 'BINANCE';
    inputToken: string;
    outputToken: string;
    amount: number;
    slippageBps?: number;
    priorityFee?: number;
  }) {
    const { data } = await apiClient.post('/api/dex/swap', params);
    return data;
  },

  async getPriorityFees() {
    const { data } = await apiClient.get('/api/dex/priority-fees');
    return data;
  },
};

// Strategy API
export const strategyApi = {
  async create(strategy: {
    name: string;
    type: 'PINESCRIPT' | 'VISUAL';
    code?: string;
    visualData?: any;
  }) {
    const { data } = await apiClient.post('/api/strategies', strategy);
    return data;
  },

  async list(userId: string) {
    const { data } = await apiClient.get(`/api/strategies/user/${userId}`);
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get(`/api/strategies/${id}`);
    return data;
  },

  async update(id: string, updates: any) {
    const { data } = await apiClient.put(`/api/strategies/${id}`, updates);
    return data;
  },

  async delete(id: string) {
    await apiClient.delete(`/api/strategies/${id}`);
  },

  async deploy(id: string) {
    const { data } = await apiClient.post(`/api/strategies/${id}/deploy`);
    return data;
  },

  async backtest(id: string, params: {
    startDate: string;
    endDate: string;
    initialCapital?: number;
  }) {
    const { data } = await apiClient.post(`/api/strategies/${id}/backtest`, params);
    return data;
  },
};

// PineScript API
export const pineScriptApi = {
  async compile(code: string) {
    const { data } = await apiClient.post('/api/pinescript/compile', { code });
    return data;
  },

  async validate(code: string) {
    const { data } = await apiClient.post('/api/pinescript/validate', { code });
    return data;
  },
};

// Visual Strategy API
export const visualStrategyApi = {
  async generateCode(visualData: any) {
    const { data } = await apiClient.post('/api/visual-strategy/generate', visualData);
    return data;
  },

  async validate(visualData: any) {
    const { data } = await apiClient.post('/api/visual-strategy/validate', visualData);
    return data;
  },
};

// Social Trading API
export const socialTradingApi = {
  async getMarketplaceStrategies() {
    const { data } = await apiClient.get('/api/strategies/marketplace/active');
    return data;
  },

  async followStrategy(params: {
    strategyId: string;
    userId: string;
    allocationAmount: number;
    maxPositionSize?: number;
    riskLimitPercent?: number;
  }) {
    const { data } = await apiClient.post(`/api/strategies/${params.strategyId}/follow`, {
      userId: params.userId,
      allocationAmount: params.allocationAmount,
      riskLimitPercent: params.riskLimitPercent,
    });
    return data;
  },

  async unfollowStrategy(strategyId: string, userId: string) {
    const { data } = await apiClient.post(`/api/strategies/${strategyId}/unfollow`, { userId });
    return data;
  },

  async getFollowedStrategies(userId: string) {
    const { data } = await apiClient.get(`/api/social/followed/${userId}`);
    return data;
  },

  async getStrategyFollowers(strategyId: string) {
    const { data } = await apiClient.get(`/api/social/followers/${strategyId}`);
    return data;
  },

  async getReplicationHistory(followerId: string) {
    const { data } = await apiClient.get(`/api/social/replications/${followerId}`);
    return data;
  },
};

// Performance API
export const performanceApi = {
  async getMetrics(strategyId: string, period?: string) {
    const { data } = await apiClient.get(`/api/performance/${strategyId}`, {
      params: { period },
    });
    return data;
  },

  async getEquityCurve(strategyId: string) {
    const { data } = await apiClient.get(`/api/performance/${strategyId}/equity`);
    return data;
  },
};

// Strategy Microchain API (Complete flow: Strategy → Social → Microchain → Trading → Analytics)
export const strategyMicrochainApi = {
  /**
   * Create and publish strategy to social feed
   */
  async createAndPublish(params: {
    userId: string;
    name: string;
    type: 'PINESCRIPT' | 'VISUAL';
    code?: string;
    visualData?: any;
    description?: string;
  }) {
    const { data } = await apiClient.post('/api/strategy-microchain/create-and-publish', params);
    return data;
  },

  /**
   * Deploy strategy to microchain (creates account)
   */
  async deployToMicrochain(strategyId: string, userId: string) {
    const { data } = await apiClient.post(`/api/strategy-microchain/${strategyId}/deploy`, {
      userId,
    });
    return data;
  },

  /**
   * Execute trade and record on microchain
   */
  async executeTrade(strategyId: string, tradeParams: {
    dex: 'RAYDIUM' | 'JUPITER' | 'BINANCE';
    inputToken: string;
    outputToken: string;
    amount: number;
    slippageBps?: number;
    priorityFee?: number;
    walletAddress: string;
  }) {
    const { data } = await apiClient.post(
      `/api/strategy-microchain/${strategyId}/execute-trade`,
      tradeParams
    );
    return data;
  },

  /**
   * Get analytics from multiple microchains
   */
  async getAnalytics(params?: {
    strategyId?: string;
    microchainId?: string;
    timeframe?: '1H' | '24H' | '7D' | '30D';
  }) {
    const { data } = await apiClient.get('/api/strategy-microchain/analytics', {
      params,
    });
    return data;
  },

  /**
   * List microchains for a user
   */
  async getMicrochains(userId: string) {
    const { data } = await apiClient.get('/api/strategy-microchain/microchains', {
      params: { userId },
    });
    return data;
  },

  /**
   * Create (or return existing) microchain for a user
   */
  async createMicrochain(userId: string) {
    const { data } = await apiClient.post('/api/strategy-microchain/microchains', {
      userId,
    });
    return data;
  },
};

// Notification API
export const notificationApi = {
  async getNotifications(userId: string, unreadOnly?: boolean) {
    const { data } = await apiClient.get(`/api/notifications/${userId}`, {
      params: { unreadOnly },
    });
    return data;
  },

  async markAsRead(userId: string, notificationId: string) {
    await apiClient.post(`/api/notifications/${userId}/${notificationId}/read`);
  },

  async markAllAsRead(userId: string) {
    await apiClient.post(`/api/notifications/${userId}/read-all`);
  },

  async setPreferences(preferences: any) {
    await apiClient.post('/api/notifications/preferences', preferences);
  },
};

// ============================================
// PHASE 1: SAFETY & VALIDATION API
// ============================================

export const safetyApi = {
  async createConfig(config: SafetyConfig) {
    const { data } = await apiClient.post('/api/safety/config', config);
    return data;
  },

  async updateConfig(config: SafetyConfig) {
    const { data } = await apiClient.put('/api/safety/config', config);
    return data;
  },

  async getConfig(owner: string) {
    const { data } = await apiClient.get(`/api/safety/config/${owner}`);
    return data;
  },

  async validateOrder(orderId: number) {
    const { data } = await apiClient.post(`/api/orders/${orderId}/validate`);
    return data;
  },
};

// ============================================
// PHASE 2: STRATEGY ENHANCEMENT API
// ============================================

export const strategyVersionApi = {
  async updateStrategy(strategyId: number, strategy: any, changeReason?: string) {
    const { data } = await apiClient.put(`/api/strategies/${strategyId}`, {
      strategy,
      change_reason: changeReason,
    });
    return data;
  },

  async getVersions(strategyId: number) {
    const { data } = await apiClient.get(`/api/strategies/${strategyId}/versions`);
    return data;
  },
};

// ============================================
// PHASE 3: ADVANCED ORDER API
// ============================================

export const advancedOrderApi = {
  async createMultiHopOrder(order: DEXOrder) {
    const { data } = await apiClient.post('/api/orders/multi-hop', order);
    return data;
  },

  async triggerConditionalOrder(orderId: number) {
    const { data } = await apiClient.post(`/api/orders/${orderId}/trigger`);
    return data;
  },

  async cancelOrder(orderId: number) {
    const { data } = await apiClient.delete(`/api/orders/${orderId}/cancel`);
    return data;
  },
};

// ============================================
// PHASE 4: PREDICTION MARKET API
// ============================================

export const predictionMarketApi = {
  async create(market: PredictionMarket) {
    const { data } = await apiClient.post('/api/markets', market);
    return data;
  },

  async list(limit: number = 50, offset: number = 0) {
    const { data } = await apiClient.get('/api/markets', { params: { limit, offset } });
    return data;
  },

  async updateProbability(marketId: number, probability: number) {
    const { data } = await apiClient.put(`/api/markets/${marketId}/probability`, { probability });
    return data;
  },

  async resolve(marketId: number, outcome: boolean) {
    const { data } = await apiClient.post(`/api/markets/${marketId}/resolve`, { outcome });
    return data;
  },

  async linkStrategy(marketId: number, link: StrategyMarketLink) {
    const { data } = await apiClient.post(`/api/markets/${marketId}/link-strategy`, link);
    return data;
  },
};

// ============================================
// TYPE DEFINITIONS FOR PHASES 1-4
// ============================================

export interface SafetyConfig {
  owner: string;
  max_position_per_token: number;
  max_portfolio_exposure: number;
  slippage_tolerance_bps: number;
  max_slippage_bps: number;
  require_stop_loss: boolean;
  require_take_profit: boolean;
  enable_auto_validation: boolean;
}

export interface DEXOrder {
  id?: number;
  strategy_id: number;
  dex: 'Raydium' | 'Jupiter' | 'Binance';
  input_mint: string;
  output_mint: string;
  input_amount: number;
  output_amount: number;
  slippage_bps: number;
  priority_fee: number;
  status?: string;
  route_path?: RouteHop[];
  is_multi_hop?: boolean;
  conditional_trigger?: ConditionalTrigger;
  execution_mode?: 'Immediate' | 'Conditional' | { Scheduled: { execute_at: number } };
}

export interface RouteHop {
  dex: 'Raydium' | 'Jupiter' | 'Binance';
  input_mint: string;
  output_mint: string;
  pool_address?: string;
  expected_output: number;
}

export interface ConditionalTrigger {
  trigger_type: 'PriceThreshold' | 'MarketProbability' | 'TimeBasedTrigger' | 'VolumeThreshold';
  threshold: number;
  comparison: 'GreaterThan' | 'LessThan' | 'GreaterThanOrEqual' | 'LessThanOrEqual' | 'Equal';
  active: boolean;
}

export interface PredictionMarket {
  id?: number;
  question: string;
  description: string;
  creator: string;
  probability?: number;
  outcome?: boolean;
}

export interface StrategyMarketLink {
  strategy_id: number;
  trigger_on_probability: number;
  trigger_above: boolean;
  enabled: boolean;
}
