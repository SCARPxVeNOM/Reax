// Test script for @Anubhav06_2004
// Run from ingestion directory: npm run test:user

import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import { resolve, join } from 'path';

// Load .env from project root
const rootPath = join(process.cwd(), '..');
dotenv.config({ path: join(rootPath, '.env') });

const username = 'Anubhav06_2004';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

async function testUserTweets() {
  console.log(`\n🔍 Testing Twitter API for @${username}...\n`);

  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    console.error('❌ TWITTER_BEARER_TOKEN not found in .env file');
    process.exit(1);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log('✅ API credentials found');
  console.log(`📡 Using Free Tier API (1 request per 15 minutes)\n`);

  try {
    const twitterClient = new TwitterApi(bearerToken);

    console.log(`Step 1: Looking up user @${username}...`);
    const user = await twitterClient.v2.userByUsername(username);
    
    if (!user.data) {
      console.error(`❌ User @${username} not found`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user.data.name} (@${user.data.username})`);
    console.log(`   User ID: ${user.data.id}\n`);

    console.log('Step 2: Fetching recent tweets...');
    const tweets = await twitterClient.v2.userTimeline(user.data.id, {
      max_results: 5,
      'tweet.fields': ['created_at', 'author_id', 'attachments', 'text'],
      expansions: ['attachments.media_keys'],
      'media.fields': ['url', 'preview_image_url', 'type'],
    });

    if (!tweets.data.data || tweets.data.data.length === 0) {
      console.log('⚠️  No recent tweets found');
      process.exit(0);
    }

    console.log(`✅ Found ${tweets.data.data.length} recent tweet(s)\n`);

    for (let i = 0; i < tweets.data.data.length; i++) {
      const tweet = tweets.data.data[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Tweet ${i + 1}/${tweets.data.data.length}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📅 ${new Date(tweet.created_at || Date.now()).toLocaleString()}`);
      console.log(`🔗 https://twitter.com/${username}/status/${tweet.id}`);
      console.log(`\n📝 ${tweet.text}\n`);

      let imageUrl: string | undefined;
      if (tweet.attachments?.media_keys && tweets.includes?.media) {
        const mediaKey = tweet.attachments.media_keys[0];
        const media = tweets.includes.media.find((m: any) => m.media_key === mediaKey);
        if (media && (media.type === 'photo' || media.type === 'video')) {
          imageUrl = media.url || media.preview_image_url;
          console.log(`🖼️  Image: ${imageUrl}`);
        }
      }

      console.log('\n🤖 Sending to backend for AI analysis...');
      const rawTweet = {
        id: tweet.id,
        author: username,
        text: tweet.text,
        timestamp: new Date(tweet.created_at || Date.now()).getTime(),
        url: `https://twitter.com/${username}/status/${tweet.id}`,
        image_url: imageUrl,
      };

      try {
        const response = await axios.post(
          `${backendUrl}/api/tweets/process`,
          rawTweet,
          { timeout: 15000 }
        );

        if (response.data.processed && response.data.signal) {
          console.log('\n✅ Trading Signal Detected!');
          const signal = response.data.signal;
          console.log(`   Token: ${signal.token}`);
          console.log(`   Sentiment: ${signal.sentiment}`);
          console.log(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
          if (signal.entry_price) console.log(`   Entry: $${signal.entry_price}`);
          if (signal.stop_loss) console.log(`   Stop Loss: $${signal.stop_loss}`);
          if (signal.take_profit) console.log(`   Take Profit: $${signal.take_profit}`);
          if (signal.position_size) console.log(`   Position Size: $${signal.position_size}`);
          if (signal.leverage) console.log(`   Leverage: ${signal.leverage}X`);
          console.log(`   Signal ID: ${response.data.signalId}`);
          if (response.data.autoOrdered) {
            console.log(`   📊 Auto-order: Order ID ${response.data.orderId}`);
          }
        } else {
          console.log(`\nℹ️  No signal: ${response.data.reason || 'Low confidence'}`);
        }
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`⚠️  Backend not running at ${backendUrl}`);
          console.log('   Start backend: npm run dev:backend');
        } else {
          console.log(`⚠️  Error: ${error.message}`);
        }
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Test completed!');
    console.log(`\n⚠️  Free tier: 1 request per 15 minutes\n`);

  } catch (error: any) {
    if (error.code === 429) {
      console.error('\n❌ Rate limit exceeded!');
      console.error('   Wait 15 minutes before trying again');
    } else if (error.code === 401) {
      console.error('\n❌ Auth failed! Check TWITTER_BEARER_TOKEN');
    } else {
      console.error('\n❌ Error:', error.message);
    }
    process.exit(1);
  }
}

testUserTweets();

