/**
 * Strategy Microchain Routes
 * Handles the complete flow: Strategy → Social → Microchain → Trading → Analytics
 */

import { Router } from 'express';
import { StrategyMicrochainService } from '../services/strategy-microchain-service';
import { LineraClient } from '../linera-client';
import { DEXRouter } from '../services/dex-router';

const router = Router();

// Initialize services (would be injected via dependency injection in production)
const lineraClient = new LineraClient(
  process.env.LINERA_RPC_URL || 'http://localhost:8080',
  process.env.LINERA_APP_ID
);
const dexRouter = new DEXRouter();
const strategyMicrochainService = new StrategyMicrochainService(
  lineraClient,
  dexRouter
);

/**
 * POST /api/strategy-microchain/create-and-publish
 * Create a strategy and publish it to the social feed
 */
router.post('/create-and-publish', async (req, res) => {
  try {
    const { userId, name, type, code, visualData, description } = req.body;

    if (!userId || !name || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await strategyMicrochainService.createAndPublishStrategy({
      userId,
      name,
      type,
      code,
      visualData,
      description,
    });

    res.json({
      success: true,
      ...result,
      message: 'Strategy created and published to social feed',
    });
  } catch (error: any) {
    console.error('Error creating and publishing strategy:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/strategy-microchain/:strategyId/deploy
 * Deploy a strategy to a microchain (creates account on microchain)
 */
router.post('/:strategyId/deploy', async (req, res) => {
  try {
    const { strategyId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await strategyMicrochainService.deployStrategyToMicrochain(
      strategyId,
      userId
    );

    res.json({
      success: true,
      ...result,
      message: 'Strategy deployed to microchain and account created',
    });
  } catch (error: any) {
    console.error('Error deploying strategy:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/strategy-microchain/:strategyId/execute-trade
 * Execute a trade on the trading page and record it on the microchain
 */
router.post('/:strategyId/execute-trade', async (req, res) => {
  try {
    const { strategyId } = req.params;
    const {
      dex,
      inputToken,
      outputToken,
      amount,
      slippageBps,
      priorityFee,
      walletAddress,
    } = req.body;

    if (!dex || !inputToken || !outputToken || !amount || !walletAddress) {
      return res.status(400).json({ error: 'Missing required trade parameters' });
    }

    const result = await strategyMicrochainService.executeTradeOnMicrochain(
      strategyId,
      {
        dex,
        inputToken,
        outputToken,
        amount,
        slippageBps: slippageBps || 50,
        priorityFee,
        walletAddress,
      }
    );

    res.json({
      success: true,
      trade: result,
      message: 'Trade executed and recorded on microchain',
    });
  } catch (error: any) {
    console.error('Error executing trade:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/strategy-microchain/analytics
 * Get analytics aggregated from multiple microchains
 */
router.get('/analytics', async (req, res) => {
  try {
    const { strategyId, microchainId, timeframe } = req.query;

    const analytics = await strategyMicrochainService.getMicrochainAnalytics(
      strategyId as string | undefined,
      microchainId as string | undefined,
      (timeframe as '1H' | '24H' | '7D' | '30D') || '24H'
    );

    res.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

