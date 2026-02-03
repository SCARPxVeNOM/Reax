/**
 * Linera Storage Service
 * Uses Linera blockchain as primary storage with in-memory fallback for demo mode
 */

import { LineraClient, Strategy, Order, Signal } from '../linera-client';

export interface MicrochainProfile {
    id: string;
    name: string;
    owner: string;
    wallets: string[];
    preferredChains: string[];
    visibility: 'public' | 'private' | 'gated';
    createdAt: number;
    strategiesCount: number;
    tradesCount: number;
}

export interface PublishedStrategy {
    id: string;
    name: string;
    owner: string;
    ownerName: string;
    creationMethod: 'visual' | 'image' | 'pinescript';
    code?: string;
    rules?: any;
    visibility: 'public' | 'private' | 'gated';
    tags: string[];
    riskLevel: 'low' | 'medium' | 'high';
    description?: string;
    performance: {
        winRate: number;
        avgReturn: number;
        totalTrades: number;
    };
    createdAt: number;
}

export interface Trade {
    id: string;
    strategyId: string;
    microchainId: string;
    dex: 'JUPITER' | 'RAYDIUM' | 'BINANCE';
    inputToken: string;
    outputToken: string;
    inputAmount: number;
    outputAmount: number;
    pnl: number;
    txHash?: string;
    status: 'pending' | 'filled' | 'failed';
    createdAt: number;
    filledAt?: number;
}

export interface NetworkAnalytics {
    totalMicrochains: number;
    totalStrategies: number;
    totalTrades: number;
    totalVolume: string;
    activeTrades: number;
    chainDistribution: { [chain: string]: number };
    leaderboard: Array<{
        id: string;
        name: string;
        winRate: number;
        roi: number;
        trades: number;
        volume: string;
        chain: string;
    }>;
}

export class LineraStorageService {
    private lineraClient: LineraClient;
    private isLineraConnected: boolean = false;

    // In-memory storage for demo mode (Linera fallback)
    private memoryProfiles: Map<string, MicrochainProfile> = new Map();
    private memoryStrategies: Map<string, PublishedStrategy> = new Map();
    private memoryTrades: Map<string, Trade> = new Map();
    private memoryFollowers: Map<string, string[]> = new Map(); // strategyId -> followerIds

    constructor(lineraClient: LineraClient) {
        this.lineraClient = lineraClient;
        this.initializeDemoData();
        this.checkLineraConnection();
    }

    private async checkLineraConnection(): Promise<void> {
        try {
            // Try to fetch something from Linera to check connection
            await this.lineraClient.getStrategies(undefined, 1, 0);
            this.isLineraConnected = true;
            console.log('✅ Linera blockchain connected');
        } catch (error) {
            this.isLineraConnected = false;
            console.log('⚠️ Linera not connected, using in-memory storage');
        }
    }

    private initializeDemoData(): void {
        // Pre-populate with demo data for testing
        const demoStrategies: PublishedStrategy[] = [
            {
                id: 'strat_demo_1',
                name: 'Breakout Scalping',
                owner: 'mc_demo_1',
                ownerName: 'TraderMike',
                creationMethod: 'visual',
                visibility: 'public',
                tags: ['Crypto', 'Scalping'],
                riskLevel: 'high',
                description: 'High-frequency breakout strategy for volatile markets',
                performance: { winRate: 72, avgReturn: 15, totalTrades: 234 },
                createdAt: Date.now() - 86400000,
            },
            {
                id: 'strat_demo_2',
                name: 'BTC Swing Trade',
                owner: 'mc_demo_2',
                ownerName: 'CryptoQueen',
                creationMethod: 'pinescript',
                visibility: 'public',
                tags: ['Crypto', 'Swing'],
                riskLevel: 'medium',
                description: 'Medium-term swing trading on BTC using trend indicators',
                performance: { winRate: 65, avgReturn: 28, totalTrades: 89 },
                createdAt: Date.now() - 172800000,
            },
            {
                id: 'strat_demo_3',
                name: 'Grid Trading Bot',
                owner: 'mc_demo_3',
                ownerName: 'AlgoBot_v3',
                creationMethod: 'visual',
                visibility: 'public',
                tags: ['Automated', 'DeFi'],
                riskLevel: 'low',
                description: 'Automated grid trading for ranging markets',
                performance: { winRate: 89, avgReturn: 8, totalTrades: 567 },
                createdAt: Date.now() - 259200000,
            },
        ];

        demoStrategies.forEach(s => this.memoryStrategies.set(s.id, s));

        const demoProfiles: MicrochainProfile[] = [
            { id: 'mc_demo_1', name: 'TraderMike', owner: '0x123...', wallets: ['0x123...'], preferredChains: ['linera', 'solana'], visibility: 'public', createdAt: Date.now() - 86400000 * 7, strategiesCount: 5, tradesCount: 234 },
            { id: 'mc_demo_2', name: 'CryptoQueen', owner: '0x456...', wallets: ['0x456...'], preferredChains: ['linera'], visibility: 'public', createdAt: Date.now() - 86400000 * 14, strategiesCount: 3, tradesCount: 89 },
            { id: 'mc_demo_3', name: 'AlgoBot_v3', owner: '0x789...', wallets: ['0x789...'], preferredChains: ['linera', 'ethereum'], visibility: 'public', createdAt: Date.now() - 86400000 * 30, strategiesCount: 8, tradesCount: 567 },
        ];

        demoProfiles.forEach(p => this.memoryProfiles.set(p.id, p));
    }

    // ==================== MICROCHAIN PROFILES ====================

    async createProfile(params: {
        name: string;
        wallet: string;
        chains: string[];
        visibility: 'public' | 'private' | 'gated';
    }): Promise<MicrochainProfile> {
        const profile: MicrochainProfile = {
            id: `mc_${Date.now()}`,
            name: params.name,
            owner: params.wallet,
            wallets: [params.wallet],
            preferredChains: params.chains,
            visibility: params.visibility,
            createdAt: Date.now(),
            strategiesCount: 0,
            tradesCount: 0,
        };

        if (this.isLineraConnected) {
            // Store on Linera blockchain
            try {
                const strategyId = await this.lineraClient.createStrategy({
                    owner: params.wallet,
                    name: `PROFILE:${params.name}`,
                    strategy_type: { Profile: { chains: params.chains, visibility: params.visibility } },
                    active: true,
                    created_at: profile.createdAt,
                });
                profile.id = `mc_${strategyId}`;
            } catch (error) {
                console.error('Failed to store profile on Linera:', error);
            }
        }

        // Always store in memory as cache
        this.memoryProfiles.set(profile.id, profile);
        return profile;
    }

    async getProfile(walletOrId: string): Promise<MicrochainProfile | null> {
        // Check memory first
        for (const profile of this.memoryProfiles.values()) {
            if (profile.id === walletOrId || profile.wallets.includes(walletOrId)) {
                return profile;
            }
        }

        if (this.isLineraConnected) {
            // Try to fetch from Linera
            try {
                const strategies = await this.lineraClient.getStrategies(walletOrId);
                const profileStrategy = strategies.find(s => s.name.startsWith('PROFILE:'));
                if (profileStrategy) {
                    // Parse profile from strategy
                    const profile: MicrochainProfile = {
                        id: `mc_${profileStrategy.id}`,
                        name: profileStrategy.name.replace('PROFILE:', ''),
                        owner: profileStrategy.owner,
                        wallets: [profileStrategy.owner],
                        preferredChains: (profileStrategy.strategy_type as any)?.Profile?.chains || [],
                        visibility: (profileStrategy.strategy_type as any)?.Profile?.visibility || 'public',
                        createdAt: profileStrategy.created_at,
                        strategiesCount: strategies.filter(s => !s.name.startsWith('PROFILE:')).length,
                        tradesCount: 0,
                    };
                    this.memoryProfiles.set(profile.id, profile);
                    return profile;
                }
            } catch (error) {
                console.error('Failed to fetch profile from Linera:', error);
            }
        }

        return null;
    }

    async getAllProfiles(): Promise<MicrochainProfile[]> {
        return Array.from(this.memoryProfiles.values());
    }

    // ==================== STRATEGIES ====================

    async publishStrategy(params: {
        name: string;
        owner: string;
        ownerName: string;
        creationMethod: 'visual' | 'image' | 'pinescript';
        code?: string;
        rules?: any;
        tags: string[];
        riskLevel: 'low' | 'medium' | 'high';
        visibility: 'public' | 'private' | 'gated';
        description?: string;
    }): Promise<PublishedStrategy> {
        const strategy: PublishedStrategy = {
            id: `strat_${Date.now()}`,
            name: params.name,
            owner: params.owner,
            ownerName: params.ownerName,
            creationMethod: params.creationMethod,
            code: params.code,
            rules: params.rules,
            visibility: params.visibility,
            tags: params.tags,
            riskLevel: params.riskLevel,
            description: params.description,
            performance: { winRate: 0, avgReturn: 0, totalTrades: 0 },
            createdAt: Date.now(),
        };

        if (this.isLineraConnected) {
            try {
                const strategyId = await this.lineraClient.createStrategy({
                    owner: params.owner,
                    name: params.name,
                    strategy_type: {
                        Trading: {
                            method: params.creationMethod,
                            code: params.code,
                            rules: params.rules,
                            tags: params.tags,
                            risk: params.riskLevel,
                        },
                    },
                    active: true,
                    created_at: strategy.createdAt,
                });
                strategy.id = `strat_${strategyId}`;
            } catch (error) {
                console.error('Failed to store strategy on Linera:', error);
            }
        }

        this.memoryStrategies.set(strategy.id, strategy);

        // Update owner's strategy count
        const ownerProfile = this.memoryProfiles.get(params.owner);
        if (ownerProfile) {
            ownerProfile.strategiesCount++;
        }

        return strategy;
    }

    async getPublicStrategies(): Promise<PublishedStrategy[]> {
        const strategies = Array.from(this.memoryStrategies.values())
            .filter(s => s.visibility === 'public');

        if (this.isLineraConnected) {
            try {
                const lineraStrategies = await this.lineraClient.getStrategies();
                // Merge with memory strategies, preferring Linera data
                for (const ls of lineraStrategies) {
                    if (!ls.name.startsWith('PROFILE:')) {
                        const existing = strategies.find(s => s.id === `strat_${ls.id}`);
                        if (!existing) {
                            strategies.push({
                                id: `strat_${ls.id}`,
                                name: ls.name,
                                owner: ls.owner,
                                ownerName: ls.owner.substring(0, 8) + '...',
                                creationMethod: (ls.strategy_type as any)?.Trading?.method || 'visual',
                                visibility: 'public',
                                tags: (ls.strategy_type as any)?.Trading?.tags || [],
                                riskLevel: (ls.strategy_type as any)?.Trading?.risk || 'medium',
                                performance: { winRate: 50, avgReturn: 0, totalTrades: 0 },
                                createdAt: ls.created_at,
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch strategies from Linera:', error);
            }
        }

        return strategies.sort((a, b) => b.createdAt - a.createdAt);
    }

    async getStrategy(strategyId: string): Promise<PublishedStrategy | null> {
        return this.memoryStrategies.get(strategyId) || null;
    }

    // ==================== TRADING ====================

    async recordTrade(params: {
        strategyId?: string;
        microchainId: string;
        dex: 'JUPITER' | 'RAYDIUM' | 'BINANCE';
        inputToken: string;
        outputToken: string;
        inputAmount: number;
        outputAmount: number;
        txHash?: string;
    }): Promise<Trade> {
        const trade: Trade = {
            id: `trade_${Date.now()}`,
            strategyId: params.strategyId || 'manual',
            microchainId: params.microchainId,
            dex: params.dex,
            inputToken: params.inputToken,
            outputToken: params.outputToken,
            inputAmount: params.inputAmount,
            outputAmount: params.outputAmount,
            pnl: 0,
            txHash: params.txHash,
            status: 'pending',
            createdAt: Date.now(),
        };

        if (this.isLineraConnected) {
            try {
                const orderId = await this.lineraClient.createOrder({
                    strategy_id: parseInt(params.strategyId?.replace('strat_', '') || '0'),
                    signal_id: 0,
                    order_type: params.dex,
                    token: params.inputToken,
                    quantity: params.inputAmount,
                    status: 'pending',
                    created_at: trade.createdAt,
                });
                trade.id = `trade_${orderId}`;
            } catch (error) {
                console.error('Failed to record trade on Linera:', error);
            }
        }

        this.memoryTrades.set(trade.id, trade);
        return trade;
    }

    async updateTradeStatus(tradeId: string, status: 'filled' | 'failed', txHash?: string, pnl?: number): Promise<void> {
        const trade = this.memoryTrades.get(tradeId);
        if (trade) {
            trade.status = status;
            trade.filledAt = Date.now();
            if (txHash) trade.txHash = txHash;
            if (pnl !== undefined) trade.pnl = pnl;

            if (this.isLineraConnected) {
                try {
                    await this.lineraClient.recordOrderFill(
                        parseInt(tradeId.replace('trade_', '')),
                        txHash || '',
                        pnl || 0,
                        trade.filledAt
                    );
                } catch (error) {
                    console.error('Failed to update trade on Linera:', error);
                }
            }
        }
    }

    async getTrades(microchainId?: string, strategyId?: string): Promise<Trade[]> {
        let trades = Array.from(this.memoryTrades.values());

        if (microchainId) {
            trades = trades.filter(t => t.microchainId === microchainId);
        }
        if (strategyId) {
            trades = trades.filter(t => t.strategyId === strategyId);
        }

        return trades.sort((a, b) => b.createdAt - a.createdAt);
    }

    // ==================== FOLLOWING ====================

    async followStrategy(followerId: string, strategyId: string): Promise<void> {
        const followers = this.memoryFollowers.get(strategyId) || [];
        if (!followers.includes(followerId)) {
            followers.push(followerId);
            this.memoryFollowers.set(strategyId, followers);
        }
    }

    async unfollowStrategy(followerId: string, strategyId: string): Promise<void> {
        const followers = this.memoryFollowers.get(strategyId) || [];
        this.memoryFollowers.set(strategyId, followers.filter(f => f !== followerId));
    }

    async getFollowers(strategyId: string): Promise<string[]> {
        return this.memoryFollowers.get(strategyId) || [];
    }

    // ==================== ANALYTICS ====================

    async getNetworkAnalytics(): Promise<NetworkAnalytics> {
        const profiles = Array.from(this.memoryProfiles.values());
        const strategies = Array.from(this.memoryStrategies.values());
        const trades = Array.from(this.memoryTrades.values());

        // Calculate chain distribution
        const chainDistribution: { [chain: string]: number } = {};
        profiles.forEach(p => {
            p.preferredChains.forEach(chain => {
                chainDistribution[chain] = (chainDistribution[chain] || 0) + 1;
            });
        });

        // Calculate total volume (demo calculation)
        const totalVolume = trades.reduce((sum, t) => sum + t.inputAmount, 0);

        // Build leaderboard
        const leaderboard = profiles
            .map(p => {
                const userStrategies = strategies.filter(s => s.owner === p.id);
                const avgWinRate = userStrategies.length > 0
                    ? userStrategies.reduce((sum, s) => sum + s.performance.winRate, 0) / userStrategies.length
                    : 0;
                const totalTrades = userStrategies.reduce((sum, s) => sum + s.performance.totalTrades, 0);
                const roi = userStrategies.reduce((sum, s) => sum + s.performance.avgReturn, 0);

                return {
                    id: p.id,
                    name: p.name,
                    winRate: Math.round(avgWinRate),
                    roi: Math.round(roi),
                    trades: totalTrades || p.tradesCount,
                    volume: `$${((totalTrades || p.tradesCount) * 100).toLocaleString()}`,
                    chain: p.preferredChains[0] || 'linera',
                };
            })
            .sort((a, b) => b.roi - a.roi);

        return {
            totalMicrochains: profiles.length,
            totalStrategies: strategies.length,
            totalTrades: trades.length,
            totalVolume: `$${totalVolume.toLocaleString()}`,
            activeTrades: trades.filter(t => t.status === 'pending').length,
            chainDistribution,
            leaderboard,
        };
    }

    // ==================== STATUS ====================

    isConnected(): boolean {
        return this.isLineraConnected;
    }
}

// Singleton instance
let storageInstance: LineraStorageService | null = null;

export function getLineraStorageService(lineraClient?: LineraClient): LineraStorageService {
    if (!storageInstance) {
        const client = lineraClient || new LineraClient(
            process.env.LINERA_RPC_URL || 'http://localhost:8080',
            process.env.LINERA_APP_ID
        );
        storageInstance = new LineraStorageService(client);
    }
    return storageInstance;
}
