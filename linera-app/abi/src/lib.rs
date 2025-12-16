use serde::{Deserialize, Serialize};

/// Trading signal extracted from tweets
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Signal {
    pub id: u64,
    pub influencer: String,
    pub token: String,
    pub contract: String,
    pub sentiment: String,
    pub confidence: f64,
    pub timestamp: u64,
    pub tweet_url: String,
    // Enhanced fields for trade execution
    pub entry_price: Option<f64>,
    pub stop_loss: Option<f64>,
    pub take_profit: Option<f64>,
    pub position_size: Option<f64>,
    pub leverage: Option<u8>,
    pub platform: Option<String>, // "DEX" or "CEX"
}

/// User trading strategy
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Strategy {
    pub id: u64,
    pub owner: String,
    pub name: String,
    pub strategy_type: StrategyType,
    pub active: bool,
    pub created_at: u64,
}

/// Strategy type: Form-based or DSL code
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum StrategyType {
    Form(FormStrategy),
    DSL(String),
}

/// Form-based strategy parameters
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FormStrategy {
    pub token_pair: String,
    pub buy_price: f64,
    pub sell_target: f64,
    pub trailing_stop_pct: f64,
    pub take_profit_pct: f64,
    pub max_loss_pct: f64,
}

/// Order status
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum OrderStatus {
    Pending,
    Submitted,
    Filled,
    Failed,
    Cancelled,
}

/// Trading order
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Order {
    pub id: u64,
    pub strategy_id: u64,
    pub signal_id: u64,
    pub order_type: String,
    pub token: String,
    pub quantity: f64,
    pub status: OrderStatus,
    pub tx_hash: Option<String>,
    pub fill_price: Option<f64>,
    pub created_at: u64,
    pub filled_at: Option<u64>,
}

/// DEX types
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum DEX {
    Raydium,
    Jupiter,
    Binance,
}

/// DEX Order
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DEXOrder {
    pub id: u64,
    pub strategy_id: u64,
    pub dex: DEX,
    pub input_mint: String,
    pub output_mint: String,
    pub input_amount: u64,
    pub output_amount: u64,
    pub slippage_bps: u16,
    pub priority_fee: u64,
    pub status: OrderStatus,
    pub tx_signature: Option<String>,
    pub created_at: u64,
    pub executed_at: Option<u64>,
}

/// Strategy Follower
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct StrategyFollower {
    pub follower_id: String,
    pub strategy_id: u64,
    pub allocation_percentage: f64,
    pub max_position_size: f64,
    pub auto_follow: bool,
    pub followed_at: u64,
}

/// Trade Replication Status
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum ReplicationStatus {
    Pending,
    Executed,
    Failed { reason: String },
    Skipped { reason: String },
}

/// Trade Replication
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TradeReplication {
    pub original_order_id: u64,
    pub follower_order_id: u64,
    pub follower_id: String,
    pub scale_factor: f64,
    pub status: ReplicationStatus,
}

/// Operations that modify state
#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    SubmitSignal { signal: Signal },
    CreateStrategy { strategy: Strategy },
    ActivateStrategy { strategy_id: u64 },
    DeactivateStrategy { strategy_id: u64 },
    CreateOrder { order: Order },
    RecordOrderFill {
        order_id: u64,
        tx_hash: String,
        fill_price: f64,
        filled_at: u64,
    },
    // DEX Operations
    CreateDEXOrder { order: DEXOrder },
    ExecuteDEXOrder { order_id: u64, tx_signature: String },
    // Social Trading Operations
    FollowStrategy {
        strategy_id: u64,
        allocation_percentage: f64,
        max_position_size: f64,
        auto_follow: bool,
    },
    UnfollowStrategy { strategy_id: u64 },
    ReplicateTrade {
        original_order_id: u64,
        follower_id: String,
        scale_factor: f64,
    },
}

/// Events emitted by the application
#[derive(Debug, Deserialize, Serialize)]
pub enum Event {
    SignalReceived { signal: Signal },
    StrategyCreated { strategy_id: u64, owner: String },
    StrategyActivated { strategy_id: u64 },
    StrategyDeactivated { strategy_id: u64 },
    OrderCreated { order: Order },
    OrderFilled {
        order_id: u64,
        tx_hash: String,
        fill_price: f64,
    },
    OrderFailed { order_id: u64, reason: String },
    // DEX Events
    DEXOrderCreated { order: DEXOrder },
    DEXOrderExecuted {
        order_id: u64,
        tx_signature: String,
        output_amount: u64,
    },
    DEXOrderFailed { order_id: u64, reason: String },
    // Social Trading Events
    StrategyFollowed {
        strategy_id: u64,
        follower_id: String,
    },
    StrategyUnfollowed {
        strategy_id: u64,
        follower_id: String,
    },
    TradeReplicated {
        original_order_id: u64,
        follower_order_id: u64,
        follower_id: String,
    },
    TradeReplicationFailed {
        original_order_id: u64,
        follower_id: String,
        reason: String,
    },
}

/// Query operations for read-only access
#[derive(Debug, Deserialize, Serialize)]
pub enum Query {
    GetSignals { limit: usize, offset: usize },
    GetSignal { id: u64 },
    GetStrategies {
        owner: Option<String>,
        limit: usize,
        offset: usize,
    },
    GetStrategy { id: u64 },
    GetOrders {
        strategy_id: Option<u64>,
        status: Option<String>,
        limit: usize,
        offset: usize,
    },
    GetOrder { id: u64 },
}

/// Query response types
#[derive(Debug, Deserialize, Serialize)]
pub enum QueryResponse {
    Signals(Vec<Signal>),
    Signal(Option<Signal>),
    Strategies(Vec<Strategy>),
    Strategy(Option<Strategy>),
    Orders(Vec<Order>),
    Order(Option<Order>),
}

use linera_sdk::abi::{ContractAbi, ServiceAbi};

/// Application ABI definition
pub struct LineraTradeAbi;

impl ContractAbi for LineraTradeAbi {
    type Operation = Operation;
    type Response = u64;
}

impl ServiceAbi for LineraTradeAbi {
    type Query = Query;
    type QueryResponse = QueryResponse;
}

#[cfg(test)]
mod tests;
