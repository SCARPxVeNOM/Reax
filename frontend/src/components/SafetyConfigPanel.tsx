'use client';

import React, { useState, useEffect } from 'react';
import { safetyApi, SafetyConfig } from '@/lib/api';

interface SafetyConfigPanelProps {
    owner: string;
    onConfigChange?: (config: SafetyConfig) => void;
}

export const SafetyConfigPanel: React.FC<SafetyConfigPanelProps> = ({ owner, onConfigChange }) => {
    const [config, setConfig] = useState<SafetyConfig>({
        owner,
        max_position_per_token: 1000,
        max_portfolio_exposure: 10000,
        slippage_tolerance_bps: 100,
        max_slippage_bps: 500,
        require_stop_loss: true,
        require_take_profit: false,
        enable_auto_validation: true,
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const existingConfig = await safetyApi.getConfig(owner);
                if (existingConfig && !existingConfig.message) {
                    setConfig(existingConfig);
                }
            } catch (error) {
                console.error('Failed to fetch safety config:', error);
            }
        };
        fetchConfig();
    }, [owner]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await safetyApi.updateConfig(config);
            setSaved(true);
            onConfigChange?.(config);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to save safety config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSliderChange = (field: keyof SafetyConfig, value: number) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleToggle = (field: keyof SafetyConfig) => {
        setConfig(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🛡️</span> Safety Configuration
                </h3>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${saved
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                        }`}
                >
                    {loading ? 'Saving...' : saved ? '✓ Saved' : 'Save Config'}
                </button>
            </div>

            <div className="space-y-6">
                {/* Position Limits */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                    <h4 className="text-gray-400 text-sm font-medium mb-4">Position Limits</h4>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-300">Max Position Per Token</span>
                                <span className="text-purple-400 font-mono">${config.max_position_per_token}</span>
                            </div>
                            <input
                                type="range"
                                min={100}
                                max={10000}
                                step={100}
                                value={config.max_position_per_token}
                                onChange={(e) => handleSliderChange('max_position_per_token', Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-300">Max Portfolio Exposure</span>
                                <span className="text-purple-400 font-mono">${config.max_portfolio_exposure}</span>
                            </div>
                            <input
                                type="range"
                                min={1000}
                                max={100000}
                                step={1000}
                                value={config.max_portfolio_exposure}
                                onChange={(e) => handleSliderChange('max_portfolio_exposure', Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Slippage Settings */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                    <h4 className="text-gray-400 text-sm font-medium mb-4">Slippage Tolerance</h4>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-300">Default Slippage</span>
                                <span className="text-cyan-400 font-mono">{(config.slippage_tolerance_bps / 100).toFixed(2)}%</span>
                            </div>
                            <input
                                type="range"
                                min={10}
                                max={500}
                                step={10}
                                value={config.slippage_tolerance_bps}
                                onChange={(e) => handleSliderChange('slippage_tolerance_bps', Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-300">Max Allowed Slippage</span>
                                <span className="text-orange-400 font-mono">{(config.max_slippage_bps / 100).toFixed(2)}%</span>
                            </div>
                            <input
                                type="range"
                                min={100}
                                max={1000}
                                step={50}
                                value={config.max_slippage_bps}
                                onChange={(e) => handleSliderChange('max_slippage_bps', Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Safety Toggles */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                    <h4 className="text-gray-400 text-sm font-medium mb-4">Safety Requirements</h4>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">Require Stop Loss</span>
                            <button
                                onClick={() => handleToggle('require_stop_loss')}
                                className={`w-12 h-6 rounded-full transition-colors ${config.require_stop_loss ? 'bg-green-500' : 'bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 bg-white rounded-full transition-transform ${config.require_stop_loss ? 'translate-x-6' : 'translate-x-0.5'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">Require Take Profit</span>
                            <button
                                onClick={() => handleToggle('require_take_profit')}
                                className={`w-12 h-6 rounded-full transition-colors ${config.require_take_profit ? 'bg-green-500' : 'bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 bg-white rounded-full transition-transform ${config.require_take_profit ? 'translate-x-6' : 'translate-x-0.5'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">Auto-Validate Orders</span>
                            <button
                                onClick={() => handleToggle('enable_auto_validation')}
                                className={`w-12 h-6 rounded-full transition-colors ${config.enable_auto_validation ? 'bg-green-500' : 'bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 bg-white rounded-full transition-transform ${config.enable_auto_validation ? 'translate-x-6' : 'translate-x-0.5'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SafetyConfigPanel;
