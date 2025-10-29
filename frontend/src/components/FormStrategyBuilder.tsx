'use client';

import { useState } from 'react';
import { useLinera } from '../lib/linera-hooks';

interface FormData {
  name: string;
  tokenPair: string;
  buyPrice: number;
  sellTarget: number;
  trailingStop: number;
  takeProfit: number;
  maxLoss: number;
}

export function FormStrategyBuilder() {
  const { client, isConnected } = useLinera();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    tokenPair: 'SOL/USDC',
    buyPrice: 0,
    sellTarget: 0,
    trailingStop: 2.0,
    takeProfit: 5.0,
    maxLoss: 2.0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Strategy name is required';
    }

    if (!formData.tokenPair.trim()) {
      newErrors.tokenPair = 'Token pair is required';
    }

    if (formData.trailingStop < 0 || formData.trailingStop > 100) {
      newErrors.trailingStop = 'Trailing stop must be between 0-100%';
    }

    if (formData.takeProfit < 0 || formData.takeProfit > 100) {
      newErrors.takeProfit = 'Take profit must be between 0-100%';
    }

    if (formData.maxLoss < 0 || formData.maxLoss > 100) {
      newErrors.maxLoss = 'Max loss must be between 0-100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!isConnected || !client) {
      alert('Not connected to Linera. Please wait for connection...');
      return;
    }

    setIsSubmitting(true);
    setSuccess(false);

    try {
      const strategy = {
        owner: 'user-' + Date.now().toString(), // Temporary owner ID
        name: formData.name,
        strategy_type: {
          Form: {
            token_pair: formData.tokenPair,
            buy_price: formData.buyPrice,
            sell_target: formData.sellTarget,
            trailing_stop_pct: formData.trailingStop,
            take_profit_pct: formData.takeProfit,
            max_loss_pct: formData.maxLoss,
          },
        },
        active: false,
        created_at: Math.floor(Date.now() / 1000),
      };

      const strategyId = await client.createStrategy(strategy);

      console.log('Strategy created with ID:', strategyId);
      setSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: '',
          tokenPair: 'SOL/USDC',
          buyPrice: 0,
          sellTarget: 0,
          trailingStop: 2.0,
          takeProfit: 5.0,
          maxLoss: 2.0,
        });
        setSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error creating strategy:', error);
      setErrors({ 
        submit: error.message || 'Failed to create strategy. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">Connecting to Linera...</div>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Strategy Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Strategy Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="My Trading Strategy"
          required
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Token Pair */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Token Pair *
        </label>
        <input
          type="text"
          value={formData.tokenPair}
          onChange={(e) => setFormData({ ...formData, tokenPair: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="SOL/USDC"
          required
        />
        {errors.tokenPair && <p className="mt-1 text-sm text-red-600">{errors.tokenPair}</p>}
      </div>

      {/* Price Targets */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buy Price ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.buyPrice || ''}
            onChange={(e) => setFormData({ ...formData, buyPrice: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sell Target ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.sellTarget || ''}
            onChange={(e) => setFormData({ ...formData, sellTarget: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Risk Management */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trailing Stop (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.trailingStop}
            onChange={(e) => setFormData({ ...formData, trailingStop: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.trailingStop && (
            <p className="mt-1 text-sm text-red-600">{errors.trailingStop}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Take Profit (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.takeProfit}
            onChange={(e) => setFormData({ ...formData, takeProfit: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.takeProfit && <p className="mt-1 text-sm text-red-600">{errors.takeProfit}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Loss (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.maxLoss}
            onChange={(e) => setFormData({ ...formData, maxLoss: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.maxLoss && <p className="mt-1 text-sm text-red-600">{errors.maxLoss}</p>}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {isSubmitting ? 'Creating...' : 'Create Strategy on Linera'}
        </button>

        {success && (
          <p className="text-green-600 font-medium flex items-center gap-2">
            ✓ Strategy created successfully on Linera chain!
          </p>
        )}

        {errors.submit && <p className="text-red-600">{errors.submit}</p>}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        * Strategy will be created on the Linera blockchain and can be activated/deactivated from the dashboard.
      </p>
    </form>
  );
}
