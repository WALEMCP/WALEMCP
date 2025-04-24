/**
 * Intent Parser Component
 * Handles parsing user inputs to structured intents for MCP
 */

import { Intent, Entity, TaskTemplate } from '../types';

interface IntentParsingOptions {
  confidenceThreshold?: number;
  maxEntities?: number;
  extractParameters?: boolean;
}

/**
 * Parses user inputs into structured intents for MCP execution
 */
export class IntentParser {
  private defaultOptions: IntentParsingOptions = {
    confidenceThreshold: 0.7,
    maxEntities: 15,
    extractParameters: true
  };

  /**
   * Parse user inputs into a structured intent
   * @param inputs User inputs
   * @param template The task template to use for parsing
   * @param options Parsing options
   * @returns Structured intent
   */
  async parseIntent(
    inputs: Record<string, any>,
    template: TaskTemplate,
    options?: IntentParsingOptions
  ): Promise<Intent> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Extract primary action from inputs
      const action = this.extractAction(inputs, template);
      
      // Extract entities from inputs
      const entities = this.extractEntities(inputs, template, opts.maxEntities);
      
      // Extract additional parameters
      const parameters = opts.extractParameters 
        ? this.extractParameters(inputs, template) 
        : {};
      
      // Calculate confidence level
      const confidence = this.calculateConfidence(action, entities, template);
      
      // Create intent object
      const intent: Intent = {
        action,
        entities,
        parameters,
        confidence
      };
      
      return intent;
    } catch (error) {
      console.error('Error parsing intent:', error);
      throw new Error(`Failed to parse intent: ${error.message}`);
    }
  }
  
  /**
   * Extract primary action from inputs
   * @param inputs User inputs
   * @param template Template for context
   * @returns Primary action
   */
  private extractAction(inputs: Record<string, any>, template: TaskTemplate): string {
    // Simple extraction from inputs
    if (inputs.action) {
      return inputs.action;
    }
    
    // Infer from template name and category
    if (template.category === 'defi') {
      return 'optimize_portfolio';
    } else if (template.category === 'dao') {
      return 'process_governance';
    } else if (template.category === 'analytics') {
      return 'analyze_data';
    } else if (template.category === 'content') {
      return 'generate_content';
    } else if (template.category === 'development') {
      return 'support_development';
    }
    
    // Default fallback
    return 'process_task';
  }
  
  /**
   * Extract entities from inputs
   * @param inputs User inputs
   * @param template Template for context
   * @param maxEntities Maximum number of entities to extract
   * @returns Array of entities
   */
  private extractEntities(
    inputs: Record<string, any>,
    template: TaskTemplate,
    maxEntities: number = 10
  ): Entity[] {
    const entities: Entity[] = [];
    
    // Process input definitions from template
    for (const inputDef of template.inputs) {
      if (inputs[inputDef.name] !== undefined) {
        const entity: Entity = {
          type: inputDef.type,
          value: inputs[inputDef.name]
        };
        
        // Add metadata if available
        if (inputDef.description) {
          entity.metadata = { description: inputDef.description };
        }
        
        entities.push(entity);
        
        // Check if we've reached the max entities
        if (entities.length >= maxEntities) {
          break;
        }
      }
    }
    
    // Process special input fields if available
    if (inputs.entities && Array.isArray(inputs.entities)) {
      for (const entityData of inputs.entities) {
        if (typeof entityData === 'object' && entityData.type && 'value' in entityData) {
          entities.push({
            type: entityData.type,
            value: entityData.value,
            metadata: entityData.metadata
          });
          
          // Check if we've reached the max entities
          if (entities.length >= maxEntities) {
            break;
          }
        }
      }
    }
    
    return entities;
  }
  
  /**
   * Extract additional parameters from inputs
   * @param inputs User inputs
   * @param template Template for context
   * @returns Parameters dictionary
   */
  private extractParameters(inputs: Record<string, any>, template: TaskTemplate): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    // Extract standard parameters if available
    if (inputs.parameters && typeof inputs.parameters === 'object') {
      Object.assign(parameters, inputs.parameters);
    }
    
    // Add template-specific parameters
    parameters.templateId = template.id;
    parameters.templateName = template.name;
    parameters.templateVersion = template.version;
    
    // Add context parameters if available
    if (inputs.context) {
      parameters.context = inputs.context;
    }
    
    // Add timestamp
    parameters.timestamp = Date.now();
    
    return parameters;
  }
  
  /**
   * Calculate confidence level for the intent
   * @param action Action extracted
   * @param entities Entities extracted
   * @param template Template used for context
   * @returns Confidence level (0-1)
   */
  private calculateConfidence(action: string, entities: Entity[], template: TaskTemplate): number {
    let confidence = 1.0;
    
    // Decrease confidence if no entities were found
    if (entities.length === 0) {
      confidence *= 0.7;
    }
    
    // Decrease confidence if action is default
    if (action === 'process_task') {
      confidence *= 0.8;
    }
    
    // Decrease confidence if minimal inputs provided
    const requiredInputs = template.inputs.filter(input => input.required).length;
    const providedRequiredInputs = entities.filter(entity => {
      const matchingInput = template.inputs.find(input => input.name === entity.type && input.required);
      return !!matchingInput;
    }).length;
    
    if (requiredInputs > 0) {
      confidence *= Math.min(1.0, providedRequiredInputs / requiredInputs);
    }
    
    return confidence;
  }
} 