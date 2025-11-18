"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAIParser = exports.AITweetParser = void 0;
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
// Load .env from project root
// When running from workspace, process.cwd() is the workspace dir, so go up one level
const rootPath = (0, path_1.join)(process.cwd(), '..');
dotenv_1.default.config({ path: (0, path_1.join)(rootPath, '.env') });
class AITweetParser {
    constructor(apiKey) {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        this.tokenRegistry = this.initializeTokenRegistry();
    }
    initializeTokenRegistry() {
        // Common token contract addresses (Solana)
        const registry = new Map();
        registry.set('SOL', 'So11111111111111111111111111111111111111112');
        registry.set('USDC', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        registry.set('USDT', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
        registry.set('BONK', 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
        registry.set('WIF', 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm');
        // Add more tokens as needed
        return registry;
    }
    async parseTweet(tweet, imageUrl) {
        try {
            const startTime = Date.now();
            // Fast-path heuristic: handle very explicit tweets without calling LLM
            const textLower = tweet.text.toLowerCase();
            const bullishHints = ['buy', 'buying', 'long', 'moon', 'pump', 'bull'];
            const bearishHints = ['sell', 'selling', 'short', 'dump', 'bear'];
            const mentionedTokens = [];
            for (const symbol of this.tokenRegistry.keys()) {
                if (textLower.includes(symbol.toLowerCase())) {
                    mentionedTokens.push(symbol);
                }
            }
            const hasBullish = bullishHints.some((w) => textLower.includes(w));
            const hasBearish = bearishHints.some((w) => textLower.includes(w));
            // Extract price levels from text (SL, TP, Entry)
            const priceExtraction = this.extractPriceLevels(tweet.text);
            if (mentionedTokens.length > 0 && (hasBullish || hasBearish)) {
                const primary = mentionedTokens[0];
                const contract = await this.resolveContract(primary);
                const signal = {
                    influencer: tweet.author,
                    token: primary,
                    contract: contract || 'UNKNOWN',
                    sentiment: hasBullish ? 'bullish' : 'bearish',
                    confidence: 0.9,
                    timestamp: tweet.timestamp,
                    tweetUrl: tweet.url,
                    entry_price: priceExtraction.entry,
                    stop_loss: priceExtraction.stopLoss,
                    take_profit: priceExtraction.takeProfit,
                    position_size: priceExtraction.positionSize,
                    leverage: priceExtraction.leverage,
                };
                return signal;
            }
            // Call LLM for sentiment analysis and price extraction
            const llmResponse = await this.analyzeSentiment(tweet, imageUrl);
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
            // Merge LLM-extracted prices with text-extracted prices
            const finalPrices = {
                entry: llmResponse.entry || priceExtraction.entry,
                stopLoss: llmResponse.stopLoss || priceExtraction.stopLoss,
                takeProfit: llmResponse.takeProfit || priceExtraction.takeProfit,
                positionSize: llmResponse.positionSize || priceExtraction.positionSize,
                leverage: llmResponse.leverage || priceExtraction.leverage,
            };
            // Create trading signal
            const signal = {
                influencer: tweet.author,
                token: primaryToken.symbol,
                contract: contract || 'UNKNOWN',
                sentiment: llmResponse.sentiment,
                confidence: llmResponse.confidence,
                timestamp: tweet.timestamp,
                tweetUrl: tweet.url,
                entry_price: finalPrices.entry,
                stop_loss: finalPrices.stopLoss,
                take_profit: finalPrices.takeProfit,
                position_size: finalPrices.positionSize,
                leverage: finalPrices.leverage,
            };
            // Log low-confidence signals
            if (signal.confidence < 0.7) {
                console.warn(`Low confidence signal (${signal.confidence}): ${tweet.text.substring(0, 50)}...`);
            }
            return signal;
        }
        catch (error) {
            console.error('Error parsing tweet:', error);
            return null;
        }
    }
    /**
     * Extract price levels from tweet text using regex patterns
     */
    extractPriceLevels(text) {
        const result = {};
        // Patterns for common price mentions
        // SL: 318.3, Stop Loss: 318, SL=318
        const slPatterns = [
            /SL[:\s=]+(\d+\.?\d*)/i,
            /stop\s+loss[:\s=]+(\d+\.?\d*)/i,
            /sl[:\s=]+(\d+\.?\d*)/i,
        ];
        for (const pattern of slPatterns) {
            const match = text.match(pattern);
            if (match) {
                result.stopLoss = parseFloat(match[1]);
                break;
            }
        }
        // TP: 350, Take Profit: 350, TP=350
        const tpPatterns = [
            /TP[:\s=]+(\d+\.?\d*)/i,
            /take\s+profit[:\s=]+(\d+\.?\d*)/i,
            /tp[:\s=]+(\d+\.?\d*)/i,
        ];
        for (const pattern of tpPatterns) {
            const match = text.match(pattern);
            if (match) {
                result.takeProfit = parseFloat(match[1]);
                break;
            }
        }
        // Entry: 330, Entry: 330, Entry=330
        const entryPatterns = [
            /entry[:\s=]+(\d+\.?\d*)/i,
            /buy[:\s]+at[:\s]+(\d+\.?\d*)/i,
            /long[:\s]+(\d+\.?\d*)/i,
        ];
        for (const pattern of entryPatterns) {
            const match = text.match(pattern);
            if (match) {
                result.entry = parseFloat(match[1]);
                break;
            }
        }
        // Position size: $50, 50 USDT, size: 50
        const sizePatterns = [
            /\$(\d+\.?\d*)/,
            /(\d+\.?\d*)\s*(usdt|usd)/i,
            /size[:\s=]+(\d+\.?\d*)/i,
        ];
        for (const pattern of sizePatterns) {
            const match = text.match(pattern);
            if (match) {
                result.positionSize = parseFloat(match[1]);
                break;
            }
        }
        // Leverage: 11X, 11x, leverage: 11
        const leveragePatterns = [
            /(\d+)x/i,
            /leverage[:\s=]+(\d+)/i,
        ];
        for (const pattern of leveragePatterns) {
            const match = text.match(pattern);
            if (match) {
                result.leverage = parseInt(match[1]);
                break;
            }
        }
        return result;
    }
    async analyzeSentiment(tweet, imageUrl) {
        let prompt = `You are a cryptocurrency trading signal analyzer. Analyze the following tweet and respond with ONLY valid JSON.

Tweet: "${tweet.text}"
Author: "${tweet.author}"`;
        // Use vision model if image is provided
        const model = imageUrl
            ? this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' })
            : this.model;
        if (imageUrl) {
            prompt += `\n\nImage URL: ${imageUrl}`;
        }
        prompt += `\n\nExtract:
1. Sentiment: bullish, bearish, or neutral
2. Confidence: 0.0 to 1.0 (how confident are you in this sentiment?)
3. Token mentions: list of cryptocurrency token symbols mentioned
4. Entry price: if mentioned (e.g., "entry 330", "buy at 330")
5. Stop Loss: if mentioned (e.g., "SL: 318.3", "stop loss 318")
6. Take Profit: if mentioned (e.g., "TP: 350", "target 350")
7. Position size: if mentioned (e.g., "$50", "50 USDT")
8. Leverage: if mentioned (e.g., "11X", "leverage 11")

Rules:
- Only identify sentiment if there's clear positive/negative indication about a specific token
- Confidence should reflect how explicit the sentiment is
- Extract all token symbols mentioned (e.g., BTC, ETH, SOL, BONK, TAO, etc.)
- Extract numeric values for prices, sizes, and leverage if explicitly mentioned
- If analyzing an image, look for trading charts, position cards, or price levels
- If no clear sentiment or tokens, return neutral with low confidence

Respond with ONLY this JSON format (no other text):
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0.95,
  "tokens": [{"symbol": "SOL", "contract": ""}],
  "entry": 330.0,
  "stopLoss": 318.3,
  "takeProfit": 350.0,
  "positionSize": 50.0,
  "leverage": 11
}`;
        try {
            const result = await model.generateContent(prompt);
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
                entry: parsed.entry ? parseFloat(parsed.entry) : undefined,
                stopLoss: parsed.stopLoss ? parseFloat(parsed.stopLoss) : undefined,
                takeProfit: parsed.takeProfit ? parseFloat(parsed.takeProfit) : undefined,
                positionSize: parsed.positionSize ? parseFloat(parsed.positionSize) : undefined,
                leverage: parsed.leverage ? parseInt(parsed.leverage) : undefined,
            };
        }
        catch (error) {
            console.error('Gemini API error:', error.message);
            // Return neutral signal on error
            return {
                sentiment: 'neutral',
                confidence: 0,
                tokens: [],
            };
        }
    }
    normalizeSentiment(sentiment) {
        const normalized = sentiment.toLowerCase();
        if (normalized.includes('bull'))
            return 'bullish';
        if (normalized.includes('bear'))
            return 'bearish';
        return 'neutral';
    }
    async resolveContract(symbol, providedContract) {
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
    async batchParseTweets(tweets) {
        const signals = [];
        for (const tweet of tweets) {
            const signal = await this.parseTweet(tweet);
            if (signal) {
                signals.push(signal);
            }
        }
        return signals;
    }
}
exports.AITweetParser = AITweetParser;
// Export singleton instance
const createAIParser = (apiKey) => {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
    if (!key) {
        throw new Error('Gemini API key is required. Set GEMINI_API_KEY in .env file');
    }
    return new AITweetParser(key);
};
exports.createAIParser = createAIParser;
