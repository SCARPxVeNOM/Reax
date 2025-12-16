// Feature: linera-workspace-migration, Property 2: Type Reference Consistency
// Validates: Requirements 2.1, 2.2, 2.5

#[cfg(test)]
mod property_tests {
    use super::super::*;

    #[test]
    fn test_signal_type_compiles() {
        // Verify Signal type can be instantiated and all fields are accessible
        let signal = Signal {
            id: 1,
            influencer: "test".to_string(),
            token: "BTC".to_string(),
            contract: "0x123".to_string(),
            sentiment: "bullish".to_string(),
            confidence: 0.95,
            timestamp: 1234567890,
            tweet_url: "https://twitter.com/test".to_string(),
            entry_price: Some(50000.0),
            stop_loss: Some(48000.0),
            take_profit: Some(55000.0),
            position_size: Some(1.0),
            leverage: Some(2),
            platform: Some("DEX".to_string()),
        };

        assert_eq!(signal.id, 1);
        assert_eq!(signal.token, "BTC");
    }

    #[test]
    fn test_strategy_type_compiles() {
        // Verify Strategy type can be instantiated
        let strategy = Strategy {
            id: 1,
            owner: "owner1".to_string(),
            name: "My Strategy".to_string(),
            strategy_type: StrategyType::DSL("buy when price > 50000".to_string()),
            active: true,
            created_at: 1234567890,
        };

        assert_eq!(strategy.id, 1);
        assert!(strategy.active);
    }

    #[test]
    fn test_form_strategy_type_compiles() {
        // Verify FormStrategy type can be instantiated
        let form_strategy = FormStrategy {
            token_pair: "BTC/USD".to_string(),
            buy_price: 50000.0,
            sell_target: 55000.0,
            trailing_stop_pct: 2.0,
            take_profit_pct: 10.0,
            max_loss_pct: 5.0,
        };

        assert_eq!(form_strategy.token_pair, "BTC/USD");
    }

    #[test]
    fn test_order_type_compiles() {
        // Verify Order type can be instantiated
        let order = Order {
            id: 1,
            strategy_id: 1,
            signal_id: 1,
            order_type: "market".to_string(),
            token: "BTC".to_string(),
            quantity: 1.0,
            status: OrderStatus::Pending,
            tx_hash: None,
            fill_price: None,
            created_at: 1234567890,
            filled_at: None,
        };

        assert_eq!(order.id, 1);
        assert_eq!(order.strategy_id, 1);
    }

    #[test]
    fn test_operation_enum_compiles() {
        // Verify Operation enum variants can be instantiated
        let signal = Signal {
            id: 1,
            influencer: "test".to_string(),
            token: "BTC".to_string(),
            contract: "0x123".to_string(),
            sentiment: "bullish".to_string(),
            confidence: 0.95,
            timestamp: 1234567890,
            tweet_url: "https://twitter.com/test".to_string(),
            entry_price: None,
            stop_loss: None,
            take_profit: None,
            position_size: None,
            leverage: None,
            platform: None,
        };

        let _op = Operation::SubmitSignal {
            signal: signal.clone(),
        };
        let _op2 = Operation::ActivateStrategy { strategy_id: 1 };
        let _op3 = Operation::RecordOrderFill {
            order_id: 1,
            tx_hash: "0xabc".to_string(),
            fill_price: 50000.0,
            filled_at: 1234567890,
        };
    }

    #[test]
    fn test_event_enum_compiles() {
        // Verify Event enum variants can be instantiated
        let signal = Signal {
            id: 1,
            influencer: "test".to_string(),
            token: "BTC".to_string(),
            contract: "0x123".to_string(),
            sentiment: "bullish".to_string(),
            confidence: 0.95,
            timestamp: 1234567890,
            tweet_url: "https://twitter.com/test".to_string(),
            entry_price: None,
            stop_loss: None,
            take_profit: None,
            position_size: None,
            leverage: None,
            platform: None,
        };

        let _event = Event::SignalReceived {
            signal: signal.clone(),
        };
        let _event2 = Event::StrategyCreated {
            strategy_id: 1,
            owner: "owner1".to_string(),
        };
        let _event3 = Event::OrderFilled {
            order_id: 1,
            tx_hash: "0xabc".to_string(),
            fill_price: 50000.0,
        };
    }

    #[test]
    fn test_query_enum_compiles() {
        // Verify Query enum variants can be instantiated
        let _query = Query::GetSignals {
            limit: 10,
            offset: 0,
        };
        let _query2 = Query::GetSignal { id: 1 };
        let _query3 = Query::GetStrategies {
            owner: Some("owner1".to_string()),
            limit: 10,
            offset: 0,
        };
    }

    #[test]
    fn test_query_response_enum_compiles() {
        // Verify QueryResponse enum variants can be instantiated
        let _response = QueryResponse::Signals(vec![]);
        let _response2 = QueryResponse::Signal(None);
        let _response3 = QueryResponse::Strategies(vec![]);
    }

    #[test]
    fn test_abi_traits_compile() {
        // Verify ABI traits are properly implemented
        use linera_sdk::abi::{ContractAbi, ServiceAbi};

        // This will fail to compile if the traits aren't properly implemented
        fn _check_contract_abi<T: ContractAbi>() {}
        fn _check_service_abi<T: ServiceAbi>() {}

        _check_contract_abi::<LineraTradeAbi>();
        _check_service_abi::<LineraTradeAbi>();
    }
}
