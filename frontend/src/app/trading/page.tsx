'use client';

import { useState, useEffect } from 'react';
import { useLineraContext } from '@/components/LineraProvider';
import { useMicrochain, Trade } from '@/components/MicrochainContext';
import { LineraIntegrationService } from '@/lib/linera-integration';
import { GlassCard, GlowButton, GlassInput, GradientText } from '@/components/ui';
import {
  ArrowRightLeft,
  Wallet,
  History,
  TrendingUp,
  Activity,
  AlertCircle,
  Zap,
  Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';

const lineraService = new LineraIntegrationService();

export default function TradingPage() {
  const { isConnected } = useLineraContext();
  const {
    profile,
    profileTrades,
    addTrade,
    followedStrategies,
    walletAddress
  } = useMicrochain();

  const [selectedDex, setSelectedDex] = useState<'jupiter' | 'raydium'>('jupiter');
  const [tradeForm, setTradeForm] = useState({
    pair: 'SOL/USDC',
    amount: '',
    slippage: '0.5',
    type: 'buy' as 'buy' | 'sell',
    strategyId: '' as string,
  });
  const [isExecuting, setIsExecuting] = useState(false);

  // Use trades from Microchain context
  const trades = profileTrades;

  const handleExecuteTrade = async () => {
    if (!tradeForm.amount) return;

    setIsExecuting(true);
    const [inputToken, outputToken] = tradeForm.pair.split('/');

    // Create trade object linked to Microchain profile
    const newTrade: Trade = {
      id: `trade_${Date.now()}`,
      strategyId: tradeForm.strategyId || undefined,
      pair: tradeForm.pair,
      type: tradeForm.type,
      amount: parseFloat(tradeForm.amount),
      price: 0,
      pnl: 0,
      time: new Date().toLocaleTimeString(),
      status: 'pending',
      microchainId: profile?.id || walletAddress || 'demo',
    };

    // Add to context immediately (shows as pending)
    addTrade(newTrade);

    try {
      // Create DEX order via Linera
      const { orderId } = await lineraService.createDEXOrder({
        dex: selectedDex.toUpperCase() as 'JUPITER' | 'RAYDIUM',
        inputToken: tradeForm.type === 'buy' ? outputToken : inputToken,
        outputToken: tradeForm.type === 'buy' ? inputToken : outputToken,
        inputAmount: parseFloat(tradeForm.amount),
        slippageBps: parseInt(tradeForm.slippage) * 100,
      });

      // Execute the order
      const result = await lineraService.executeDEXOrder(orderId);

      // Add filled trade to history via context
      const filledTrade: Trade = {
        id: `trade_${orderId || Date.now()}`,
        strategyId: tradeForm.strategyId || undefined,
        pair: tradeForm.pair,
        type: tradeForm.type,
        amount: parseFloat(tradeForm.amount),
        price: 100 + Math.random() * 10,
        pnl: Math.random() * 10 - 2,
        time: new Date().toLocaleTimeString(),
        status: 'filled',
        txHash: result.txHash,
        microchainId: profile?.id || walletAddress || 'demo',
      };
      addTrade(filledTrade);

      // Clear form
      setTradeForm(prev => ({ ...prev, amount: '' }));
    } catch (error) {
      console.error('Trade execution failed:', error);
      // Add failed trade
      const failedTrade: Trade = {
        id: `trade_${Date.now()}`,
        pair: tradeForm.pair,
        type: tradeForm.type,
        amount: parseFloat(tradeForm.amount),
        price: 0,
        pnl: 0,
        time: new Date().toLocaleTimeString(),
        status: 'failed',
        microchainId: profile?.id || walletAddress || 'demo',
      };
      addTrade(failedTrade);
      alert(`Trade failed: ${error instanceof Error ? error.message : 'Chain unavailable'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const totalPnl = trades.filter(t => t.status === 'filled').reduce((sum, t) => sum + t.pnl, 0);
  const winRate = Math.round((trades.filter(t => t.pnl > 0).length / trades.filter(t => t.status === 'filled').length) * 100) || 0;

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-[url('/grid.svg')] bg-center bg-fixed">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2"> <GradientText>Trading Terminal</GradientText></h1>
            <p className="text-gray-400">Execute zero-latency trades via Linera Microchains</p>
          </div>

          <div className="flex gap-4">
            {/* Microchain Profile Badge */}
            {profile && (
              <Link href="/microchains" className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm text-gray-400 hover:bg-white/10 transition-colors">
                <LinkIcon className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-medium">{profile.name}</span>
              </Link>
            )}

            {/* Followed Strategies Badge */}
            {followedStrategies.length > 0 && (
              <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm text-gray-400">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>{followedStrategies.length} Strategies</span>
              </div>
            )}

            <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm text-gray-400">
              <Wallet className="w-4 h-4" />
              <span>Balance:</span>
              <span className="text-white font-mono font-bold">$12,450.00</span>
            </div>
          </div>
        </div>

        {/* Connection Banner */}
        {!isConnected && (
          <GlassCard className="p-4 border-yellow-500/20 bg-yellow-500/5 flex items-center gap-3">
            <AlertCircle className="text-yellow-500" />
            <span className="text-yellow-200">Demo Mode Active - Connect your wallet to execute real trades on Linera Mainnet.</span>
          </GlassCard>
        )}

        {/* Followed Strategies Quick Actions */}
        {followedStrategies.length > 0 && (
          <GlassCard className="p-4 border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="text-purple-400" />
                <span className="text-white font-medium">Active Strategies from Social</span>
              </div>
              <div className="flex gap-2">
                {followedStrategies.slice(0, 3).map(strategy => (
                  <button
                    key={strategy.id}
                    onClick={() => setTradeForm(prev => ({ ...prev, strategyId: strategy.id }))}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${tradeForm.strategyId === strategy.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                  >
                    {strategy.name}
                  </button>
                ))}
                {followedStrategies.length > 3 && (
                  <span className="px-3 py-1 text-gray-500 text-sm">+{followedStrategies.length - 3} more</span>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Charts & History */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <TrendingUp size={16} /> Total PnL
                </div>
                <div className={`text-2xl font-bold font-mono ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                </div>
              </GlassCard>
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <Activity size={16} /> Win Rate
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {winRate}%
                </div>
              </GlassCard>
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <History size={16} /> Trades
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {trades.length}
                </div>
              </GlassCard>
            </div>

            {/* Trade History */}
            <GlassCard className="p-6 h-[500px] overflow-hidden flex flex-col">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <History className="text-blue-400" /> Trade History
              </h3>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {trades.map(trade => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {trade.type === 'buy' ? '↗' : '↘'}
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{trade.pair}</div>
                        <div className="text-xs text-gray-500">{trade.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium text-white">
                        {trade.amount} @ ${trade.price.toFixed(2)}
                      </div>
                      <div className={`text-xs font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.status === 'pending' ? (
                          <span className="text-yellow-400 animate-pulse">Pending...</span>
                        ) : (
                          <>{trade.pnl >= 0 ? '+' : ''}{trade.pnl}%</>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Execution Panel */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 sticky top-24">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Execute Trade</h2>
                <div className="px-2 py-1 rounded-md bg-white/10 text-xs text-gray-400 font-mono">
                  V0.4.2
                </div>
              </div>

              {/* DEX Selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setSelectedDex('jupiter')}
                  className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${selectedDex === 'jupiter'
                    ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                    }`}
                >
                  <span className="text-2xl">🪐</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Jupiter</span>
                </button>
                <button
                  onClick={() => setSelectedDex('raydium')}
                  className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${selectedDex === 'raydium'
                    ? 'bg-purple-500/20 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                    }`}
                >
                  <span className="text-2xl">☢️</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Raydium</span>
                </button>
              </div>

              {/* Main Form */}
              <div className="space-y-4">
                <div className="p-1 bg-white/5 rounded-xl flex gap-1 mb-6">
                  <button
                    onClick={() => setTradeForm(prev => ({ ...prev, type: 'buy' }))}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${tradeForm.type === 'buy' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => setTradeForm(prev => ({ ...prev, type: 'sell' }))}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${tradeForm.type === 'sell' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    SELL
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Token Pair</label>
                  <select
                    value={tradeForm.pair}
                    onChange={(e) => setTradeForm(prev => ({ ...prev, pair: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors appearance-none"
                  >
                    <option>SOL/USDC</option>
                    <option>BTC/USDC</option>
                    <option>ETH/USDC</option>
                    <option>JUP/USDC</option>
                  </select>
                </div>

                <GlassInput
                  label="AMOUNT"
                  type="number"
                  placeholder="0.00"
                  value={tradeForm.amount}
                  onChange={(e) => setTradeForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="text-xl font-mono font-bold"
                />

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Slippage</label>
                  <div className="flex gap-2">
                    {['0.1', '0.5', '1.0'].map(s => (
                      <button
                        key={s}
                        onClick={() => setTradeForm(prev => ({ ...prev, slippage: s }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-colors ${tradeForm.slippage === s
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10'
                          }`}
                      >
                        {s}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <GlowButton
                    size="lg"
                    variant={tradeForm.type === 'buy' ? 'primary' : 'secondary'}
                    onClick={handleExecuteTrade}
                    disabled={!tradeForm.amount || isExecuting}
                    className={`w-full ${tradeForm.type === 'sell' ? '!bg-red-500 !shadow-red-500/20' : ''}`}
                  >
                    {isExecuting ? (
                      <span className="flex items-center gap-2">
                        <TrendingUp className="animate-spin" /> Executing
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ArrowRightLeft size={18} />
                        {tradeForm.type === 'buy' ? 'Buy' : 'Sell'} {tradeForm.pair}
                      </span>
                    )}
                  </GlowButton>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
