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

/// Microchain Profile
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct MicrochainProfile {
    pub id: String,
    pub name: String,
    pub wallets: Vec<String>,
    pub preferred_chains: Vec<String>,
    pub visibility: String,
    pub created_at: u64,
    // Performance tracking for leaderboard
    pub total_trades: u64,
    pub winning_trades: u64,
    pub total_volume: u64,
    pub total_pnl: i64, // Can be negative
}

/// Leaderboard entry for network analytics
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LeaderboardEntry {
    pub id: String,
    pub name: String,
    pub win_rate: f64,
    pub roi: f64,
    pub trades: u64,
    pub volume: u64,
    pub chain: String,
}

/// Network-wide analytics
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct NetworkAnalytics {
    pub total_microchains: u64,
    pub total_strategies: u64,
    pub total_volume: u64,
    pub active_trades: u64,
    pub leaderboard: Vec<LeaderboardEntry>,
}

// ============================================
// PHASE 2: STRATEGY ENHANCEMENTS
// ============================================

/// Source of the strategy
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum StrategySource {
    /// User-created strategy
    Manual { author: String },
    /// Strategy from community posts
    Community { author: String, post_id: String },
    /// Curated by trusted traders
    Curated { curator: String, rating: f64 },
    /// Triggered by prediction market signals
    PredictionMarket { market_id: u64 },
}

/// User trading strategy with versioning and risk parameters
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Strategy {
    pub id: u64,
    pub owner: String,
    pub name: String,
    pub strategy_type: StrategyType,
    pub active: bool,
    pub created_at: u64,
    // Phase 2: Versioning
    pub version: u64,
    pub updated_at: Option<u64>,
    // Phase 2: Source tracking
    pub source: StrategySource,
    // Phase 2: Risk parameters
    pub risk_percentage: f64,       // Max % of portfolio to risk per trade
    pub max_exposure: f64,          // Max total exposure in USD
    pub slippage_bps: u16,          // Max slippage tolerance in basis points
}

/// Strategy version history entry
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct StrategyVersion {
    pub strategy_id: u64,
    pub version: u64,
    pub strategy_snapshot: Strategy,
    pub changed_at: u64,
    pub change_reason: Option<String>,
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

// ============================================
// PHASE 3: EXECUTION ENGINE ENHANCEMENTS
// ============================================

/// Comparison operators for conditional triggers
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Comparison {
    GreaterThan,
    LessThan,
    GreaterThanOrEqual,
    LessThanOrEqual,
    Equal,
}

/// Trigger types for conditional execution
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum TriggerType {
    /// Execute when price reaches threshold
    PriceThreshold { token: String },
    /// Execute when prediction market probability crosses threshold
    MarketProbability { market_id: u64 },
    /// Execute at specific timestamp
    TimeBasedTrigger,
    /// Execute when volume exceeds threshold
    VolumeThreshold { token: String },
}

/// Conditional trigger for order execution
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ConditionalTrigger {
    pub trigger_type: TriggerType,
    pub threshold: f64,
    pub comparison: Comparison,
    pub active: bool,
    pub triggered_at: Option<u64>,
}

/// Single hop in multi-hop route
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct RouteHop {
    pub dex: DEX,
    pub input_mint: String,
    pub output_mint: String,
    pub pool_address: Option<String>,
    pub expected_output: u64,
}

/// DEX Order with multi-hop routing and conditional execution
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
    // Phase 3: Multi-hop routing
    pub route_path: Vec<RouteHop>,
    pub is_multi_hop: bool,
    // Phase 3: Conditional execution
    pub conditional_trigger: Option<ConditionalTrigger>,
    pub execution_mode: ExecutionMode,
}

/// Execution mode for orders
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum ExecutionMode {
    /// Execute immediately
    Immediate,
    /// Execute when condition is met
    Conditional,
    /// Execute at scheduled time
    Scheduled { execute_at: u64 },
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

// ============================================
// PHASE 1: SAFETY & VALIDATION CONTROLS
// ============================================

/// Safety configuration for risk management
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SafetyConfig {
    pub id: u64,
    pub owner: String,
    /// Maximum position size per token (in USD equivalent)
    pub max_position_per_token: f64,
    /// Maximum total portfolio exposure (in USD)
    pub max_total_exposure: f64,
    /// Maximum slippage allowed (in basis points, e.g., 50 = 0.5%)
    pub max_slippage_bps: u16,
    /// Maximum loss percentage before fail-safe triggers
    pub max_loss_percentage: f64,
    /// Require stop-loss on all orders
    pub require_stop_loss: bool,
    /// Enable automatic fail-safe reverts
    pub fail_safe_enabled: bool,
    /// Minimum gas/balance required before execution
    pub min_balance_required: f64,
}

/// Order validation status
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum ValidationStatus {
    Pending,
    Approved,
    Rejected { reason: String },
}

/// Validated order with safety checks
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ValidatedOrder {
    pub order_id: u64,
    pub validation_status: ValidationStatus,
    pub checks_passed: Vec<String>,
    pub checks_failed: Vec<String>,
    pub validated_at: u64,
}

// ============================================
// PHASE 4: PREDICTION MARKET INTEGRATION
// ============================================

/// Prediction market for strategy triggers
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PredictionMarket {
    pub id: u64,
    pub question: String,
    pub outcome: Option<bool>,  // None = unresolved
    pub probability: f64,       // 0.0 - 1.0
    pub created_at: u64,
    pub resolved_at: Option<u64>,
}

/// Link between strategy and prediction market
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct StrategyMarketLink {
    pub strategy_id: u64,
    pub market_id: u64,
    /// Probability threshold to trigger strategy activation
    pub trigger_probability: f64,
    /// Activate when probability is above (true) or below (false) threshold
    pub activate_above: bool,
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
    // Safety & Validation Operations (Phase 1)
    CreateSafetyConfig { config: SafetyConfig },
    UpdateSafetyConfig { config: SafetyConfig },
    ValidateOrder { order_id: u64 },
    // Prediction Market Operations (Phase 4)
    CreatePredictionMarket { market: PredictionMarket },
    UpdateMarketProbability { market_id: u64, probability: f64 },
    ResolvePredictionMarket { market_id: u64, outcome: bool },
    LinkStrategyToMarket { link: StrategyMarketLink },
    // Strategy Enhancement Operations (Phase 2)
    UpdateStrategy { strategy: Strategy, change_reason: Option<String> },
    GetStrategyHistory { strategy_id: u64 },
    // Execution Engine Operations (Phase 3)
    CreateMultiHopOrder { order: DEXOrder },
    CheckConditionalOrders,
    TriggerConditionalOrder { order_id: u64 },
    CancelConditionalOrder { order_id: u64 },
    // Microchain Profile Operations
    CreateMicrochainProfile { 
        name: String,
        wallet: String,
        chains: Vec<String>,
        visibility: String,
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
    // Safety & Validation Events (Phase 1)
    SafetyConfigCreated { config_id: u64, owner: String },
    SafetyConfigUpdated { config_id: u64 },
    OrderValidated { order_id: u64, status: ValidationStatus },
    OrderRejectedBySafety { order_id: u64, reason: String },
    // Prediction Market Events (Phase 4)
    PredictionMarketCreated { market_id: u64, question: String },
    MarketProbabilityUpdated { market_id: u64, probability: f64 },
    PredictionMarketResolved { market_id: u64, outcome: bool },
    StrategyLinkedToMarket { strategy_id: u64, market_id: u64 },
    StrategyTriggeredByMarket { strategy_id: u64, market_id: u64 },
    // Strategy Enhancement Events (Phase 2)
    StrategyUpdated { strategy_id: u64, new_version: u64 },
    // Execution Engine Events (Phase 3)
    MultiHopOrderCreated { order_id: u64, hop_count: usize },
    ConditionalOrderTriggered { order_id: u64 },
    ConditionalOrderCancelled { order_id: u64 },
    // Microchain Events
    MicrochainProfileCreated { wallet: String, name: String },
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
    // Safety & Validation Queries
    GetSafetyConfig { owner: String },
    GetOrderValidation { order_id: u64 },
    // Prediction Market Queries
    GetPredictionMarkets { limit: usize, offset: usize },
    GetPredictionMarket { id: u64 },
    GetStrategyMarketLinks { strategy_id: u64 },
    // Strategy Enhancement Queries (Phase 2)
    GetStrategyVersions { strategy_id: u64 },
    // Microchain Queries
    GetMicrochainProfile { wallet: String },
    // Network Analytics Query
    GetNetworkAnalytics,
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
    // Safety & Validation Responses
    SafetyConfig(Option<SafetyConfig>),
    OrderValidation(Option<ValidatedOrder>),
    // Prediction Market Responses
    PredictionMarkets(Vec<PredictionMarket>),
    PredictionMarket(Option<PredictionMarket>),
    StrategyMarketLinks(Vec<StrategyMarketLink>),
    // Strategy Enhancement Responses (Phase 2)
    StrategyVersions(Vec<StrategyVersion>),
    // Microchain Responses
    MicrochainProfile(Option<MicrochainProfile>),
    // Network Analytics Response
    NetworkAnalytics(NetworkAnalytics),
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
