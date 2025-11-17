use linera_sdk::views::{MapView, RegisterView, RootView, ViewStorageContext};
use linera_sdk::views::View;
use linera_views;
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

/// Application state
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct LineraTradeState {
    pub signals: MapView<u64, Signal>,
    pub strategies: MapView<u64, Strategy>,
    pub orders: MapView<u64, Order>,
    pub signal_counter: RegisterView<u64>,
    pub strategy_counter: RegisterView<u64>,
    pub order_counter: RegisterView<u64>,
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
}