import { DEX, Quote, QuoteParams, SwapParams, SwapResult } from '../models/dex';
import { RaydiumService } from './raydium-service';
import { JupiterService } from './jupiter-service';
import { BinanceService } from './binance-service';

export class DEXRouter {
  private raydiumService: RaydiumService;
  private jupiterService: JupiterService;
  private binanceService: BinanceService;

  constructor() {
    this.raydiumService = new RaydiumService();
    this.jupiterService = new JupiterService();
    this.binanceService = new BinanceService();
  }

  /**
   * Get quotes from multiple DEXes in parallel
   */
  async getQuote(params: QuoteParams): Promise<Quote[]> {
    const promises: Promise<Quote | null>[] = [];

    // Fetch quotes from selected DEXes
    if (params.dexes.includes(DEX.RAYDIUM)) {
      promises.push(
        this.raydiumService.getQuote(params).catch(err => {
          console.error('Raydium quote error:', err);
          return null;
        })
      );
    }

    if (params.dexes.includes(DEX.JUPITER)) {
      promises.push(
        this.jupiterService.getQuote(params).catch(err => {
          console.error('Jupiter quote error:', err);
          return null;
        })
      );
    }

    if (params.dexes.includes(DEX.BINANCE)) {
      promises.push(
        this.binanceService.getQuote(params).catch(err => {
          console.error('Binance quote error:', err);
          return null;
        })
      );
    }

    const results = await Promise.all(promises);
    return results.filter((quote): quote is Quote => quote !== null);
  }

  /**
   * Compare quotes and select the best one based on net output after fees
   */
  compareRoutes(quotes: Quote[]): Quote {
    if (quotes.length === 0) {
      throw new Error('No quotes available');
    }

    // Calculate net output (output amount - fees)
    const quotesWithNet = quotes.map(quote => ({
      quote,
      netOutput: quote.outputAmount - quote.fee
    }));

    // Sort by net output descending
    quotesWithNet.sort((a, b) => b.netOutput - a.netOutput);

    return quotesWithNet[0].quote;
  }

  /**
   * Execute swap on the selected DEX
   */
  async executeSwap(params: SwapParams): Promise<SwapResult> {
    const { quote } = params;

    switch (quote.dex) {
      case DEX.RAYDIUM:
        return this.raydiumService.executeSwap(params);
      
      case DEX.JUPITER:
        return this.jupiterService.executeSwap(params);
      
      case DEX.BINANCE:
        return this.binanceService.executeSwap(params);
      
      default:
        throw new Error(`Unsupported DEX: ${quote.dex}`);
    }
  }

  /**
   * Get the best quote from all available DEXes
   */
  async getBestQuote(params: QuoteParams): Promise<Quote> {
    const quotes = await this.getQuote(params);
    return this.compareRoutes(quotes);
  }
}
