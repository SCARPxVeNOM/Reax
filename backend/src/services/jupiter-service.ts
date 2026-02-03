import axios from 'axios';
import { VersionedTransaction } from '@solana/web3.js';
import { Quote, QuoteParams, SwapParams, SwapResult, DEX } from '../models/dex';

interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: null | any;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot?: number;
  timeTaken?: number;
}

interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}

export class JupiterService {
  private apiUrl: string;
  private ultraApiUrl: string;
  private apiKey: string;

  constructor() {
    // Basic API (legacy v6)
    this.apiUrl = process.env.JUPITER_API_URL || 'https://api.jup.ag';
    // Ultra API (new, dynamic rate limiting)
    this.ultraApiUrl = process.env.JUPITER_ULTRA_API_URL || 'https://api.jup.ag/ultra';
    this.apiKey = process.env.JUPITER_API_KEY || '';
  }

  /**
   * Get headers with API key (required for both Basic and Ultra plans)
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }
    return headers;
  }

  /**
   * Get swap quote from Jupiter
   */
  async getQuote(params: QuoteParams): Promise<Quote> {
    try {
      const response = await axios.get<JupiterQuoteResponse>(
        `${this.apiUrl}/quote`,
        {
          params: {
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            amount: params.amount,
            slippageBps: params.slippageBps,
            onlyDirectRoutes: false,
            asLegacyTransaction: false
          },
          headers: this.getHeaders()
        }
      );

      const data = response.data;

      // Extract route information
      const route = data.routePlan.map(plan => plan.swapInfo.label);

      // Calculate total fees
      const totalFee = data.routePlan.reduce((sum, plan) => {
        return sum + parseFloat(plan.swapInfo.feeAmount);
      }, 0);

      return {
        dex: DEX.JUPITER,
        inputAmount: parseFloat(data.inAmount),
        outputAmount: parseFloat(data.outAmount),
        priceImpact: parseFloat(data.priceImpactPct),
        fee: totalFee,
        route,
        minimumReceived: parseFloat(data.otherAmountThreshold)
      };
    } catch (error) {
      console.error('Jupiter getQuote error:', error);
      throw error;
    }
  }

  /**
   * Get swap transaction from Jupiter
   */
  async getSwapTransaction(
    quote: JupiterQuoteResponse,
    userPublicKey: string,
    wrapAndUnwrapSol: boolean = true
  ): Promise<VersionedTransaction> {
    try {
      const response = await axios.post<JupiterSwapResponse>(
        `${this.apiUrl}/swap`,
        {
          quoteResponse: quote,
          userPublicKey,
          wrapAndUnwrapSol,
          computeUnitPriceMicroLamports: 'auto',
          dynamicComputeUnitLimit: true
        },
        {
          headers: this.apiKey ? {
            'X-API-KEY': this.apiKey
          } : {}
        }
      );

      const txBuf = Buffer.from(response.data.swapTransaction, 'base64');
      return VersionedTransaction.deserialize(txBuf);
    } catch (error) {
      console.error('Jupiter getSwapTransaction error:', error);
      throw error;
    }
  }

  /**
   * Execute swap on Jupiter
   */
  async executeSwap(params: SwapParams): Promise<SwapResult> {
    try {
      // Get fresh quote
      const quoteParams: QuoteParams = {
        inputMint: params.quote.route[0] || '',
        outputMint: params.quote.route[params.quote.route.length - 1] || '',
        amount: params.quote.inputAmount,
        slippageBps: 50,
        dexes: [DEX.JUPITER]
      };

      const quoteResponse = await axios.get<JupiterQuoteResponse>(
        `${this.apiUrl}/quote`,
        {
          params: {
            inputMint: quoteParams.inputMint,
            outputMint: quoteParams.outputMint,
            amount: quoteParams.amount,
            slippageBps: quoteParams.slippageBps
          },
          headers: this.apiKey ? {
            'X-API-KEY': this.apiKey
          } : {}
        }
      );

      // Get transaction
      const transaction = await this.getSwapTransaction(
        quoteResponse.data,
        params.walletAddress,
        true
      );

      // Note: Transaction needs to be signed by client wallet
      return {
        signature: 'pending',
        status: 'pending',
        inputAmount: params.quote.inputAmount,
        outputAmount: params.quote.outputAmount,
        fee: params.quote.fee
      };
    } catch (error) {
      console.error('Jupiter executeSwap error:', error);
      throw error;
    }
  }

  /**
   * Get price for a token
   */
  async getPrice(tokenMint: string): Promise<number> {
    try {
      const response = await axios.get(
        `https://price.jup.ag/v4/price`,
        {
          params: {
            ids: tokenMint
          }
        }
      );

      return response.data.data[tokenMint]?.price || 0;
    } catch (error) {
      console.error('Jupiter getPrice error:', error);
      return 0;
    }
  }

  /**
   * Get multiple token prices
   */
  async getPrices(tokenMints: string[]): Promise<Record<string, number>> {
    try {
      const response = await axios.get(
        `https://price.jup.ag/v4/price`,
        {
          params: {
            ids: tokenMints.join(',')
          }
        }
      );

      const prices: Record<string, number> = {};
      for (const mint of tokenMints) {
        prices[mint] = response.data.data[mint]?.price || 0;
      }

      return prices;
    } catch (error) {
      console.error('Jupiter getPrices error:', error);
      return {};
    }
  }

  // ==================== ULTRA API METHODS ====================

  /**
   * Ultra API: Get swap order (transaction)
   * POST /ultra/v1/order
   */
  async getUltraOrder(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    taker: string; // wallet address
    slippageBps?: number;
  }): Promise<{ transaction: string; requestId: string }> {
    try {
      const response = await axios.post(
        `${this.ultraApiUrl}/v1/order`,
        {
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          amount: params.amount.toString(),
          taker: params.taker,
          slippageBps: params.slippageBps || 50,
        },
        { headers: this.getHeaders() }
      );

      return {
        transaction: response.data.transaction,
        requestId: response.data.requestId,
      };
    } catch (error) {
      console.error('Jupiter Ultra getOrder error:', error);
      throw error;
    }
  }

  /**
   * Ultra API: Execute signed transaction
   * POST /ultra/v1/execute
   */
  async executeUltraOrder(params: {
    signedTransaction: string;
    requestId: string;
  }): Promise<{ signature: string; status: string }> {
    try {
      const response = await axios.post(
        `${this.ultraApiUrl}/v1/execute`,
        {
          signedTransaction: params.signedTransaction,
          requestId: params.requestId,
        },
        { headers: this.getHeaders() }
      );

      return {
        signature: response.data.signature,
        status: response.data.status,
      };
    } catch (error) {
      console.error('Jupiter Ultra execute error:', error);
      throw error;
    }
  }

  /**
   * Ultra API: Get token holdings for wallet
   * GET /ultra/v1/holdings
   */
  async getHoldings(walletAddress: string): Promise<Array<{
    mint: string;
    amount: string;
    decimals: number;
    uiAmount: number;
  }>> {
    try {
      const response = await axios.get(
        `${this.ultraApiUrl}/v1/holdings`,
        {
          params: { wallet: walletAddress },
          headers: this.getHeaders(),
        }
      );

      return response.data.holdings || [];
    } catch (error) {
      console.error('Jupiter Ultra getHoldings error:', error);
      return [];
    }
  }

  /**
   * Ultra API: Check token security (shield)
   * GET /ultra/v1/shield
   */
  async checkTokenSecurity(mints: string[]): Promise<Record<string, {
    isVerified: boolean;
    warnings: string[];
    isFreezeAuthority: boolean;
    isMintAuthority: boolean;
  }>> {
    try {
      const response = await axios.get(
        `${this.ultraApiUrl}/v1/shield`,
        {
          params: { mints: mints.join(',') },
          headers: this.getHeaders(),
        }
      );

      return response.data.tokens || {};
    } catch (error) {
      console.error('Jupiter Ultra shield error:', error);
      return {};
    }
  }

  /**
   * Ultra API: Search tokens
   * GET /ultra/v1/search
   */
  async searchTokens(query: string): Promise<Array<{
    mint: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  }>> {
    try {
      const response = await axios.get(
        `${this.ultraApiUrl}/v1/search`,
        {
          params: { query },
          headers: this.getHeaders(),
        }
      );

      // API returns array directly
      return Array.isArray(response.data) ? response.data : (response.data.tokens || []);
    } catch (error) {
      console.error('Jupiter Ultra search error:', error);
      return [];
    }
  }
}
