import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

dotenv.config();

interface IngestionConfig {
  influencers: string[];
  pollInterval: number;
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterBearerToken: string;
  backendUrl: string;
}

interface RawTweet {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  url: string;
}

class TweetIngestionService {
  private config: IngestionConfig;
  private twitterClient: TwitterApi;
  private seenTweetIds: Set<string>;
  private isRunning: boolean;

  constructor(config: IngestionConfig) {
    this.config = config;
    this.twitterClient = new TwitterApi(config.twitterBearerToken);
    this.seenTweetIds = new Set();
    this.isRunning = false;
  }

  async start() {
    console.log('Starting Tweet Ingestion Service...');
    console.log(`Monitoring influencers: ${this.config.influencers.join(', ')}`);
    
    this.isRunning = true;
    await this.monitorInfluencers();
  }

  stop() {
    console.log('Stopping Tweet Ingestion Service...');
    this.isRunning = false;
  }

  private async monitorInfluencers() {
    while (this.isRunning) {
      try {
        for (const influencer of this.config.influencers) {
          await this.fetchRecentTweets(influencer);
        }
        
        // Wait for poll interval
        await this.sleep(this.config.pollInterval);
      } catch (error) {
        console.error('Error monitoring influencers:', error);
        // Exponential backoff on error
        await this.sleep(Math.min(this.config.pollInterval * 2, 60000));
      }
    }
  }

  private async fetchRecentTweets(username: string) {
    try {
      // Get user by username
      const user = await this.twitterClient.v2.userByUsername(username);
      
      if (!user.data) {
        console.warn(`User not found: ${username}`);
        return;
      }

      // Get recent tweets
      const tweets = await this.twitterClient.v2.userTimeline(user.data.id, {
        max_results: 10,
        'tweet.fields': ['created_at', 'author_id'],
      });

      for (const tweet of tweets.data.data || []) {
        // Skip if already seen
        if (this.seenTweetIds.has(tweet.id)) {
          continue;
        }

        // Mark as seen
        this.seenTweetIds.add(tweet.id);

        // Create raw tweet object
        const rawTweet: RawTweet = {
          id: tweet.id,
          author: username,
          text: tweet.text,
          timestamp: new Date(tweet.created_at || Date.now()).getTime(),
          url: `https://twitter.com/${username}/status/${tweet.id}`,
        };

        // Log captured tweet
        console.log(`[${new Date().toISOString()}] Captured tweet from @${username}: ${tweet.text.substring(0, 50)}...`);

        // Stream to backend for AI processing
        await this.streamToBackend(rawTweet);
      }
    } catch (error: any) {
      if (error.code === 429) {
        console.warn('Rate limit hit, backing off...');
        await this.sleep(60000); // Wait 1 minute
      } else {
        console.error(`Error fetching tweets for ${username}:`, error.message);
      }
    }
  }

  private async streamToBackend(tweet: RawTweet) {
    try {
      const response = await axios.post(
        `${this.config.backendUrl}/api/tweets/process`,
        tweet,
        {
          timeout: 2000, // 2 second timeout for streaming
        }
      );

      console.log(`Tweet ${tweet.id} sent to backend for processing`);
    } catch (error: any) {
      console.error(`Failed to stream tweet ${tweet.id}:`, error.message);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize and start service
const config: IngestionConfig = {
  influencers: (process.env.INFLUENCERS || 'elonmusk,VitalikButerin').split(','),
  pollInterval: parseInt(process.env.POLL_INTERVAL || '30000'), // 30 seconds
  twitterApiKey: process.env.TWITTER_API_KEY || '',
  twitterApiSecret: process.env.TWITTER_API_SECRET || '',
  twitterBearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
};

const service = new TweetIngestionService(config);

// Handle graceful shutdown
process.on('SIGINT', () => {
  service.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  service.stop();
  process.exit(0);
});

// Start service
service.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
