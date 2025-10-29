import { createClient, RedisClientType } from 'redis';

export class RedisClient {
  private client: RedisClientType;

  constructor(url: string) {
    this.client = createClient({ url });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    console.log('Redis connected');
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
    await this.set('signals:recent', JSON.stringify(signals), 60); // Cache for 1 minute
  }

  async getCachedSignals(): Promise<any[] | null> {
    const cached = await this.get('signals:recent');
    return cached ? JSON.parse(cached) : null;
  }

  async cacheStrategies(owner: string, strategies: any[]): Promise<void> {
    await this.set(`strategies:${owner}`, JSON.stringify(strategies), 300); // Cache for 5 minutes
  }

  async getCachedStrategies(owner: string): Promise<any[] | null> {
    const cached = await this.get(`strategies:${owner}`);
    return cached ? JSON.parse(cached) : null;
  }
}
