import { Express, Request, Response } from 'express';
import { Server } from 'socket.io';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

import { LineraClient } from './linera-client';
import { DatabaseClient } from './database';
import { RedisClient } from './redis-client';
import { AITweetParser } from '../../parser/src/ai-parser';

interface RouteContext {
  lineraClient: LineraClient;
  dbClient: DatabaseClient;
  redisClient: RedisClient;
  aiParser: AITweetParser;
  io: Server;
}

// Validation schemas
const TweetSchema = z.object({
  id: z.string(),
  author: z.string(),
  text: z.string(),
  timestamp: z.number(),
  url: z.string(),
});

const StrategySchema = z.object({
  owner: z.string(),
  name: z.string(),
  strategy_type: z.any(),
  active: z.boolean().optional(),
});

// Order creation rate limiter (10 per minute per user)
const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.body.owner || req.ip,
  message: 'Too many orders created, please try again later.',
});

export function setupRoutes(app: Express, context: RouteContext) {
  const { lineraClient, dbClient, redisClient, aiParser, io } = context;

  // Tweet processing endpoint
  app.post('/api/tweets/process', async (req: Request, res: Response) => {
    try {
      const tweet = TweetSchema.parse(req.body);

      // Parse tweet with AI
      const signal = await aiParser.parseTweet(tweet);

      if (!signal) {
        return res.json({ processed: false, reason: 'No trading signal detected' });
      }

      // Submit signal to Linera
      const signalId = await lineraClient.submitSignal(signal);

      // Cache in database
      await dbClient.cacheSignal({ ...signal, id: signalId });

      // Broadcast to WebSocket clients
      io.to('signals').emit('signal:new', { ...signal, id: signalId });

      res.json({
        processed: true,
        signalId,
        signal,
      });
    } catch (error: any) {
      console.error('Error processing tweet:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get recent signals
  app.get('/api/signals', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Try cache first
      const cached = await redisClient.getCachedSignals();
      if (cached && offset === 0) {
        return res.json(cached);
      }

      // Fetch from Linera
      const signals = await lineraClient.getSignals(limit, offset);

      // Cache if first page
      if (offset === 0) {
        await redisClient.cacheSignals(signals);
      }

      res.json(signals);
    } catch (error: any) {
      console.error('Error fetching signals:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create strategy
  app.post('/api/strategies', async (req: Request, res: Response) => {
    try {
      const strategy = StrategySchema.parse(req.body);

      // Create strategy on Linera
      const strategyId = await lineraClient.createStrategy({
        ...strategy,
        created_at: Date.now(),
      });

      // Cache in database
      await dbClient.cacheStrategy({ ...strategy, id: strategyId });

      // Broadcast to WebSocket clients
      io.to('strategies').emit('strategy:created', { ...strategy, id: strategyId });

      res.json({
        success: true,
        strategyId,
      });
    } catch (error: any) {
      console.error('Error creating strategy:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get strategies
  app.get('/api/strategies', async (req: Request, res: Response) => {
    try {
      const owner = req.query.owner as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Try cache first
      if (owner) {
        const cached = await redisClient.getCachedStrategies(owner);
        if (cached && offset === 0) {
          return res.json(cached);
        }
      }

      // Fetch from Linera
      const strategies = await lineraClient.getStrategies(owner, limit, offset);

      // Cache if first page and owner specified
      if (owner && offset === 0) {
        await redisClient.cacheStrategies(owner, strategies);
      }

      res.json(strategies);
    } catch (error: any) {
      console.error('Error fetching strategies:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Activate strategy
  app.patch('/api/strategies/:id/activate', async (req: Request, res: Response) => {
    try {
      const strategyId = parseInt(req.params.id);

      await lineraClient.activateStrategy(strategyId);

      // Broadcast to WebSocket clients
      io.to('strategies').emit('strategy:activated', { strategyId });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error activating strategy:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Deactivate strategy
  app.patch('/api/strategies/:id/deactivate', async (req: Request, res: Response) => {
    try {
      const strategyId = parseInt(req.params.id);

      await lineraClient.deactivateStrategy(strategyId);

      // Broadcast to WebSocket clients
      io.to('strategies').emit('strategy:deactivated', { strategyId });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deactivating strategy:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get orders
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const strategyId = req.query.strategy_id ? parseInt(req.query.strategy_id as string) : undefined;
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const orders = await lineraClient.getOrders(strategyId, status, limit, offset);

      res.json(orders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get strategy performance
  app.get('/api/strategies/:id/performance', async (req: Request, res: Response) => {
    try {
      const strategyId = parseInt(req.params.id);

      const performance = await dbClient.getStrategyPerformance(strategyId);

      res.json(performance || { message: 'No performance data available' });
    } catch (error: any) {
      console.error('Error fetching performance:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
