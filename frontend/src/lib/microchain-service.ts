/**
 * Microchain Service
 * Handles Microchain profile creation and management via Linera
 */

import { lineraClient, LineraGraphQLClient } from './linera-client-graphql';

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
   * Tries Linera mutation first, falls back to localStorage if unavailable
   */
  async createProfile(params: {
    name: string;
    wallet: string;
    chains: string[];
    visibility: 'public' | 'private' | 'gated';
  }): Promise<MicrochainProfile> {
    // Create the profile object
    const profile: MicrochainProfile = {
      id: params.wallet,
      name: params.name,
      wallets: [params.wallet],
      preferredChains: params.chains,
      visibility: params.visibility,
      createdAt: Date.now(),
      strategiesCount: 0,
      tradesCount: 0,
    };

    try {
      // Try Linera mutation first
      const chainsArray = params.chains.map(c => `"${c}"`).join(', ');
      const mutation = `
        mutation {
          createMicrochainProfile(
            name: "${params.name}",
            wallet: "${params.wallet}",
            chains: [${chainsArray}],
            visibility: "${params.visibility}"
          )
        }
      `;

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      await Promise.race([
        lineraClient.request(mutation),
        timeoutPromise
      ]);

      console.log('Profile created on Linera successfully');
    } catch (error) {
      console.warn('Linera mutation unavailable, using local storage:', error);
      // Fallback: Store in localStorage for now
      if (typeof window !== 'undefined') {
        const profiles = JSON.parse(localStorage.getItem('microchain_profiles') || '{}');
        profiles[params.wallet] = profile;
        localStorage.setItem('microchain_profiles', JSON.stringify(profiles));
      }
    }

    return profile;
  }

  /**
   * Get Microchain profile by wallet
   * Tries Linera first, falls back to localStorage
   */
  async getProfile(wallet: string): Promise<MicrochainProfile | null> {
    // First check localStorage for quick response
    let localProfile: MicrochainProfile | null = null;
    if (typeof window !== 'undefined') {
      const profiles = JSON.parse(localStorage.getItem('microchain_profiles') || '{}');
      if (profiles[wallet]) {
        localProfile = profiles[wallet];
      }
    }

    try {
      // Try Linera query with timeout
      const query = `
        query {
          getMicrochainProfile(wallet: "${wallet}")
        }
      `;

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      const response = await Promise.race([
        lineraClient.request<{ getMicrochainProfile: any }>(query),
        timeoutPromise
      ]);

      if (response?.getMicrochainProfile) {
        const profile = response.getMicrochainProfile;
        return {
          id: profile.id,
          name: profile.name,
          wallets: profile.wallets || [wallet],
          preferredChains: profile.preferred_chains || profile.preferredChains || [],
          visibility: profile.visibility,
          createdAt: profile.created_at || profile.createdAt,
          strategiesCount: profile.total_trades || 0,
          tradesCount: profile.total_trades || 0,
        };
      }

      // If Linera returns null, return local profile
      return localProfile;
    } catch (error) {
      console.warn('Linera query unavailable, using local storage:', error);
      return localProfile;
    }
  }

  /**
   * Publish a strategy linked to the Microchain
   * Uses Linera's executeOperation with CreateStrategy operation via node service
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
    const applicationId = lineraClient.getApplicationId();
    const chainId = lineraClient.getChainId();

    // Create strategy object for frontend
    const frontendStrategy: Strategy = {
      id: `strat_${Date.now()}`,
      name: params.name,
      owner: 'current_user',
      creationMethod: params.creationMethod,
      code: params.code,
      rules: params.rules,
      visibility: params.visibility,
      tags: params.tags,
      riskLevel: params.riskLevel,
      performance: { winRate: 0, avgReturn: 0, totalTrades: 0 },
      createdAt: Date.now(),
    };

    // Map frontend params to Linera ABI Strategy structure
    const lineraStrategy = {
      id: 0, // Will be assigned by contract
      owner: 'current_user',
      name: params.name,
      strategy_type: params.code
        ? { DSL: params.code }
        : {
          Token: {
            token_pair: 'BTC/USD',
            buy_price: 0,
            sell_target: 0,
            trailing_stop_pct: 0,
            take_profit_pct: 0,
            max_loss_pct: 0,
            entries: [],
            exits: [],
          }
        },
      active: true,
      created_at: Date.now(),
      version: 1,
      updated_at: null,
      source: { Manual: { author: 'current_user' } },
      risk_percentage: params.riskLevel === 'high' ? 10 : params.riskLevel === 'medium' ? 5 : 2,
      max_exposure: 10000,
      slippage_bps: 50,
    };

    try {
      // Use node service for executeOperation mutation
      const operationJson = JSON.stringify(JSON.stringify({ CreateStrategy: { strategy: lineraStrategy } }));

      const mutation = `
        mutation CreateStrategy {
          executeOperation(
            chainId: "${chainId}",
            applicationId: "${applicationId}",
            operation: ${operationJson}
          )
        }
      `;

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );

      await Promise.race([
        lineraClient.nodeRequest(mutation),
        timeoutPromise
      ]);

      console.log('Strategy published to Linera successfully');
    } catch (error) {
      console.warn('Linera operation unavailable, using local storage:', error);
      // Fallback: Store in localStorage
      if (typeof window !== 'undefined') {
        const strategies = JSON.parse(localStorage.getItem('microchain_strategies') || '[]');
        strategies.push(frontendStrategy);
        localStorage.setItem('microchain_strategies', JSON.stringify(strategies));
      }
    }

    return frontendStrategy;
  }

  /**
   * Get all public strategies
   * Tries Linera first, falls back to localStorage
   */
  async getPublicStrategies(): Promise<Strategy[]> {
    // Get local strategies first
    let localStrategies: Strategy[] = [];
    if (typeof window !== 'undefined') {
      localStrategies = JSON.parse(localStorage.getItem('microchain_strategies') || '[]');
    }

    try {
      const applicationId = lineraClient.getApplicationId();
      const chainId = lineraClient.getChainId();
      const queryJson = JSON.stringify(JSON.stringify({ GetStrategies: { owner: null, limit: 50, offset: 0 } }));

      const query = `
        query GetStrategies {
          queryApplication(
            chainId: "${chainId}",
            applicationId: "${applicationId}",
            query: ${queryJson}
          )
        }
      `;

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const result = await Promise.race([
        lineraClient.nodeRequest<{ queryApplication: string }>(query),
        timeoutPromise
      ]);

      if (result?.queryApplication) {
        const appResult = JSON.parse(result.queryApplication);
        const lineraStrategies = (appResult.Strategies || []).map((s: any) => ({
          id: String(s.id),
          name: s.name,
          owner: s.owner,
          creationMethod: s.strategy_type?.DSL ? 'pinescript' : 'visual' as const,
          code: s.strategy_type?.DSL,
          rules: s.strategy_type?.Token || s.strategy_type?.Form,
          visibility: 'public' as const,
          tags: [],
          riskLevel: s.risk_percentage > 7 ? 'high' : s.risk_percentage > 3 ? 'medium' : 'low' as const,
          performance: { winRate: 0, avgReturn: 0, totalTrades: 0 },
          createdAt: s.created_at,
        }));

        // Combine Linera and local strategies (avoiding duplicates by name)
        const allStrategies = [...lineraStrategies];
        for (const local of localStrategies) {
          if (!allStrategies.some(s => s.name === local.name)) {
            allStrategies.push(local);
          }
        }
        return allStrategies;
      }

      return localStrategies;
    } catch (error) {
      console.warn('Linera query unavailable, using local storage:', error);
      return localStrategies;
    }
  }

  /**
   * Get analytics data for all microchains
   * Uses the app-specific GraphQL endpoint with direct query
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
    const query = `
      query {
        getNetworkAnalytics
      }
    `;

    try {
      const response = await lineraClient.request<{ getNetworkAnalytics: any }>(query);

      if (response.getNetworkAnalytics) {
        const analytics = response.getNetworkAnalytics;
        return {
          totalMicrochains: analytics.total_microchains || analytics.totalMicrochains || 0,
          totalStrategies: analytics.total_strategies || analytics.totalStrategies || 0,
          totalVolume: `$${analytics.total_volume || analytics.totalVolume || 0}`,
          activeTrades: analytics.active_trades || analytics.activeTrades || 0,
          leaderboard: (analytics.leaderboard || []).map((entry: any) => ({
            id: entry.id,
            name: entry.name,
            winRate: entry.win_rate || entry.winRate || 0,
            roi: entry.roi || 0,
            trades: entry.trades || 0,
            volume: `$${entry.volume || 0}`,
            chain: entry.chain || 'linera',
          })),
        };
      }

      // Return zero-state if not found
      return {
        totalMicrochains: 0,
        totalStrategies: 0,
        totalVolume: '$0',
        activeTrades: 0,
        leaderboard: [],
      };
    } catch (error) {
      console.error('Failed to get network analytics:', error);
      // Return zero-state data - real chain data unavailable
      return {
        totalMicrochains: 0,
        totalStrategies: 0,
        totalVolume: '$0',
        activeTrades: 0,
        leaderboard: [],
      };
    }
  }
}

export const microchainService = new MicrochainService();
