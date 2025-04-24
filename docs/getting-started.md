# Getting Started with WALEMCP

This guide will help you set up and start using WALEMCP for your Solana-based projects.

## Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [Solana CLI Tools](https://docs.solana.com/cli/install-solana-cli-tools)
- [Git](https://git-scm.com/)
- A code editor (like VSCode)
- A Solana wallet (for interacting with the Solana blockchain)

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/WALEMCP.git
   cd WALEMCP
   ```

2. **Install Dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set Up Environment**

   Copy the example environment file and configure it with your settings:

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your:
   - Solana RPC URL
   - API keys
   - Other configuration options

4. **Build the Project**

   ```bash
   npm run build
   # or
   yarn build
   ```

## Running Your First Task

1. **Start the Development Server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Try a Simple Query**

   WALEMCP supports various tasks. Let's start with a simple token price query:

   ```javascript
   const { IntentProcessor } = require('./src');
   
   async function runSimpleTask() {
     const processor = new IntentProcessor();
     
     const intent = {
       id: 'query-001',
       type: 'query',
       content: 'What is the current price of SOL?',
       entities: [{ type: 'token', value: 'SOL' }],
       timestamp: Date.now(),
       userId: 'user-123'
     };
     
     const result = await processor.processIntent(intent);
     console.log('Result:', result);
   }
   
   runSimpleTask().catch(console.error);
   ```

3. **Save this to a file** (e.g., `examples/simple-query.js`) and run it:

   ```bash
   node examples/simple-query.js
   ```

## Using Templates

WALEMCP comes with pre-built templates for common tasks:

1. **List Available Templates**

   ```javascript
   const { IntentPlanner } = require('./src/core');
   
   const planner = new IntentPlanner();
   const templates = planner.getTemplates();
   
   console.log('Available templates:');
   templates.forEach(template => {
     console.log(`- ${template.id}: ${template.description}`);
   });
   ```

2. **Use a Specific Template**

   ```javascript
   // Example: Using the portfolio-analysis template
   const intent = {
     id: 'analysis-001',
     type: 'analysis',
     content: 'Analyze my portfolio performance',
     timestamp: Date.now(),
     userId: 'user-123'
   };
   
   const context = {
     userProfile: {
       wallets: [
         { address: 'your-solana-wallet-address', chain: 'solana', type: 'native' }
       ]
     }
   };
   
   const plan = await planner.generatePlan(intent, context);
   console.log('Generated execution plan:', plan);
   ```

## Next Steps

- Learn about [Core Concepts](./core-concepts.md)
- Explore [Templates](./templates.md) for different tasks
- Understand [Solana Integration](./solana-integration.md)
- Dive into the [API Reference](./api-reference.md)

## Troubleshooting

If you encounter issues:

- Check the [Troubleshooting](./troubleshooting.md) guide
- Review your environment configuration
- Join our community Discord for help
- Open an issue on GitHub

## Example Projects

Check the `examples/` directory for more sample projects and use cases. 