import { useEffect, useState, useCallback } from 'react';
import { getLineraClient } from './linera-client-graphql';

/**
 * React hook for Linera client
 * Manages connection and provides easy access
 */
export function useLinera() {
  const [client, setClient] = useState<ReturnType<typeof getLineraClient> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        const lineraClient = getLineraClient();

        if (mounted) {
          setClient(lineraClient);
          setIsConnected(true);
          // Get chain ID and application ID from environment
          setChainId(process.env.NEXT_PUBLIC_LINERA_CHAIN_ID || null);
          setApplicationId(process.env.NEXT_PUBLIC_LINERA_APP_ID || null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          console.error('Failed to connect to Linera:', err);
        }
      }
    }

    connect();

    return () => {
      mounted = false;
      client?.disconnect();
    };
  }, []);

  return { client, isConnected, error, chainId, applicationId };
}

/**
 * Hook to subscribe to Linera events
 */
export function useLineraEvents(callback: (event: any) => void) {
  const { client, isConnected } = useLinera();

  useEffect(() => {
    if (!isConnected || !client) return;

    let unsubscribe: (() => void) | null = null;

    const setup = async () => {
      unsubscribe = await client.subscribeToEvents((event) => {
        callback(event);
      });
    };

    setup();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isConnected, client, callback]);
}

/**
 * Hook to query signals with auto-refresh
 */
export function useSignals(limit: number = 50, offset: number = 0) {
  const { client, isConnected } = useLinera();
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSignals = useCallback(async () => {
    if (!isConnected || !client) return;

    try {
      setLoading(true);
      const data = await client.getSignals(limit, offset);
      setSignals(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, client, limit, offset]);

  useEffect(() => {
    fetchSignals();

    // Subscribe to real-time updates
    if (isConnected && client) {
      let unsubscribe: (() => void) | null = null;

      const setup = async () => {
        unsubscribe = await client.subscribeToEvents((event) => {
          if (event.type === 'update') {
            fetchSignals();
          }
        });
      };

      setup();

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isConnected, client, fetchSignals]);

  return { signals, loading, error, refetch: fetchSignals };
}

/**
 * Hook to query strategies with auto-refresh
 */
export function useStrategies(owner?: string, limit: number = 50, offset: number = 0) {
  const { client, isConnected } = useLinera();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStrategies = useCallback(async () => {
    if (!isConnected || !client) return;

    try {
      setLoading(true);
      const data = await client.getStrategies(owner, limit, offset);
      setStrategies(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, client, owner, limit, offset]);

  useEffect(() => {
    fetchStrategies();

    // Subscribe to real-time updates
    if (isConnected && client) {
      let unsubscribe: (() => void) | null = null;

      const setup = async () => {
        unsubscribe = await client.subscribeToEvents((event) => {
          if (event.type === 'update') {
            fetchStrategies();
          }
        });
      };

      setup();

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isConnected, client, fetchStrategies]);

  return { strategies, loading, error, refetch: fetchStrategies };
}

/**
 * Hook to query orders with auto-refresh
 */
export function useOrders(strategyId?: number, status?: string, limit: number = 50, offset: number = 0) {
  const { client, isConnected } = useLinera();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isConnected || !client) return;

    try {
      setLoading(true);
      const data = await client.getOrders(strategyId, status, limit, offset);
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, client, strategyId, status, limit, offset]);

  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time updates
    if (isConnected && client) {
      let unsubscribe: (() => void) | null = null;

      const setup = async () => {
        unsubscribe = await client.subscribeToEvents((event) => {
          if (event.type === 'update') {
            fetchOrders();
          }
        });
      };

      setup();

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isConnected, client, fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
