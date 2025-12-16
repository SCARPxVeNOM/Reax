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
