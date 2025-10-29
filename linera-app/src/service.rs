use linera_sdk::{Service, ServiceRuntime};
use linera_sdk::abi::WithServiceAbi;
use linera_sdk::views::View;
use crate::{LineraTradeAbi, LineraTradeState, Order, Signal, Strategy};

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
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
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

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub enum QueryResponse {
    Signals(Vec<Signal>),
    Signal(Option<Signal>),
    Strategies(Vec<Strategy>),
    Strategy(Option<Strategy>),
    Orders(Vec<Order>),
    Order(Option<Order>),
}