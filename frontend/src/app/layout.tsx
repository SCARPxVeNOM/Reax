'use client';

import './globals.css';
import { LineraProvider } from '@/components/LineraProvider';
import { MicrochainProvider } from '@/components/MicrochainContext';
import { Navigation } from '@/components/Navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>ReaX | Microchain Social Trading</title>
        <meta name="description" content="Web3-native social trading platform with Linera Microchains - Zero Latency, Infinite Scalability" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <LineraProvider>
          <MicrochainProvider>
            <Navigation />
            <main className="min-h-screen">
              {children}
            </main>
          </MicrochainProvider>
        </LineraProvider>
      </body>
    </html>
  );
}
