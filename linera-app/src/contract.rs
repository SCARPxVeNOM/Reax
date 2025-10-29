use linera_sdk::{Contract, ContractRuntime};
use linera_sdk::abi::WithContractAbi;
use linera_sdk::views::{RootView, View};
use linera_sdk::linera_base_types::StreamName;
use crate::{LineraTradeAbi, LineraTradeState, Event, Operation, Order, OrderStatus, Signal, Strategy};

linera_sdk::contract!(LineraTradeContract);

pub struct LineraTradeContract {
    state: LineraTradeState,
    runtime: ContractRuntime<Self>,
}

impl WithContractAbi for LineraTradeContract {
    type Abi = LineraTradeAbi;
}

impl Contract for LineraTradeContract {
    type Parameters = ();
    type InstantiationArgument = ();
    type Message = ();
    type EventValue = Event;

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = <LineraTradeState as linera_sdk::views::View>::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        LineraTradeContract { state, runtime }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }

    async fn instantiate(&mut self, _argument: ()) {
        // Initialize counters
        self.state.signal_counter.set(0);
        self.state.strategy_counter.set(0);
        self.state.order_counter.set(0);
    }

    async fn execute_operation(&mut self, operation: Operation) -> u64 {
        match operation {
            Operation::SubmitSignal { signal } => {
                self.submit_signal(signal).await;
                0
            }
            Operation::CreateStrategy { strategy } => {
                self.create_strategy(strategy).await;
                0
            }
            Operation::ActivateStrategy { strategy_id } => {
                self.activate_strategy(strategy_id).await;
                0
            }
            Operation::DeactivateStrategy { strategy_id } => {
                self.deactivate_strategy(strategy_id).await;
                0
            }
            Operation::CreateOrder { order } => {
                self.create_order(order).await;
                0
            }
            Operation::RecordOrderFill {
                order_id,
                tx_hash,
                fill_price,
                filled_at,
            } => {
                self.record_order_fill(order_id, tx_hash, fill_price, filled_at)
                    .await;
                0
            }
        }
    }

    async fn execute_message(&mut self, _message: ()) {}
}

impl LineraTradeContract {
    async fn submit_signal(&mut self, mut signal: Signal) {
        // Validate signal
        if signal.confidence < 0.0 || signal.confidence > 1.0 {
            return;
        }

        // Generate ID
        let id = *self.state.signal_counter.get() + 1;
        signal.id = id;
        self.state.signal_counter.set(id);

        // Store signal
        let _ = self.state.signals.insert(&id, signal.clone());

        // Emit event
        let event = Event::SignalReceived { signal };
        let stream_name = StreamName::from(bcs::to_bytes(&"signal_received").unwrap());
        self.runtime.emit(stream_name, &event);
    }

    async fn create_strategy(&mut self, mut strategy: Strategy) {
        // Generate ID
        let id = *self.state.strategy_counter.get() + 1;
        strategy.id = id;
        self.state.strategy_counter.set(id);

        // Store strategy
        let owner = strategy.owner.clone();
        let _ = self.state.strategies.insert(&id, strategy);

        // Emit event
        let event = Event::StrategyCreated {
            strategy_id: id,
            owner,
        };
        let stream_name = StreamName::from(bcs::to_bytes(&"strategy_created").unwrap());
        self.runtime.emit(stream_name, &event);
    }

    async fn activate_strategy(&mut self, strategy_id: u64) {
        if let Ok(Some(mut strategy)) = self.state.strategies.get(&strategy_id).await {
            strategy.active = true;
            let _ = self.state.strategies.insert(&strategy_id, strategy);

            let event = Event::StrategyActivated { strategy_id };
            let stream_name = StreamName::from(bcs::to_bytes(&"strategy_activated").unwrap());
            self.runtime.emit(stream_name, &event);
        }
    }

    async fn deactivate_strategy(&mut self, strategy_id: u64) {
        if let Ok(Some(mut strategy)) = self.state.strategies.get(&strategy_id).await {
            strategy.active = false;
            let _ = self.state.strategies.insert(&strategy_id, strategy);

            let event = Event::StrategyDeactivated { strategy_id };
            let stream_name = StreamName::from(bcs::to_bytes(&"strategy_deactivated").unwrap());
            self.runtime.emit(stream_name, &event);
        }
    }

    async fn create_order(&mut self, mut order: Order) {
        // Generate ID
        let id = *self.state.order_counter.get() + 1;
        order.id = id;
        self.state.order_counter.set(id);

        // Store order
        let _ = self.state.orders.insert(&id, order.clone());

        // Emit event
        let event = Event::OrderCreated { order };
        let stream_name = StreamName::from(bcs::to_bytes(&"order_created").unwrap());
        self.runtime.emit(stream_name, &event);
    }

    async fn record_order_fill(
        &mut self,
        order_id: u64,
        tx_hash: String,
        fill_price: f64,
        filled_at: u64,
    ) {
        if let Ok(Some(mut order)) = self.state.orders.get(&order_id).await {
            // Prevent duplicate fills
            if !matches!(order.status, OrderStatus::Filled) {
                order.status = OrderStatus::Filled;
                order.tx_hash = Some(tx_hash.clone());
                order.fill_price = Some(fill_price);
                order.filled_at = Some(filled_at);

                let _ = self.state.orders.insert(&order_id, order);

                let event = Event::OrderFilled {
                    order_id,
                    tx_hash,
                    fill_price,
                };
                let stream_name = StreamName::from(bcs::to_bytes(&"order_filled").unwrap());
                self.runtime.emit(stream_name, &event);
            }
        }
    }
}
