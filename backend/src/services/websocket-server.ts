/**
 * WebSocket Server for Real-time Updates
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

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

export class WebSocketServer {
  private io: Server;
  private priceSubscriptions: Map<string, Set<string>> = new Map();
  private strategySubscriptions: Map<string, Set<string>> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Start heartbeat
      this.startHeartbeat(socket);

      // Price feed subscriptions
      socket.on('subscribe:price', (symbols: string[]) => {
        this.subscribeToPrices(socket, symbols);
      });

      socket.on('unsubscribe:price', (symbols: string[]) => {
        this.unsubscribeFromPrices(socket, symbols);
      });

      // Strategy event subscriptions
      socket.on('subscribe:strategy', (strategyIds: string[]) => {
        this.subscribeToStrategies(socket, strategyIds);
      });

      socket.on('unsubscribe:strategy', (strategyIds: string[]) => {
        this.unsubscribeFromStrategies(socket, strategyIds);
      });

      // Heartbeat response
      socket.on('pong', () => {
        socket.data.lastPong = Date.now();
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.cleanup(socket);
      });
    });
  }

  /**
   * Subscribe to price feeds
   */
  private subscribeToPrices(socket: Socket, symbols: string[]): void {
    for (const symbol of symbols) {
      if (!this.priceSubscriptions.has(symbol)) {
        this.priceSubscriptions.set(symbol, new Set());
      }
      this.priceSubscriptions.get(symbol)!.add(socket.id);
      socket.join(`price:${symbol}`);
    }

    socket.emit('subscribed:price', { symbols, timestamp: Date.now() });
  }

  /**
   * Unsubscribe from price feeds
   */
  private unsubscribeFromPrices(socket: Socket, symbols: string[]): void {
    for (const symbol of symbols) {
      const subscribers = this.priceSubscriptions.get(symbol);
      if (subscribers) {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          this.priceSubscriptions.delete(symbol);
        }
      }
      socket.leave(`price:${symbol}`);
    }

    socket.emit('unsubscribed:price', { symbols, timestamp: Date.now() });
  }

  /**
   * Subscribe to strategy events
   */
  private subscribeToStrategies(socket: Socket, strategyIds: string[]): void {
    for (const strategyId of strategyIds) {
      if (!this.strategySubscriptions.has(strategyId)) {
        this.strategySubscriptions.set(strategyId, new Set());
      }
      this.strategySubscriptions.get(strategyId)!.add(socket.id);
      socket.join(`strategy:${strategyId}`);
    }

    socket.emit('subscribed:strategy', { strategyIds, timestamp: Date.now() });
  }

  /**
   * Unsubscribe from strategy events
   */
  private unsubscribeFromStrategies(socket: Socket, strategyIds: string[]): void {
    for (const strategyId of strategyIds) {
      const subscribers = this.strategySubscriptions.get(strategyId);
      if (subscribers) {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          this.strategySubscriptions.delete(strategyId);
        }
      }
      socket.leave(`strategy:${strategyId}`);
    }

    socket.emit('unsubscribed:strategy', { strategyIds, timestamp: Date.now() });
  }

  /**
   * Broadcast price update
   */
  broadcastPrice(priceFeed: PriceFeed): void {
    this.io.to(`price:${priceFeed.symbol}`).emit('price:update', priceFeed);
  }

  /**
   * Broadcast strategy event
   */
  broadcastStrategyEvent(event: StrategyEvent): void {
    this.io.to(`strategy:${event.strategyId}`).emit('strategy:event', event);
  }

  /**
   * Broadcast trade replication
   */
  broadcastTradeReplication(replication: TradeReplication): void {
    this.io.to(`strategy:${replication.strategyId}`).emit('trade:replicated', replication);
  }

  /**
   * Send notification to specific user
   */
  sendNotification(userId: string, notification: any): void {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Start heartbeat for connection health
   */
  private startHeartbeat(socket: Socket): void {
    socket.data.lastPong = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const lastPong = socket.data.lastPong || now;

      // Check if client is still responsive (within 60 seconds)
      if (now - lastPong > 60000) {
        console.log(`Client ${socket.id} timed out`);
        socket.disconnect();
        return;
      }

      socket.emit('ping', { timestamp: now });
    }, 25000);

    this.heartbeatIntervals.set(socket.id, interval);
  }

  /**
   * Cleanup on disconnect
   */
  private cleanup(socket: Socket): void {
    // Clear heartbeat
    const interval = this.heartbeatIntervals.get(socket.id);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(socket.id);
    }

    // Remove from all subscriptions
    for (const subscribers of this.priceSubscriptions.values()) {
      subscribers.delete(socket.id);
    }

    for (const subscribers of this.strategySubscriptions.values()) {
      subscribers.delete(socket.id);
    }
  }

  /**
   * Get active connections count
   */
  getConnectionsCount(): number {
    return this.io.sockets.sockets.size;
  }

  /**
   * Get subscription stats
   */
  getStats(): {
    connections: number;
    priceSubscriptions: number;
    strategySubscriptions: number;
  } {
    return {
      connections: this.getConnectionsCount(),
      priceSubscriptions: this.priceSubscriptions.size,
      strategySubscriptions: this.strategySubscriptions.size,
    };
  }

  /**
   * Close server
   */
  close(): void {
    // Clear all heartbeat intervals
    for (const interval of this.heartbeatIntervals.values()) {
      clearInterval(interval);
    }
    this.heartbeatIntervals.clear();

    this.io.close();
  }
}
