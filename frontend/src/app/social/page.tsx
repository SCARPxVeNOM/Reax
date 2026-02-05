'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLineraContext } from '@/components/LineraProvider';
import { useMicrochain } from '@/components/MicrochainContext';
import { microchainService, Strategy } from '@/lib/microchain-service';
import { LineraIntegrationService } from '@/lib/linera-integration';
import { GlassCard, GlowButton, GradientText } from '@/components/ui';
import { Heart, X, Star, TrendingUp, ShieldAlert, BarChart3, User } from 'lucide-react';
import Link from 'next/link';

const lineraService = new LineraIntegrationService();

export default function SocialPage() {
  const { isConnected } = useLineraContext();
  const { followStrategy, followedStrategies, allStrategies, refreshStrategies } = useMicrochain();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate deterministic physics for the "shuffled" look
  const cardPhysics = useMemo(() => {
    return Array.from({ length: 50 }, () => ({
      rotation: Math.random() * 16 - 8, // -8 to +8 degrees
      offsetX: Math.random() * 30 - 15, // -15px to +15px horizontal jitter
      offsetY: Math.random() * 20 - 10, // -10px to +10px vertical jitter
    }));
  }, []);

  // Use ALL strategies from context (from all microchains)
  useEffect(() => {
    async function fetchStrategies() {
      setIsLoading(true);
      try {
        // Use allStrategies from context (all microchains)
        let data: Strategy[] = allStrategies || [];

        // Fall back to service if context is empty
        if (data.length === 0) {
          data = await microchainService.getPublicStrategies();
        }

        // Filter out already followed strategies
        const followedIds = new Set(followedStrategies.map(s => s.id));
        const unfollowed = data.filter(s => !followedIds.has(s.id));
        setStrategies(unfollowed);
      } catch (error) {
        console.error('Failed to fetch strategies:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStrategies();
  }, [followedStrategies, allStrategies]);

  const currentStrategy = strategies[currentIndex];
  // Show up to 4 cards in the stack for depth
  const stackDepth = 4;
  const visibleStrategies = strategies.slice(currentIndex, currentIndex + stackDepth);
  const hasMore = currentIndex < strategies.length;

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!hasMore || !currentStrategy) return;

    if (direction === 'right') {
      setIsFollowing(true);
      try {
        await lineraService.followStrategy({
          strategyId: currentStrategy.id,
          allocationAmount: 100,
          riskLimitPercent: 10,
        });
        // Persist to MicrochainContext
        followStrategy(currentStrategy);
        setAccepted(prev => [...prev, currentStrategy.id]);
      } catch (error) {
        console.error('Failed to follow strategy on Linera:', error);
        // Still persist locally even if Linera fails
        followStrategy(currentStrategy);
        setAccepted(prev => [...prev, currentStrategy.id]);
      } finally {
        setIsFollowing(false);
      }
    } else {
      setRejected(prev => [...prev, currentStrategy.id]);
    }
    setCurrentIndex(prev => prev + 1);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'low': return 'text-green-400 border-green-400/30 bg-green-400/10';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-purple-500 border-l-transparent animate-spin" />
          <p className="text-gray-400 font-medium">Synced with Linera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden bg-[url('/grid.svg')] bg-center bg-fixed">
      {/* Header */}
      <div className="mb-12 text-center animate-in" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-4xl font-bold mb-3">
          <GradientText animate={true}>Strategy Discovery</GradientText>
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Swipe to allow your Microchain to automatically mirror top performing traders.
        </p>
      </div>

      {/* Card Stack Area */}
      <div className="relative w-full max-w-md h-[650px] flex items-center justify-center" style={{ perspective: '1000px' }}>
        {hasMore ? (
          <>
            {/* Render stack in reverse order so top card is last (highest z-index) in DOM if strictly absolute, 
                but here we use z-index explicitly. 
                Actually, iterating visibleStrategies:
                i=0 is current (Top). i=1 is next (Behind).
            */}
            {visibleStrategies.map((strategy, i) => {
              // Get consistent physics based on the original index of the strategy
              const realIndex = currentIndex + i;
              const physics = cardPhysics[realIndex % cardPhysics.length];
              const isTop = i === 0;

              // Calculate transform
              // Top card: Centered, no rotate (or slight interactive), Scale 1
              // Back cards: Random rotate, slight offset, Scale down
              const scale = 1 - (i * 0.05);
              const translateY = i * 15; // Stack vertically a bit
              const rotate = isTop ? 0 : physics.rotation;
              const dx = isTop ? 0 : physics.offsetX;
              const dy = isTop ? 0 : physics.offsetY;

              // Opacity: Top is 1, others fade slightly (but keep solid for realism)
              const opacity = 1 - (i * 0.15);

              return (
                <div
                  key={strategy.id}
                  className={`absolute w-full h-full p-4 transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1) ${isTop ? 'cursor-grab active:cursor-grabbing hover:-translate-y-2' : ''}`}
                  style={{
                    zIndex: 100 - i,
                    transform: `
                      translate3d(${dx}px, ${translateY + dy}px, -${i * 50}px)
                      rotate(${rotate}deg)
                      scale(${scale})
                    `,
                    opacity: opacity,
                    filter: isTop ? 'none' : `brightness(${1 - i * 0.1}) blur(${i * 2}px)`,
                  }}
                >
                  {/* Card Container */}
                  <GlassCard
                    hover3D={true}
                    className="w-full h-full flex flex-col p-0 overflow-hidden !border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl bg-[#0A0A0A]/90"
                  >

                    {/* Gloss Reflection Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />

                    {/* Card Header */}
                    <div className="h-32 bg-gradient-to-br from-blue-900/40 to-purple-900/40 relative group-hover:from-blue-900/50 group-hover:to-purple-900/50 transition-colors">
                      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30" />

                      {/* Owner Avatar - Floating */}
                      <div className="absolute -bottom-10 left-6 z-20">
                        <div className="w-20 h-20 rounded-2xl bg-[#0F0F11] border-4 border-[#0F0F11] shadow-xl flex items-center justify-center overflow-hidden">
                          <User size={40} className="text-gray-500" />
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1 text-xs font-bold text-yellow-400 shadow-lg">
                          <Star size={12} fill="currentColor" />
                          <span>TOP RATED</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="mt-12 px-6 pb-6 flex-1 flex flex-col relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-1 line-clamp-1">{strategy.name}</h2>
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            <span>by {strategy.owner}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span className="text-blue-400 flex items-center gap-1">
                              <ShieldAlert size={12} /> Verifiable
                            </span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${getRiskColor(strategy.riskLevel)}`}>
                          {strategy.riskLevel}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {strategy.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-gray-300">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Visual Chart Placeholder */}
                      <div className="flex-1 bg-black/20 rounded-2xl p-4 mb-6 relative overflow-hidden border border-white/5 inner-shadow">
                        <div className="absolute inset-x-0 top-4 px-4 flex justify-between text-xs text-gray-400 uppercase tracking-wider font-bold z-10">
                          <span className="flex items-center gap-1"><BarChart3 size={12} /> Performance</span>
                          <span className="text-green-400">+153% All time</span>
                        </div>

                        <div className="h-full flex items-end justify-between gap-1 pt-8 px-1">
                          {Array.from({ length: 24 }).map((_, k) => {
                            // Deterministic "random" height based on strategy id + index
                            const seed = strategy.id.charCodeAt(0) + k;
                            const height = 20 + (seed % 80);
                            const isGreen = (seed % 10) > 3;
                            return (
                              <div
                                key={k}
                                className={`w-full rounded-sm ${isGreen ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{
                                  height: `${height}%`,
                                  opacity: 0.6 + height / 200
                                }}
                              />
                            )
                          })}
                        </div>
                      </div>

                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-6 pt-4 border-t border-white/5">
                        <div className="text-center">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Win Rate</div>
                          <div className="text-lg font-mono font-bold text-white">{strategy.performance.winRate}%</div>
                        </div>
                        <div className="text-center border-l border-white/5">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Trades</div>
                          <div className="text-lg font-mono font-bold text-white">{strategy.performance.totalTrades}</div>
                        </div>
                        <div className="text-center border-l border-white/5">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Avg ROI</div>
                          <div className="text-lg font-mono font-bold text-green-400">+{strategy.performance.avgReturn}%</div>
                        </div>
                      </div>

                      {/* Swipe Actions - only on top card */}
                      <div className={`grid grid-cols-2 gap-4 mt-auto transition-opacity duration-300 ${isTop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <GlowButton
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); handleSwipe('left'); }}
                          disabled={isFollowing}
                          animated={true}
                          className="h-12 border-red-500/20 hover:bg-red-500/10 hover:text-red-400 text-gray-400"
                        >
                          <X size={20} />
                          <span className="ml-2">Pass</span>
                        </GlowButton>
                        <GlowButton
                          variant="primary"
                          onClick={(e) => { e.stopPropagation(); handleSwipe('right'); }}
                          disabled={isFollowing}
                          animated={true}
                          className="h-12"
                        >
                          {isFollowing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Heart size={20} className={isFollowing ? 'fill-current' : ''} />
                          )}
                          <span className="ml-2">Follow</span>
                        </GlowButton>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              );
            })}
          </>
        ) : (
          /* Empty State */
          <div className="text-center max-w-sm animate-in">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/30">
              <Star size={40} className="text-white fill-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">All Caught Up!</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              You've reviewed all currently active strategies on the Linera network.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <div className="text-2xl font-bold text-green-400 mb-1">{accepted.length}</div>
                <div className="text-xs text-green-300 font-bold uppercase tracking-wider">Following</div>
              </div>
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <div className="text-2xl font-bold text-red-400 mb-1">{rejected.length}</div>
                <div className="text-xs text-red-300 font-bold uppercase tracking-wider">Skipped</div>
              </div>
            </div>

            <Link href="/trading" className="w-full block">
              <GlowButton size="lg" className="w-full" animated={true}>
                Go to Trading Terminal
              </GlowButton>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
