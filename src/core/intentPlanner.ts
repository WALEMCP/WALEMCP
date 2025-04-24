/**
 * Intent Planner Component
 * Plans execution steps based on user intent
 */

import { Intent, IntentContext, PlanExecutionContext, PlannedStep } from '../types';
import { Logger } from '../utils/logger';
import { ToolType } from './toolIntegration';

/**
 * Interface for planning templates
 */
export interface PlanningTemplate {
  id: string;
  name: string;
  description: string;
  matches: (intent: Intent) => boolean;
  generateSteps: (intent: Intent, context: IntentContext) => PlannedStep[];
}

/**
 * Configuration for IntentPlanner
 */
export interface IntentPlannerConfig {
  maxSteps?: number;
  enableDynamicPlanning?: boolean;
  defaultPlanTimeout?: number;
}

/**
 * Plans execution steps based on user intent
 */
export class IntentPlanner {
  private templates: Map<string, PlanningTemplate>;
  private logger: Logger;
  private config: IntentPlannerConfig;
  
  constructor(config?: IntentPlannerConfig, logger?: Logger) {
    this.templates = new Map();
    this.logger = logger || new Logger('info');
    this.config = {
      maxSteps: 20,
      enableDynamicPlanning: true,
      defaultPlanTimeout: 30000,
      ...config
    };
    
    // Register default templates
    this.registerDefaultTemplates();
  }
  
  /**
   * Generate a plan for executing an intent
   * @param intent User intent to plan for
   * @param context Additional context for planning
   * @returns Array of planned execution steps
   */
  async generatePlan(intent: Intent, context: IntentContext): Promise<PlannedStep[]> {
    this.logger.debug(`Generating plan for intent: ${intent.type}`);
    
    // Find applicable template
    const matchingTemplates = Array.from(this.templates.values())
      .filter(template => template.matches(intent));

    if (matchingTemplates.length > 0) {
      // Use the first matching template to generate steps
      const template = matchingTemplates[0];
      const steps = template.generateSteps(intent, context);
      return this.validateSteps(steps);
    } else if (this.config.enableDynamicPlanning) {
      // Generate steps dynamically based on intent type
      return this.generateDynamicPlan(intent, context);
    }

    throw new Error(`No suitable planning template found for intent ${intent.id}`);
  }
  
  /**
   * Register a new planning template
   * @param template Planning template to register
   */
  registerTemplate(template: PlanningTemplate): void {
    if (this.templates.has(template.id)) {
      this.logger.warn(`Template with ID ${template.id} already exists. Overwriting.`);
    }
    
    this.templates.set(template.id, template);
    this.logger.debug(`Registered template: ${template.id}`);
  }
  
  /**
   * Get all registered templates
   * @returns Array of registered templates
   */
  getTemplates(): PlanningTemplate[] {
    return Array.from(this.templates.values());
  }
  
  /**
   * Validate and normalize execution steps
   */
  private validateSteps(steps: PlannedStep[]): PlannedStep[] {
    if (steps.length > this.config.maxSteps) {
      throw new Error(`Plan exceeds maximum number of steps (${this.config.maxSteps})`);
    }

    // Ensure all steps have required properties
    return steps.map((step, index) => ({
      ...step,
      stepId: step.stepId || `step-${index}`
    }));
  }
  
  /**
   * Generate a plan dynamically based on intent type
   */
  private generateDynamicPlan(intent: Intent, context: IntentContext): PlannedStep[] {
    this.logger.debug('Generating dynamic plan for intent');
    
    const steps: PlannedStep[] = [];
    
    // Step 1: Add environment sensing step (always first)
    steps.push({
      stepId: `step_1_env_sensing`,
      toolId: 'environment_sensor',
      description: 'Gather environmental data',
      inputs: {
        intent: intent,
        includeMarketData: true,
        includePriceData: true
      },
      expectedOutputs: ['environmentData']
    });
    
    // Analyze intent type and construct appropriate steps
    switch (intent.type) {
      case 'query': 
        return this.generateQueryPlan(intent, context, steps);
        
      case 'transaction':
        return this.generateTransactionPlan(intent, context, steps);
        
      case 'analysis':
        return this.generateAnalysisPlan(intent, context, steps);
        
      default:
        throw new Error(`Cannot dynamically generate plan for intent type: ${intent.type}`);
    }
  }
  
  /**
   * Generate a plan for a query intent
   * @param intent Query intent
   * @param context Planning context
   * @param steps Initial steps (should include environment sensing)
   * @returns Complete array of planned steps
   */
  private generateQueryPlan(intent: Intent, context: IntentContext, steps: PlannedStep[]): PlannedStep[] {
    // Step 2: Retrieve relevant data based on query
    steps.push({
      stepId: `step_2_data_retrieval`,
      toolId: ToolType.API_CALL,
      description: 'Retrieve data relevant to query',
      inputs: {
        intent: intent,
        environmentData: { source: 'step_1_env_sensing', key: 'environmentData' }
      },
      expectedOutputs: ['data']
    });
    
    // Step 3: Process and transform data if needed
    steps.push({
      stepId: `step_3_data_processing`,
      toolId: ToolType.DATA_TRANSFORMATION,
      description: 'Process and transform query data',
      inputs: {
        data: { source: 'step_2_data_retrieval', key: 'data' }
      },
      expectedOutputs: ['processedData', 'trends']
    });
    
    // Step 4: AI analysis of the processed data
    steps.push({
      stepId: `step_4_analysis`,
      toolId: ToolType.AI_ANALYSIS,
      description: 'Analyze data and generate insights',
      inputs: {
        data: { source: 'step_3_data_processing', key: 'processedData' },
        trends: { source: 'step_3_data_processing', key: 'trends' },
        intent: intent,
        analysis_type: 'query_response'
      },
      expectedOutputs: ['analysis', 'summary']
    });
    
    return this.validateSteps(steps);
  }
  
  /**
   * Generate a plan for a transaction intent
   * @param intent Transaction intent
   * @param context Planning context
   * @param steps Initial steps (should include environment sensing)
   * @returns Complete array of planned steps
   */
  private generateTransactionPlan(intent: Intent, context: IntentContext, steps: PlannedStep[]): PlannedStep[] {
    // Step 2: Analyze transaction parameters
    steps.push({
      stepId: `step_2_tx_analysis`,
      toolId: ToolType.AI_ANALYSIS,
      description: 'Analyze transaction parameters',
      inputs: {
        intent: intent,
        environmentData: { source: 'step_1_env_sensing', key: 'environmentData' },
        analysis_type: 'transaction_preparation'
      },
      expectedOutputs: ['transactionParams', 'risk']
    });
    
    // Step 3: Conditional risk assessment
    steps.push({
      stepId: `step_3_risk_check`,
      toolId: ToolType.CONDITIONAL,
      description: 'Check transaction risk level',
      inputs: {
        risk: { source: 'step_2_tx_analysis', key: 'risk' },
        condition: { operator: 'less_than', value: 'high' }
      },
      expectedOutputs: ['conditionMet']
    });
    
    // Step 4: Execute transaction if risk check passes
    steps.push({
      stepId: `step_4_transaction`,
      toolId: ToolType.SOLANA_TRANSACTION,
      description: 'Execute Solana transaction',
      inputs: {
        transactionParams: { source: 'step_2_tx_analysis', key: 'transactionParams' },
        riskCheckPassed: { source: 'step_3_risk_check', key: 'conditionMet' }
      },
      expectedOutputs: ['transactionResult'],
      condition: {
        source: 'step_3_risk_check',
        key: 'conditionMet',
        expected: true
      }
    });
    
    // Step 5: Generate transaction report
    steps.push({
      stepId: `step_5_report`,
      toolId: ToolType.AI_ANALYSIS,
      description: 'Generate transaction report',
      inputs: {
        transactionResult: { source: 'step_4_transaction', key: 'transactionResult' },
        intent: intent,
        analysis_type: 'transaction_report'
      },
      expectedOutputs: ['report', 'summary'],
      condition: {
        source: 'step_3_risk_check',
        key: 'conditionMet',
        expected: true
      }
    });
    
    // Alternative step if risk check fails
    steps.push({
      stepId: `step_5_risk_report`,
      toolId: ToolType.AI_ANALYSIS,
      description: 'Generate risk assessment report',
      inputs: {
        risk: { source: 'step_2_tx_analysis', key: 'risk' },
        intent: intent,
        analysis_type: 'risk_report'
      },
      expectedOutputs: ['report', 'summary'],
      condition: {
        source: 'step_3_risk_check',
        key: 'conditionMet',
        expected: false
      }
    });
    
    return this.validateSteps(steps);
  }
  
  /**
   * Generate a plan for an analysis intent
   * @param intent Analysis intent
   * @param context Planning context
   * @param steps Initial steps (should include environment sensing)
   * @returns Complete array of planned steps
   */
  private generateAnalysisPlan(intent: Intent, context: IntentContext, steps: PlannedStep[]): PlannedStep[] {
    // Step 2: Retrieve data for analysis
    steps.push({
      stepId: `step_2_data_retrieval`,
      toolId: ToolType.API_CALL,
      description: 'Retrieve data for analysis',
      inputs: {
        intent: intent,
        environmentData: { source: 'step_1_env_sensing', key: 'environmentData' }
      },
      expectedOutputs: ['data']
    });
    
    // Step 3: Process and transform data
    steps.push({
      stepId: `step_3_data_processing`,
      toolId: ToolType.DATA_TRANSFORMATION,
      description: 'Process and prepare data for analysis',
      inputs: {
        data: { source: 'step_2_data_retrieval', key: 'data' }
      },
      expectedOutputs: ['processedData']
    });
    
    // Step 4: First phase of analysis
    steps.push({
      stepId: `step_4_initial_analysis`,
      toolId: ToolType.AI_ANALYSIS,
      description: 'Perform initial analysis',
      inputs: {
        data: { source: 'step_3_data_processing', key: 'processedData' },
        intent: intent,
        analysis_type: 'initial'
      },
      expectedOutputs: ['initialInsights', 'metrics']
    });
    
    // Step 5: Deep analysis based on initial findings
    steps.push({
      stepId: `step_5_deep_analysis`,
      toolId: ToolType.AI_ANALYSIS,
      description: 'Perform deep analysis based on initial findings',
      inputs: {
        data: { source: 'step_3_data_processing', key: 'processedData' },
        initialInsights: { source: 'step_4_initial_analysis', key: 'initialInsights' },
        metrics: { source: 'step_4_initial_analysis', key: 'metrics' },
        intent: intent,
        analysis_type: 'deep'
      },
      expectedOutputs: ['analysis', 'portfolio', 'summary', 'impact']
    });
    
    return this.validateSteps(steps);
  }
  
  /**
   * Register default templates
   */
  private registerDefaultTemplates(): void {
    // Template for token price queries
    this.registerTemplate({
      id: 'token-price-query',
      name: 'Token Price Query',
      description: 'Handles queries about token prices',
      matches: (intent: Intent): boolean => {
        if (!intent || intent.type !== 'query' || !intent.content.toLowerCase().includes('price')) {
          return false;
        }
        
        return Array.isArray(intent.entities) && 
               intent.entities.length > 0 && 
               intent.entities.some(e => e && typeof e === 'object' && 'type' in e && typeof e.type === 'string' && e.type === 'token');
      },
      generateSteps: (intent: Intent, context: IntentContext) => {
        const tokenEntities = intent.entities?.filter(e => e.type === 'token') || [];
        
        return [
          {
            stepId: 'fetchTokenPrices',
            toolId: 'priceService',
            description: 'Fetch token prices',
            inputs: {
              tokens: tokenEntities.map(e => e.value),
              currency: 'USD'
            },
            expectedOutputs: ['prices']
          },
          {
            stepId: 'formatPriceResponse',
            toolId: 'responseFormatter',
            description: 'Format price information response',
            inputs: {
              prices: { source: 'fetchTokenPrices', key: 'prices' },
              tokens: tokenEntities.map(e => e.value)
            },
            expectedOutputs: ['response']
          }
        ];
      }
    });
    
    // Template for fund transfers
    this.registerTemplate({
      id: 'fund-transfer',
      name: 'Fund Transfer',
      description: 'Handles requests to transfer funds',
      matches: (intent: Intent) => {
        return intent.type === 'transaction' && 
               (intent.content.toLowerCase().includes('send') || 
                intent.content.toLowerCase().includes('transfer'));
      },
      generateSteps: (intent: Intent, context: IntentContext) => {
        return [
          {
            stepId: 'extractTransferParams',
            toolId: 'transferParamExtractor',
            description: 'Extract transfer parameters',
            inputs: {
              intent: intent,
              userContext: context
            },
            expectedOutputs: ['transferParams']
          },
          {
            stepId: 'validateTransfer',
            toolId: 'transferValidator',
            description: 'Validate transfer parameters',
            inputs: {
              params: { source: 'extractTransferParams', key: 'transferParams' },
              userWallets: context.userProfile?.wallets || []
            },
            expectedOutputs: ['isValid', 'warnings']
          },
          {
            stepId: 'confirmTransfer',
            toolId: 'userConfirmation',
            description: 'Get user confirmation for transfer',
            inputs: {
              transferDetails: { source: 'extractTransferParams', key: 'transferParams' },
              warnings: { source: 'validateTransfer', key: 'warnings' }
            },
            expectedOutputs: ['userConfirmed']
          },
          {
            stepId: 'executeTransfer',
            toolId: 'transferExecutor',
            description: 'Execute the transfer',
            inputs: {
              params: { source: 'extractTransferParams', key: 'transferParams' },
              confirmed: { source: 'confirmTransfer', key: 'userConfirmed' }
            },
            expectedOutputs: ['transactionHash', 'status']
          }
        ];
      }
    });
    
    // Template for portfolio analysis
    this.registerTemplate({
      id: 'portfolio-analysis',
      name: 'Portfolio Analysis',
      description: 'Handles requests to analyze user portfolio',
      matches: (intent: Intent) => {
        return intent.type === 'analysis' && 
               intent.content.toLowerCase().includes('portfolio');
      },
      generateSteps: (intent: Intent, context: IntentContext) => {
        return [
          {
            stepId: 'fetchPortfolioData',
            toolId: 'portfolioDataFetcher',
            description: 'Fetch portfolio data for analysis',
            inputs: {
              userWallets: context.userProfile?.wallets || [],
              timeRange: '30d'
            },
            expectedOutputs: ['portfolioData']
          },
          {
            stepId: 'analyzePortfolio',
            toolId: 'portfolioAnalyzer',
            description: 'Analyze portfolio performance and composition',
            inputs: {
              portfolioData: { source: 'fetchPortfolioData', key: 'portfolioData' },
              metrics: ['performance', 'risk', 'diversification']
            },
            expectedOutputs: ['analysis']
          },
          {
            stepId: 'generatePortfolioReport',
            toolId: 'reportGenerator',
            description: 'Generate portfolio analysis report',
            inputs: {
              analysis: { source: 'analyzePortfolio', key: 'analysis' },
              format: intent.metadata?.format || 'summary'
            },
            expectedOutputs: ['report']
          }
        ];
      }
    });
  }
} 