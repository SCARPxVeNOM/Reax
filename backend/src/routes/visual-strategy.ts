/**
 * Visual Strategy API Routes
 */

import { Router } from 'express';
import { StrategyCodeGenerator } from '../strategy-builder/code-generator';
import { StrategyValidator } from '../strategy-builder/validator';

const router = Router();

// Generate code from visual strategy
router.post('/generate', async (req, res) => {
  try {
    const visualData = req.body;

    const code = StrategyCodeGenerator.generatePineScript(visualData);
    
    res.json({ code });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Validate visual strategy
router.post('/validate', async (req, res) => {
  try {
    const visualData = req.body;

    const result = StrategyValidator.validateStrategy(visualData);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
