'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Order {
  id: number;
  strategy_id: number;
  signal_id: number;
  order_type: string;
  token: string;
  quantity: number;
  status: string;
  tx_hash?: string;
  fill_price?: number;
  created_at: number;
}

interface PerformanceChartProps {
  orders?: Order[];
  data?: { timestamp: number; pnl: number }[];
}

export function PerformanceChart({ orders, data }: PerformanceChartProps) {
  // If data prop is provided (for demo), use it directly
  // Otherwise, compute from orders
  let chartData: { timestamp: number; pnl: number }[] = [];

  if (data) {
    chartData = data;
  } else if (orders && orders.length > 0) {
    // Calculate P&L from orders for real data
    // For now, show a simple progression based on order timestamps
    chartData = orders
      .sort((a, b) => a.created_at - b.created_at)
      .slice(-20)
      .map((order, index) => ({
        timestamp: order.created_at,
        pnl: order.fill_price 
          ? (order.order_type === 'BUY' ? 1 : -1) * (order.fill_price * order.quantity * 0.01)
          : index * 0.5,
      }));
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-500">No performance data available</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTimestamp}
            stroke="#666"
          />
          <YAxis 
            stroke="#666"
            label={{ value: 'P&L ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'P&L']}
            labelFormatter={(label: any) => formatTimestamp(label)}
          />
          <Line 
            type="monotone" 
            dataKey="pnl" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
