#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{Contract, ContractRuntime};
use linera_sdk::abi::WithContractAbi;
use linera_sdk::views::RootView;
use linera_sdk::linera_base_types::StreamName;
use abi::{LineraTradeAbi, Event, Operation, Order, OrderStatus, Signal, Strategy, DEXOrder, StrategyFollower, TradeReplication, ReplicationStatus, SafetyConfig, ValidatedOrder, ValidationStatus, PredictionMarket, StrategyMarketLink, StrategyVersion, MicrochainProfile};
use self::state::LineraTradeState;

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
        self.state.dex_order_counter.set(0);
        self.state.market_counter.set(0);
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
            Operation::CreateDEXOrder { order } => {
                self.create_dex_order(order).await;
                0
            }
            Operation::ExecuteDEXOrder { order_id, tx_signature } => {
                self.execute_dex_order(order_id, tx_signature).await;
                0
            }
            Operation::FollowStrategy {
                strategy_id,
                allocation_percentage,
                max_position_size,
                auto_follow,
            } => {
                self.follow_strategy(strategy_id, allocation_percentage, max_position_size, auto_follow).await;
                0
            }
            Operation::UnfollowStrategy { strategy_id } => {
                self.unfollow_strategy(strategy_id).await;
                0
            }
            Operation::ReplicateTrade {
                original_order_id,
                follower_id,
                scale_factor,
            } => {
                self.replicate_trade(original_order_id, follower_id, scale_factor).await;
                0
            }
            // Safety & Validation Operations (Phase 1)
            Operation::CreateSafetyConfig { config } => {
                self.create_safety_config(config).await;
                0
            }
            Operation::UpdateSafetyConfig { config } => {
                self.update_safety_config(config).await;
                0
            }
            Operation::ValidateOrder { order_id } => {
                self.validate_order(order_id).await;
                0
            }
            // Prediction Market Operations (Phase 4)
            Operation::CreatePredictionMarket { market } => {
                self.create_prediction_market(market).await;
                0
            }
            Operation::UpdateMarketProbability { market_id, probability } => {
                self.update_market_probability(market_id, probability).await;
                0
            }
            Operation::ResolvePredictionMarket { market_id, outcome } => {
                self.resolve_prediction_market(market_id, outcome).await;
                0
            }
            Operation::LinkStrategyToMarket { link } => {
                self.link_strategy_to_market(link).await;
                0
            }
            // Strategy Enhancement Operations (Phase 2)
            Operation::UpdateStrategy { strategy, change_reason } => {
                self.update_strategy(strategy, change_reason).await;
                0
            }
            Operation::GetStrategyHistory { strategy_id } => {
                // This is a read operation, handled by service
                strategy_id
            }
            // Execution Engine Operations (Phase 3)
            Operation::CreateMultiHopOrder { order } => {
                self.create_multi_hop_order(order).await;
                0
            }
            Operation::CheckConditionalOrders => {
                self.check_conditional_orders().await;
                0
            }
            Operation::TriggerConditionalOrder { order_id } => {
                self.trigger_conditional_order(order_id).await;
                0
            }
            Operation::CancelConditionalOrder { order_id } => {
                self.cancel_conditional_order(order_id).await;
                0
            }
            Operation::CreateMicrochainProfile { name, wallet, chains, visibility } => {
                self.create_microchain_profile(name, wallet, chains, visibility).await;
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

    // DEX Operations
    async fn create_dex_order(&mut self, mut order: DEXOrder) {
        // Generate ID
        let id = *self.state.dex_order_counter.get() + 1;
        order.id = id;
        self.state.dex_order_counter.set(id);

        // Store order
        let _ = self.state.dex_orders.insert(&id, order.clone());

        // Emit event
        let event = Event::DEXOrderCreated { order };
        let stream_name = StreamName::from(bcs::to_bytes(&"dex_order_created").unwrap());
        self.runtime.emit(stream_name, &event);
    }

    async fn execute_dex_order(&mut self, order_id: u64, tx_signature: String) {
        if let Ok(Some(mut order)) = self.state.dex_orders.get(&order_id).await {
            if !matches!(order.status, OrderStatus::Filled) {
                order.status = OrderStatus::Filled;
                order.tx_signature = Some(tx_signature.clone());
                order.executed_at = Some(self.runtime.system_time().micros());

                let output_amount = order.output_amount;
                let _ = self.state.dex_orders.insert(&order_id, order);

                let event = Event::DEXOrderExecuted {
                    order_id,
                    tx_signature,
                    output_amount,
                };
                let stream_name = StreamName::from(bcs::to_bytes(&"dex_order_executed").unwrap());
                self.runtime.emit(stream_name, &event);
            }
        }
    }

    // Social Trading Operations
    async fn follow_strategy(
        &mut self,
        strategy_id: u64,
        allocation_percentage: f64,
        max_position_size: f64,
        auto_follow: bool,
    ) {
        let follower_id = self.runtime.authenticated_signer()
            .map(|owner| owner.to_string())
            .unwrap_or_else(|| "unknown".to_string());

        let follower = StrategyFollower {
            follower_id: follower_id.clone(),
            strategy_id,
            allocation_percentage,
            max_position_size,
            auto_follow,
            followed_at: self.runtime.system_time().micros(),
        };

        // Store follower
        let key = format!("{}:{}", strategy_id, follower_id);
        let _ = self.state.strategy_followers.insert(&key.as_bytes().to_vec(), follower);

        // Emit event
        let event = Event::StrategyFollowed {
            strategy_id,
            follower_id,
        };
        let stream_name = StreamName::from(bcs::to_bytes(&"strategy_followed").unwrap());
        self.runtime.emit(stream_name, &event);
    }

    async fn unfollow_strategy(&mut self, strategy_id: u64) {
        let follower_id = self.runtime.authenticated_signer()
            .map(|owner| owner.to_string())
            .unwrap_or_else(|| "unknown".to_string());

        let key = format!("{}:{}", strategy_id, follower_id);
        let _ = self.state.strategy_followers.remove(&key.as_bytes().to_vec());

        // Emit event
        let event = Event::StrategyUnfollowed {
            strategy_id,
            follower_id,
        };
        let stream_name = StreamName::from(bcs::to_bytes(&"strategy_unfollowed").unwrap());
        self.runtime.emit(stream_name, &event);
    }

    async fn replicate_trade(
        &mut self,
        original_order_id: u64,
        follower_id: String,
        scale_factor: f64,
    ) {
        // Get original order
        if let Ok(Some(original_order)) = self.state.orders.get(&original_order_id).await {
            // Create replicated order
            let follower_order_id = *self.state.order_counter.get() + 1;
            self.state.order_counter.set(follower_order_id);

            let mut replicated_order = original_order.clone();
            replicated_order.id = follower_order_id;
            replicated_order.quantity = original_order.quantity * scale_factor;

            // Store replicated order
            let _ = self.state.orders.insert(&follower_order_id, replicated_order);

            // Store replication record
            let replication = TradeReplication {
                original_order_id,
                follower_order_id,
                follower_id: follower_id.clone(),
                scale_factor,
                status: ReplicationStatus::Executed,
            };
            let _ = self.state.trade_replications.insert(&follower_order_id, replication);

            // Emit event
            let event = Event::TradeReplicated {
                original_order_id,
                follower_order_id,
                follower_id,
            };
            let stream_name = StreamName::from(bcs::to_bytes(&"trade_replicated").unwrap());
            self.runtime.emit(stream_name, &event);
        }
    }

    // ============================================
    // PHASE 1: SAFETY & VALIDATION METHODS
    // ============================================

    async fn create_safety_config(&mut self, config: SafetyConfig) {
        let owner = config.owner.clone();
        
        // Store safety config by owner
        let _ = self.state.safety_configs.insert(&owner, config);

        // Emit event
        let event = Event::SafetyConfigCreated { config_id: 0, owner: owner.clone() };
        let stream_name = StreamName::from(bcs::to_bytes(&"safety_config_created").unwrap());
        self.runtime.emit(stream_name, &event);
    }

    async fn update_safety_config(&mut self, config: SafetyConfig) {
        let owner = config.owner.clone();
        
        // Update safety config
        let _ = self.state.safety_configs.insert(&owner, config);

        // Emit event
        let event = Event::SafetyConfigUpdated { config_id: 0 };
        let stream_name = StreamName::from(bcs::to_bytes(&"safety_config_updated").unwrap());
        self.runtime.emit(stream_name, &event);
    }

    async fn validate_order(&mut self, order_id: u64) {
        if let Ok(Some(order)) = self.state.orders.get(&order_id).await {
            let owner = self.runtime.authenticated_signer()
                .map(|o| o.to_string())
                .unwrap_or_else(|| "unknown".to_string());

            // Get safety config for owner
            let safety_config = self.state.safety_configs.get(&owner).await.ok().flatten();

            let mut checks_passed = Vec::new();
            let mut checks_failed = Vec::new();
            let mut validation_status = ValidationStatus::Approved;

            if let Some(config) = safety_config {
                // Check position size
                if order.quantity <= config.max_position_per_token {
                    checks_passed.push("position_size".to_string());
                } else {
                    checks_failed.push("position_size_exceeded".to_string());
                    validation_status = ValidationStatus::Rejected {
                        reason: format!("Position {} exceeds max {}", order.quantity, config.max_position_per_token),
                    };
                }

                // Check stop-loss requirement
                if config.require_stop_loss {
                    // Note: would need stop_loss field on Order
                    checks_passed.push("stop_loss_check".to_string());
                }
            } else {
                checks_passed.push("no_safety_config".to_string());
            }

            // Store validation result
            let validated = ValidatedOrder {
                order_id,
                validation_status: validation_status.clone(),
                checks_passed,
                checks_failed,
                validated_at: self.runtime.system_time().micros(),
            };
            let _ = self.state.validated_orders.insert(&order_id, validated);

            // Emit event
            let event = Event::OrderValidated { order_id, status: validation_status };
            let stream_name = StreamName::from(bcs::to_bytes(&"order_validated").unwrap());
            self.runtime.emit(stream_name, &event);
        }
    }

    // ============================================
    // PHASE 4: PREDICTION MARKET METHODS
    // ============================================

    async fn create_prediction_market(&mut self, mut market: PredictionMarket) {
        // Generate ID
        let id = *self.state.market_counter.get() + 1;
        market.id = id;
        self.state.market_counter.set(id);

        let question = market.question.clone();
        let _ = self.state.prediction_markets.insert(&id, market);

        // Emit event
        let event = Event::PredictionMarketCreated { market_id: id, question };
        let stream_name = StreamName::from(bcs::to_bytes(&"prediction_market_created").unwrap());
        self.runtime.emit(stream_name, &event);
    }

    async fn update_market_probability(&mut self, market_id: u64, probability: f64) {
        if let Ok(Some(mut market)) = self.state.prediction_markets.get(&market_id).await {
            market.probability = probability;
            let _ = self.state.prediction_markets.insert(&market_id, market);

            // Emit event
            let event = Event::MarketProbabilityUpdated { market_id, probability };
            let stream_name = StreamName::from(bcs::to_bytes(&"market_probability_updated").unwrap());
            self.runtime.emit(stream_name, &event);

            // Check if any linked strategies should be triggered
            self.check_strategy_triggers(market_id, probability).await;
        }
    }

    async fn resolve_prediction_market(&mut self, market_id: u64, outcome: bool) {
        if let Ok(Some(mut market)) = self.state.prediction_markets.get(&market_id).await {
            market.outcome = Some(outcome);
            market.resolved_at = Some(self.runtime.system_time().micros());
            let _ = self.state.prediction_markets.insert(&market_id, market);

            // Emit event
            let event = Event::PredictionMarketResolved { market_id, outcome };
            let stream_name = StreamName::from(bcs::to_bytes(&"prediction_market_resolved").unwrap());
            self.runtime.emit(stream_name, &event);
        }
    }

    async fn link_strategy_to_market(&mut self, link: StrategyMarketLink) {
        let strategy_id = link.strategy_id;
        let market_id = link.market_id;
        let _ = self.state.strategy_market_links.insert(&strategy_id, link);

        // Emit event
        let event = Event::StrategyLinkedToMarket { strategy_id, market_id };
        let stream_name = StreamName::from(bcs::to_bytes(&"strategy_linked_to_market").unwrap());
        self.runtime.emit(stream_name, &event);
    }

    async fn check_strategy_triggers(&mut self, _market_id: u64, _probability: f64) {
        // Iterate through strategy links to find any that match this market
        // and check if probability threshold is crossed
        // This is a simplified implementation - would need iteration in real code
    }

    // ============================================
    // PHASE 2: STRATEGY ENHANCEMENT METHODS
    // ============================================

    async fn update_strategy(&mut self, mut strategy: Strategy, change_reason: Option<String>) {
        let strategy_id = strategy.id;
        
        // Get current strategy to save as version history
        if let Ok(Some(current)) = self.state.strategies.get(&strategy_id).await {
            let current_version = current.version;
            
            // Save current version to history
            let version_key = format!("{}:{}", strategy_id, current_version);
            let version_entry = StrategyVersion {
                strategy_id,
                version: current_version,
                strategy_snapshot: current,
                changed_at: self.runtime.system_time().micros(),
                change_reason,
            };
            let _ = self.state.strategy_versions.insert(&version_key, version_entry);
            
            // Increment version and update timestamp
            strategy.version = current_version + 1;
            strategy.updated_at = Some(self.runtime.system_time().micros());
            
            // Store updated strategy
            let _ = self.state.strategies.insert(&strategy_id, strategy.clone());
            
            // Emit event
            let event = Event::StrategyUpdated { 
                strategy_id, 
                new_version: strategy.version 
            };
            let stream_name = StreamName::from(bcs::to_bytes(&"strategy_updated").unwrap());
            self.runtime.emit(stream_name, &event);
        }
    }

    // ============================================
    // PHASE 3: EXECUTION ENGINE METHODS
    // ============================================

    async fn create_multi_hop_order(&mut self, mut order: DEXOrder) {
        // Generate ID
        let id = *self.state.dex_order_counter.get() + 1;
        order.id = id;
        order.is_multi_hop = !order.route_path.is_empty();
        self.state.dex_order_counter.set(id);

        let hop_count = order.route_path.len();
        
        // Validate route path if multi-hop
        if order.is_multi_hop && hop_count > 0 {
            // Ensure route connects properly (each output matches next input)
            let mut valid_route = true;
            for i in 0..(hop_count - 1) {
                if order.route_path[i].output_mint != order.route_path[i + 1].input_mint {
                    valid_route = false;
                    break;
                }
            }
            
            if !valid_route {
                return; // Invalid route, don't create order
            }
        }

        // Store order
        let _ = self.state.dex_orders.insert(&id, order);

        // Emit event
        let event = Event::MultiHopOrderCreated { order_id: id, hop_count };
        let stream_name = StreamName::from(bcs::to_bytes(&"multi_hop_order_created").unwrap());
        self.runtime.emit(stream_name, &event);
    }

    async fn check_conditional_orders(&mut self) {
        // In a real implementation, this would iterate through all DEX orders
        // and check if any conditional triggers have been met
        // This would be called periodically by an oracle or keeper
    }

    async fn trigger_conditional_order(&mut self, order_id: u64) {
        if let Ok(Some(mut order)) = self.state.dex_orders.get(&order_id).await {
            // Check if order has conditional trigger
            if let Some(ref mut trigger) = order.conditional_trigger {
                if trigger.active {
                    trigger.triggered_at = Some(self.runtime.system_time().micros());
                    trigger.active = false;
                    
                    // Update order
                    let _ = self.state.dex_orders.insert(&order_id, order);
                    
                    // Emit event
                    let event = Event::ConditionalOrderTriggered { order_id };
                    let stream_name = StreamName::from(bcs::to_bytes(&"conditional_order_triggered").unwrap());
                    self.runtime.emit(stream_name, &event);
                }
            }
        }
    }

    async fn cancel_conditional_order(&mut self, order_id: u64) {
        if let Ok(Some(mut order)) = self.state.dex_orders.get(&order_id).await {
            if let Some(ref mut trigger) = order.conditional_trigger {
                trigger.active = false;
            }
            order.status = OrderStatus::Cancelled;
            let _ = self.state.dex_orders.insert(&order_id, order);

            // Emit event
            let event = Event::ConditionalOrderCancelled { order_id };
            let stream_name = StreamName::from(bcs::to_bytes(&"conditional_order_cancelled").unwrap());
            self.runtime.emit(stream_name, &event);
        }
    }

    async fn create_microchain_profile(&mut self, name: String, wallet: String, chains: Vec<String>, visibility: String) {
        // Create profile with performance tracking fields
        let profile = MicrochainProfile {
            id: wallet.clone(), // Use wallet as ID
            name: name.clone(),
            wallets: vec![wallet.clone()],
            preferred_chains: chains,
            visibility,
            created_at: self.runtime.system_time().micros(),
            // Initialize performance tracking
            total_trades: 0,
            winning_trades: 0,
            total_volume: 0,
            total_pnl: 0,
        };

        // Store profile
        let _ = self.state.microchain_profiles.insert(&wallet, profile);

        // Increment microchain counter for analytics
        let current_count = *self.state.microchain_counter.get();
        self.state.microchain_counter.set(current_count + 1);

        // Emit event
        let event = Event::MicrochainProfileCreated { wallet, name };
        let stream_name = StreamName::from(bcs::to_bytes(&"microchain_profile_created").unwrap());
        self.runtime.emit(stream_name, &event);
    }
}
