/**
 * Simple token price query example for WALEMCP
 * 
 * This example demonstrates how to use WALEMCP to query token prices
 * using the intent processing system.
 */

const { IntentProcessor } = require('../src');
const { Logger } = require('../src/utils/logger');

// Create a logger
const logger = new Logger('info');

/**
 * Main function to run the example
 */
async function runSimpleQuery() {
  logger.info('Starting simple token price query example');
  
  try {
    // Initialize the intent processor
    const processor = new IntentProcessor({
      logger: logger
    });
    
    // Create a simple query intent
    const intent = {
      id: `query-${Date.now()}`,
      type: 'query',
      content: 'What is the current price of SOL and WALE?',
      entities: [
        { type: 'token', value: 'SOL' },
        { type: 'token', value: 'WALE' }
      ],
      timestamp: Date.now(),
      userId: 'example-user'
    };
    
    logger.info('Processing intent:', intent);
    
    // Process the intent
    const result = await processor.processIntent(intent);
    
    // Display the result
    logger.info('Query completed successfully');
    console.log('\n===== RESULT =====');
    console.log(JSON.stringify(result, null, 2));
    console.log('==================\n');
    
    // Extract price data from the result
    if (result.data && result.data.prices) {
      console.log('Token Prices:');
      Object.entries(result.data.prices).forEach(([token, priceData]) => {
        console.log(`- ${token}: $${priceData.usd}`);
      });
    }
    
  } catch (error) {
    logger.error('Error processing intent:', error);
  }
}

// Run the example
if (require.main === module) {
  runSimpleQuery()
    .then(() => logger.info('Example completed'))
    .catch(err => {
      logger.error('Example failed:', err);
      process.exit(1);
    });
}

module.exports = { runSimpleQuery };