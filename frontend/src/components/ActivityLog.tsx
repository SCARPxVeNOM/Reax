'use client';

interface ActivityItem {
  id: string;
  type: 'signal' | 'order' | 'strategy' | 'system';
  message: string;
  user?: string;
  role?: string;
  timestamp: number;
  status?: 'success' | 'warning' | 'error';
}

interface ActivityLogProps {
  title: string;
  items: ActivityItem[];
  onViewAll?: () => void;
}

export function ActivityLog({ title, items, onViewAll }: ActivityLogProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const colors = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors] || colors.success}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        )}
      </div>
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No activity yet
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(item.status)}
                  <span className="text-sm text-gray-700">{item.message}</span>
                </div>
                {item.user && (
                  <div className="text-xs text-gray-500">
                    {item.user} {item.role && `(${item.role})`}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">{formatTime(item.timestamp)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

