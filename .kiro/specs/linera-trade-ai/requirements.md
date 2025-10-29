# Requirements Document

## Introduction

LineraTrade AI is a real-time, event-driven, AI-powered market infrastructure built on Linera microchains for the Linera Buildathon. The system tracks influencer tweets, uses AI to detect sentiment, executes trades on decentralized exchanges, and enables users to build and share custom trading strategies through both no-code form builders and code-based DSL editors. This platform demonstrates Linera's ultra-low latency execution and real-time state updates while functioning as on-chain market oracle and execution infrastructure.

## Glossary

- **LineraTrade AI System**: The complete platform including tweet ingestion, AI parsing, Linera microchain, relayer, and frontend components
- **Tweet Ingestion Service**: Backend service that monitors and streams influencer tweets in real-time
- **AI Tweet Parser**: LLM-powered component that analyzes tweet sentiment and extracts trading signals
- **Linera App Chain**: Rust-based microchain application storing signals, strategies, orders, and results
- **Relayer**: Off-chain service that listens to Linera events and executes trades on Solana DEXes
- **Strategy Builder**: Frontend interface allowing users to create trading strategies via forms or DSL code
- **Trading Signal**: Structured data containing influencer, token, sentiment, and confidence extracted from tweets
- **DSL**: Domain-Specific Language for defining trading strategies (PineScript-like syntax)
- **DEX**: Decentralized Exchange (Jupiter/Raydium on Solana)
- **Monaco Editor**: Code editor component with syntax highlighting for DSL
- **Form Mode**: No-code interface for creating strategies using form fields
- **Code Mode**: Advanced interface using DSL for strategy creation
- **Dashboard**: Frontend interface displaying live tweets, signals, strategies, positions, and P&L

## Requirements

### Requirement 1: Tweet Monitoring and Ingestion

**User Story:** As a trader, I want the system to monitor influencer Twitter accounts in real-time, so that I can receive trading signals based on their tweets.

#### Acceptance Criteria

1. WHEN the Tweet Ingestion Service starts, THE LineraTrade AI System SHALL connect to Twitter APIs or web scrapers to monitor configured influencer accounts
2. WHEN an influencer publishes a new tweet, THE Tweet Ingestion Service SHALL capture the tweet content within 5 seconds of publication
3. THE Tweet Ingestion Service SHALL stream captured tweets to the backend processing pipeline with a maximum latency of 2 seconds
4. THE Tweet Ingestion Service SHALL maintain a persistent connection and automatically reconnect within 10 seconds if the connection drops
5. THE Tweet Ingestion Service SHALL log all captured tweets with timestamps for audit purposes

### Requirement 2: AI-Powered Sentiment Analysis

**User Story:** As a trader, I want tweets to be analyzed for bullish or bearish sentiment, so that I can make informed trading decisions based on influencer opinions.

#### Acceptance Criteria

1. WHEN the AI Tweet Parser receives a tweet, THE LineraTrade AI System SHALL analyze the sentiment using an LLM within 3 seconds
2. THE AI Tweet Parser SHALL classify each tweet as bullish, bearish, or neutral with a confidence score between 0.0 and 1.0
3. WHEN a token mention is detected, THE AI Tweet Parser SHALL extract the token name and attempt to resolve the contract address
4. THE AI Tweet Parser SHALL output structured JSON containing influencer name, token, contract address, sentiment, and confidence
5. IF the confidence score is below 0.7, THEN THE AI Tweet Parser SHALL mark the signal as low-confidence and require manual review

### Requirement 3: Linera Microchain State Management

**User Story:** As a platform operator, I want all trading signals, strategies, and orders stored on Linera microchains, so that the system maintains transparent and deterministic state.

#### Acceptance Criteria

1. THE Linera App Chain SHALL store trading signals with fields for influencer, token, contract, sentiment, confidence, and timestamp
2. THE Linera App Chain SHALL store user strategies with fields for strategy ID, owner address, script content, parameters, and active status
3. THE Linera App Chain SHALL store orders with fields for order ID, strategy ID, associated signal, execution status, and transaction hash
4. WHEN a new signal is submitted, THE Linera App Chain SHALL emit a SignalReceived event containing the complete signal data
5. WHEN an order is created, THE Linera App Chain SHALL emit an OrderCreated event with order details for relayer consumption

### Requirement 4: Strategy Creation via Form Builder

**User Story:** As a non-technical trader, I want to create trading strategies using a simple form interface, so that I can automate trades without writing code.

#### Acceptance Criteria

1. THE Strategy Builder SHALL provide form fields for token pair, buy price, sell target, trailing stop percentage, take profit percentage, and maximum loss percentage
2. WHEN a user completes the form, THE LineraTrade AI System SHALL validate all numeric inputs are within acceptable ranges (0-100 for percentages)
3. WHEN a user submits the form, THE Strategy Builder SHALL convert form data to JSON format and store it on the Linera App Chain
4. THE Strategy Builder SHALL allow users to edit existing strategies by pre-populating form fields with saved values
5. THE Strategy Builder SHALL display validation errors inline when users enter invalid values

### Requirement 5: Strategy Creation via DSL Code Editor

**User Story:** As an advanced trader, I want to write trading strategies using a code-based DSL, so that I can implement complex conditional logic and technical indicators.

#### Acceptance Criteria

1. THE Strategy Builder SHALL provide a Monaco Editor with syntax highlighting for the custom DSL
2. THE Strategy Builder SHALL support DSL syntax including if/then conditions, technical indicators (RSI, SMA), and buy/sell actions with parameters
3. WHEN a user writes DSL code, THE LineraTrade AI System SHALL parse and validate the syntax before allowing submission
4. WHEN DSL code is submitted, THE Strategy Builder SHALL compile the code to JSON format and store it on the Linera App Chain
5. IF DSL parsing fails, THEN THE Strategy Builder SHALL display error messages with line numbers and descriptions

### Requirement 6: Automated Trade Execution

**User Story:** As a trader, I want my active strategies to automatically execute trades when conditions are met, so that I can capitalize on opportunities without manual intervention.

#### Acceptance Criteria

1. WHEN the Linera App Chain emits a SignalReceived event, THE Relayer SHALL receive the event within 1 second via the Linera indexer
2. THE Relayer SHALL evaluate all active user strategies against the received signal to determine if trading conditions are met
3. WHEN a strategy condition matches, THE Relayer SHALL query Jupiter API for optimal swap routes on Solana
4. THE Relayer SHALL construct and sign a transaction, then submit it to Solana RPC nodes within 5 seconds of signal receipt
5. WHEN a transaction is confirmed, THE Relayer SHALL call the record_order_fill function on the Linera App Chain with transaction hash and fill price

### Requirement 7: Real-Time Dashboard Updates

**User Story:** As a trader, I want to view live trading signals, active strategies, open positions, and profit/loss in a dashboard, so that I can monitor my trading activity in real-time.

#### Acceptance Criteria

1. THE Dashboard SHALL display a live feed of incoming tweets and generated trading signals with timestamps
2. THE Dashboard SHALL display all user-created strategies with their active/inactive status and performance metrics
3. THE Dashboard SHALL display open positions with entry price, current price, unrealized P&L, and position size
4. WHEN the Linera App Chain state updates, THE Dashboard SHALL reflect changes within 2 seconds using WebSocket or Linera RPC polling
5. THE Dashboard SHALL calculate and display total portfolio value, realized P&L, and unrealized P&L

### Requirement 8: Strategy Activation and Deactivation

**User Story:** As a trader, I want to activate or deactivate my strategies at any time, so that I can control when automated trading occurs.

#### Acceptance Criteria

1. THE Dashboard SHALL provide toggle controls for each strategy to activate or deactivate
2. WHEN a user activates a strategy, THE LineraTrade AI System SHALL update the strategy status on the Linera App Chain within 1 second
3. THE Relayer SHALL only evaluate signals against strategies that have active status set to true
4. WHEN a user deactivates a strategy, THE LineraTrade AI System SHALL immediately stop evaluating that strategy for new signals
5. THE Dashboard SHALL visually distinguish active strategies from inactive strategies using color coding or icons

### Requirement 9: Wallet Integration

**User Story:** As a user, I want to connect my crypto wallet to the platform, so that I can authenticate and manage my trading strategies securely.

#### Acceptance Criteria

1. THE LineraTrade AI System SHALL support wallet connection via RainbowKit, Phantom, or wagmi libraries
2. WHEN a user connects their wallet, THE Dashboard SHALL display the connected wallet address
3. THE LineraTrade AI System SHALL associate all created strategies with the connected wallet address as the owner
4. THE LineraTrade AI System SHALL verify wallet signatures for all state-changing operations on the Linera App Chain
5. WHEN a user disconnects their wallet, THE Dashboard SHALL clear all user-specific data from the interface

### Requirement 10: Order Fill Recording and Verification

**User Story:** As a trader, I want all executed trades to be recorded on-chain with transaction details, so that I have a transparent and immutable record of my trading history.

#### Acceptance Criteria

1. WHEN the Relayer successfully executes a trade, THE Relayer SHALL call the record_order_fill function with order ID, transaction hash, and fill price
2. THE Linera App Chain SHALL update the order status to "filled" and store the transaction hash and fill price
3. THE Linera App Chain SHALL emit an OrderFilled event containing the complete order details
4. THE Dashboard SHALL display filled orders with links to Solana blockchain explorers for transaction verification
5. THE Linera App Chain SHALL prevent duplicate fill recordings by validating that each order ID can only be filled once

### Requirement 11: Multi-Relayer Support

**User Story:** As a platform operator, I want to support multiple relayers for high availability, so that trade execution continues even if one relayer fails.

#### Acceptance Criteria

1. THE LineraTrade AI System SHALL allow multiple Relayer instances to subscribe to the same Linera indexer events
2. WHEN multiple relayers receive the same event, THE Linera App Chain SHALL accept only the first valid order fill transaction
3. THE Relayer SHALL implement retry logic with exponential backoff for failed transaction submissions up to 3 attempts
4. THE Relayer SHALL log all execution attempts, successes, and failures for monitoring and debugging
5. IF all relayers fail to execute an order within 30 seconds, THEN THE LineraTrade AI System SHALL emit an OrderExecutionFailed event

### Requirement 12: Security and Risk Management

**User Story:** As a user, I want the platform to implement security measures and risk controls, so that my funds and strategies are protected from unauthorized access and excessive losses.

#### Acceptance Criteria

1. THE Relayer SHALL store private keys in secure hardware security modules (HSM) or offline signers, never in plain text
2. THE LineraTrade AI System SHALL implement rate limiting of 10 orders per user per minute to prevent abuse
3. THE Strategy Builder SHALL sandbox DSL execution to prevent arbitrary code execution vulnerabilities
4. THE Linera App Chain SHALL implement replay protection using nonces or timestamps for all transactions
5. THE LineraTrade AI System SHALL enforce maximum position size limits and require users to set stop-loss parameters for all strategies

### Requirement 13: Historical Data and Backtesting

**User Story:** As a trader, I want to replay historical tweets and backtest my strategies, so that I can evaluate strategy performance before deploying with real funds.

#### Acceptance Criteria

1. THE LineraTrade AI System SHALL store historical tweets and signals for a minimum of 90 days
2. THE Dashboard SHALL provide a backtesting interface where users can select date ranges and strategies to test
3. WHEN a user initiates backtesting, THE LineraTrade AI System SHALL replay historical signals against the selected strategy and calculate simulated P&L
4. THE Dashboard SHALL display backtesting results including total return, win rate, maximum drawdown, and Sharpe ratio
5. THE LineraTrade AI System SHALL clearly label backtested results as simulated and not actual trading performance

### Requirement 14: Performance Monitoring and Analytics

**User Story:** As a trader, I want to view detailed performance analytics for my strategies, so that I can identify which strategies are profitable and optimize my trading approach.

#### Acceptance Criteria

1. THE Dashboard SHALL display per-strategy metrics including total trades, win rate, average profit per trade, and maximum drawdown
2. THE Dashboard SHALL provide time-series charts showing cumulative P&L over daily, weekly, and monthly periods
3. THE Dashboard SHALL calculate and display risk-adjusted returns using Sharpe ratio and Sortino ratio
4. THE Dashboard SHALL allow users to compare performance across multiple strategies using side-by-side visualizations
5. THE Dashboard SHALL export performance data to CSV format for external analysis

### Requirement 15: Educational Safeguards

**User Story:** As a platform operator, I want to clearly communicate that the platform is for educational purposes, so that users understand the risks and do not trade with funds they cannot afford to lose.

#### Acceptance Criteria

1. THE Dashboard SHALL display a prominent disclaimer on first login stating the platform is for educational use only
2. THE Dashboard SHALL require users to acknowledge the disclaimer before accessing trading features
3. THE Dashboard SHALL recommend using Solana devnet for testing before deploying strategies on mainnet
4. THE Dashboard SHALL provide documentation and tutorials explaining how the system works and associated risks
5. THE Dashboard SHALL display warnings when users attempt to activate strategies that may result in high-risk trades
