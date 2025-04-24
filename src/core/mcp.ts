/**
 * Multi-Context Protocol (MCP) Core Implementation
 * Solana Ecosystem's Intelligent Connector
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { IntentParser } from './intentParser';
import { EnvironmentSensor } from './environmentSensor';
import { ToolIntegration } from './toolIntegration';
import { DecisionEngine } from './decisionEngine';
import { ExecutionMonitor } from './executionMonitor';
import { KnowledgeModule } from './knowledgeModule';
import { SolanaConnector } from '../integrations/solanaConnector';
import { DataStorage } from '../utils/dataStorage';
import { Logger } from '../utils/logger';
import { TaskTemplate } from '../types';

export interface MCPConfig {
  solanaEndpoint: string;
  arweaveEndpoint?: string;
  ipfsGateway?: string;
  aiProvider: string;
  aiApiKey: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface TaskContext {
  taskId: string;
  userId: string;
  inputs: Record<string, any>;
  environment: Record<string, any>;
  history: any[];
  startTime: number;
}

export interface TaskResult {
  taskId: string;
  status: 'success' | 'failure' | 'in_progress';
  outputs: Record<string, any>;
  metadata: {
    executionTime: number;
    resourceUsage: Record<string, number>;
    onChainVerification?: string;
  };
}

/**
 * MCP Protocol core class - the intelligent connector for Solana
 */
export class MCP {
  private config: MCPConfig;
  private intentParser: IntentParser;
  private environmentSensor: EnvironmentSensor;
  private toolIntegration: ToolIntegration;
  private decisionEngine: DecisionEngine;
  private executionMonitor: ExecutionMonitor;
  private knowledgeModule: KnowledgeModule;
  private solanaConnector: SolanaConnector;
  private dataStorage: DataStorage;
  private logger: Logger;

  constructor(config: MCPConfig) {
    this.config = config;
    this.logger = new Logger(config.logLevel);
    this.solanaConnector = new SolanaConnector(config.solanaEndpoint);
    this.dataStorage = new DataStorage(config.arweaveEndpoint, config.ipfsGateway);
    
    // Initialize core components
    this.intentParser = new IntentParser();
    this.environmentSensor = new EnvironmentSensor(this.solanaConnector);
    this.toolIntegration = new ToolIntegration();
    this.decisionEngine = new DecisionEngine(config.aiProvider, config.aiApiKey);
    this.executionMonitor = new ExecutionMonitor();
    this.knowledgeModule = new KnowledgeModule(this.dataStorage);
    
    this.logger.info('MCP Core initialized successfully');
  }

  /**
   * Execute a task using the MCP protocol
   * @param taskTemplate The template defining the task structure
   * @param inputs User inputs for the task
   * @param userId Identifier of the user
   * @returns Task execution result
   */
  async executeTask(taskTemplate: TaskTemplate, inputs: Record<string, any>, userId: string): Promise<TaskResult> {
    const taskId = this.generateTaskId();
    this.logger.info(`Starting task execution: ${taskId}`);
    
    try {
      // Create task context
      const context: TaskContext = {
        taskId,
        userId,
        inputs,
        environment: {},
        history: [],
        startTime: Date.now()
      };
      
      // Parse intent from inputs
      const intent = await this.intentParser.parseIntent(inputs, taskTemplate);
      this.logger.debug(`Parsed intent: ${JSON.stringify(intent)}`);
      
      // Sense environment (Solana on-chain data)
      context.environment = await this.environmentSensor.gatherEnvironmentData(intent);
      
      // Generate execution plan
      const executionPlan = await this.decisionEngine.generatePlan(intent, context, taskTemplate);
      this.logger.debug(`Execution plan generated: ${JSON.stringify(executionPlan)}`);
      
      // Execute the plan with tools
      for (const step of executionPlan.steps) {
        const stepResult = await this.toolIntegration.executeStep(step, context);
        context.history.push(stepResult);
        
        // Monitor execution and adapt if needed
        const adaptedPlan = await this.executionMonitor.evaluateExecution(
          executionPlan, 
          context, 
          step, 
          stepResult
        );
        
        if (adaptedPlan) {
          this.logger.info('Execution plan adapted based on feedback');
          // Continue with adapted plan
        }
      }
      
      // Prepare final results
      const result: TaskResult = {
        taskId,
        status: 'success',
        outputs: this.prepareOutputs(context),
        metadata: {
          executionTime: Date.now() - context.startTime,
          resourceUsage: this.calculateResourceUsage(context),
          onChainVerification: await this.storeVerificationProof(context)
        }
      };
      
      // Store result on Arweave/IPFS for persistence
      await this.dataStorage.storeResult(result);
      
      this.logger.info(`Task completed successfully: ${taskId}`);
      return result;
      
    } catch (error) {
      this.logger.error(`Task execution failed: ${error}`);
      return {
        taskId,
        status: 'failure',
        outputs: { error: error.message },
        metadata: {
          executionTime: Date.now() - (this.getTaskStartTime(taskId) || Date.now()),
          resourceUsage: {}
        }
      };
    }
  }
  
  /**
   * Register a new template for task execution
   * @param template Template definition
   * @param creatorId Creator identifier
   * @returns Template ID
   */
  async registerTemplate(template: TaskTemplate, creatorId: string): Promise<string> {
    // Validate template structure
    const isValid = this.validateTemplate(template);
    if (!isValid) {
      throw new Error('Invalid template structure');
    }
    
    // Store template on-chain and in decentralized storage
    const templateId = await this.solanaConnector.registerTemplate(template, creatorId);
    await this.dataStorage.storeTemplate(template, templateId);
    
    this.logger.info(`New template registered: ${templateId}`);
    return templateId;
  }
  
  /**
   * Search for templates matching certain criteria
   * @param criteria Search criteria
   * @returns Matching templates
   */
  async searchTemplates(criteria: Record<string, any>): Promise<TaskTemplate[]> {
    // Search templates from Solana on-chain data and decentralized storage
    const templateIds = await this.solanaConnector.searchTemplates(criteria);
    const templates = await Promise.all(
      templateIds.map(id => this.dataStorage.getTemplate(id))
    );
    
    return templates.filter(t => !!t);
  }
  
  // Private helper methods
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  private getTaskStartTime(taskId: string): number | null {
    // Implementation to get task start time
    return null;
  }
  
  private prepareOutputs(context: TaskContext): Record<string, any> {
    // Process context to extract relevant outputs
    const outputs: Record<string, any> = {};
    
    if (context.history.length > 0) {
      const lastStep = context.history[context.history.length - 1];
      Object.assign(outputs, lastStep.outputs);
    }
    
    return outputs;
  }
  
  private calculateResourceUsage(context: TaskContext): Record<string, number> {
    // Calculate resource usage for billing/monitoring
    return {
      processingTime: Date.now() - context.startTime,
      apiCalls: context.history.length,
      tokenUsage: context.history.reduce((sum, step) => sum + (step.tokenUsage || 0), 0)
    };
  }
  
  private async storeVerificationProof(context: TaskContext): Promise<string> {
    // Store execution verification on-chain
    const proof = await this.solanaConnector.storeExecutionProof(context);
    return proof;
  }
  
  private validateTemplate(template: TaskTemplate): boolean {
    // Validate template structure and components
    // Implementation details
    return true;
  }
} 