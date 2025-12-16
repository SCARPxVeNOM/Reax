import axios from 'axios';
import crypto from 'crypto';
import WebSocket from 'ws';
import { Quote, QuoteParams, SwapParams, SwapResult, DEX } from '../models/dex';

interface BinanceOrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT';
  quantity?: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

interface BinanceOrder {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  fills: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
  }>;
}

export class BinanceService {
  private apiKey: string;
  private apiSecret: string;
  private apiUrl: string;
  private wsUrl: string;

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY || '';
    this.apiSecret = process.env.BINANCE_API_SECRET || '';
    this.apiUrl = process.env.BINANCE_API_URL || 'https://api.binance.com';
    this.wsUrl = 'wss://stream.binance.com:9443/ws';
  }

  /**
   * Generate HMAC SHA256 signature for Binance API
   */
  private generateSignature(params: any, timestamp: number): string {
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&') + `&timestamp=${timestamp}`;
    
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Get quote from Binance (price check)
   */
  async getQuote(params: QuoteParams): Promise<Quote> {
    try {
      // Convert mints to Binance symbol format (e.g., BTCUSDT)
      const symbol = this.convertToSymbol(params.inputMint, params.outputMint);
      
      // Get current price
      const priceResponse = await axios.get(
        `${this.apiUrl}/api/v3/ticker/price`,
        {
          params: { symbol }
        }
      );

      const price = parseFloat(priceResponse.data.price);
      const outputAmount = params.amount * price;
      
      // Binance trading fee is 0.1% for regular users
      const fee = outputAmount * 0.001;

      return {
        dex: DEX.BINANCE,
        inputAmount: params.amount,
        outputAmount: outputAmount - fee,
        priceImpact: 0, // Binance doesn't have price impact like AMMs
        fee,
        route: [symbol],
        minimumReceived: outputAmount - fee
      };
    } catch (error) {
      console.error('Binance getQuote error:', error);
      throw error;
    }
  }

  /**
   * Place order on Binance
   */
  async placeOrder(params: BinanceOrderParams): Promise<BinanceOrder> {
    try {
      const timestamp = Date.now();
      const orderParams: any = {
        symbol: params.symbol,
        side: params.side,
        type: params.type,
        ...params
      };

      // Remove undefined values
      Object.keys(orderParams).forEach(key => 
        orderParams[key] === undefined && delete orderParams[key]
      );

      const signature = this.generateSignature(orderParams, timestamp);

      const response = await axios.post<BinanceOrder>(
        `${this.apiUrl}/api/v3/order`,
        null,
        {
          params: {
            ...orderParams,
            timestamp,
            signature
          },
          headers: {
            'X-MBX-APIKEY': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Binance placeOrder error:', error);
      throw error;
    }
  }

  /**
   * Execute swap on Binance (place market order)
   */
  async executeSwap(params: SwapParams): Promise<SwapResult> {
    try {
      const symbol = params.quote.route[0];
      
      // Determine if we're buying or selling
      const side: 'BUY' | 'SELL' = 'BUY'; // Would need logic to determine

      const order = await this.placeOrder({
        symbol,
        side,
        type: 'MARKET',
        quantity: params.quote.inputAmount
      });

      // Calculate actual output from fills
      const actualOutput = order.fills.reduce((sum, fill) => {
        return sum + parseFloat(fill.qty) * parseFloat(fill.price);
      }, 0);

      const totalFee = order.fills.reduce((sum, fill) => {
        return sum + parseFloat(fill.commission);
      }, 0);

      return {
        signature: order.orderId.toString(),
        status: order.status === 'FILLED' ? 'confirmed' : 'pending',
        inputAmount: parseFloat(order.origQty),
        outputAmount: actualOutput,
        fee: totalFee
      };
    } catch (error) {
      console.error('Binance executeSwap error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time price updates via WebSocket
   */
  subscribeToPrice(symbol: string, callback: (price: number) => void): WebSocket {
    const ws = new WebSocket(`${this.wsUrl}/${symbol.toLowerCase()}@trade`);

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const trade = JSON.parse(data.toString());
        callback(parseFloat(trade.p));
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return ws;
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<any> {
    try {
      const timestamp = Date.now();
      const signature = this.generateSignature({}, timestamp);

      const response = await axios.get(
        `${this.apiUrl}/api/v3/account`,
        {
          params: {
            timestamp,
            signature
          },
          headers: {
            'X-MBX-APIKEY': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Binance getAccount error:', error);
      throw error;
    }
  }

  /**
   * Convert token mints to Binance symbol format
   */
  private convertToSymbol(inputMint: string, outputMint: string): string {
    // This is a simplified conversion
    // In production, you'd need a proper mapping of token addresses to symbols
    return 'BTCUSDT'; // Default for testing
  }

  /**
   * Get order status
   */
  async getOrderStatus(symbol: string, orderId: number): Promise<any> {
    try {
      const timestamp = Date.now();
      const params = { symbol, orderId };
      const signature = this.generateSignature(params, timestamp);

      const response = await axios.get(
        `${this.apiUrl}/api/v3/order`,
        {
          params: {
            ...params,
            timestamp,
            signature
          },
          headers: {
            'X-MBX-APIKEY': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Binance getOrderStatus error:', error);
      throw error;
    }
  }
}
