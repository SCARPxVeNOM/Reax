/**
 * Strategies Routes - Using Linera Blockchain Storage
 */

import { Router } from 'express';
import { getLineraStorageService } from '../services/linera-storage';

const router = Router();
const storage = getLineraStorageService();

// GET /api/strategies - Get all public strategies
router.get('/', async (req, res) => {
  try {
    const strategies = await storage.getPublicStrategies();
    res.json({
      success: true,
      strategies,
      source: storage.isConnected() ? 'linera' : 'memory',
    });
  } catch (error: any) {
    console.error('Error fetching strategies:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/strategies/:id - Get a specific strategy
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const strategy = await storage.getStrategy(id);

    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json({
      success: true,
      strategy,
    });
  } catch (error: any) {
    console.error('Error fetching strategy:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/strategies - Create/publish a new strategy
router.post('/', async (req, res) => {
  try {
    const {
      name,
      owner,
      ownerName,
      creationMethod,
      code,
      rules,
      tags,
      riskLevel,
      visibility,
      description,
    } = req.body;

    if (!name || !owner) {
      return res.status(400).json({ error: 'name and owner are required' });
    }

    const strategy = await storage.publishStrategy({
      name,
      owner,
      ownerName: ownerName || owner.substring(0, 8) + '...',
      creationMethod: creationMethod || 'visual',
      code,
      rules,
      tags: tags || [],
      riskLevel: riskLevel || 'medium',
      visibility: visibility || 'public',
      description,
    });

    res.json({
      success: true,
      strategy,
      message: storage.isConnected()
        ? 'Strategy published to Linera blockchain'
        : 'Strategy stored locally (Linera offline)',
    });
  } catch (error: any) {
    console.error('Error creating strategy:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/strategies/:id/follow - Follow a strategy
router.post('/:id/follow', async (req, res) => {
  try {
    const { id } = req.params;
    const { followerId } = req.body;

    if (!followerId) {
      return res.status(400).json({ error: 'followerId is required' });
    }

    await storage.followStrategy(followerId, id);

    res.json({
      success: true,
      message: 'Now following strategy',
    });
  } catch (error: any) {
    console.error('Error following strategy:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/strategies/:id/unfollow - Unfollow a strategy
router.post('/:id/unfollow', async (req, res) => {
  try {
    const { id } = req.params;
    const { followerId } = req.body;

    if (!followerId) {
      return res.status(400).json({ error: 'followerId is required' });
    }

    await storage.unfollowStrategy(followerId, id);

    res.json({
      success: true,
      message: 'Unfollowed strategy',
    });
  } catch (error: any) {
    console.error('Error unfollowing strategy:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/strategies/:id/followers - Get strategy followers
router.get('/:id/followers', async (req, res) => {
  try {
    const { id } = req.params;
    const followers = await storage.getFollowers(id);

    res.json({
      success: true,
      followers,
      count: followers.length,
    });
  } catch (error: any) {
    console.error('Error getting followers:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
