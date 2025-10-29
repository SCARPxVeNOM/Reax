import { createClient, RedisClientType } from 'redis';

export class RedisClient {
  private client: RedisClientType;

  constructor(url: string) {
    this.client = createClient({ url });

    // Only log errors if we've attempted to connect
    let connectionAttempted = false;
    this.client.on('error', (err) => {
      if (connectionAttempted) {
        // Silent - errors are handled in connect()
      }
    });
    // Mark when connection is attempted
    const originalConnect = this.client.connect.bind(this.client);
    this.client.connect = async function() {
      connectionAttempted = true;
      return originalConnect();
    };
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('Redis connected');
    } catch (error: any) {
      // Don't spam - just throw once
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }

  // Check if Redis is available
  private async isAvailable(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (expirySeconds) {
      await this.client.setEx(key, expirySeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async cacheSignals(signals: any[]): Promise<void> {
    if (!(await this.isAvailable())) return;
    await this.set('signals:recent', JSON.stringify(signals), 60); // Cache for 1 minute
  }

  async getCachedSignals(): Promise<any[] | null> {
    if (!(await this.isAvailable())) return null;
    const cached = await this.get('signals:recent');
    return cached ? JSON.parse(cached) : null;
  }

  async cacheStrategies(owner: string, strategies: any[]): Promise<void> {
    if (!(await this.isAvailable())) return;
    await this.set(`strategies:${owner}`, JSON.stringify(strategies), 300); // Cache for 5 minutes
  }

  async getCachedStrategies(owner: string): Promise<any[] | null> {
    if (!(await this.isAvailable())) return null;
    const cached = await this.get(`strategies:${owner}`);
    return cached ? JSON.parse(cached) : null;
  }
}
