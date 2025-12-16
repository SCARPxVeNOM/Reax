/**
 * Strategy API Routes
 */

import { Router } from 'express';
import { strategyRepository } from '../database/repositories/strategy-repository';
import { pineScriptService } from '../services/pinescript-service';

const router = Router();

// Create strategy
router.post('/', async (req, res) => {
  try {
    const { userId, name, type, code, visualData } = req.body;

    const strategy = await strategyRepository.create({
      userId,
      name,
      type,
      code,
      visualData,
      status: 'DRAFT',
      initialCapital: 10000,
    });

    res.json(strategy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user strategies
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const strategies = await strategyRepository.findByUserId(userId);
    res.json(strategies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get strategy by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const strategy = await strategyRepository.findById(id);
    
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json(strategy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update strategy
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const strategy = await strategyRepository.update(id, updates);
    
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json(strategy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete strategy
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await strategyRepository.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deploy strategy to Linera microchain
router.post('/:id/deploy', async (req, res) => {
  try {
    const { id } = req.params;
    const strategy = await strategyRepository.findById(id);
    
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    // Deploy to Linera microchain via GraphQL
    const lineraResponse = await fetch(process.env.LINERA_SERVICE_URL || 'http://localhost:8080', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation CreateStrategy($strategy: StrategyInput!) {
            executeOperation(
              applicationId: "${process.env.LINERA_APP_ID}",
              operation: {
                CreateStrategy: {
                  strategy: $strategy
                }
              }
            )
          }
        `,
        variables: {
          strategy: {
            id: parseInt(id),
            owner: strategy.userId,
            name: strategy.name,
            strategy_type: strategy.type === 'PINESCRIPT' ? { DSL: strategy.code } : { Form: strategy.visualData },
            active: true,
            created_at: Date.now() * 1000, // Convert to microseconds
          }
        }
      })
    });

    if (!lineraResponse.ok) {
      throw new Error('Failed to deploy to Linera microchain');
    }

    // Update strategy status
    const updatedStrategy = await strategyRepository.update(id, {
      status: 'ACTIVE',
      deployedAt: new Date(),
    });

    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('strategy:deployed', {
        strategyId: id,
        strategy: updatedStrategy,
        timestamp: Date.now(),
      });
    }

    res.json({ 
      success: true, 
      message: 'Strategy deployed to Linera microchain',
      strategy: updatedStrategy 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Backtest strategy
router.post('/:id/backtest', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, initialCapital } = req.body;

    const strategy = await strategyRepository.findById(id);
    
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    if (strategy.type !== 'PINESCRIPT' || !strategy.code) {
      return res.status(400).json({ error: 'Only PineScript strategies can be backtested' });
    }

    const compiled = pineScriptService.parseAndCompile(strategy.code);
    
    // TODO: Fetch historical data for the date range
    const mockContext = {
      open: [],
      high: [],
      low: [],
      close: [],
      volume: [],
      timestamp: [],
    };

    const results = pineScriptService.backtest(compiled, mockContext, initialCapital || 10000);

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active strategies for social trading
router.get('/marketplace/active', async (req, res) => {
  try {
    // Query Linera microchain for active strategies
    const lineraResponse = await fetch(process.env.LINERA_SERVICE_URL || 'http://localhost:8080', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetActiveStrategies {
            queryApplication(
              applicationId: "${process.env.LINERA_APP_ID}",
              query: {
                GetStrategies: {
                  owner: null,
                  limit: 100,
                  offset: 0
                }
              }
            )
          }
        `
      })
    });

    let lineraStrategies = [];
    if (lineraResponse.ok) {
      const data = await lineraResponse.json();
      const result = JSON.parse(data.data.queryApplication);
      lineraStrategies = result.Strategies || [];
    }

    // Also get from local database for additional metadata
    const dbStrategies = await strategyRepository.findAll();
    
    // Merge and enrich data
    const enrichedStrategies = lineraStrategies.map((lineraStrat: any) => {
      const dbStrat = dbStrategies.find((s: any) => s.id === lineraStrat.id.toString());
      return {
        ...lineraStrat,
        ...dbStrat,
        // Mock performance metrics (would come from actual execution data)
        performance: {
          totalReturn: Math.random() * 100 - 20,
          winRate: Math.random() * 100,
          sharpeRatio: Math.random() * 3,
          maxDrawdown: Math.random() * 30,
          totalTrades: Math.floor(Math.random() * 500),
          followers: Math.floor(Math.random() * 100),
        }
      };
    });

    res.json(enrichedStrategies);
  } catch (error: any) {
    console.error('Error fetching marketplace strategies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Follow a strategy
router.post('/:id/follow', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, allocationAmount, riskLimitPercent } = req.body;

    // Create follower record on Linera microchain
    const lineraResponse = await fetch(process.env.LINERA_SERVICE_URL || 'http://localhost:8080', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation FollowStrategy($strategyId: Int!, $allocation: Float!, $maxPosition: Float!, $autoFollow: Boolean!) {
            executeOperation(
              applicationId: "${process.env.LINERA_APP_ID}",
              operation: {
                FollowStrategy: {
                  strategy_id: $strategyId,
                  allocation_percentage: $allocation,
                  max_position_size: $maxPosition,
                  auto_follow: $autoFollow
                }
              }
            )
          }
        `,
        variables: {
          strategyId: parseInt(id),
          allocation: riskLimitPercent || 10.0,
          maxPosition: allocationAmount,
          autoFollow: true,
        }
      })
    });

    if (!lineraResponse.ok) {
      throw new Error('Failed to follow strategy on Linera microchain');
    }

    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('strategy:followed', {
        strategyId: id,
        userId,
        allocationAmount,
        riskLimitPercent,
        timestamp: Date.now(),
      });
    }

    res.json({ 
      success: true, 
      message: 'Successfully following strategy',
      followerId: userId,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unfollow a strategy
router.post('/:id/unfollow', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Remove follower record from Linera microchain
    const lineraResponse = await fetch(process.env.LINERA_SERVICE_URL || 'http://localhost:8080', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation UnfollowStrategy($strategyId: Int!) {
            executeOperation(
              applicationId: "${process.env.LINERA_APP_ID}",
              operation: {
                UnfollowStrategy: {
                  strategy_id: $strategyId
                }
              }
            )
          }
        `,
        variables: {
          strategyId: parseInt(id),
        }
      })
    });

    if (!lineraResponse.ok) {
      throw new Error('Failed to unfollow strategy on Linera microchain');
    }

    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('strategy:unfollowed', {
        strategyId: id,
        userId,
        timestamp: Date.now(),
      });
    }

    res.json({ 
      success: true, 
      message: 'Successfully unfollowed strategy',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
