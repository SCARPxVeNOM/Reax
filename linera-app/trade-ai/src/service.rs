#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{Service, ServiceRuntime};
use linera_sdk::abi::WithServiceAbi;
use abi::{LineraTradeAbi, Order, Signal, Strategy, Query, QueryResponse, SafetyConfig, ValidatedOrder, PredictionMarket, StrategyMarketLink, StrategyVersion};
use self::state::LineraTradeState;

linera_sdk::service!(LineraTradeService);

pub struct LineraTradeService {
    state: LineraTradeState,
}

impl WithServiceAbi for LineraTradeService {
    type Abi = LineraTradeAbi;
}

impl Service for LineraTradeService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = <LineraTradeState as linera_sdk::views::View>::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        LineraTradeService { state }
    }

    async fn handle_query(&self, query: Query) -> QueryResponse {
        match query {
            Query::GetSignals { limit, offset } => {
                QueryResponse::Signals(self.get_signals(limit, offset).await)
            }
            Query::GetSignal { id } => QueryResponse::Signal(self.get_signal(id).await),
            Query::GetStrategies {
                owner,
                limit,
                offset,
            } => QueryResponse::Strategies(self.get_strategies(owner, limit, offset).await),
            Query::GetStrategy { id } => QueryResponse::Strategy(self.get_strategy(id).await),
            Query::GetOrders {
                strategy_id,
                status,
                limit,
                offset,
            } => QueryResponse::Orders(self.get_orders(strategy_id, status, limit, offset).await),
            Query::GetOrder { id } => QueryResponse::Order(self.get_order(id).await),
            // Safety & Validation Queries
            Query::GetSafetyConfig { owner } => {
                QueryResponse::SafetyConfig(self.get_safety_config(owner).await)
            }
            Query::GetOrderValidation { order_id } => {
                QueryResponse::OrderValidation(self.get_order_validation(order_id).await)
            }
            // Prediction Market Queries
            Query::GetPredictionMarkets { limit, offset } => {
                QueryResponse::PredictionMarkets(self.get_prediction_markets(limit, offset).await)
            }
            Query::GetPredictionMarket { id } => {
                QueryResponse::PredictionMarket(self.get_prediction_market(id).await)
            }
            Query::GetStrategyMarketLinks { strategy_id } => {
                QueryResponse::StrategyMarketLinks(self.get_strategy_market_links(strategy_id).await)
            }
            // Strategy Enhancement Queries (Phase 2)
            Query::GetStrategyVersions { strategy_id } => {
                QueryResponse::StrategyVersions(self.get_strategy_versions(strategy_id).await)
            }
        }
    }
}

impl LineraTradeService {
    async fn get_signals(&self, limit: usize, offset: usize) -> Vec<Signal> {
        let mut signals = Vec::new();
        let counter = *self.state.signal_counter.get();

        let start = if offset >= counter as usize {
            return signals;
        } else {
            counter.saturating_sub(offset as u64)
        };

        let end = start.saturating_sub(limit as u64);

        for id in (end..=start).rev() {
            if let Ok(Some(signal)) = self.state.signals.get(&id).await {
                signals.push(signal);
            }
        }

        signals
    }

    async fn get_signal(&self, id: u64) -> Option<Signal> {
        self.state.signals.get(&id).await.ok().flatten()
    }

    async fn get_strategies(
        &self,
        owner: Option<String>,
        limit: usize,
        offset: usize,
    ) -> Vec<Strategy> {
        let mut strategies = Vec::new();
        let counter = *self.state.strategy_counter.get();

        let start = if offset >= counter as usize {
            return strategies;
        } else {
            counter.saturating_sub(offset as u64)
        };

        let end = start.saturating_sub(limit as u64);

        for id in (end..=start).rev() {
            if let Ok(Some(strategy)) = self.state.strategies.get(&id).await {
                if let Some(ref filter_owner) = owner {
                    if &strategy.owner == filter_owner {
                        strategies.push(strategy);
                    }
                } else {
                    strategies.push(strategy);
                }
            }
        }

        strategies
    }

    async fn get_strategy(&self, id: u64) -> Option<Strategy> {
        self.state.strategies.get(&id).await.ok().flatten()
    }

    async fn get_orders(
        &self,
        strategy_id: Option<u64>,
        status: Option<String>,
        limit: usize,
        offset: usize,
    ) -> Vec<Order> {
        let mut orders = Vec::new();
        let counter = *self.state.order_counter.get();

        let start = if offset >= counter as usize {
            return orders;
        } else {
            counter.saturating_sub(offset as u64)
        };

        let end = start.saturating_sub(limit as u64);

        for id in (end..=start).rev() {
            if let Ok(Some(order)) = self.state.orders.get(&id).await {
                let mut include = true;

                if let Some(filter_strategy_id) = strategy_id {
                    if order.strategy_id != filter_strategy_id {
                        include = false;
                    }
                }

                if let Some(ref filter_status) = status {
                    let order_status = format!("{:?}", order.status);
                    if &order_status != filter_status {
                        include = false;
                    }
                }

                if include {
                    orders.push(order);
                }
            }
        }

        orders
    }

    async fn get_order(&self, id: u64) -> Option<Order> {
        self.state.orders.get(&id).await.ok().flatten()
    }

    // Safety & Validation query methods
    async fn get_safety_config(&self, owner: String) -> Option<SafetyConfig> {
        self.state.safety_configs.get(&owner).await.ok().flatten()
    }

    async fn get_order_validation(&self, order_id: u64) -> Option<ValidatedOrder> {
        self.state.validated_orders.get(&order_id).await.ok().flatten()
    }

    // Prediction Market query methods
    async fn get_prediction_markets(&self, limit: usize, offset: usize) -> Vec<PredictionMarket> {
        let mut markets = Vec::new();
        let counter = *self.state.market_counter.get();

        let start = if offset >= counter as usize {
            return markets;
        } else {
            counter.saturating_sub(offset as u64)
        };

        let end = start.saturating_sub(limit as u64);

        for id in (end..=start).rev() {
            if let Ok(Some(market)) = self.state.prediction_markets.get(&id).await {
                markets.push(market);
            }
        }

        markets
    }

    async fn get_prediction_market(&self, id: u64) -> Option<PredictionMarket> {
        self.state.prediction_markets.get(&id).await.ok().flatten()
    }

    async fn get_strategy_market_links(&self, strategy_id: u64) -> Vec<StrategyMarketLink> {
        let mut links = Vec::new();
        if let Ok(Some(link)) = self.state.strategy_market_links.get(&strategy_id).await {
            links.push(link);
        }
        links
    }

    // Strategy Enhancement query methods (Phase 2)
    async fn get_strategy_versions(&self, strategy_id: u64) -> Vec<StrategyVersion> {
        let mut versions = Vec::new();
        
        // Get current strategy to find max version
        if let Ok(Some(current)) = self.state.strategies.get(&strategy_id).await {
            let max_version = current.version;
            
            // Iterate through all versions
            for version in 1..=max_version {
                let version_key = format!("{}:{}", strategy_id, version);
                if let Ok(Some(entry)) = self.state.strategy_versions.get(&version_key).await {
                    versions.push(entry);
                }
            }
        }
        
        versions
    }
}
