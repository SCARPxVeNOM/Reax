'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Signal {
  id: number;
  token: string;
  sentiment: string;
  confidence: number;
}

interface SignalsByTokenChartProps {
  signals: Signal[];
}

export function SignalsByTokenChart({ signals }: SignalsByTokenChartProps) {
  // Group signals by token and count
  const tokenCounts = signals.reduce((acc, signal) => {
    const token = signal.token || 'Unknown';
    if (!acc[token]) {
      acc[token] = { token, count: 0, bullish: 0, bearish: 0 };
    }
    acc[token].count++;
    if (signal.sentiment === 'bullish') {
      acc[token].bullish++;
    } else {
      acc[token].bearish++;
    }
    return acc;
  }, {} as Record<string, { token: string; count: number; bullish: number; bearish: number }>);

  const chartData = Object.values(tokenCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
    .map((item) => ({
      token: item.token,
      signals: item.count,
      bullish: item.bullish,
      bearish: item.bearish,
    }));

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No signal data available</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="token" 
            stroke="#666"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#666" />
          <Tooltip 
            formatter={(value: any, name: string) => {
              if (name === 'signals') return [value, 'Total Signals'];
              if (name === 'bullish') return [value, 'Bullish'];
              if (name === 'bearish') return [value, 'Bearish'];
              return [value, name];
            }}
          />
          <Bar dataKey="signals" fill="#3b82f6" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

