'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { getLineraClient } from '../lib/linera-client';

interface LineraContextType {
  client: ReturnType<typeof getLineraClient>;
  isConnected: boolean;
}

const LineraContext = createContext<LineraContextType | undefined>(undefined);

export function LineraProvider({ children }: { children: ReactNode }) {
  const client = getLineraClient();
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        await client.connect();
        if (mounted) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to connect to Linera:', error);
      }
    }

    connect();

    return () => {
      mounted = false;
      client.disconnect();
    };
  }, []);

  return (
    <LineraContext.Provider value={{ client, isConnected }}>
      {children}
    </LineraContext.Provider>
  );
}

export function useLineraContext() {
  const context = useContext(LineraContext);
  if (context === undefined) {
    throw new Error('useLineraContext must be used within LineraProvider');
  }
  return context;
}

