import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LineraProvider } from '../components/LineraProvider'
import { Navigation } from '../components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LineraTrade AI - Advanced Trading Platform',
  description: 'Multi-DEX trading, PineScript strategies, and social trading on Linera microchains',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Linera service runs on port 8080 and provides GraphQL API */}
      </head>
      <body className={inter.className}>
        <LineraProvider>
          <Navigation />
          {children}
        </LineraProvider>
      </body>
    </html>
  )
}
