'use client';

import { useState, useEffect } from 'react';
import { useLineraContext } from '@/components/LineraProvider';
import { microchainService, MicrochainProfile } from '@/lib/microchain-service';
import { GlassCard, GlowButton, GlassInput, GradientText } from '@/components/ui';
import { Wallet, Shield, Eye, Lock, Users, TrendingUp, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function MicrochainsPage() {
  const { isConnected } = useLineraContext();
  const [profile, setProfile] = useState({
    name: '',
    wallet: '',
    visibility: 'public' as 'public' | 'private' | 'gated',
  });
  const [existingProfile, setExistingProfile] = useState<MicrochainProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [created, setCreated] = useState(false);

  // Check for existing profile on mount
  useEffect(() => {
    async function checkProfile() {
      const storedWallet = localStorage.getItem('microchain_wallet');
      if (storedWallet) {
        const existing = await microchainService.getProfile(storedWallet);
        if (existing) {
          setExistingProfile(existing);
        }
      }
    }
    checkProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newProfile = await microchainService.createProfile({
        name: profile.name,
        wallet: profile.wallet,
        chains: ['linera'],
        visibility: profile.visibility,
      });

      localStorage.setItem('microchain_wallet', profile.wallet);
      localStorage.setItem('microchain_profile', JSON.stringify(newProfile));

      setExistingProfile(newProfile);
      setCreated(true);
    } catch (error) {
      console.error('Failed to create profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show existing profile dashboard
  if (existingProfile || created) {
    const displayProfile = existingProfile || {
      name: profile.name,
      wallets: [profile.wallet],
      visibility: profile.visibility,
      strategiesCount: 0,
      tradesCount: 0,
    };

    return (
      <div className="min-h-screen pt-24 pb-12 px-6 bg-[url('/grid.svg')] bg-center bg-fixed">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <GlassCard className="p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-4xl shadow-lg shadow-purple-500/20">
                ⛓️
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{displayProfile.name}</h1>
                <p className="text-gray-400">Linera Microchain Profile</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                    {isConnected ? '🟢 Chain Synced' : '🟡 Demo Mode'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-400 border border-white/10 capitalize">
                    {displayProfile.visibility}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                <div className="text-3xl font-bold text-white">{displayProfile.strategiesCount}</div>
                <div className="text-sm text-gray-400">Strategies</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                <div className="text-3xl font-bold text-white">{displayProfile.tradesCount}</div>
                <div className="text-sm text-gray-400">Trades Executed</div>
              </div>
            </div>
          </GlassCard>

          {/* Connected Wallet */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Wallet size={20} className="text-blue-400" />
              Connected Wallet
            </h2>
            {displayProfile.wallets?.map((wallet: string, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="font-mono text-sm text-gray-300">{wallet}</div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  Primary
                </span>
              </div>
            ))}
          </GlassCard>

          {/* Infrastructure Info */}
          <GlassCard className="p-6 border-l-4 !border-l-purple-500">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⚡</span>
              <h3 className="font-bold text-white">Linera Microchain</h3>
            </div>
            <p className="text-sm text-gray-400">
              Your microchain provides isolated execution for your strategies. Trading is routed through Solana DEXs (Jupiter & Raydium) for actual token swaps.
            </p>
          </GlassCard>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href="/strategies" className="flex-1">
              <GlowButton className="w-full" size="lg">
                Create Strategy
              </GlowButton>
            </Link>
            <Link href="/trading" className="flex-1">
              <GlowButton variant="secondary" className="w-full" size="lg">
                Start Trading
              </GlowButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show profile creation form
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-[url('/grid.svg')] bg-center bg-fixed">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">⛓️</div>
          <h1 className="text-4xl md:text-5xl font-bold">
            <GradientText>Create Your Microchain</GradientText>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Your Microchain is your on-chain identity on Linera. It provides isolated execution for your trading strategies.
          </p>

          {!isConnected && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium">
              <AlertTriangle size={16} />
              Demo Mode - Profile will be stored locally
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <GlassCard className="p-8 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Microchain Name
              </label>
              <GlassInput
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., TraderMike"
                required
              />
            </div>

            {/* Wallet */}
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Connected Wallet (Solana)
              </label>
              <GlassInput
                value={profile.wallet}
                onChange={(e) => setProfile(prev => ({ ...prev, wallet: e.target.value }))}
                placeholder="Your Solana wallet address..."
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                This wallet will be used for trading on Jupiter & Raydium DEXs.
              </p>
            </div>

            {/* Infrastructure Info */}
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚡</span>
                <span className="font-bold text-sm text-white">Linera Microchain</span>
              </div>
              <p className="text-xs text-gray-400">
                Your microchain will be created on the Linera blockchain for strategy execution and verification.
                Actual trades are routed to Solana DEXs.
              </p>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Strategy Visibility
              </label>
              <div className="flex gap-3">
                {[
                  { v: 'public', icon: <Eye size={16} />, label: 'Public' },
                  { v: 'private', icon: <Lock size={16} />, label: 'Private' },
                  { v: 'gated', icon: <Users size={16} />, label: 'Gated' },
                ].map(({ v, icon, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setProfile(prev => ({ ...prev, visibility: v as 'public' | 'private' | 'gated' }))}
                    className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${profile.visibility === v
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <GlowButton
              type="submit"
              disabled={isLoading || !profile.name || !profile.wallet}
              className="w-full h-14 text-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Microchain...
                </span>
              ) : (
                'Create Microchain'
              )}
            </GlowButton>

            <p className="text-xs text-center text-gray-500">
              {isConnected
                ? 'Your profile will be synced to the Linera blockchain'
                : 'Profile will be stored locally until Linera is connected'}
            </p>
          </GlassCard>
        </form>
      </div>
    </div>
  );
}
