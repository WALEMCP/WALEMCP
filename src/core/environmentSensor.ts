/**
 * Environment Sensor Component
 * Collects environment data for MCP tasks, especially Solana on-chain data
 */

import { SolanaConnector } from '../integrations/solanaConnector';
import { Intent } from '../types';
import { Logger } from '../utils/logger';

interface SensorConfig {
  includePriceData?: boolean;
  includeMarketData?: boolean;
  includeHistoricalData?: boolean;
  timeframeSeconds?: number;
}

/**
 * Gathers environment data based on intent and Solana on-chain data
 */
export class EnvironmentSensor {
  private solanaConnector: SolanaConnector;
  private logger: Logger;
  private config: SensorConfig;
  
  constructor(
    solanaConnector: SolanaConnector,
    config?: SensorConfig,
    logger?: Logger
  ) {
    this.solanaConnector = solanaConnector;
    this.logger = logger || new Logger('info');
    this.config = {
      includePriceData: config?.includePriceData ?? true,
      includeMarketData: config?.includeMarketData ?? true,
      includeHistoricalData: config?.includeHistoricalData ?? false,
      timeframeSeconds: config?.timeframeSeconds ?? 86400, // 24 hours
    };
  }
  
  /**
   * Gather environment data based on intent
   * @param intent The parsed intent
   * @returns Environment data relevant for task execution
   */
  async gatherEnvironmentData(intent: Intent): Promise<Record<string, any>> {
    this.logger.debug('Gathering environment data for intent:', intent);
    
    try {
      const environment: Record<string, any> = {};
      
      // Get basic Solana network status
      environment.network = await this.getSolanaNetworkStatus();
      
      // Extract address entities from intent
      const addressEntities = intent.entities.filter(entity => entity.type === 'address');
      
      // Gather account data for any Solana addresses
      if (addressEntities.length > 0) {
        environment.accounts = await this.fetchAccountsData(addressEntities);
      }
      
      // Get price data if needed
      if (this.config.includePriceData) {
        environment.prices = await this.getPriceData(intent);
      }
      
      // Get market data if needed
      if (this.config.includeMarketData) {
        environment.market = await this.getMarketData(intent);
      }
      
      // Add timestamp
      environment.timestamp = Date.now();
      
      this.logger.debug('Environment data gathered successfully');
      return environment;
    } catch (error) {
      this.logger.error('Error gathering environment data:', error);
      // Return minimal environment data on error
      return {
        timestamp: Date.now(),
        error: true,
        errorMessage: (error as Error).message
      };
    }
  }
  
  /**
   * Get Solana network status
   * @returns Basic network status
   */
  private async getSolanaNetworkStatus(): Promise<Record<string, any>> {
    try {
      const networkStatus = await this.solanaConnector.getNetworkStatus();
      
      return {
        blockHeight: networkStatus.blockHeight,
        slot: networkStatus.slot,
        epoch: networkStatus.epochInfo.epoch,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.warn('Error fetching Solana network status:', error);
      return { error: 'Failed to fetch network status' };
    }
  }
  
  /**
   * Fetch account data for Solana addresses
   * @param addressEntities Entities with Solana addresses
   * @returns Account data
   */
  private async fetchAccountsData(addressEntities: any[]): Promise<Record<string, any>> {
    const accounts: Record<string, any> = {};
    
    // Extract addresses
    const addresses = addressEntities
      .map(entity => entity.value.toString())
      .filter(address => address.length >= 32 && address.length <= 44); // Basic validation
    
    if (addresses.length === 0) {
      return accounts;
    }
    
    try {
      // Fetch account data from Solana
      const accountsData = await this.solanaConnector.fetchAccountsData(addresses);
      
      // Process the data
      for (const [address, data] of Object.entries(accountsData)) {
        accounts[address] = {
          lamports: data.lamports,
          owner: data.owner,
          executable: data.executable,
          rentEpoch: data.rentEpoch,
          // Don't include raw data as it could be large
          dataSize: data.data ? data.data.length : 0
        };
      }
      
      return accounts;
    } catch (error) {
      this.logger.warn('Error fetching accounts data:', error);
      return { error: 'Failed to fetch accounts data' };
    }
  }
  
  /**
   * Get price data for relevant tokens
   * @param intent The parsed intent
   * @returns Price data
   */
  private async getPriceData(intent: Intent): Promise<Record<string, any>> {
    // In a real implementation, this would fetch price data from an oracle or API
    // This is a mock implementation
    return {
      SOL: { usd: 140.25, btc: 0.00246 },
      WALE: { usd: 0.12, btc: 0.00000202 },
      timestamp: Date.now()
    };
  }
  
  /**
   * Get market data relevant to the intent
   * @param intent The parsed intent
   * @returns Market data
   */
  private async getMarketData(intent: Intent): Promise<Record<string, any>> {
    // In a real implementation, this would fetch market data from APIs
    // This is a mock implementation
    return {
      globalMarketCap: 2475000000000,
      fear_greed_index: 65,
      trending: ['SOL', 'BTC', 'ETH', 'WALE'],
      timestamp: Date.now()
    };
  }
} 