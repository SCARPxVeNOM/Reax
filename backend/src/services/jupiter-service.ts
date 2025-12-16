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
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6';
    this.apiKey = process.env.JUPITER_API_KEY || '';
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
          headers: this.apiKey ? {
            'X-API-KEY': this.apiKey
          } : {}
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
}
