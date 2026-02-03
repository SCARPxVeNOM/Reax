import { Express, Request, Response } from 'express';
import { Server } from 'socket.io';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

import { LineraClient } from './linera-client';
import { DatabaseClient } from './database';
import { RedisClient } from './redis-client';
import { AITweetParser } from '../../parser/src/ai-parser';
import { suggestionEngine, SuggestedTrade } from './suggestion-engine';
import { AutoOrderService } from './auto-order-service';

interface RouteContext {
  lineraClient: LineraClient;
  dbClient: DatabaseClient;
  redisClient: RedisClient;
  aiParser: AITweetParser;
  io: Server;
  autoOrderService?: AutoOrderService;
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
  const { lineraClient, dbClient, redisClient, aiParser, io, autoOrderService } = context;

  // Manual trigger to fetch latest tweets (for testing)
  app.post('/api/tweets/fetch-latest', async (req: Request, res: Response) => {
    try {
      const { username } = req.body;

      // If no username provided, fetch from default user
      const influencers = username
        ? [username]
        : (process.env.INFLUENCERS || 'Anubhav06_2004').split(',').map(u => u.trim());

      // Trigger ingestion service to fetch tweets
      // Note: In a production setup, you'd use a message queue or direct service call
      // For now, we'll return success and let the ingestion service handle it
      console.log(`📥 Manual tweet fetch requested for: ${influencers.join(', ')}`);

      res.json({
        success: true,
        message: `Fetch request queued for @${influencers.join(', @')}`,
        note: 'Tweets will be processed by the ingestion service. Check logs for results.',
        influencers
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tweet processing endpoint
  app.post('/api/tweets/process', async (req: Request, res: Response) => {
    try {
      const tweet = TweetSchema.parse(req.body);
      const imageUrl = req.body.image_url as string | undefined;

      // Parse tweet with AI (including image if provided)
      const signal = await aiParser.parseTweet(tweet, imageUrl);

      if (!signal) {
        return res.json({ processed: false, reason: 'No trading signal detected' });
      }

      // Submit signal to Linera
      const signalId = await lineraClient.submitSignal(signal);

      // Cache in database
      await dbClient.cacheSignal({ ...signal, id: signalId });

      // Broadcast to WebSocket clients
      io.to('signals').emit('signal:new', { ...signal, id: signalId });

      // Auto-create order if buy signal detected and auto-ordering is enabled
      let autoOrderResult = null;
      if (autoOrderService && signal.sentiment === 'bullish') {
        signal.id = signalId;
        autoOrderResult = await autoOrderService.processBuySignal(signal, signalId);

        if (autoOrderResult.orderCreated) {
          console.log(`✅ Auto-order created for signal ${signalId}: Order ID ${autoOrderResult.orderId}`);
          // Broadcast order creation
          io.to('orders').emit('order:auto_created', {
            orderId: autoOrderResult.orderId,
            signalId,
            suggestionId: autoOrderResult.suggestionId,
          });
        }
      }

      res.json({
        processed: true,
        signalId,
        signal,
        orderId: autoOrderResult?.orderId,
        autoOrdered: autoOrderResult?.orderCreated || false,
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
      let signals = await lineraClient.getSignals(limit, offset);

      // Fallback to database if Linera returns nothing
      if ((!signals || signals.length === 0) && offset === 0) {
        try {
          const recent = await dbClient.getRecentSignals(limit);
          if (recent && recent.length > 0) {
            signals = recent.map((row: any) => ({
              id: row.id,
              influencer: row.influencer,
              token: row.token,
              contract: row.contract,
              sentiment: row.sentiment,
              confidence: parseFloat(row.confidence),
              timestamp: Number(row.timestamp),
              tweet_url: row.tweet_url,
              entry_price: row.entry_price ? parseFloat(row.entry_price) : null,
              stop_loss: row.stop_loss ? parseFloat(row.stop_loss) : null,
              take_profit: row.take_profit ? parseFloat(row.take_profit) : null,
              position_size: row.position_size ? parseFloat(row.position_size) : null,
              leverage: row.leverage ? parseFloat(row.leverage) : null,
              platform: row.platform,
            }));
          }
        } catch { }
      }

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
      let strategies = await lineraClient.getStrategies(owner, limit, offset);

      // Fallback: if empty and owner specified, attempt DB cache
      if ((!strategies || strategies.length === 0) && owner && offset === 0) {
        try {
          const cached = await redisClient.getCachedStrategies(owner);
          if (cached && cached.length > 0) {
            strategies = cached;
          }
        } catch { }
      }

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

  // Get suggestions for a signal
  app.get('/api/suggestions', async (req: Request, res: Response) => {
    try {
      const signalId = parseInt(req.query.signal_id as string);
      if (!signalId) {
        return res.status(400).json({ error: 'signal_id is required' });
      }

      // Get signal from Linera
      const signal = await lineraClient.getSignal(signalId);
      if (!signal) {
        return res.status(404).json({ error: 'Signal not found' });
      }

      // Convert Linera signal to TradingSignal format
      const tradingSignal: any = {
        id: signal.id,
        influencer: signal.influencer,
        token: signal.token,
        contract: signal.contract,
        sentiment: signal.sentiment,
        confidence: signal.confidence,
        timestamp: signal.timestamp,
        tweetUrl: signal.tweet_url,
        entry_price: signal.entry_price,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit,
        position_size: signal.position_size,
        leverage: signal.leverage,
      };

      // Get user risk profile from query params (optional)
      const userRiskProfile = req.query.max_trade_size
        ? {
          maxTradeSize: parseFloat(req.query.max_trade_size as string),
          maxSlippage: parseFloat(req.query.max_slippage as string) || 5.0,
          preferredRoute: req.query.preferred_route as 'DEX' | 'CEX' | undefined,
        }
        : undefined;

      // Generate suggestions
      const suggestions = await suggestionEngine.generateSuggestions(tradingSignal, userRiskProfile);

      res.json(suggestions);
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Execute a suggestion (creates order on Linera)
  app.post('/api/suggestions/:id/execute', orderLimiter, async (req: Request, res: Response) => {
    try {
      const suggestionId = req.params.id;
      const { user_wallet, execution_mode, paper_trade } = req.body;

      // Get suggestion (in production, store suggestions in cache/DB)
      // For now, we'll reconstruct from signal
      const signalId = parseInt(req.query.signal_id as string);
      if (!signalId) {
        return res.status(400).json({ error: 'signal_id is required' });
      }

      const signal = await lineraClient.getSignal(signalId);
      if (!signal) {
        return res.status(404).json({ error: 'Signal not found' });
      }

      // Generate suggestions to find the one matching suggestionId
      const tradingSignal: any = {
        id: signal.id,
        influencer: signal.influencer,
        token: signal.token,
        contract: signal.contract,
        sentiment: signal.sentiment,
        confidence: signal.confidence,
        timestamp: signal.timestamp,
        tweetUrl: signal.tweet_url,
        entry_price: signal.entry_price,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit,
        position_size: signal.position_size,
        leverage: signal.leverage,
      };

      const suggestions = await suggestionEngine.generateSuggestions(tradingSignal);
      const suggestion = suggestions.find((s) => s.id === suggestionId);

      if (!suggestion) {
        return res.status(404).json({ error: 'Suggestion not found' });
      }

      // If paper trade, just record in database
      if (paper_trade) {
        await dbClient.recordPaperTrade({
          suggestion_id: suggestionId,
          signal_id: signalId,
          user_wallet: user_wallet || 'paper_trader',
          entry: suggestion.entry,
          size: suggestion.size,
          stop_loss: suggestion.stopLoss,
          take_profit: suggestion.takeProfit,
          route: suggestion.route.type,
          executed_at: Date.now(),
        });

        return res.json({
          success: true,
          paper_trade: true,
          message: 'Paper trade recorded',
        });
      }

      // Create order on Linera
      const order = {
        strategy_id: 0, // No strategy for direct execution
        signal_id: signalId,
        order_type: 'buy',
        token: suggestion.token,
        quantity: suggestion.size,
        status: 'Pending',
        created_at: Date.now(),
      };

      const orderId = await lineraClient.createOrder(order);

      // Broadcast to WebSocket clients
      io.to('orders').emit('order:created', { ...order, id: orderId });

      res.json({
        success: true,
        orderId,
        suggestion: suggestion,
        execution_mode: execution_mode || 'wallet_signed',
      });
    } catch (error: any) {
      console.error('Error executing suggestion:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Paper trade endpoints
  app.get('/api/paper-trades', async (req: Request, res: Response) => {
    try {
      const userWallet = req.query.user_wallet as string;
      const trades = await dbClient.getPaperTrades(userWallet);
      res.json(trades || []);
    } catch (error: any) {
      console.error('Error fetching paper trades:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Auto-order configuration endpoints
  if (autoOrderService) {
    app.get('/api/auto-order/config', (_req: Request, res: Response) => {
      res.json(autoOrderService.getConfig());
    });

    app.patch('/api/auto-order/config', (req: Request, res: Response) => {
      try {
        const updates = req.body;
        autoOrderService.updateConfig(updates);
        res.json({
          success: true,
          config: autoOrderService.getConfig(),
        });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  // Monitored Users endpoints
  app.get('/api/monitored-users', async (req: Request, res: Response) => {
    try {
      const activeOnly = req.query.active === 'true';
      const users = await dbClient.getMonitoredUsers(activeOnly);
      // Always return an array, even if empty
      res.json(users || []);
    } catch (error: any) {
      console.error('Error fetching monitored users:', error);
      // Return empty array on error instead of error response
      // This allows the UI to work even if database is temporarily unavailable
      res.json([]);
    }
  });

  app.post('/api/monitored-users', async (req: Request, res: Response) => {
    try {
      const { username, display_name } = req.body;
      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }
      const id = await dbClient.addMonitoredUser(username, display_name);
      // Broadcast to WebSocket clients
      io.to('settings').emit('monitored_user:added', { id, username, display_name });
      res.json({ success: true, id, username, display_name });
    } catch (error: any) {
      console.error('Error adding monitored user:', error);
      // Check if it's a database unavailable error
      if (error.message && error.message.includes('not available')) {
        return res.status(503).json({ error: 'Database is not available. Please ensure PostgreSQL is running.' });
      }
      res.status(500).json({ error: error.message || 'Failed to add user' });
    }
  });

  app.delete('/api/monitored-users/:username', async (req: Request, res: Response) => {
    try {
      const username = req.params.username;
      await dbClient.removeMonitoredUser(username);
      // Broadcast to WebSocket clients
      io.to('settings').emit('monitored_user:removed', { username });
      res.json({ success: true, message: `User @${username} removed from monitoring` });
    } catch (error: any) {
      console.error('Error removing monitored user:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/monitored-users/:username/toggle', async (req: Request, res: Response) => {
    try {
      const username = req.params.username;
      const { active } = req.body;
      if (typeof active !== 'boolean') {
        return res.status(400).json({ error: 'active must be a boolean' });
      }
      await dbClient.toggleMonitoredUser(username, active);
      // Broadcast to WebSocket clients
      io.to('settings').emit('monitored_user:toggled', { username, active });
      res.json({ success: true, username, active });
    } catch (error: any) {
      console.error('Error toggling monitored user:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // PHASE 1: SAFETY & VALIDATION ROUTES
  // ============================================

  // Create safety config
  app.post('/api/safety/config', async (req: Request, res: Response) => {
    try {
      const config = req.body;
      await lineraClient.createSafetyConfig(config);
      io.to('safety').emit('safety_config:created', config);
      res.json({ success: true, config });
    } catch (error: any) {
      console.error('Error creating safety config:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update safety config
  app.put('/api/safety/config', async (req: Request, res: Response) => {
    try {
      const config = req.body;
      await lineraClient.updateSafetyConfig(config);
      io.to('safety').emit('safety_config:updated', config);
      res.json({ success: true, config });
    } catch (error: any) {
      console.error('Error updating safety config:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get safety config
  app.get('/api/safety/config/:owner', async (req: Request, res: Response) => {
    try {
      const owner = req.params.owner;
      const config = await lineraClient.getSafetyConfig(owner);
      res.json(config || { message: 'No safety config found' });
    } catch (error: any) {
      console.error('Error fetching safety config:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Validate order
  app.post('/api/orders/:id/validate', async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const validation = await lineraClient.validateOrder(orderId);
      io.to('orders').emit('order:validated', { orderId, validation });
      res.json({ success: true, validation });
    } catch (error: any) {
      console.error('Error validating order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // PHASE 2: STRATEGY ENHANCEMENT ROUTES
  // ============================================

  // Update strategy with versioning
  app.put('/api/strategies/:id', async (req: Request, res: Response) => {
    try {
      const strategyId = parseInt(req.params.id);
      const { strategy, change_reason } = req.body;
      strategy.id = strategyId;
      await lineraClient.updateStrategy(strategy, change_reason);
      io.to('strategies').emit('strategy:updated', { strategyId, strategy });
      res.json({ success: true, strategyId });
    } catch (error: any) {
      console.error('Error updating strategy:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get strategy versions
  app.get('/api/strategies/:id/versions', async (req: Request, res: Response) => {
    try {
      const strategyId = parseInt(req.params.id);
      const versions = await lineraClient.getStrategyVersions(strategyId);
      res.json(versions);
    } catch (error: any) {
      console.error('Error fetching strategy versions:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // PHASE 3: EXECUTION ENGINE ROUTES
  // ============================================

  // Create multi-hop order
  app.post('/api/orders/multi-hop', orderLimiter, async (req: Request, res: Response) => {
    try {
      const order = req.body;
      const orderId = await lineraClient.createMultiHopOrder(order);
      io.to('orders').emit('order:multi_hop_created', { orderId, order });
      res.json({ success: true, orderId });
    } catch (error: any) {
      console.error('Error creating multi-hop order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger conditional order
  app.post('/api/orders/:id/trigger', async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      await lineraClient.triggerConditionalOrder(orderId);
      io.to('orders').emit('order:conditional_triggered', { orderId });
      res.json({ success: true, orderId, message: 'Conditional order triggered' });
    } catch (error: any) {
      console.error('Error triggering conditional order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel conditional order
  app.delete('/api/orders/:id/cancel', async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      await lineraClient.cancelConditionalOrder(orderId);
      io.to('orders').emit('order:cancelled', { orderId });
      res.json({ success: true, orderId, message: 'Order cancelled' });
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // PHASE 4: PREDICTION MARKET ROUTES
  // ============================================

  // Create prediction market
  app.post('/api/markets', async (req: Request, res: Response) => {
    try {
      const market = req.body;
      const marketId = await lineraClient.createPredictionMarket(market);
      io.to('markets').emit('market:created', { marketId, market });
      res.json({ success: true, marketId });
    } catch (error: any) {
      console.error('Error creating prediction market:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get prediction markets
  app.get('/api/markets', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const markets = await lineraClient.getPredictionMarkets(limit, offset);
      res.json(markets);
    } catch (error: any) {
      console.error('Error fetching markets:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update market probability
  app.put('/api/markets/:id/probability', async (req: Request, res: Response) => {
    try {
      const marketId = parseInt(req.params.id);
      const { probability } = req.body;
      await lineraClient.updateMarketProbability(marketId, probability);
      io.to('markets').emit('market:probability_updated', { marketId, probability });
      res.json({ success: true, marketId, probability });
    } catch (error: any) {
      console.error('Error updating market probability:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Resolve prediction market
  app.post('/api/markets/:id/resolve', async (req: Request, res: Response) => {
    try {
      const marketId = parseInt(req.params.id);
      const { outcome } = req.body;
      await lineraClient.resolvePredictionMarket(marketId, outcome);
      io.to('markets').emit('market:resolved', { marketId, outcome });
      res.json({ success: true, marketId, outcome });
    } catch (error: any) {
      console.error('Error resolving market:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Link strategy to market
  app.post('/api/markets/:id/link-strategy', async (req: Request, res: Response) => {
    try {
      const marketId = parseInt(req.params.id);
      const { strategy_id, trigger_on_probability, trigger_above, enabled } = req.body;
      const link = {
        strategy_id,
        market_id: marketId,
        trigger_on_probability,
        trigger_above,
        enabled,
      };
      await lineraClient.linkStrategyToMarket(link);
      io.to('markets').emit('market:strategy_linked', link);
      res.json({ success: true, link });
    } catch (error: any) {
      console.error('Error linking strategy to market:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
