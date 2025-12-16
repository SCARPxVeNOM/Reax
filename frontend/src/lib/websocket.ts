/**
 * WebSocket Client for Real-time Updates
 */

import { io, Socket } from 'socket.io-client';

export interface PriceFeed {
  symbol: string;
  price: number;
  timestamp: number;
  volume24h?: number;
  change24h?: number;
}

export interface StrategyEvent {
  strategyId: string;
  type: 'SIGNAL' | 'EXECUTION' | 'ERROR' | 'STATUS_CHANGE';
  data: any;
  timestamp: number;
}

export interface TradeReplication {
  followerId: string;
  strategyId: string;
  tradeId: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  amount: number;
  price: number;
  timestamp: number;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private priceCallbacks: Map<string, Set<(feed: PriceFeed) => void>> = new Map();
  private strategyCallbacks: Map<string, Set<(event: StrategyEvent) => void>> = new Map();
  private tradeCallbacks: Set<(replication: TradeReplication) => void> = new Set();

  connect() {
    if (this.socket?.connected) return;

    const url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    
    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupEventHandlers();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('ping', (data: { timestamp: number }) => {
      this.socket?.emit('pong');
    });

    this.socket.on('price:update', (feed: PriceFeed) => {
      const callbacks = this.priceCallbacks.get(feed.symbol);
      if (callbacks) {
        callbacks.forEach(cb => cb(feed));
      }
    });

    this.socket.on('strategy:event', (event: StrategyEvent) => {
      const callbacks = this.strategyCallbacks.get(event.strategyId);
      if (callbacks) {
        callbacks.forEach(cb => cb(event));
      }
    });

    this.socket.on('trade:replicated', (replication: TradeReplication) => {
      this.tradeCallbacks.forEach(cb => cb(replication));
    });
  }

  subscribeToPrice(symbol: string, callback: (feed: PriceFeed) => void) {
    if (!this.priceCallbacks.has(symbol)) {
      this.priceCallbacks.set(symbol, new Set());
      this.socket?.emit('subscribe:price', [symbol]);
    }
    this.priceCallbacks.get(symbol)!.add(callback);
  }

  unsubscribeFromPrice(symbol: string, callback: (feed: PriceFeed) => void) {
    const callbacks = this.priceCallbacks.get(symbol);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.priceCallbacks.delete(symbol);
        this.socket?.emit('unsubscribe:price', [symbol]);
      }
    }
  }

  subscribeToStrategy(strategyId: string, callback: (event: StrategyEvent) => void) {
    if (!this.strategyCallbacks.has(strategyId)) {
      this.strategyCallbacks.set(strategyId, new Set());
      this.socket?.emit('subscribe:strategy', [strategyId]);
    }
    this.strategyCallbacks.get(strategyId)!.add(callback);
  }

  unsubscribeFromStrategy(strategyId: string, callback: (event: StrategyEvent) => void) {
    const callbacks = this.strategyCallbacks.get(strategyId);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.strategyCallbacks.delete(strategyId);
        this.socket?.emit('unsubscribe:strategy', [strategyId]);
      }
    }
  }

  subscribeToTradeReplications(callback: (replication: TradeReplication) => void) {
    this.tradeCallbacks.add(callback);
  }

  unsubscribeFromTradeReplications(callback: (replication: TradeReplication) => void) {
    this.tradeCallbacks.delete(callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsClient = new WebSocketClient();
