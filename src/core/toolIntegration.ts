/**
 * Tool Integration Component
 * Manages the integration and execution of various tools in MCP
 */

import { PlannedStep, StepExecutionResult } from '../types';
import { SolanaConnector } from '../integrations/solanaConnector';
import { Logger } from '../utils/logger';

// Different tool types supported by the system
export enum ToolType {
  API_CALL = 'api_call',
  SOLANA_TRANSACTION = 'solana_transaction',
  AI_ANALYSIS = 'ai_analysis',
  DATA_TRANSFORMATION = 'data_transformation',
  CONDITIONAL = 'conditional'
}

interface Tool {
  id: string;
  type: ToolType;
  name: string;
  description: string;
  execute: (step: PlannedStep, context: any) => Promise<StepExecutionResult>;
}

/**
 * Manages and executes tools for MCP
 */
export class ToolIntegration {
  private tools: Map<string, Tool>;
  private logger: Logger;
  
  constructor(logger?: Logger) {
    this.tools = new Map();
    this.logger = logger || new Logger('info');
    
    // Register built-in tools
    this.registerBuiltInTools();
  }
  
  /**
   * Register a new tool for use in MCP
   * @param tool Tool definition and implementation
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.id)) {
      this.logger.warn(`Tool with ID ${tool.id} already exists. Overwriting.`);
    }
    
    this.tools.set(tool.id, tool);
    this.logger.debug(`Registered tool: ${tool.id} (${tool.type})`);
  }
  
  /**
   * Execute a step using the appropriate tool
   * @param step The planned execution step
   * @param context Task execution context
   * @returns Step execution result
   */
  async executeStep(step: PlannedStep, context: any): Promise<StepExecutionResult> {
    this.logger.debug(`Executing step: ${step.stepId} using tool: ${step.toolId}`);
    
    const startTime = Date.now();
    
    try {
      // Find the appropriate tool
      const tool = this.findToolForStep(step);
      
      if (!tool) {
        throw new Error(`No tool found for step: ${step.stepId} (tool ID: ${step.toolId})`);
      }
      
      // Execute the tool
      const result = await tool.execute(step, context);
      
      // Add execution metadata if not already included
      if (!result.duration) {
        result.duration = Date.now() - startTime;
      }
      
      this.logger.debug(`Step ${step.stepId} executed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Error executing step ${step.stepId}:`, error);
      
      // Return failure result
      return {
        stepId: step.stepId,
        status: 'failure',
        outputs: {},
        error: (error as Error).message,
        duration: Date.now() - startTime,
        tokenUsage: 0
      };
    }
  }
  
  /**
   * Get a list of all available tools
   * @returns Array of tools
   */
  getAvailableTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Find the appropriate tool for a step
   * @param step Planned execution step
   * @returns Tool implementation or undefined if not found
   */
  private findToolForStep(step: PlannedStep): Tool | undefined {
    // First try to find by exact tool ID
    if (this.tools.has(step.toolId)) {
      return this.tools.get(step.toolId);
    }
    
    // If not found by ID, look for a tool of the appropriate type
    // This allows generic tools to handle steps that don't specify a specific tool
    for (const tool of this.tools.values()) {
      if (tool.type.toString() === step.toolId) {
        return tool;
      }
    }
    
    return undefined;
  }
  
  /**
   * Register built-in tools
   */
  private registerBuiltInTools(): void {
    // API Call Tool
    this.registerTool({
      id: 'api_call',
      type: ToolType.API_CALL,
      name: 'API Call',
      description: 'Makes HTTP requests to external APIs',
      execute: async (step: PlannedStep, context: any): Promise<StepExecutionResult> => {
        try {
          // In a real implementation, this would use axios or fetch to make API calls
          // This is a mock implementation
          this.logger.info(`[Mock] Making API call for step: ${step.stepId}`);
          
          // Extract API details from step inputs
          const apiUrl = step.inputs.url || 'https://api.example.com';
          const method = step.inputs.method || 'GET';
          
          // Simulate API response
          const mockResponse = {
            success: true,
            data: {
              message: `Mock API response for ${apiUrl} using ${method}`,
              timestamp: Date.now()
            }
          };
          
          return {
            stepId: step.stepId,
            status: 'success',
            outputs: { result: mockResponse },
            duration: 500, // Simulated duration
            tokenUsage: 0
          };
        } catch (error) {
          return {
            stepId: step.stepId,
            status: 'failure',
            outputs: {},
            error: (error as Error).message,
            duration: 500,
            tokenUsage: 0
          };
        }
      }
    });
    
    // Solana Transaction Tool
    this.registerTool({
      id: 'solana_transaction',
      type: ToolType.SOLANA_TRANSACTION,
      name: 'Solana Transaction',
      description: 'Executes transactions on the Solana blockchain',
      execute: async (step: PlannedStep, context: any): Promise<StepExecutionResult> => {
        try {
          // In a real implementation, this would use SolanaConnector to execute transactions
          // This is a mock implementation
          this.logger.info(`[Mock] Executing Solana transaction for step: ${step.stepId}`);
          
          // Extract transaction details from step inputs
          const method = step.inputs.method || 'getAccountInfo';
          
          // Simulate transaction response
          const mockResponse = {
            signature: `mock_tx_sig_${Date.now()}`,
            slot: 12345678,
            blockTime: Math.floor(Date.now() / 1000),
            confirmationStatus: 'confirmed'
          };
          
          return {
            stepId: step.stepId,
            status: 'success',
            outputs: { result: mockResponse },
            duration: 2000, // Simulated duration
            tokenUsage: 0
          };
        } catch (error) {
          return {
            stepId: step.stepId,
            status: 'failure',
            outputs: {},
            error: (error as Error).message,
            duration: 2000,
            tokenUsage: 0
          };
        }
      }
    });
    
    // AI Analysis Tool
    this.registerTool({
      id: 'ai_analysis',
      type: ToolType.AI_ANALYSIS,
      name: 'AI Analysis',
      description: 'Performs AI analysis on data',
      execute: async (step: PlannedStep, context: any): Promise<StepExecutionResult> => {
        try {
          // In a real implementation, this would use an AI provider like OpenAI
          // This is a mock implementation
          this.logger.info(`[Mock] Performing AI analysis for step: ${step.stepId}`);
          
          // Extract analysis details from step inputs
          const analysisType = step.inputs.analysis_type || 'general';
          
          // Simulate AI analysis response
          const mockResponse = {
            analysis: `Mock AI analysis (${analysisType})`,
            confidence: 0.92,
            reasoning: "This is a simulated AI analysis response",
            timestamp: Date.now()
          };
          
          return {
            stepId: step.stepId,
            status: 'success',
            outputs: { 
              result: mockResponse,
              // Add different output mappings based on the step's expected outputs
              portfolio: { assets: [], metrics: {} },
              metrics: { risk: 'moderate', return: 'positive' },
              summary: "This is a summary",
              type: "analysis_result",
              entities: ["entity1", "entity2"],
              impact: { financial: "positive", governance: "neutral" }
            },
            duration: 1500, // Simulated duration
            tokenUsage: 750 // Simulated token usage
          };
        } catch (error) {
          return {
            stepId: step.stepId,
            status: 'failure',
            outputs: {},
            error: (error as Error).message,
            duration: 1500,
            tokenUsage: 100
          };
        }
      }
    });
    
    // Data Transformation Tool
    this.registerTool({
      id: 'data_transformation',
      type: ToolType.DATA_TRANSFORMATION,
      name: 'Data Transformation',
      description: 'Transforms data between formats',
      execute: async (step: PlannedStep, context: any): Promise<StepExecutionResult> => {
        try {
          this.logger.info(`[Mock] Transforming data for step: ${step.stepId}`);
          
          // Extract transformation details from step inputs
          const inputData = step.inputs.data || {};
          
          // Simulate data transformation
          const mockResult = {
            transformed: true,
            original: inputData,
            timestamp: Date.now()
          };
          
          return {
            stepId: step.stepId,
            status: 'success',
            outputs: { 
              result: mockResult,
              trends: { current: "up", historical: "stable" }
            },
            duration: 200, // Simulated duration
            tokenUsage: 0
          };
        } catch (error) {
          return {
            stepId: step.stepId,
            status: 'failure',
            outputs: {},
            error: (error as Error).message,
            duration: 200,
            tokenUsage: 0
          };
        }
      }
    });
    
    // Conditional Tool
    this.registerTool({
      id: 'conditional',
      type: ToolType.CONDITIONAL,
      name: 'Conditional',
      description: 'Evaluates conditions and executes conditional logic',
      execute: async (step: PlannedStep, context: any): Promise<StepExecutionResult> => {
        try {
          this.logger.info(`[Mock] Evaluating condition for step: ${step.stepId}`);
          
          // Extract condition from step inputs
          const condition = step.inputs.condition || true;
          
          // Simulate condition evaluation
          const mockResult = {
            conditionMet: Boolean(condition),
            timestamp: Date.now()
          };
          
          return {
            stepId: step.stepId,
            status: 'success',
            outputs: { result: mockResult },
            duration: 100, // Simulated duration
            tokenUsage: 0
          };
        } catch (error) {
          return {
            stepId: step.stepId,
            status: 'failure',
            outputs: {},
            error: (error as Error).message,
            duration: 100,
            tokenUsage: 0
          };
        }
      }
    });
  }
} 