/**
 * Raydium Service - Integrates with Raydium API
 * 
 * NOTE: This service uses the Raydium Transaction API directly.
 * The @raydium-io/raydium-sdk-v2 package is not yet published to npm.
 * 
 * API Documentation: https://docs.raydium.io/raydium/trading/trade-api
 */

import axios from 'axios';
import { Connection, VersionedTransaction, Transaction, Keypair, PublicKey } from '@solana/web3.js';
import { Quote, QuoteParams, SwapParams, SwapResult } from '../models/dex';
import { DEX } from '../models/dex';

interface RaydiumSwapCompute {
  id: string;
  success: boolean;
  data: {
    swapType: string;
    inputMint: string;
    inputAmount: string;
    outputMint: string;
    outputAmount: string;
    otherAmountThreshold: string;
    slippageBps: number;
    priceImpactPct: number;
    routePlan: any[];
  };
}

interface RaydiumPriorityFee {
  id: string;
  success: boolean;
  data: {
    default: {
      vh: number;
      h: number;
      m: number;
    };
  };
}

export class RaydiumService {
  private apiUrl: string;
  private priorityFeeUrl: string;
  private connection: Connection;

  constructor() {
    this.apiUrl = process.env.RAYDIUM_API_URL || 'https://transaction-v1.raydium.io';
    this.priorityFeeUrl = process.env.RAYDIUM_PRIORITY_FEE_URL || 'https://api-v3.raydium.io/main/auto-fee';
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  }

  /**
   * Get swap quote from Raydium
   */
  async getQuote(params: QuoteParams): Promise<Quote> {
    try {
      const response = await axios.get<RaydiumSwapCompute>(
        `${this.apiUrl}/compute/swap-base-in`,
        {
          params: {
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            amount: params.amount,
            slippageBps: params.slippageBps,
            txVersion: 'V0'
          }
        }
      );

      if (!response.data.success) {
        throw new Error('Failed to get Raydium quote');
      }

      const data = response.data.data;
      const route = data.routePlan.map((r: any) => r.poolId || 'direct');

      return {
        dex: DEX.RAYDIUM,
        inputAmount: parseFloat(data.inputAmount),
        outputAmount: parseFloat(data.outputAmount),
        priceImpact: data.priceImpactPct,
        fee: 0.0025 * parseFloat(data.inputAmount), // 0.25% fee estimate
        route,
        minimumReceived: parseFloat(data.otherAmountThreshold)
      };
    } catch (error) {
      console.error('Raydium getQuote error:', error);
      throw error;
    }
  }

  /**
   * Get priority fee recommendations
   */
  async getPriorityFee(): Promise<RaydiumPriorityFee> {
    try {
      const response = await axios.get<RaydiumPriorityFee>(this.priorityFeeUrl);
      return response.data;
    } catch (error) {
      console.error('Failed to get priority fee:', error);
      // Return default values if API fails
      return {
        id: 'default',
        success: true,
        data: {
          default: {
            vh: 100000,
            h: 50000,
            m: 10000
          }
        }
      };
    }
  }

  /**
   * Get swap transaction from Raydium
   */
  async getSwapTransaction(
    swapResponse: RaydiumSwapCompute,
    walletAddress: string,
    priorityFee?: number
  ): Promise<VersionedTransaction> {
    try {
      const priorityFeeData = await this.getPriorityFee();
      const computeUnitPrice = priorityFee || priorityFeeData.data.default.h;

      // Check if input/output is SOL
      const NATIVE_SOL = 'So11111111111111111111111111111111111111112';
      const isInputSol = swapResponse.data.inputMint === NATIVE_SOL;
      const isOutputSol = swapResponse.data.outputMint === NATIVE_SOL;

      const response = await axios.post<{
        id: string;
        version: string;
        success: boolean;
        data: { transaction: string }[];
      }>(`${this.apiUrl}/transaction/swap-base-in`, {
        computeUnitPriceMicroLamports: String(computeUnitPrice),
        swapResponse: swapResponse.data,
        txVersion: 'V0',
        wallet: walletAddress,
        wrapSol: isInputSol,
        unwrapSol: isOutputSol,
        inputAccount: isInputSol ? undefined : undefined, // Would need actual token account
        outputAccount: isOutputSol ? undefined : undefined
      });

      if (!response.data.success || response.data.data.length === 0) {
        throw new Error('Failed to get swap transaction');
      }

      const txBuf = Buffer.from(response.data.data[0].transaction, 'base64');
      return VersionedTransaction.deserialize(txBuf);
    } catch (error) {
      console.error('Raydium getSwapTransaction error:', error);
      throw error;
    }
  }

  /**
   * Execute swap on Raydium
   */
  async executeSwap(params: SwapParams): Promise<SwapResult> {
    try {
      // First get the quote again to ensure fresh data
      const quoteParams: QuoteParams = {
        inputMint: params.quote.route[0] || '',
        outputMint: params.quote.route[params.quote.route.length - 1] || '',
        amount: params.quote.inputAmount,
        slippageBps: 50, // Default 0.5% slippage
        dexes: [DEX.RAYDIUM]
      };

      // Get fresh swap compute
      const swapCompute = await axios.get<RaydiumSwapCompute>(
        `${this.apiUrl}/compute/swap-base-in`,
        {
          params: {
            inputMint: quoteParams.inputMint,
            outputMint: quoteParams.outputMint,
            amount: quoteParams.amount,
            slippageBps: quoteParams.slippageBps,
            txVersion: 'V0'
          }
        }
      );

      // Get transaction
      const transaction = await this.getSwapTransaction(
        swapCompute.data,
        params.walletAddress,
        params.priorityFee
      );

      // Note: In production, the transaction would be signed by the client wallet
      // and sent back to be executed. For now, we return pending status.
      
      return {
        signature: 'pending', // Would be actual signature after client signs
        status: 'pending',
        inputAmount: params.quote.inputAmount,
        outputAmount: params.quote.outputAmount,
        fee: params.quote.fee
      };
    } catch (error) {
      console.error('Raydium executeSwap error:', error);
      throw error;
    }
  }

  /**
   * Confirm transaction on Solana
   */
  async confirmTransaction(signature: string): Promise<boolean> {
    try {
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash({
        commitment: 'finalized'
      });

      await this.connection.confirmTransaction(
        {
          blockhash,
          lastValidBlockHeight,
          signature
        },
        'confirmed'
      );

      return true;
    } catch (error) {
      console.error('Transaction confirmation error:', error);
      return false;
    }
  }
}
