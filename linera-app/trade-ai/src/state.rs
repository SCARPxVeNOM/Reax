use linera_sdk::views::{MapView, RegisterView, RootView, ViewStorageContext};
use abi::{Signal, Strategy, Order, DEXOrder, StrategyFollower, TradeReplication};

/// Application state
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct LineraTradeState {
    pub signals: MapView<u64, Signal>,
    pub strategies: MapView<u64, Strategy>,
    pub orders: MapView<u64, Order>,
    pub dex_orders: MapView<u64, DEXOrder>,
    pub strategy_followers: MapView<Vec<u8>, StrategyFollower>,
    pub trade_replications: MapView<u64, TradeReplication>,
    pub signal_counter: RegisterView<u64>,
    pub strategy_counter: RegisterView<u64>,
    pub order_counter: RegisterView<u64>,
    pub dex_order_counter: RegisterView<u64>,
}
