/**
 * Portfolio Analysis Example for WALEMCP
 * 
 * This example demonstrates how to use WALEMCP to analyze a Solana wallet portfolio
 * using the intent processing system.
 */

const { IntentProcessor } = require('../src');
const { Logger } = require('../src/utils/logger');

// Create a logger
const logger = new Logger('info');

/**
 * Main function to run the portfolio analysis example
 */
async function analyzePortfolio(walletAddress) {
  logger.info('Starting portfolio analysis example');
  
  if (!walletAddress) {
    walletAddress = 'demo_wallet_address'; // Use a demo wallet if none provided
    logger.info('No wallet address provided, using demo wallet');
  }
  
  try {
    // Initialize the intent processor
    const processor = new IntentProcessor({
      logger: logger
    });
    
    // Create a portfolio analysis intent
    const intent = {
      id: `analysis-${Date.now()}`,
      type: 'analysis',
      content: 'Analyze my Solana portfolio performance and provide insights',
      entities: [
        { type: 'address', value: walletAddress }
      ],
      timestamp: Date.now(),
      userId: 'example-user'
    };
    
    // Create context with user wallet information
    const context = {
      userProfile: {
        wallets: [
          { 
            address: walletAddress,
            chain: 'solana',
            type: 'native',
            label: 'My Solana Wallet'
          }
        ]
      },
      preferences: {
        currency: 'USD',
        timeRange: '30d'
      }
    };
    
    logger.info('Processing portfolio analysis intent');
    
    // Process the intent with context
    const result = await processor.processIntent(intent, context);
    
    // Display the result
    logger.info('Portfolio analysis completed successfully');
    console.log('\n===== PORTFOLIO ANALYSIS =====');
    console.log(JSON.stringify(result.summary, null, 2));
    
    // Print portfolio metrics if available
    if (result.data && result.data.portfolio) {
      console.log('\nPortfolio Metrics:');
      const metrics = result.data.portfolio.metrics || {};
      
      console.log(`- Total Value: $${metrics.totalValue || 'N/A'}`);
      console.log(`- 30-Day Change: ${metrics.performance?.monthly || 'N/A'}%`);
      console.log(`- Risk Level: ${metrics.risk || 'N/A'}`);
      console.log(`- Diversification Score: ${metrics.diversification || 'N/A'}/10`);
      
      // Print assets if available
      if (result.data.portfolio.assets && result.data.portfolio.assets.length > 0) {
        console.log('\nTop Holdings:');
        result.data.portfolio.assets
          .slice(0, 5) // Top 5 assets
          .forEach((asset, index) => {
            console.log(`${index + 1}. ${asset.name} (${asset.symbol}): $${asset.value} (${asset.percentage}%)`);
          });
      }
    }
    
    console.log('\n==============================');
    
  } catch (error) {
    logger.error('Error processing portfolio analysis:', error);
  }
}

// Run the example
if (require.main === module) {
  // Use command line argument as wallet address if provided
  const walletAddress = process.argv[2];
  
  analyzePortfolio(walletAddress)
    .then(() => logger.info('Portfolio analysis example completed'))
    .catch(err => {
      logger.error('Example failed:', err);
      process.exit(1);
    });
}

module.exports = { analyzePortfolio }; 