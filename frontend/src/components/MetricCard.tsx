'use client';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  trend?: 'up' | 'down';
}

export function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  const changeColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const changeIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  return (
    <div className="glass-card rounded-xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-800">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {change !== undefined && (
            <div className={`text-sm mt-1 font-semibold ${changeColor}`}>
              {changeIcon} {Math.abs(change)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

