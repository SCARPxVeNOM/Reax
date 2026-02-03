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
        console.log('Attempting to connect to Linera...');
        // Set a timeout for connection to avoid hanging indefinitely
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 2000)
        );

        await Promise.race([client.connect(), timeoutPromise]);

        if (mounted) {
          console.log('Connected to Linera successfully');
          setIsConnected(true);
        }
      } catch (error) {
        console.warn('Failed to connect to Linera (Backend might be offline). Running in Demo Mode.', error);
        // Do not re-throw, allow app to run in disconnected mode
      }
    }

    connect();

    return () => {
      mounted = false;
      client.disconnect().catch(console.error);
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

