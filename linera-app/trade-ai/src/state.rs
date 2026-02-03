use linera_sdk::views::{MapView, RegisterView, RootView, ViewStorageContext};
use abi::{Signal, Strategy, Order, DEXOrder, StrategyFollower, TradeReplication, SafetyConfig, ValidatedOrder, PredictionMarket, StrategyMarketLink, StrategyVersion};

/// Application state
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct LineraTradeState {
    // Core trading state
    pub signals: MapView<u64, Signal>,
    pub strategies: MapView<u64, Strategy>,
    pub orders: MapView<u64, Order>,
    pub dex_orders: MapView<u64, DEXOrder>,
    pub strategy_followers: MapView<Vec<u8>, StrategyFollower>,
    pub trade_replications: MapView<u64, TradeReplication>,
    
    // Safety & Validation state (Phase 1)
    pub safety_configs: MapView<String, SafetyConfig>,  // owner -> config
    pub validated_orders: MapView<u64, ValidatedOrder>, // order_id -> validation
    
    // Prediction Market state (Phase 4)
    pub prediction_markets: MapView<u64, PredictionMarket>,
    pub strategy_market_links: MapView<u64, StrategyMarketLink>, // strategy_id -> link
    
    // Strategy Enhancement state (Phase 2)
    pub strategy_versions: MapView<String, StrategyVersion>, // "strategy_id:version" -> snapshot
    
    // Counters
    pub signal_counter: RegisterView<u64>,
    pub strategy_counter: RegisterView<u64>,
    pub order_counter: RegisterView<u64>,
    pub dex_order_counter: RegisterView<u64>,
    pub market_counter: RegisterView<u64>,
}

