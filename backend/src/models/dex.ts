export enum DEX {
  RAYDIUM = 'raydium',
  JUPITER = 'jupiter',
  BINANCE = 'binance'
}

export interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
  dexes: DEX[];
}

export interface Quote {
  dex: DEX;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
  route: string[];
  estimatedGas?: number;
  minimumReceived: number;
}

export interface SwapParams {
  quote: Quote;
  walletAddress: string;
  priorityFee?: number;
}

export interface SwapResult {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  inputAmount: number;
  outputAmount: number;
  fee: number;
}
