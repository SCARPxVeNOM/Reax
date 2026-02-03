/**
 * Microchain Service
 * Handles Microchain profile creation and management via Linera
 */

import { gql } from 'graphql-request';
import { lineraClient } from './linera-client-graphql';

export interface MicrochainProfile {
    id: string;
    name: string;
    wallets: string[];
    preferredChains: string[];
    visibility: 'public' | 'private' | 'gated';
    createdAt: number;
    strategiesCount: number;
    tradesCount: number;
}

export interface Strategy {
    id: string;
    name: string;
    owner: string;
    creationMethod: 'visual' | 'image' | 'pinescript';
    code?: string;
    rules?: object;
    visibility: 'public' | 'private' | 'gated';
    tags: string[];
    riskLevel: 'low' | 'medium' | 'high';
    performance: {
        winRate: number;
        avgReturn: number;
        totalTrades: number;
    };
    createdAt: number;
}

export class MicrochainService {
    /**
     * Create a new Microchain profile
     */
    async createProfile(params: {
        name: string;
        wallet: string;
        chains: string[];
        visibility: 'public' | 'private' | 'gated';
    }): Promise<MicrochainProfile> {
        const mutation = gql`
      mutation CreateMicrochainProfile(
        $name: String!
        $wallet: String!
        $chains: [String!]!
        $visibility: String!
      ) {
        createMicrochainProfile(
          name: $name
          wallet: $wallet
          chains: $chains
          visibility: $visibility
        ) {
          id
          name
          wallets
          preferredChains
          visibility
          createdAt
        }
      }
    `;

        try {
            const result = await lineraClient.request(mutation, params);
            return result.createMicrochainProfile;
        } catch (error) {
            console.error('Failed to create Microchain profile:', error);
            // Return mock data for demo mode
            return {
                id: `mc_${Date.now()}`,
                name: params.name,
                wallets: [params.wallet],
                preferredChains: params.chains,
                visibility: params.visibility,
                createdAt: Date.now(),
                strategiesCount: 0,
                tradesCount: 0,
            };
        }
    }

    /**
     * Get Microchain profile by wallet
     */
    async getProfile(wallet: string): Promise<MicrochainProfile | null> {
        const query = gql`
      query GetMicrochainProfile($wallet: String!) {
        microchainProfile(wallet: $wallet) {
          id
          name
          wallets
          preferredChains
          visibility
          createdAt
          strategiesCount
          tradesCount
        }
      }
    `;

        try {
            const result = await lineraClient.request(query, { wallet });
            return result.microchainProfile;
        } catch (error) {
            console.error('Failed to get Microchain profile:', error);
            return null;
        }
    }

    /**
     * Publish a strategy linked to the Microchain
     */
    async publishStrategy(params: {
        name: string;
        creationMethod: 'visual' | 'image' | 'pinescript';
        code?: string;
        rules?: object;
        tags: string[];
        riskLevel: 'low' | 'medium' | 'high';
        visibility: 'public' | 'private' | 'gated';
    }): Promise<Strategy> {
        const mutation = gql`
      mutation PublishStrategy(
        $name: String!
        $creationMethod: String!
        $code: String
        $rules: JSON
        $tags: [String!]!
        $riskLevel: String!
        $visibility: String!
      ) {
        publishStrategy(
          name: $name
          creationMethod: $creationMethod
          code: $code
          rules: $rules
          tags: $tags
          riskLevel: $riskLevel
          visibility: $visibility
        ) {
          id
          name
          owner
          creationMethod
          visibility
          tags
          riskLevel
          createdAt
        }
      }
    `;

        try {
            const result = await lineraClient.request(mutation, params);
            return result.publishStrategy;
        } catch (error) {
            console.error('Failed to publish strategy:', error);
            // Return mock data for demo mode
            return {
                id: `strat_${Date.now()}`,
                name: params.name,
                owner: 'demo_user',
                creationMethod: params.creationMethod,
                code: params.code,
                rules: params.rules,
                visibility: params.visibility,
                tags: params.tags,
                riskLevel: params.riskLevel,
                performance: { winRate: 0, avgReturn: 0, totalTrades: 0 },
                createdAt: Date.now(),
            };
        }
    }

    /**
     * Get all public strategies
     */
    async getPublicStrategies(): Promise<Strategy[]> {
        const query = gql`
      query GetPublicStrategies {
        publicStrategies {
          id
          name
          owner
          creationMethod
          visibility
          tags
          riskLevel
          performance {
            winRate
            avgReturn
            totalTrades
          }
          createdAt
        }
      }
    `;

        try {
            const result = await lineraClient.request(query);
            return result.publicStrategies;
        } catch (error) {
            console.error('Failed to get public strategies:', error);
            // Return mock data for demo mode
            return [
                {
                    id: 'strat_1',
                    name: 'Breakout Scalping',
                    owner: 'TraderMike',
                    creationMethod: 'visual',
                    visibility: 'public',
                    tags: ['Forex', '1-Min Chart'],
                    riskLevel: 'high',
                    performance: { winRate: 72, avgReturn: 15, totalTrades: 234 },
                    createdAt: Date.now() - 86400000,
                },
                {
                    id: 'strat_2',
                    name: 'BTC Swing Trade',
                    owner: 'CryptoQueen',
                    creationMethod: 'pinescript',
                    visibility: 'public',
                    tags: ['Crypto', '4H Chart'],
                    riskLevel: 'medium',
                    performance: { winRate: 65, avgReturn: 28, totalTrades: 89 },
                    createdAt: Date.now() - 172800000,
                },
                {
                    id: 'strat_3',
                    name: 'Grid Trading Bot',
                    owner: 'AlgoBot_v3',
                    creationMethod: 'visual',
                    visibility: 'public',
                    tags: ['Automated', 'Range'],
                    riskLevel: 'low',
                    performance: { winRate: 89, avgReturn: 8, totalTrades: 567 },
                    createdAt: Date.now() - 259200000,
                },
            ];
        }
    }

    /**
     * Get analytics data for all microchains
     */
    async getNetworkAnalytics(): Promise<{
        totalMicrochains: number;
        totalStrategies: number;
        totalVolume: string;
        activeTrades: number;
        leaderboard: Array<{
            id: string;
            name: string;
            winRate: number;
            roi: number;
            trades: number;
            volume: string;
            chain: string;
        }>;
    }> {
        const query = gql`
      query GetNetworkAnalytics {
        networkAnalytics {
          totalMicrochains
          totalStrategies
          totalVolume
          activeTrades
          leaderboard {
            id
            name
            winRate
            roi
            trades
            volume
            chain
          }
        }
      }
    `;

        try {
            const result = await lineraClient.request(query);
            return result.networkAnalytics;
        } catch (error) {
            console.error('Failed to get network analytics:', error);
            // Return mock data for demo mode
            return {
                totalMicrochains: 1247,
                totalStrategies: 3842,
                totalVolume: '$12.5M',
                activeTrades: 892,
                leaderboard: [
                    { id: '1', name: 'AlphaTrader', winRate: 82, roi: 156, trades: 423, volume: '$1.2M', chain: 'Solana' },
                    { id: '2', name: 'CryptoWhale', winRate: 78, roi: 124, trades: 312, volume: '$890K', chain: 'Linera' },
                    { id: '3', name: 'DegenMaster', winRate: 65, roi: 98, trades: 567, volume: '$2.1M', chain: 'Solana' },
                    { id: '4', name: 'SteadyGains', winRate: 91, roi: 45, trades: 189, volume: '$450K', chain: 'Ethereum' },
                    { id: '5', name: 'BotRunner', winRate: 73, roi: 67, trades: 1024, volume: '$3.5M', chain: 'Linera' },
                ],
            };
        }
    }
}

export const microchainService = new MicrochainService();
