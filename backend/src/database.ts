import { Pool, PoolClient } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class DatabaseClient {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool(config);
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await this.initializeSchema(client);
      client.release();
      console.log('Database connected and schema initialized');
    } catch (error: any) {
      // Don't spam errors - just throw once
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  // Check if database is available
  private async isAvailable(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  private async initializeSchema(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS signals (
        id BIGSERIAL PRIMARY KEY,
        influencer VARCHAR(255) NOT NULL,
        token VARCHAR(50) NOT NULL,
        contract VARCHAR(255),
        sentiment VARCHAR(20) NOT NULL,
        confidence DECIMAL(3,2) NOT NULL,
        timestamp BIGINT NOT NULL,
        tweet_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS strategies (
        id BIGSERIAL PRIMARY KEY,
        owner VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        strategy_type VARCHAR(20) NOT NULL,
        parameters JSONB,
        dsl_code TEXT,
        active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id BIGSERIAL PRIMARY KEY,
        strategy_id BIGINT REFERENCES strategies(id),
        signal_id BIGINT REFERENCES signals(id),
        order_type VARCHAR(10) NOT NULL,
        token VARCHAR(50) NOT NULL,
        quantity DECIMAL(20,8) NOT NULL,
        status VARCHAR(20) NOT NULL,
        tx_hash VARCHAR(255),
        fill_price DECIMAL(20,8),
        created_at TIMESTAMP DEFAULT NOW(),
        filled_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS performance_snapshots (
        id BIGSERIAL PRIMARY KEY,
        strategy_id BIGINT REFERENCES strategies(id),
        total_trades INT NOT NULL,
        win_rate DECIMAL(5,2),
        total_pnl DECIMAL(20,8),
        max_drawdown DECIMAL(5,2),
        sharpe_ratio DECIMAL(5,2),
        snapshot_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_strategy ON orders(strategy_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `);
  }

  async cacheSignal(signal: any): Promise<void> {
    if (!(await this.isAvailable())) return;
    await this.pool.query(
      `INSERT INTO signals (influencer, token, contract, sentiment, confidence, timestamp, tweet_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        signal.influencer,
        signal.token,
        signal.contract,
        signal.sentiment,
        signal.confidence,
        signal.timestamp,
        signal.tweetUrl,
      ]
    );
  }

  async cacheStrategy(strategy: any): Promise<void> {
    if (!(await this.isAvailable())) return;
    await this.pool.query(
      `INSERT INTO strategies (owner, name, strategy_type, parameters, dsl_code, active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        strategy.owner,
        strategy.name,
        strategy.strategy_type,
        JSON.stringify(strategy.parameters),
        strategy.dsl_code,
        strategy.active,
      ]
    );
  }

  async cacheOrder(order: any): Promise<void> {
    if (!(await this.isAvailable())) return;
    await this.pool.query(
      `INSERT INTO orders (strategy_id, signal_id, order_type, token, quantity, status, tx_hash, fill_price, filled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        order.strategy_id,
        order.signal_id,
        order.order_type,
        order.token,
        order.quantity,
        order.status,
        order.tx_hash,
        order.fill_price,
        order.filled_at ? new Date(order.filled_at) : null,
      ]
    );
  }

  async getRecentSignals(limit: number = 50): Promise<any[]> {
    if (!(await this.isAvailable())) return [];
    const result = await this.pool.query(
      'SELECT * FROM signals ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }

  async getStrategyPerformance(strategyId: number): Promise<any> {
    if (!(await this.isAvailable())) return null;
    const result = await this.pool.query(
      'SELECT * FROM performance_snapshots WHERE strategy_id = $1 ORDER BY snapshot_at DESC LIMIT 1',
      [strategyId]
    );
    return result.rows[0] || null;
  }
}
