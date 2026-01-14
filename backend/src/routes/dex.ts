/**
 * DEX API Routes
 */

import { Router } from 'express';
import { dexRouter } from '../services/dex-router';

const router = Router();

// Get quote from specific DEX
router.post('/quote', async (req, res) => {
  try {
    const { dex, inputToken, outputToken, amount, slippageBps } = req.body;

    let quote;
    switch (dex) {
      case 'RAYDIUM':
        quote = await dexRouter.raydiumService.getSwapQuote(
          inputToken,
          outputToken,
          amount,
          slippageBps
        );
        break;
      case 'JUPITER':
        quote = await dexRouter.jupiterService.getQuote(
          inputToken,
          outputToken,
          amount,
          slippageBps
        );
        break;
      case 'BINANCE':
        quote = await dexRouter.binanceService.getQuote(
          inputToken,
          outputToken,
          amount
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid DEX' });
    }

    res.json(quote);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Compare quotes from all DEXes
router.post('/compare', async (req, res) => {
  try {
    const { inputToken, outputToken, amount, slippageBps } = req.body;

    const bestQuote = await dexRouter.getBestQuote({
      inputMint: inputToken,
      outputMint: outputToken,
      amount,
      slippageBps,
      dexes: [DEX.RAYDIUM, DEX.JUPITER, DEX.BINANCE],
    });

    res.json({
      bestDex: bestQuote.dex,
      quote: bestQuote,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Execute swap
router.post('/swap', async (req, res) => {
  try {
    const { dex, inputToken, outputToken, amount, slippageBps, priorityFee } = req.body;

    const result = await dexRouter.executeSwap(
      dex,
      inputToken,
      outputToken,
      amount,
      slippageBps,
      priorityFee
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get priority fees
router.get('/priority-fees', async (req, res) => {
  try {
    const fees = await dexRouter.raydiumService.getPriorityFees();
    res.json(fees);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
