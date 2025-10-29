import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { resolve, join } from 'path';

// Load .env from project root
// When running from workspace, process.cwd() is the workspace dir, so go up one level
const rootPath = join(process.cwd(), '..');
dotenv.config({ path: join(rootPath, '.env') });

export interface RawTweet {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  url: string;
}

export interface TradingSignal {
  influencer: string;
  token: string;
  contract: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timestamp: number;
  tweetUrl: string;
}

export interface TokenMention {
  symbol: string;
  contract?: string;
}

export interface LLMResponse {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  tokens: TokenMention[];
}

export class AITweetParser {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private tokenRegistry: Map<string, string>;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.tokenRegistry = this.initializeTokenRegistry();
  }

  private initializeTokenRegistry(): Map<string, string> {
    // Common token contract addresses (Solana)
    const registry = new Map<string, string>();
    registry.set('SOL', 'So11111111111111111111111111111111111111112');
    registry.set('USDC', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    registry.set('USDT', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
    registry.set('BONK', 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
    registry.set('WIF', 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm');
    // Add more tokens as needed
    return registry;
  }

  async parseTweet(tweet: RawTweet): Promise<TradingSignal | null> {
    try {
      const startTime = Date.now();

      // Call LLM for sentiment analysis
      const llmResponse = await this.analyzeSentiment(tweet);

      // Check latency requirement (<3 seconds)
      const latency = Date.now() - startTime;
      if (latency > 3000) {
        console.warn(`LLM analysis took ${latency}ms, exceeding 3s requirement`);
      }

      // If no tokens found or neutral sentiment with low confidence, skip
      if (llmResponse.tokens.length === 0 || 
          (llmResponse.sentiment === 'neutral' && llmResponse.confidence < 0.7)) {
        return null;
      }

      // Take the first token mention
      const primaryToken = llmResponse.tokens[0];

      // Resolve contract address
      const contract = await this.resolveContract(primaryToken.symbol, primaryToken.contract);

      // Create trading signal
      const signal: TradingSignal = {
        influencer: tweet.author,
        token: primaryToken.symbol,
        contract: contract || 'UNKNOWN',
        sentiment: llmResponse.sentiment,
        confidence: llmResponse.confidence,
        timestamp: tweet.timestamp,
        tweetUrl: tweet.url,
      };

      // Log low-confidence signals
      if (signal.confidence < 0.7) {
        console.warn(`Low confidence signal (${signal.confidence}): ${tweet.text.substring(0, 50)}...`);
      }

      return signal;
    } catch (error) {
      console.error('Error parsing tweet:', error);
      return null;
    }
  }

  private async analyzeSentiment(tweet: RawTweet): Promise<LLMResponse> {
    const prompt = `You are a cryptocurrency trading signal analyzer. Analyze the following tweet and respond with ONLY valid JSON.

Tweet: "${tweet.text}"
Author: "${tweet.author}"

Extract:
1. Sentiment: bullish, bearish, or neutral
2. Confidence: 0.0 to 1.0 (how confident are you in this sentiment?)
3. Token mentions: list of cryptocurrency token symbols mentioned

Rules:
- Only identify sentiment if there's clear positive/negative indication about a specific token
- Confidence should reflect how explicit the sentiment is
- Extract all token symbols mentioned (e.g., BTC, ETH, SOL, BONK, etc.)
- If no clear sentiment or tokens, return neutral with low confidence

Respond with ONLY this JSON format (no other text):
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0.95,
  "tokens": [{"symbol": "SOL", "contract": ""}]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let responseText = response.text();

      // Clean up response - remove markdown code blocks if present
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsed = JSON.parse(responseText);

      // Validate and normalize response
      return {
        sentiment: this.normalizeSentiment(parsed.sentiment),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        tokens: Array.isArray(parsed.tokens) ? parsed.tokens : [],
      };
    } catch (error: any) {
      console.error('Gemini API error:', error.message);
      // Return neutral signal on error
      return {
        sentiment: 'neutral',
        confidence: 0,
        tokens: [],
      };
    }
  }

  private normalizeSentiment(sentiment: string): 'bullish' | 'bearish' | 'neutral' {
    const normalized = sentiment.toLowerCase();
    if (normalized.includes('bull')) return 'bullish';
    if (normalized.includes('bear')) return 'bearish';
    return 'neutral';
  }

  private async resolveContract(symbol: string, providedContract?: string): Promise<string | null> {
    // If contract provided in tweet, use it
    if (providedContract) {
      return providedContract;
    }

    // Check local registry
    const registryContract = this.tokenRegistry.get(symbol.toUpperCase());
    if (registryContract) {
      return registryContract;
    }

    // Could integrate with Jupiter API or other token registries here
    console.warn(`Contract address not found for token: ${symbol}`);
    return null;
  }

  async batchParseTweets(tweets: RawTweet[]): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    for (const tweet of tweets) {
      const signal = await this.parseTweet(tweet);
      if (signal) {
        signals.push(signal);
      }
    }

    return signals;
  }
}

// Export singleton instance
export const createAIParser = (apiKey?: string): AITweetParser => {
  const key = apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
  if (!key) {
    throw new Error('Gemini API key is required. Set GEMINI_API_KEY in .env file');
  }
  return new AITweetParser(key);
};
