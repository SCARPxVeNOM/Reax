'use client';

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
  filled_at?: number;
}

interface OrdersListProps {
  orders: Order[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function OrdersList({ orders, loading = false, onRefresh }: OrdersListProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'filled':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeColor = (type: string) => {
    return type.toLowerCase() === 'buy'
      ? 'text-green-600 font-bold'
      : 'text-red-600 font-bold';
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Orders</h2>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh orders"
            >
              🔄 Refresh
            </button>
          )}
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {loading && orders.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders yet. Orders will appear here when strategies are executed.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${getOrderTypeColor(order.order_type)}`}>
                      {order.order_type.toUpperCase()}
                    </span>
                    <span className="text-gray-900 font-medium">{order.token}</span>
                  </div>
                  <span className="text-xs text-gray-500">Order #{order.id}</span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mt-2">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                {order.fill_price && (
                  <div className="flex justify-between">
                    <span>Fill Price:</span>
                    <span className="font-medium text-green-600">${order.fill_price.toFixed(4)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created:</span>
                  <span>{formatTimestamp(order.created_at)}</span>
                </div>
                {order.filled_at && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Filled:</span>
                    <span>{formatTimestamp(order.filled_at)}</span>
                  </div>
                )}
              </div>

              {order.tx_hash && (
                <a
                  href={`https://explorer.solana.com/tx/${order.tx_hash}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                >
                  View on Solana Explorer →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
