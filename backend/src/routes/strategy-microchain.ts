/**
 * Strategy Microchain Routes - Using Linera Blockchain Storage
 * Handles: Profiles, Strategies, Trades, Analytics
 */

import { Router } from 'express';
import { getLineraStorageService } from '../services/linera-storage';

const router = Router();
const storage = getLineraStorageService();

// ==================== MICROCHAIN PROFILES ====================

// POST /api/strategy-microchain/profile - Create microchain profile
router.post('/profile', async (req, res) => {
  try {
    const { name, wallet, chains, visibility } = req.body;

    if (!name || !wallet) {
      return res.status(400).json({ error: 'name and wallet are required' });
    }

    const profile = await storage.createProfile({
      name,
      wallet,
      chains: chains || ['linera'],
      visibility: visibility || 'public',
    });

    res.json({
      success: true,
      profile,
      message: storage.isConnected()
        ? 'Profile created on Linera blockchain'
        : 'Profile stored locally (Linera offline)',
    });
  } catch (error: any) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/strategy-microchain/profile/:walletOrId - Get profile
router.get('/profile/:walletOrId', async (req, res) => {
  try {
    const { walletOrId } = req.params;
    const profile = await storage.getProfile(walletOrId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/strategy-microchain/microchains - List all microchains
router.get('/microchains', async (req, res) => {
  try {
    const profiles = await storage.getAllProfiles();

    res.json({
      success: true,
      microchains: profiles,
      source: storage.isConnected() ? 'linera' : 'memory',
    });
  } catch (error: any) {
    console.error('Error getting microchains:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/strategy-microchain/microchains - Create microchain (alias for profile)
router.post('/microchains', async (req, res) => {
  try {
    const { userId, name, wallet } = req.body;

    const profile = await storage.createProfile({
      name: name || `User_${userId}`,
      wallet: wallet || userId,
      chains: ['linera'],
      visibility: 'public',
    });

    res.json({
      success: true,
      microchainId: profile.id,
    });
  } catch (error: any) {
    console.error('Error creating microchain:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== STRATEGIES ====================

// POST /api/strategy-microchain/create-and-publish - Create and publish strategy
router.post('/create-and-publish', async (req, res) => {
  try {
    const { userId, name, type, code, visualData, description, tags, riskLevel } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    // Get or create user profile
    let profile = await storage.getProfile(userId);
    if (!profile) {
      profile = await storage.createProfile({
        name: `User_${userId.substring(0, 8)}`,
        wallet: userId,
        chains: ['linera'],
        visibility: 'public',
      });
    }

    const strategy = await storage.publishStrategy({
      name,
      owner: profile.id,
      ownerName: profile.name,
      creationMethod: type || 'visual',
      code,
      rules: visualData,
      tags: tags || [],
      riskLevel: riskLevel || 'medium',
      visibility: 'public',
      description,
    });

    res.json({
      success: true,
      strategy,
      microchainId: profile.id,
      message: storage.isConnected()
        ? 'Strategy published to Linera blockchain'
        : 'Strategy stored locally (Linera offline)',
    });
  } catch (error: any) {
    console.error('Error creating and publishing strategy:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRADING ====================

// POST /api/strategy-microchain/:strategyId/execute-trade - Execute and record trade
router.post('/:strategyId/execute-trade', async (req, res) => {
  try {
    const { strategyId } = req.params;
    const {
      dex,
      inputToken,
      outputToken,
      amount,
      walletAddress,
    } = req.body;

    if (!dex || !inputToken || !outputToken || !amount) {
      return res.status(400).json({ error: 'Missing required trade parameters' });
    }

    // Get or create user microchain
    let profile = await storage.getProfile(walletAddress || 'demo_user');
    if (!profile) {
      profile = await storage.createProfile({
        name: 'Demo User',
        wallet: walletAddress || 'demo_user',
        chains: ['linera'],
        visibility: 'public',
      });
    }

    const trade = await storage.recordTrade({
      strategyId: strategyId !== 'manual' ? strategyId : undefined,
      microchainId: profile.id,
      dex: dex.toUpperCase() as 'JUPITER' | 'RAYDIUM' | 'BINANCE',
      inputToken,
      outputToken,
      inputAmount: amount,
      outputAmount: amount * (0.95 + Math.random() * 0.1), // Mock output
    });

    // Simulate trade execution
    setTimeout(async () => {
      const pnl = (Math.random() - 0.3) * 10; // Random PnL between -3% and +7%
      await storage.updateTradeStatus(trade.id, 'filled', `0x${Date.now().toString(16)}`, pnl);
    }, 2000);

    res.json({
      success: true,
      trade,
      message: storage.isConnected()
        ? 'Trade recorded on Linera blockchain'
        : 'Trade stored locally (Linera offline)',
    });
  } catch (error: any) {
    console.error('Error executing trade:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/strategy-microchain/trades - Get trades
router.get('/trades', async (req, res) => {
  try {
    const { microchainId, strategyId } = req.query;
    const trades = await storage.getTrades(
      microchainId as string | undefined,
      strategyId as string | undefined
    );

    res.json({
      success: true,
      trades,
    });
  } catch (error: any) {
    console.error('Error getting trades:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ANALYTICS ====================

// GET /api/strategy-microchain/analytics - Get network analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await storage.getNetworkAnalytics();

    res.json({
      success: true,
      analytics,
      source: storage.isConnected() ? 'linera' : 'memory',
    });
  } catch (error: any) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATUS ====================

// GET /api/strategy-microchain/status - Get connection status
router.get('/status', async (req, res) => {
  res.json({
    success: true,
    lineraConnected: storage.isConnected(),
    storageMode: storage.isConnected() ? 'blockchain' : 'memory',
    message: storage.isConnected()
      ? 'Connected to Linera blockchain'
      : 'Using in-memory storage (Linera offline)',
  });
});

export default router;
