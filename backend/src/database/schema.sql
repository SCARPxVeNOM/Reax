-- Database Schema for Trading Platform

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('PINESCRIPT', 'VISUAL')),
    code TEXT,
    visual_data JSONB,
    microchain_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'STOPPED', 'ERROR')),
    initial_capital DECIMAL(20, 8) DEFAULT 10000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deployed_at TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_microchain_id (microchain_id)
);

-- DEX Orders table
CREATE TABLE IF NOT EXISTS dex_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    dex VARCHAR(50) NOT NULL CHECK (dex IN ('RAYDIUM', 'JUPITER', 'BINANCE')),
    order_type VARCHAR(50) NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP_LOSS')),
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    input_token VARCHAR(100) NOT NULL,
    output_token VARCHAR(100) NOT NULL,
    input_amount DECIMAL(30, 18) NOT NULL,
    output_amount DECIMAL(30, 18),
    slippage_bps INTEGER DEFAULT 50,
    priority_fee BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'CANCELLED')),
    transaction_hash VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_dex (dex),
    INDEX idx_created_at (created_at)
);

-- Strategy Followers table
CREATE TABLE IF NOT EXISTS strategy_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_user_id VARCHAR(255) NOT NULL,
    strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
    strategy_owner_id VARCHAR(255) NOT NULL,
    allocation_amount DECIMAL(20, 8) NOT NULL,
    max_position_size DECIMAL(20, 8),
    risk_limit_percent DECIMAL(5, 2) DEFAULT 10.00,
    auto_follow BOOLEAN DEFAULT true,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'STOPPED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_follower_user_id (follower_user_id),
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_status (status),
    UNIQUE (follower_user_id, strategy_id)
);

-- Trade Replications table
CREATE TABLE IF NOT EXISTS trade_replications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES strategy_followers(id) ON DELETE CASCADE,
    original_order_id UUID REFERENCES dex_orders(id) ON DELETE SET NULL,
    replicated_order_id UUID REFERENCES dex_orders(id) ON DELETE SET NULL,
    scale_factor DECIMAL(10, 6) NOT NULL,
    original_amount DECIMAL(30, 18) NOT NULL,
    replicated_amount DECIMAL(30, 18) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'EXECUTED', 'FAILED', 'SKIPPED')),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    INDEX idx_follower_id (follower_id),
    INDEX idx_original_order_id (original_order_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Performance Metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0.00,
    total_return DECIMAL(10, 4) DEFAULT 0.00,
    daily_return DECIMAL(10, 4) DEFAULT 0.00,
    max_drawdown DECIMAL(10, 4) DEFAULT 0.00,
    sharpe_ratio DECIMAL(10, 4) DEFAULT 0.00,
    total_volume DECIMAL(30, 18) DEFAULT 0,
    total_fees DECIMAL(30, 18) DEFAULT 0,
    equity DECIMAL(20, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_date (date),
    UNIQUE (strategy_id, date)
);

-- Strategy Signals table
CREATE TABLE IF NOT EXISTS strategy_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
    signal_type VARCHAR(50) NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'CLOSE')),
    price DECIMAL(30, 18) NOT NULL,
    quantity DECIMAL(30, 18),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_signal_type (signal_type),
    INDEX idx_created_at (created_at)
);

-- Price History table (for backtesting and analysis)
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    open DECIMAL(30, 18) NOT NULL,
    high DECIMAL(30, 18) NOT NULL,
    low DECIMAL(30, 18) NOT NULL,
    close DECIMAL(30, 18) NOT NULL,
    volume DECIMAL(30, 18) NOT NULL,
    timeframe VARCHAR(10) NOT NULL CHECK (timeframe IN ('1m', '5m', '15m', '1h', '4h', '1d')),
    INDEX idx_symbol_timestamp (symbol, timestamp),
    INDEX idx_timeframe (timeframe),
    UNIQUE (symbol, timestamp, timeframe)
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    notification_channels JSONB DEFAULT '["IN_APP"]',
    notification_types JSONB DEFAULT '[]',
    email_address VARCHAR(255),
    webhook_url VARCHAR(500),
    theme VARCHAR(20) DEFAULT 'dark',
    default_slippage_bps INTEGER DEFAULT 50,
    default_priority_fee BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategy_followers_updated_at BEFORE UPDATE ON strategy_followers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
