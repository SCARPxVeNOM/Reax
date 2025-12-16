/**
 * Linera Microchain Integration Service
 * Connects frontend with Linera smart contracts
 */

import { gql } from 'graphql-request';
import { lineraClient } from './linera-client-graphql';

export interface DEXOrder {
  id: number;
  dex: 'RAYDIUM' | 'JUPITER' | 'BINANCE';
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  outputAmount: number;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
}

export interface StrategyFollower {
  followerId: string;
  strategyId: string;
  allocationAmount: number;
  maxPositionSize?: number;
  riskLimitPercent: number;
  autoFollow: boolean;
}

export interface TradeReplication {
  originalOrderId: number;
  followerOrderId: number;
  followerId: string;
  scaleFactor: number;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
}

export class LineraIntegrationService {
  /**
   * Create a DEX order on the microchain
   */
  async createDEXOrder(params: {
    dex: 'RAYDIUM' | 'JUPITER' | 'BINANCE';
    inputToken: string;
    outputToken: string;
    inputAmount: number;
    slippageBps?: number;
  }): Promise<{ orderId: number }> {
    const mutation = gql`
      mutation CreateDEXOrder(
        $dex: String!
        $inputToken: String!
        $outputToken: String!
        $inputAmount: Float!
        $slippageBps: Int
      ) {
        createDEXOrder(
          dex: $dex
          inputToken: $inputToken
          outputToken: $outputToken
          inputAmount: $inputAmount
          slippageBps: $slippageBps
        ) {
          orderId
        }
      }
    `;

    try {
      const result = await lineraClient.request(mutation, params);
      return result.createDEXOrder;
    } catch (error) {
      console.error('Failed to create DEX order:', error);
      throw error;
    }
  }

  /**
   * Execute a DEX order
   */
  async executeDEXOrder(orderId: number): Promise<{ success: boolean; txHash?: string }> {
    const mutation = gql`
      mutation ExecuteDEXOrder($orderId: Int!) {
        executeDEXOrder(orderId: $orderId) {
          success
          txHash
        }
      }
    `;

    try {
      const result = await lineraClient.request(mutation, { orderId });
      return result.executeDEXOrder;
    } catch (error) {
      console.error('Failed to execute DEX order:', error);
      throw error;
    }
  }

  /**
   * Follow a strategy
   */
  async followStrategy(params: {
    strategyId: string;
    allocationAmount: number;
    maxPositionSize?: number;
    riskLimitPercent?: number;
  }): Promise<{ followerId: string }> {
    const mutation = gql`
      mutation FollowStrategy(
        $strategyId: String!
        $allocationAmount: Float!
        $maxPositionSize: Float
        $riskLimitPercent: Float
      ) {
        followStrategy(
          strategyId: $strategyId
          allocationAmount: $allocationAmount
          maxPositionSize: $maxPositionSize
          riskLimitPercent: $riskLimitPercent
        ) {
          followerId
        }
      }
    `;

    try {
      const result = await lineraClient.request(mutation, {
        ...params,
        riskLimitPercent: params.riskLimitPercent || 10.0,
      });
      return result.followStrategy;
    } catch (error) {
      console.error('Failed to follow strategy:', error);
      throw error;
    }
  }

  /**
   * Unfollow a strategy
   */
  async unfollowStrategy(followerId: string): Promise<{ success: boolean }> {
    const mutation = gql`
      mutation UnfollowStrategy($followerId: String!) {
        unfollowStrategy(followerId: $followerId) {
          success
        }
      }
    `;

    try {
      const result = await lineraClient.request(mutation, { followerId });
      return result.unfollowStrategy;
    } catch (error) {
      console.error('Failed to unfollow strategy:', error);
      throw error;
    }
  }

  /**
   * Get all DEX orders
   */
  async getDEXOrders(): Promise<DEXOrder[]> {
    const query = gql`
      query GetDEXOrders {
        dexOrders {
          id
          dex
          inputToken
          outputToken
          inputAmount
          outputAmount
          status
        }
      }
    `;

    try {
      const result = await lineraClient.request(query);
      return result.dexOrders || [];
    } catch (error) {
      console.error('Failed to get DEX orders:', error);
      return [];
    }
  }

  /**
   * Get strategy followers
   */
  async getStrategyFollowers(strategyId: string): Promise<StrategyFollower[]> {
    const query = gql`
      query GetStrategyFollowers($strategyId: String!) {
        strategyFollowers(strategyId: $strategyId) {
          followerId
          strategyId
          allocationAmount
          maxPositionSize
          riskLimitPercent
          autoFollow
        }
      }
    `;

    try {
      const result = await lineraClient.request(query, { strategyId });
      return result.strategyFollowers || [];
    } catch (error) {
      console.error('Failed to get strategy followers:', error);
      return [];
    }
  }

  /**
   * Get trade replications
   */
  async getTradeReplications(followerId: string): Promise<TradeReplication[]> {
    const query = gql`
      query GetTradeReplications($followerId: String!) {
        tradeReplications(followerId: $followerId) {
          originalOrderId
          followerOrderId
          followerId
          scaleFactor
          status
        }
      }
    `;

    try {
      const result = await lineraClient.request(query, { followerId });
      return result.tradeReplications || [];
    } catch (error) {
      console.error('Failed to get trade replications:', error);
      return [];
    }
  }

  /**
   * Deploy a strategy to microchain
   */
  async deployStrategy(params: {
    name: string;
    code: string;
    type: 'PINESCRIPT' | 'VISUAL';
  }): Promise<{ strategyId: string; microchainId: string }> {
    const mutation = gql`
      mutation DeployStrategy($name: String!, $code: String!, $type: String!) {
        deployStrategy(name: $name, code: $code, type: $type) {
          strategyId
          microchainId
        }
      }
    `;

    try {
      const result = await lineraClient.request(mutation, params);
      return result.deployStrategy;
    } catch (error) {
      console.error('Failed to deploy strategy:', error);
      throw error;
    }
  }

  /**
   * Get microchain status
   */
  async getMicrochainStatus(microchainId: string): Promise<{
    id: string;
    status: string;
    strategyCount: number;
    orderCount: number;
    followerCount: number;
  }> {
    const query = gql`
      query GetMicrochainStatus($microchainId: String!) {
        microchain(id: $microchainId) {
          id
          status
          strategyCount
          orderCount
          followerCount
        }
      }
    `;

    try {
      const result = await lineraClient.request(query, { microchainId });
      return result.microchain;
    } catch (error) {
      console.error('Failed to get microchain status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const lineraIntegration = new LineraIntegrationService();
