/**
 * DEX API Routes
 * Integrated with Jupiter Ultra API, Raydium, and Binance
 */

import { Router } from 'express';
import { dexRouter } from '../services/dex-router';
import { DEX } from '../models/dex';

const router = Router();

// Get quote from specific DEX
router.post('/quote', async (req, res) => {
  try {
    const { dex, inputToken, outputToken, amount, slippageBps } = req.body;

    if (!inputToken || !outputToken || !amount) {
      return res.status(400).json({ error: 'inputToken, outputToken, and amount are required' });
    }

    let quote;
    switch (dex) {
      case 'RAYDIUM':
        quote = await dexRouter.raydiumService.getQuote({
          inputMint: inputToken,
          outputMint: outputToken,
          amount,
          slippageBps: slippageBps || 50,
          dexes: [DEX.RAYDIUM],
        });
        break;
      case 'JUPITER':
        quote = await dexRouter.jupiterService.getQuote({
          inputMint: inputToken,
          outputMint: outputToken,
          amount,
          slippageBps: slippageBps || 50,
          dexes: [DEX.JUPITER],
        });
        break;
      case 'BINANCE':
        quote = await dexRouter.binanceService.getQuote({
          inputMint: inputToken,
          outputMint: outputToken,
          amount,
          slippageBps: slippageBps || 50,
          dexes: [DEX.BINANCE],
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid DEX. Use RAYDIUM, JUPITER, or BINANCE' });
    }

    res.json({ success: true, quote, dex });
  } catch (error: any) {
    console.error('DEX quote error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Compare quotes from all DEXes
router.post('/compare', async (req, res) => {
  try {
    const { inputToken, outputToken, amount, slippageBps } = req.body;

    if (!inputToken || !outputToken || !amount) {
      return res.status(400).json({ error: 'inputToken, outputToken, and amount are required' });
    }

    const bestQuote = await dexRouter.getBestQuote({
      inputMint: inputToken,
      outputMint: outputToken,
      amount,
      slippageBps: slippageBps || 50,
      dexes: [DEX.RAYDIUM, DEX.JUPITER, DEX.BINANCE],
    });

    res.json({
      success: true,
      bestDex: bestQuote.dex,
      quote: bestQuote,
    });
  } catch (error: any) {
    console.error('DEX compare error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute swap
router.post('/swap', async (req, res) => {
  try {
    const { dex, quote, walletAddress, priorityFee } = req.body;

    if (!quote || !walletAddress) {
      return res.status(400).json({ error: 'quote and walletAddress are required' });
    }

    const result = await dexRouter.executeSwap({
      quote,
      walletAddress,
      priorityFee,
    });

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('DEX swap error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get priority fees (Raydium)
router.get('/priority-fees', async (req, res) => {
  try {
    const fees = await dexRouter.raydiumService.getPriorityFee();
    res.json({ success: true, fees });
  } catch (error: any) {
    console.error('Priority fees error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== JUPITER ULTRA API ENDPOINTS ====================

// Jupiter Ultra: Get swap order (transaction)
router.post('/jupiter/order', async (req, res) => {
  try {
    const { inputMint, outputMint, amount, taker, slippageBps } = req.body;

    if (!inputMint || !outputMint || !amount || !taker) {
      return res.status(400).json({
        error: 'inputMint, outputMint, amount, and taker (wallet address) are required'
      });
    }

    const order = await dexRouter.jupiterService.getUltraOrder({
      inputMint,
      outputMint,
      amount: parseFloat(amount),
      taker,
      slippageBps: slippageBps || 50,
    });

    res.json({ success: true, ...order });
  } catch (error: any) {
    console.error('Jupiter Ultra order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Jupiter Ultra: Execute signed transaction
router.post('/jupiter/execute', async (req, res) => {
  try {
    const { signedTransaction, requestId } = req.body;

    if (!signedTransaction || !requestId) {
      return res.status(400).json({ error: 'signedTransaction and requestId are required' });
    }

    const result = await dexRouter.jupiterService.executeUltraOrder({
      signedTransaction,
      requestId,
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Jupiter Ultra execute error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Jupiter Ultra: Get token holdings for wallet
router.get('/jupiter/holdings/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      return res.status(400).json({ error: 'wallet address is required' });
    }

    const holdings = await dexRouter.jupiterService.getHoldings(wallet);
    res.json({ success: true, wallet, holdings });
  } catch (error: any) {
    console.error('Jupiter Ultra holdings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Jupiter Ultra: Check token security (shield)
router.post('/jupiter/shield', async (req, res) => {
  try {
    const { mints } = req.body;

    if (!mints || !Array.isArray(mints) || mints.length === 0) {
      return res.status(400).json({ error: 'mints array is required' });
    }

    const security = await dexRouter.jupiterService.checkTokenSecurity(mints);
    res.json({ success: true, tokens: security });
  } catch (error: any) {
    console.error('Jupiter Ultra shield error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Jupiter Ultra: Search tokens
router.get('/jupiter/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    const tokens = await dexRouter.jupiterService.searchTokens(query);
    res.json({ success: true, query, tokens });
  } catch (error: any) {
    console.error('Jupiter Ultra search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Jupiter: Get token prices
router.post('/jupiter/prices', async (req, res) => {
  try {
    const { mints } = req.body;

    if (!mints || !Array.isArray(mints) || mints.length === 0) {
      return res.status(400).json({ error: 'mints array is required' });
    }

    const prices = await dexRouter.jupiterService.getPrices(mints);
    res.json({ success: true, prices });
  } catch (error: any) {
    console.error('Jupiter prices error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Jupiter: Get single token price
router.get('/jupiter/price/:mint', async (req, res) => {
  try {
    const { mint } = req.params;

    if (!mint) {
      return res.status(400).json({ error: 'mint address is required' });
    }

    const price = await dexRouter.jupiterService.getPrice(mint);
    res.json({ success: true, mint, price });
  } catch (error: any) {
    console.error('Jupiter price error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== RAYDIUM SPECIFIC ENDPOINTS ====================

// Raydium: Get quote with exact output (swap-base-out)
router.post('/raydium/quote-base-out', async (req, res) => {
  try {
    const { inputMint, outputMint, outputAmount, slippageBps } = req.body;

    if (!inputMint || !outputMint || !outputAmount) {
      return res.status(400).json({
        error: 'inputMint, outputMint, and outputAmount are required'
      });
    }

    const quote = await dexRouter.raydiumService.getQuoteBaseOut({
      inputMint,
      outputMint,
      amount: outputAmount, // The desired output amount
      slippageBps: slippageBps || 50,
      dexes: [DEX.RAYDIUM],
    });

    res.json({ success: true, quote });
  } catch (error: any) {
    console.error('Raydium quote-base-out error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Raydium: Get priority fee recommendations
router.get('/raydium/priority-fees', async (req, res) => {
  try {
    const fees = await dexRouter.raydiumService.getPriorityFee();
    res.json({
      success: true,
      fees: fees.data.default,
      description: {
        vh: 'Very High - fastest confirmation',
        h: 'High - fast confirmation',
        m: 'Medium - normal confirmation'
      }
    });
  } catch (error: any) {
    console.error('Raydium priority fees error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Raydium: Get quote with exact input (swap-base-in)
router.post('/raydium/quote', async (req, res) => {
  try {
    const { inputMint, outputMint, inputAmount, slippageBps } = req.body;

    if (!inputMint || !outputMint || !inputAmount) {
      return res.status(400).json({
        error: 'inputMint, outputMint, and inputAmount are required'
      });
    }

    const quote = await dexRouter.raydiumService.getQuote({
      inputMint,
      outputMint,
      amount: inputAmount,
      slippageBps: slippageBps || 50,
      dexes: [DEX.RAYDIUM],
    });

    res.json({ success: true, quote });
  } catch (error: any) {
    console.error('Raydium quote error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
