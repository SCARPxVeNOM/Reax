# LineraTrade AI - User Documentation

## Table of Contents
1. [Getting Started](#getting-started)
2. [Form Builder Guide](#form-builder-guide)
3. [DSL Syntax Reference](#dsl-syntax-reference)
4. [Risk Management Best Practices](#risk-management-best-practices)
5. [Example Strategies](#example-strategies)

## Getting Started

### Prerequisites
- Phantom wallet installed
- Solana Devnet SOL (for testing)
- Basic understanding of cryptocurrency trading

### First Steps
1. **Connect Your Wallet**: Click "Connect Wallet" in the top right
2. **Review the Disclaimer**: Read and acknowledge the educational disclaimer
3. **Create Your First Strategy**: Use the Strategy Builder to create a simple strategy
4. **Test on Devnet**: Always test strategies on Solana Devnet first

### Important Safety Tips
- ⚠️ **Never use real funds for testing**
- ⚠️ **Start with Solana Devnet**
- ⚠️ **Set stop-loss limits on all strategies**
- ⚠️ **Monitor your positions regularly**

## Form Builder Guide

The Form Builder provides a no-code interface for creating trading strategies.

### Fields Explained

**Token Pair**
- The cryptocurrency pair you want to trade (e.g., SOL/USDC)
- Must match available tokens on the DEX

**Buy Price**
- The target price at which to enter a position
- Leave at 0 to buy at market price

**Sell Target**
- The price at which to take profits
- Recommended: 5-10% above buy price

**Trailing Stop (%)**
- Automatically adjusts stop-loss as price moves in your favor
- Recommended: 2-5%

**Take Profit (%)**
- Automatically closes position when profit target is reached
- Recommended: 5-15%

**Max Loss (%)**
- Maximum acceptable loss before closing position
- **REQUIRED** - Never trade without a stop-loss
- Recommended: 2-5%

### Example Form Strategy

```
Token Pair: SOL/USDC
Buy Price: 0 (market)
Sell Target: 110 (if SOL is at $100)
Trailing Stop: 3%
Take Profit: 10%
Max Loss: 5%
```

## DSL Syntax Reference

The Domain-Specific Language (DSL) allows advanced users to write custom trading logic.

### Basic Structure

```
strategy("Strategy Name") {
  if <condition> {
    <action>
  }
}
```

### Conditions

**Tweet Analysis**
```
tweet.contains("bullish")
tweet.contains("moon")
```

**Token Metrics**
```
token.volume > 1000000
price > 100
```

**Technical Indicators**
```
rsi(14) < 30        // RSI below 30 (oversold)
rsi(14) > 70        // RSI above 70 (overbought)
sma(50) > sma(200)  // Golden cross
ema(12) > ema(26)   // MACD-like signal
```

**Logical Operators**
```
condition1 and condition2
condition1 or condition2
price > 100 and rsi(14) < 30
```

### Actions

**Buy**
```
buy(token, qty=0.1, sl=2%, tp=5%)
```

**Sell**
```
sell()
sell(qty=0.5)  // Sell half position
```

### Complete DSL Examples

**RSI Strategy**
```
strategy("RSI Oversold") {
  if rsi(14) < 30 and token.volume > 500000 {
    buy(token, qty=0.2, sl=3%, tp=8%)
  }
  if rsi(14) > 70 {
    sell()
  }
}
```

**Tweet Sentiment Strategy**
```
strategy("Influencer Signals") {
  if tweet.contains("bullish") and price > sma(50) {
    buy(token, qty=0.15, sl=2%, tp=10%)
  }
  if tweet.contains("bearish") {
    sell()
  }
}
```

**Moving Average Crossover**
```
strategy("MA Crossover") {
  if sma(50) > sma(200) and rsi(14) < 60 {
    buy(token, qty=0.25, sl=4%, tp=12%)
  }
  if sma(50) < sma(200) {
    sell()
  }
}
```

## Risk Management Best Practices

### Position Sizing
- **Never risk more than 1-2% of capital per trade**
- Use the `qty` parameter to control position size
- Start small and scale up gradually

### Stop-Loss Rules
- **Always set a stop-loss** - No exceptions
- Typical stop-loss: 2-5% below entry
- Adjust based on volatility

### Take Profit Targets
- Set realistic profit targets (5-15%)
- Consider taking partial profits
- Use trailing stops to lock in gains

### Diversification
- Don't put all capital in one strategy
- Test multiple strategies simultaneously
- Spread risk across different tokens

### Monitoring
- Check positions at least daily
- Review strategy performance weekly
- Adjust or disable underperforming strategies

### Emotional Discipline
- Stick to your strategy rules
- Don't chase losses
- Don't overtrade
- Take breaks after losses

## Example Strategies

### Conservative Strategy (Form)
```
Token Pair: SOL/USDC
Buy Price: Market
Sell Target: +5%
Trailing Stop: 2%
Take Profit: 5%
Max Loss: 2%
```

**Use Case**: Low-risk, steady gains
**Expected Win Rate**: 60-70%
**Risk Level**: Low

### Aggressive Strategy (DSL)
```
strategy("High Conviction Trades") {
  if tweet.contains("major announcement") and token.volume > 2000000 {
    buy(token, qty=0.3, sl=5%, tp=20%)
  }
  if price < sma(50) {
    sell()
  }
}
```

**Use Case**: High-risk, high-reward on major news
**Expected Win Rate**: 40-50%
**Risk Level**: High

### Balanced Strategy (DSL)
```
strategy("Balanced RSI + Sentiment") {
  if rsi(14) < 35 and tweet.contains("bullish") {
    buy(token, qty=0.2, sl=3%, tp=10%)
  }
  if rsi(14) > 65 or price > entry * 1.10 {
    sell()
  }
}
```

**Use Case**: Medium risk, combines technical and sentiment
**Expected Win Rate**: 55-65%
**Risk Level**: Medium

## Backtesting Your Strategy

Before deploying a strategy with real funds:

1. Navigate to the Backtesting page
2. Select your strategy
3. Choose a date range (at least 30 days)
4. Review the results:
   - Total Return
   - Win Rate
   - Max Drawdown
   - Sharpe Ratio

**Interpretation**:
- Win Rate > 55%: Good
- Max Drawdown < 20%: Acceptable
- Sharpe Ratio > 1.0: Good risk-adjusted returns

## Troubleshooting

### Strategy Not Executing
- Check if strategy is activated
- Verify wallet is connected
- Ensure sufficient balance
- Check Linera node connection

### Orders Failing
- Verify token contract address
- Check DEX liquidity
- Ensure gas fees are covered
- Review error logs

### Performance Issues
- Reduce number of active strategies
- Increase poll intervals
- Check network connectivity

## Support and Resources

- **Documentation**: https://linera.dev/
- **Discord**: [Community Link]
- **GitHub**: [Repository Link]

## Legal Disclaimer

This platform is for educational purposes only. Cryptocurrency trading involves substantial risk. Never invest more than you can afford to lose. The creators accept no liability for losses incurred through use of this platform.

---

**Remember**: Test on Devnet first, use stop-losses always, and never risk more than you can afford to lose.
