/**
 * WALEMCP - Solana Ecosystem's Intelligent Connector
 * Main Entry Point
 */

import dotenv from 'dotenv';
import { MCP } from './core/mcp';
import { Logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = new Logger(
  (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info'
);

/**
 * Main application initialization
 */
async function initializeApp() {
  logger.info('Initializing WALEMCP application...');
  
  try {
    // Configure MCP engine
    const mcp = new MCP({
      solanaEndpoint: process.env.SOLANA_ENDPOINT || 'https://api.mainnet-beta.solana.com',
      arweaveEndpoint: process.env.ARWEAVE_ENDPOINT,
      ipfsGateway: process.env.IPFS_GATEWAY,
      aiProvider: process.env.AI_PROVIDER || 'openai',
      aiApiKey: process.env.AI_API_KEY || '',
      logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info'
    });
    
    logger.info('MCP engine initialized successfully');
    
    // Initialize API server if running in standalone mode
    if (process.env.NODE_ENV !== 'module') {
      await initializeServer(mcp);
    }
    
    return mcp;
  } catch (error) {
    logger.error('Failed to initialize WALEMCP application:', error);
    process.exit(1);
  }
}

/**
 * Initialize API server
 * @param mcp MCP instance
 */
async function initializeServer(mcp: MCP) {
  try {
    // Dynamic import to avoid loading in module mode
    const { startServer } = await import('./server');
    
    // Start API server
    const port = parseInt(process.env.PORT || '3000', 10);
    await startServer(mcp, port);
    
    logger.info(`WALEMCP API server running on port ${port}`);
  } catch (error) {
    logger.error('Failed to initialize API server:', error);
    process.exit(1);
  }
}

// Export for module usage
export const mcpInstance = initializeApp();

// Start application if not imported as a module
if (require.main === module) {
  initializeApp().catch(error => {
    logger.error('Uncaught application error:', error);
    process.exit(1);
  });
} 