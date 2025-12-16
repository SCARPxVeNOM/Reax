/**
 * PineScript API Routes
 */

import { Router } from 'express';
import { pineScriptService } from '../services/pinescript-service';

const router = Router();

// Compile PineScript code
router.post('/compile', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const result = pineScriptService.compile(code);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Validate PineScript code
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const result = pineScriptService.validate(code);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
