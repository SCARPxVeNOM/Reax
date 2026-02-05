'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { microchainService, MicrochainProfile, Strategy } from '@/lib/microchain-service';

interface Trade {
    id: string;
    strategyId?: string;
    pair: string;
    type: 'buy' | 'sell';
    amount: number;
    price: number;
    pnl: number;
    time: string;
    status: 'filled' | 'pending' | 'failed';
    txHash?: string;
    microchainId: string;
    microchainName?: string;
}

interface MicrochainContextType {
    // Current Profile
    profile: MicrochainProfile | null;
    isLoadingProfile: boolean;
    setProfile: (profile: MicrochainProfile | null) => void;
    refreshProfile: () => Promise<void>;
    disconnectProfile: () => void;

    // All Profiles (for analytics)
    allProfiles: MicrochainProfile[];

    // Current Microchain Strategies
    myStrategies: Strategy[];
    followedStrategies: Strategy[];
    publishedStrategiesCount: number;
    addStrategy: (strategy: Strategy) => void;
    followStrategy: (strategy: Strategy) => void;
    unfollowStrategy: (strategyId: string) => void;
    refreshStrategies: () => Promise<void>;

    // ALL Strategies across all microchains (for Social)
    allStrategies: Strategy[];

    // Current profile trades
    profileTrades: Trade[];
    addTrade: (trade: Trade) => void;

    // ALL Trades across all microchains (for Analytics)
    allTrades: Trade[];

    // Wallet
    walletAddress: string | null;
    setWalletAddress: (address: string) => void;
}

const MicrochainContext = createContext<MicrochainContextType | undefined>(undefined);

export function MicrochainProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<MicrochainProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [allProfiles, setAllProfiles] = useState<MicrochainProfile[]>([]);
    const [myStrategies, setMyStrategies] = useState<Strategy[]>([]);
    const [followedStrategies, setFollowedStrategies] = useState<Strategy[]>([]);
    const [allStrategies, setAllStrategies] = useState<Strategy[]>([]);
    const [profileTrades, setProfileTrades] = useState<Trade[]>([]);
    const [allTrades, setAllTrades] = useState<Trade[]>([]);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    // Load ONLY global data from localStorage on mount (NOT current profile)
    // Current profile is only set through explicit button actions
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // DO NOT auto-load current wallet or profile - user must connect via button

            // Load ALL profiles ever created (for analytics/display only)
            const savedProfiles = localStorage.getItem('all_microchain_profiles');
            if (savedProfiles) {
                setAllProfiles(JSON.parse(savedProfiles));
            }

            // Load ALL strategies across all microchains (for Social page)
            const savedAllStrategies = localStorage.getItem('all_microchain_strategies');
            if (savedAllStrategies) {
                setAllStrategies(JSON.parse(savedAllStrategies));
            }

            // Load ALL trades across all microchains (for Analytics)
            const savedAllTrades = localStorage.getItem('all_microchain_trades');
            if (savedAllTrades) {
                setAllTrades(JSON.parse(savedAllTrades));
            }

            setIsLoadingProfile(false);
        }
    }, []);

    // Disconnect current profile (allows creating new one)
    const disconnectProfile = useCallback(() => {
        // Save current profile to allProfiles before disconnecting
        if (profile && !allProfiles.find(p => p.id === profile.id)) {
            const updated = [...allProfiles, profile];
            setAllProfiles(updated);
            localStorage.setItem('all_microchain_profiles', JSON.stringify(updated));
        }

        // Clear current session
        setProfile(null);
        setWalletAddress(null);
        setMyStrategies([]);
        setFollowedStrategies([]);
        setProfileTrades([]);

        // Clear localStorage for current session
        localStorage.removeItem('connected_wallet');
        localStorage.removeItem('microchain_wallet');
        localStorage.removeItem('microchain_profile');
        localStorage.removeItem('followed_strategies');
        localStorage.removeItem('profile_trades');
    }, [profile, allProfiles]);

    // Refresh current profile
    const refreshProfile = useCallback(async () => {
        if (!walletAddress) {
            setProfile(null);
            setIsLoadingProfile(false);
            return;
        }

        setIsLoadingProfile(true);
        try {
            const fetchedProfile = await microchainService.getProfile(walletAddress);
            setProfile(fetchedProfile);

            // Update localStorage
            if (fetchedProfile) {
                localStorage.setItem('microchain_profile', JSON.stringify(fetchedProfile));

                // Add to allProfiles if not exists
                if (!allProfiles.find(p => p.id === fetchedProfile.id)) {
                    const updated = [...allProfiles, fetchedProfile];
                    setAllProfiles(updated);
                    localStorage.setItem('all_microchain_profiles', JSON.stringify(updated));
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setIsLoadingProfile(false);
        }
    }, [walletAddress, allProfiles]);

    // Refresh strategies
    const refreshStrategies = useCallback(async () => {
        try {
            const strategies = await microchainService.getPublicStrategies();
            setAllStrategies(strategies);
            localStorage.setItem('all_microchain_strategies', JSON.stringify(strategies));

            // Filter for current user's strategies
            if (walletAddress) {
                const mine = strategies.filter(s => s.owner === walletAddress || s.owner === 'current_user');
                setMyStrategies(mine);
            }
        } catch (error) {
            console.error('Failed to fetch strategies:', error);
            const localStrategies = JSON.parse(localStorage.getItem('all_microchain_strategies') || '[]');
            setAllStrategies(localStrategies);
        }
    }, [walletAddress]);

    useEffect(() => {
        refreshProfile();
    }, [refreshProfile]);

    useEffect(() => {
        refreshStrategies();
    }, [refreshStrategies]);

    // Add a new strategy (saves to both my & all)
    const addStrategy = useCallback((strategy: Strategy) => {
        // Add microchain info
        const enrichedStrategy = {
            ...strategy,
            owner: profile?.name || 'current_user',
            microchainId: profile?.id || walletAddress || 'demo',
        };

        setMyStrategies(prev => [...prev, enrichedStrategy]);
        setAllStrategies(prev => {
            const updated = [...prev, enrichedStrategy];
            localStorage.setItem('all_microchain_strategies', JSON.stringify(updated));
            return updated;
        });
    }, [profile, walletAddress]);

    // Follow a strategy
    const followStrategy = useCallback((strategy: Strategy) => {
        setFollowedStrategies(prev => {
            if (prev.find(s => s.id === strategy.id)) return prev;
            const updated = [...prev, strategy];
            localStorage.setItem('followed_strategies', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Unfollow a strategy
    const unfollowStrategy = useCallback((strategyId: string) => {
        setFollowedStrategies(prev => {
            const updated = prev.filter(s => s.id !== strategyId);
            localStorage.setItem('followed_strategies', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Add a trade (saves to both profile & all)
    const addTrade = useCallback((trade: Trade) => {
        const enrichedTrade = {
            ...trade,
            microchainName: profile?.name,
        };

        setProfileTrades(prev => {
            const updated = [enrichedTrade, ...prev];
            localStorage.setItem('profile_trades', JSON.stringify(updated.slice(0, 100)));
            return updated;
        });

        setAllTrades(prev => {
            const updated = [enrichedTrade, ...prev];
            localStorage.setItem('all_microchain_trades', JSON.stringify(updated.slice(0, 500)));
            return updated;
        });
    }, [profile]);

    // Update wallet and save
    const handleSetWalletAddress = useCallback((address: string) => {
        setWalletAddress(address);
        localStorage.setItem('connected_wallet', address);
    }, []);

    const value: MicrochainContextType = {
        profile,
        isLoadingProfile,
        setProfile,
        refreshProfile,
        disconnectProfile,
        allProfiles,
        myStrategies,
        followedStrategies,
        publishedStrategiesCount: myStrategies.length,
        addStrategy,
        followStrategy,
        unfollowStrategy,
        refreshStrategies,
        allStrategies,
        profileTrades,
        addTrade,
        allTrades,
        walletAddress,
        setWalletAddress: handleSetWalletAddress,
    };

    return (
        <MicrochainContext.Provider value={value}>
            {children}
        </MicrochainContext.Provider>
    );
}

export function useMicrochain() {
    const context = useContext(MicrochainContext);
    if (context === undefined) {
        throw new Error('useMicrochain must be used within a MicrochainProvider');
    }
    return context;
}

export type { Trade, MicrochainContextType };

