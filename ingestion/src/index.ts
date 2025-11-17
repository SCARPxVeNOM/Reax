import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

dotenv.config();

interface IngestionConfig {
  influencers: string[];
  pollInterval: number; // Minimum interval between requests (in ms)
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterBearerToken: string;
  backendUrl: string;
  freeTier: boolean; // Free tier has 1 request per 15 minutes
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
  private lastRequestTime: Map<string, number>; // Track last request time per user
  private requestQueue: Array<{ username: string; priority: number }>;
  private readonly FREE_TIER_INTERVAL = 15 * 60 * 1000; // 15 minutes in ms
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(config: IngestionConfig) {
    this.config = config;
    this.twitterClient = new TwitterApi(config.twitterBearerToken);
    this.seenTweetIds = new Set();
    this.isRunning = false;
    this.lastRequestTime = new Map();
    this.requestQueue = [];
  }

  // Fetch monitored users from backend API
  private async fetchMonitoredUsers(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.config.backendUrl}/api/monitored-users?active=true`);
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((user: any) => user.username);
      }
    } catch (error) {
      console.warn('⚠️  Failed to fetch monitored users from API, using config fallback:', error);
    }
    // Fallback to config influencers
    return this.config.influencers;
  }

  async start() {
    console.log('Starting Tweet Ingestion Service...');
    
    // Fetch monitored users from database/API
    const monitoredUsers = await this.fetchMonitoredUsers();
    console.log(`Monitoring influencers: ${monitoredUsers.join(', ')}`);
    
    if (this.config.freeTier) {
      console.log('⚠️  FREE TIER MODE: 1 request per 15 minutes per user');
      console.log(`   Polling interval: ${this.config.pollInterval / 1000} seconds`);
      console.log(`   Will process ${monitoredUsers.length} users sequentially`);
      console.log(`   Estimated time per cycle: ${(monitoredUsers.length * 15)} minutes`);
    }
    
    this.isRunning = true;
    
    // Initialize queue with monitored users
    this.requestQueue = monitoredUsers.map((username, index) => ({
      username,
      priority: index,
    }));

    // Refresh user list every 5 minutes
    this.refreshInterval = setInterval(async () => {
      const updatedUsers = await this.fetchMonitoredUsers();
      const currentUsernames = new Set(this.requestQueue.map(u => u.username));
      const newUsernames = updatedUsers.filter(u => !currentUsernames.has(u));
      
      if (newUsernames.length > 0) {
        console.log(`🔄 Adding new monitored users: ${newUsernames.join(', ')}`);
        newUsernames.forEach((username, index) => {
          this.requestQueue.push({ username, priority: this.requestQueue.length + index });
        });
      }
      
      // Remove users that are no longer active
      const activeUsernames = new Set(updatedUsers);
      this.requestQueue = this.requestQueue.filter(u => activeUsernames.has(u.username));
    }, 5 * 60 * 1000); // 5 minutes
    
    // Fetch latest tweets immediately for the first user (free tier: will wait if needed)
    console.log('\n🚀 Fetching latest tweets immediately...');
    if (this.config.freeTier && this.requestQueue.length > 0) {
      const firstUser = this.requestQueue[0];
      await this.fetchRecentTweets(firstUser.username);
      this.lastRequestTime.set(firstUser.username, Date.now());
      // Rotate queue
      this.requestQueue.push(this.requestQueue.shift()!);
    } else {
      // Paid tier: fetch all immediately
      for (const influencer of this.config.influencers) {
        await this.fetchRecentTweets(influencer);
        await this.sleep(1000); // Small delay between users
      }
    }
    
    // Start continuous monitoring
    await this.monitorInfluencers();
  }

  stop() {
    console.log('Stopping Tweet Ingestion Service...');
    this.isRunning = false;
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private async monitorInfluencers() {
    while (this.isRunning) {
      try {
        if (this.config.freeTier) {
          // Free tier: Process one user at a time with 15-minute intervals
          await this.processNextUserInQueue();
        } else {
          // Paid tier: Process all users in parallel
          // Refresh user list before processing
          const currentUsers = await this.fetchMonitoredUsers();
          for (const influencer of currentUsers) {
            await this.fetchRecentTweets(influencer);
          }
          await this.sleep(this.config.pollInterval);
        }
      } catch (error) {
        console.error('Error monitoring influencers:', error);
        await this.sleep(Math.min(this.config.pollInterval * 2, 60000));
      }
    }
  }

  private async processNextUserInQueue() {
    if (this.requestQueue.length === 0) {
      // Reset queue from monitored users
      const currentUsers = await this.fetchMonitoredUsers();
      this.requestQueue = currentUsers.map((username, index) => ({
        username,
        priority: index,
      }));
    }

    const next = this.requestQueue.shift();
    if (!next) return;

    const username = next.username;
    const lastRequest = this.lastRequestTime.get(username) || 0;
    const timeSinceLastRequest = Date.now() - lastRequest;

    // Free tier: Must wait 15 minutes between requests for same user
    if (timeSinceLastRequest < this.FREE_TIER_INTERVAL) {
      const waitTime = this.FREE_TIER_INTERVAL - timeSinceLastRequest;
      console.log(`⏳ Waiting ${Math.ceil(waitTime / 1000 / 60)} minutes before checking @${username} (free tier limit)`);
      await this.sleep(waitTime);
    }

    console.log(`\n📡 Fetching tweets from @${username}...`);
    await this.fetchRecentTweets(username);
    this.lastRequestTime.set(username, Date.now());

    // Move to end of queue
    this.requestQueue.push(next);

    // Small delay before next user (even if 15 min passed, add buffer)
    await this.sleep(1000); // 1 second buffer
  }

  private async fetchRecentTweets(username: string) {
    try {
      // Get user by username
      const user = await this.twitterClient.v2.userByUsername(username);
      
      if (!user.data) {
        console.warn(`User not found: ${username}`);
        return;
      }

      // Get recent tweets with media attachments
      const tweets = await this.twitterClient.v2.userTimeline(user.data.id, {
        max_results: 10,
        'tweet.fields': ['created_at', 'author_id', 'attachments'],
        expansions: ['attachments.media_keys'],
        'media.fields': ['url', 'preview_image_url', 'type'],
      });

      if (!tweets.data.data || tweets.data.data.length === 0) {
        console.log(`ℹ️  No new tweets from @${username}`);
        return;
      }

      let newTweetsCount = 0;

      for (const tweet of tweets.data.data || []) {
        // Skip if already seen
        if (this.seenTweetIds.has(tweet.id)) {
          continue;
        }

        // Mark as seen
        this.seenTweetIds.add(tweet.id);
        newTweetsCount++;

        // Extract image URL if available
        let imageUrl: string | undefined;
        if (tweet.attachments?.media_keys && tweets.includes?.media) {
          const mediaKey = tweet.attachments.media_keys[0];
          const media = tweets.includes.media.find((m: any) => m.media_key === mediaKey);
          if (media && (media.type === 'photo' || media.type === 'video')) {
            imageUrl = media.url || media.preview_image_url;
          }
        }

        // Create raw tweet object
        const rawTweet: RawTweet = {
          id: tweet.id,
          author: username,
          text: tweet.text,
          timestamp: new Date(tweet.created_at || Date.now()).getTime(),
          url: `https://twitter.com/${username}/status/${tweet.id}`,
        };

        // Log captured tweet
        console.log(`[${new Date().toISOString()}] 📱 Captured tweet from @${username}: ${tweet.text.substring(0, 50)}...${imageUrl ? ' (with image)' : ''}`);

        // Stream to backend for AI processing (include image if available)
        await this.streamToBackend(rawTweet, imageUrl);
      }

      if (newTweetsCount > 0) {
        console.log(`✅ Processed ${newTweetsCount} new tweet(s) from @${username}`);
      }

    } catch (error: any) {
      if (error.code === 429) {
        const resetTime = error.rateLimit?.reset ? new Date(error.rateLimit.reset * 1000) : null;
        const waitTime = resetTime ? Math.max(0, resetTime.getTime() - Date.now()) : this.FREE_TIER_INTERVAL;
        
        console.warn(`\n⚠️  Rate limit hit for @${username}!`);
        console.warn(`   Waiting ${Math.ceil(waitTime / 1000 / 60)} minutes before retry...`);
        console.warn(`   Free tier: 1 request per 15 minutes`);
        
        await this.sleep(waitTime);
      } else {
        console.error(`Error fetching tweets for ${username}:`, error.message);
        // Don't exit, just log and continue
      }
    }
  }

  private async streamToBackend(tweet: RawTweet, imageUrl?: string) {
    try {
      const response = await axios.post(
        `${this.config.backendUrl}/api/tweets/process`,
        {
          ...tweet,
          image_url: imageUrl,
        },
        {
          timeout: 10000, // 10 second timeout for AI processing
        }
      );

      if (response.data.processed && response.data.signal) {
        console.log(`✅ Buy signal detected! Signal ID: ${response.data.signalId}`);
        if (response.data.orderId) {
          console.log(`📊 Order created automatically! Order ID: ${response.data.orderId}`);
        }
      } else {
        console.log(`ℹ️  Tweet ${tweet.id} processed (no trading signal)`);
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.warn(`⚠️  Backend not available at ${this.config.backendUrl}`);
        console.warn(`   Tweet captured but not processed. Start backend to process.`);
      } else {
        console.error(`❌ Failed to stream tweet ${tweet.id}:`, error.message);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize and start service
// Monitor @Anubhav06_2004 for trading signals
const config: IngestionConfig = {
  influencers: (process.env.INFLUENCERS || 'Anubhav06_2004').split(',').map(u => u.trim()),
  pollInterval: parseInt(process.env.POLL_INTERVAL || '30000'), // 30 seconds (not used in free tier mode)
  twitterApiKey: process.env.TWITTER_API_KEY || '',
  twitterApiSecret: process.env.TWITTER_API_SECRET || '',
  twitterBearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
  freeTier: process.env.TWITTER_API_TIER !== 'paid', // Default to free tier
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
