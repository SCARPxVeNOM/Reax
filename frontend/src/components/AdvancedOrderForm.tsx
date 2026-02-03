'use client';

import React, { useState } from 'react';
import { advancedOrderApi, DEXOrder, RouteHop, ConditionalTrigger } from '@/lib/api';

interface AdvancedOrderFormProps {
    strategyId: number;
    onOrderCreated?: (orderId: number) => void;
}

export const AdvancedOrderForm: React.FC<AdvancedOrderFormProps> = ({ strategyId, onOrderCreated }) => {
    const [orderType, setOrderType] = useState<'immediate' | 'conditional' | 'multi-hop'>('immediate');
    const [loading, setLoading] = useState(false);

    const [order, setOrder] = useState<Partial<DEXOrder>>({
        strategy_id: strategyId,
        dex: 'Jupiter',
        input_mint: '',
        output_mint: '',
        input_amount: 0,
        output_amount: 0,
        slippage_bps: 100,
        priority_fee: 0,
        route_path: [],
        execution_mode: 'Immediate',
    });

    const [trigger, setTrigger] = useState<Partial<ConditionalTrigger>>({
        trigger_type: 'PriceThreshold',
        threshold: 0,
        comparison: 'GreaterThan',
        active: true,
    });

    const [routeHops, setRouteHops] = useState<RouteHop[]>([]);

    const addRouteHop = () => {
        setRouteHops([...routeHops, {
            dex: 'Jupiter',
            input_mint: '',
            output_mint: '',
            expected_output: 0,
        }]);
    };

    const updateRouteHop = (index: number, field: keyof RouteHop, value: any) => {
        const updated = [...routeHops];
        updated[index] = { ...updated[index], [field]: value };
        setRouteHops(updated);
    };

    const removeRouteHop = (index: number) => {
        setRouteHops(routeHops.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const fullOrder: DEXOrder = {
                ...order as DEXOrder,
                route_path: orderType === 'multi-hop' ? routeHops : [],
                is_multi_hop: orderType === 'multi-hop',
                conditional_trigger: orderType === 'conditional' ? trigger as ConditionalTrigger : undefined,
                execution_mode: orderType === 'conditional' ? 'Conditional' : 'Immediate',
            };

            const result = await advancedOrderApi.createMultiHopOrder(fullOrder);
            onOrderCreated?.(result.orderId);

            // Reset form
            setOrder({
                strategy_id: strategyId,
                dex: 'Jupiter',
                input_mint: '',
                output_mint: '',
                input_amount: 0,
                output_amount: 0,
                slippage_bps: 100,
                priority_fee: 0,
            });
            setRouteHops([]);
        } catch (error) {
            console.error('Failed to create order:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <span className="text-2xl">⚡</span> Advanced Order
            </h3>

            {/* Order Type Tabs */}
            <div className="flex gap-2 mb-6">
                {(['immediate', 'conditional', 'multi-hop'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setOrderType(type)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${orderType === type
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                    >
                        {type.replace('-', ' ')}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Order Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">DEX</label>
                        <select
                            value={order.dex}
                            onChange={(e) => setOrder(prev => ({ ...prev, dex: e.target.value as any }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        >
                            <option value="Jupiter">Jupiter</option>
                            <option value="Raydium">Raydium</option>
                            <option value="Binance">Binance</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Slippage (bps)</label>
                        <input
                            type="number"
                            value={order.slippage_bps}
                            onChange={(e) => setOrder(prev => ({ ...prev, slippage_bps: Number(e.target.value) }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Input Token</label>
                        <input
                            type="text"
                            value={order.input_mint}
                            onChange={(e) => setOrder(prev => ({ ...prev, input_mint: e.target.value }))}
                            placeholder="Token mint address"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Output Token</label>
                        <input
                            type="text"
                            value={order.output_mint}
                            onChange={(e) => setOrder(prev => ({ ...prev, output_mint: e.target.value }))}
                            placeholder="Token mint address"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-2">Input Amount</label>
                    <input
                        type="number"
                        value={order.input_amount}
                        onChange={(e) => setOrder(prev => ({ ...prev, input_amount: Number(e.target.value) }))}
                        placeholder="Amount in base units"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>

                {/* Conditional Trigger */}
                {orderType === 'conditional' && (
                    <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                        <h4 className="text-gray-300 font-medium flex items-center gap-2">
                            <span>🎯</span> Trigger Conditions
                        </h4>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Type</label>
                                <select
                                    value={trigger.trigger_type}
                                    onChange={(e) => setTrigger(prev => ({ ...prev, trigger_type: e.target.value as any }))}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                >
                                    <option value="PriceThreshold">Price</option>
                                    <option value="MarketProbability">Market Probability</option>
                                    <option value="VolumeThreshold">Volume</option>
                                    <option value="TimeBasedTrigger">Time</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Comparison</label>
                                <select
                                    value={trigger.comparison}
                                    onChange={(e) => setTrigger(prev => ({ ...prev, comparison: e.target.value as any }))}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                >
                                    <option value="GreaterThan">&gt;</option>
                                    <option value="LessThan">&lt;</option>
                                    <option value="GreaterThanOrEqual">≥</option>
                                    <option value="LessThanOrEqual">≤</option>
                                    <option value="Equal">=</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Threshold</label>
                                <input
                                    type="number"
                                    value={trigger.threshold}
                                    onChange={(e) => setTrigger(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Multi-hop Route */}
                {orderType === 'multi-hop' && (
                    <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-gray-300 font-medium flex items-center gap-2">
                                <span>🔀</span> Route Hops
                            </h4>
                            <button
                                type="button"
                                onClick={addRouteHop}
                                className="text-purple-400 text-sm hover:text-purple-300"
                            >
                                + Add Hop
                            </button>
                        </div>

                        {routeHops.map((hop, index) => (
                            <div key={index} className="bg-gray-700/50 rounded-lg p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">Hop {index + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeRouteHop(index)}
                                        className="text-red-400 text-sm hover:text-red-300"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <select
                                        value={hop.dex}
                                        onChange={(e) => updateRouteHop(index, 'dex', e.target.value)}
                                        className="bg-gray-600 border border-gray-500 rounded-lg px-2 py-2 text-white text-sm"
                                    >
                                        <option value="Jupiter">Jupiter</option>
                                        <option value="Raydium">Raydium</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={hop.input_mint}
                                        onChange={(e) => updateRouteHop(index, 'input_mint', e.target.value)}
                                        placeholder="Input mint"
                                        className="bg-gray-600 border border-gray-500 rounded-lg px-2 py-2 text-white text-sm placeholder-gray-400"
                                    />
                                    <input
                                        type="text"
                                        value={hop.output_mint}
                                        onChange={(e) => updateRouteHop(index, 'output_mint', e.target.value)}
                                        placeholder="Output mint"
                                        className="bg-gray-600 border border-gray-500 rounded-lg px-2 py-2 text-white text-sm placeholder-gray-400"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {loading ? 'Creating Order...' : 'Create Order'}
                </button>
            </form>
        </div>
    );
};

export default AdvancedOrderForm;
