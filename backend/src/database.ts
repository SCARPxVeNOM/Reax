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
        entry_price DECIMAL(20,8),
        stop_loss DECIMAL(20,8),
        take_profit DECIMAL(20,8),
        position_size DECIMAL(20,8),
        leverage DECIMAL(5,2),
        platform VARCHAR(50),
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

      CREATE TABLE IF NOT EXISTS paper_trades (
        id BIGSERIAL PRIMARY KEY,
        suggestion_id VARCHAR(255) NOT NULL,
        signal_id BIGINT NOT NULL,
        user_wallet VARCHAR(255) NOT NULL,
        entry DECIMAL(20,8) NOT NULL,
        size DECIMAL(20,8) NOT NULL,
        stop_loss DECIMAL(20,8),
        take_profit DECIMAL(20,8),
        route VARCHAR(50) NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW(),
        closed_at TIMESTAMP,
        exit_price DECIMAL(20,8),
        pnl DECIMAL(20,8)
      );

      CREATE TABLE IF NOT EXISTS monitored_users (
        id BIGSERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_strategy ON orders(strategy_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_paper_trades_user ON paper_trades(user_wallet);
      CREATE INDEX IF NOT EXISTS idx_paper_trades_signal ON paper_trades(signal_id);
      CREATE INDEX IF NOT EXISTS idx_monitored_users_active ON monitored_users(active);
    `);
  }

  async cacheSignal(signal: any): Promise<void> {
    if (!(await this.isAvailable())) return;
    
    // Add new columns if they don't exist (migration)
    try {
      await this.pool.query(`
        ALTER TABLE signals 
        ADD COLUMN IF NOT EXISTS entry_price DECIMAL(20,8),
        ADD COLUMN IF NOT EXISTS stop_loss DECIMAL(20,8),
        ADD COLUMN IF NOT EXISTS take_profit DECIMAL(20,8),
        ADD COLUMN IF NOT EXISTS position_size DECIMAL(20,8),
        ADD COLUMN IF NOT EXISTS leverage DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS platform VARCHAR(50);
      `);
    } catch (e) {
      // Columns might already exist, ignore
    }
    
    await this.pool.query(
      `INSERT INTO signals (influencer, token, contract, sentiment, confidence, timestamp, tweet_url, entry_price, stop_loss, take_profit, position_size, leverage, platform)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT DO NOTHING`,
      [
        signal.influencer,
        signal.token,
        signal.contract,
        signal.sentiment,
        signal.confidence,
        signal.timestamp,
        signal.tweetUrl,
        signal.entry_price || null,
        signal.stop_loss || null,
        signal.take_profit || null,
        signal.position_size || null,
        signal.leverage || null,
        signal.platform || null,
      ]
    );
  }

  async cacheStrategy(strategy: any): Promise<void> {
    if (!(await this.isAvailable())) return;

    // Normalize strategy_type for storage
    let type: string = 'Form';
    let parameters: any = null;
    let dslCode: string | null = null;

    if (strategy.strategy_type && strategy.strategy_type.Form) {
      type = 'Form';
      parameters = strategy.strategy_type.Form;
    } else if (strategy.strategy_type && strategy.strategy_type.DSL) {
      type = 'DSL';
      dslCode = strategy.strategy_type.DSL;
    }

    await this.pool.query(
      `INSERT INTO strategies (owner, name, strategy_type, parameters, dsl_code, active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        strategy.owner,
        strategy.name,
        type,
        parameters ? JSON.stringify(parameters) : null,
        dslCode,
        strategy.active ?? false,
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

  async recordPaperTrade(trade: {
    suggestion_id: string;
    signal_id: number;
    user_wallet: string;
    entry: number;
    size: number;
    stop_loss?: number;
    take_profit?: number;
    route: string;
    executed_at: number;
  }): Promise<void> {
    if (!(await this.isAvailable())) return;
    await this.pool.query(
      `INSERT INTO paper_trades (suggestion_id, signal_id, user_wallet, entry, size, stop_loss, take_profit, route, executed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        trade.suggestion_id,
        trade.signal_id,
        trade.user_wallet,
        trade.entry,
        trade.size,
        trade.stop_loss || null,
        trade.take_profit || null,
        trade.route,
        new Date(trade.executed_at),
      ]
    );
  }

  async getPaperTrades(userWallet?: string): Promise<any[]> {
    if (!(await this.isAvailable())) return [];
    if (userWallet) {
      const result = await this.pool.query(
        'SELECT * FROM paper_trades WHERE user_wallet = $1 ORDER BY executed_at DESC',
        [userWallet]
      );
      return result.rows;
    } else {
      const result = await this.pool.query(
        'SELECT * FROM paper_trades ORDER BY executed_at DESC LIMIT 100'
      );
      return result.rows;
    }
  }

  // Monitored Users methods
  async getMonitoredUsers(activeOnly: boolean = false): Promise<any[]> {
    if (!(await this.isAvailable())) return [];
    const query = activeOnly
      ? 'SELECT * FROM monitored_users WHERE active = TRUE ORDER BY created_at DESC'
      : 'SELECT * FROM monitored_users ORDER BY created_at DESC';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async addMonitoredUser(username: string, displayName?: string): Promise<number> {
    if (!(await this.isAvailable())) throw new Error('Database not available');
    // Remove @ if present
    const cleanUsername = username.replace(/^@/, '').trim();
    const result = await this.pool.query(
      `INSERT INTO monitored_users (username, display_name, active)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (username) DO UPDATE SET active = TRUE, updated_at = NOW()
       RETURNING id`,
      [cleanUsername, displayName || cleanUsername]
    );
    return result.rows[0].id;
  }

  async removeMonitoredUser(username: string): Promise<void> {
    if (!(await this.isAvailable())) throw new Error('Database not available');
    const cleanUsername = username.replace(/^@/, '').trim();
    await this.pool.query(
      'DELETE FROM monitored_users WHERE username = $1',
      [cleanUsername]
    );
  }

  async toggleMonitoredUser(username: string, active: boolean): Promise<void> {
    if (!(await this.isAvailable())) throw new Error('Database not available');
    const cleanUsername = username.replace(/^@/, '').trim();
    await this.pool.query(
      'UPDATE monitored_users SET active = $1, updated_at = NOW() WHERE username = $2',
      [active, cleanUsername]
    );
  }
}
