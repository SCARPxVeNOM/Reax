'use client';

import Link from 'next/link';
import { GlassCard, GlowButton, GradientText } from '@/components/ui';
import {
  LineChart,
  Cpu,
  Users,
  Wallet,
  ArrowRight,
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';

const features = [
  {
    href: '/trading',
    icon: <LineChart className="w-8 h-8 text-blue-400" />,
    title: 'Pro Trading',
    description: 'Execute trades with zero latency on Linera microchains. Integrated with Jupiter & Raydium.',
    color: 'blue'
  },
  {
    href: '/strategies',
    icon: <Cpu className="w-8 h-8 text-purple-400" />,
    title: 'AI Strategies',
    description: 'Build automated trading bots using our visual builder or PineScript.',
    color: 'purple'
  },
  {
    href: '/social',
    icon: <Users className="w-8 h-8 text-pink-400" />,
    title: 'Social Copy',
    description: 'Follow top performing traders. Swipe to copy their exact strategy execution.',
    color: 'pink'
  },
  {
    href: '/microchains',
    icon: <Wallet className="w-8 h-8 text-green-400" />,
    title: 'My Microchain',
    description: 'Manage your on-chain identity, funds, and execution settings.',
    color: 'green'
  }
];

export default function Home() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(to_bottom,white,transparent)]">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* Hero Section */}
        <div className="text-center space-y-6 animate-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm font-medium text-blue-400 mb-4 hover:border-blue-500/30 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live on Conway Testnet
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            <GradientText>Welcome To ReaX</GradientText>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The first Web3-native social trading platform powered by Linera microchains.
            <span className="text-gray-300"> Verifiable execution, zero latency, infinite scalability.</span>
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/trading">
              <GlowButton size="lg" icon={<Zap size={20} />}>
                Start Trading
              </GlowButton>
            </Link>
            <Link href="/strategies">
              <GlowButton variant="secondary" size="lg" icon={<Activity size={20} />}>
                Explore Strategies
              </GlowButton>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <Link key={i} href={feature.href} className="group">
              <GlassCard className="h-full p-8 hover:bg-white/5 transition-all duration-300 group-hover:-translate-y-2">
                <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform duration-300 border border-white/5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  {feature.description}
                </p>
                <div className="flex items-center text-sm font-medium text-gray-500 group-hover:text-white transition-colors">
                  Open {feature.title} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>

        {/* Security / Trust Section */}
        <div className="glass-panel rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="space-y-4 max-w-xl relative z-10">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <ShieldCheck className="text-green-400" size={32} />
              Secured by Linera
            </h2>
            <p className="text-gray-400 text-lg">
              Your assets never leave your microchain until execution.
              All strategies are verified on-chain with cryptographic proofs.
            </p>
          </div>

          <div className="flex gap-4 relative z-10">
            <GlowButton variant="ghost" onClick={() => window.open('https://linera.io', '_blank')}>
              Read Whitepaper
            </GlowButton>
            <Link href="/microchains">
              <GlowButton variant="secondary">
                View Network Status
              </GlowButton>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
