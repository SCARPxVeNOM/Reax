import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LineraProvider } from '../components/LineraProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LineraTrade AI',
  description: 'AI-powered trading infrastructure on Linera microchains',
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
          {children}
        </LineraProvider>
      </body>
    </html>
  )
}
