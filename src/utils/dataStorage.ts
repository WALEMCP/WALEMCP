/**
 * Data Storage Utility
 * Handles persistent storage of MCP data on Arweave and IPFS
 */

import Arweave from 'arweave';
import axios from 'axios';
import { TaskTemplate, TaskResult } from '../types';

export interface StorageConfig {
  arweaveEndpoint?: string;
  ipfsGateway?: string;
  defaultTags?: Record<string, string>;
}

/**
 * Provides decentralized storage capabilities for MCP
 */
export class DataStorage {
  private arweave: Arweave | null = null;
  private ipfsGateway: string | null = null;
  private defaultTags: Record<string, string>;
  
  constructor(
    arweaveEndpoint?: string,
    ipfsGateway?: string,
    config?: Partial<StorageConfig>
  ) {
    // Initialize Arweave if endpoint provided
    if (arweaveEndpoint) {
      this.arweave = Arweave.init({
        host: new URL(arweaveEndpoint).hostname,
        port: new URL(arweaveEndpoint).port ? parseInt(new URL(arweaveEndpoint).port) : 443,
        protocol: new URL(arweaveEndpoint).protocol.replace(':', '')
      });
    }
    
    // Set IPFS gateway if provided
    this.ipfsGateway = ipfsGateway || null;
    
    // Set default tags for Arweave transactions
    this.defaultTags = config?.defaultTags || {
      'App-Name': 'WALEMCP',
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Store a template in decentralized storage
   * @param template Template to store
   * @param templateId Template identifier
   * @returns Storage identifier
   */
  async storeTemplate(template: TaskTemplate, templateId: string): Promise<string> {
    const data = JSON.stringify(template);
    const tags = {
      ...this.defaultTags,
      'Template-ID': templateId,
      'Template-Name': template.name,
      'Template-Version': template.version,
      'Template-Category': template.category
    };
    
    try {
      if (this.arweave) {
        // Store on Arweave
        return await this.storeOnArweave(data, tags);
      } else if (this.ipfsGateway) {
        // Store on IPFS
        return await this.storeOnIPFS(data, tags);
      } else {
        // Mock storage for development
        console.log(`[Mock] Template stored: ${templateId}`);
        return `mock_storage_${templateId}`;
      }
    } catch (error) {
      console.error('Error storing template:', error);
      throw new Error(`Failed to store template: ${error.message}`);
    }
  }
  
  /**
   * Store a task execution result
   * @param result Task execution result
   * @returns Storage identifier
   */
  async storeResult(result: TaskResult): Promise<string> {
    const data = JSON.stringify(result);
    const tags = {
      ...this.defaultTags,
      'Task-ID': result.taskId,
      'Task-Status': result.status,
      'Execution-Time': result.metadata.executionTime.toString()
    };
    
    try {
      if (this.arweave) {
        // Store on Arweave
        return await this.storeOnArweave(data, tags);
      } else if (this.ipfsGateway) {
        // Store on IPFS
        return await this.storeOnIPFS(data, tags);
      } else {
        // Mock storage for development
        console.log(`[Mock] Result stored: ${result.taskId}`);
        return `mock_storage_${result.taskId}`;
      }
    } catch (error) {
      console.error('Error storing result:', error);
      throw new Error(`Failed to store result: ${error.message}`);
    }
  }
  
  /**
   * Retrieve a template from storage
   * @param templateId Template identifier
   * @returns The stored template
   */
  async getTemplate(templateId: string): Promise<TaskTemplate | null> {
    try {
      if (this.arweave) {
        // Find transaction ID by tags
        const txId = await this.findArweaveTxByTags({ 'Template-ID': templateId });
        if (!txId) return null;
        
        // Get data from Arweave
        const data = await this.getFromArweave(txId);
        return JSON.parse(data);
      } else if (this.ipfsGateway) {
        // Get from IPFS (implementation depends on how you store the mappings)
        const cid = await this.findIPFSCidByTags({ 'Template-ID': templateId });
        if (!cid) return null;
        
        const data = await this.getFromIPFS(cid);
        return JSON.parse(data);
      } else {
        // Mock retrieval for development
        console.log(`[Mock] Retrieving template: ${templateId}`);
        
        // Return mock template data
        return {
          id: templateId,
          name: 'Mock Template',
          description: 'This is a mock template for development',
          version: '1.0.0',
          author: 'WALEMCP',
          category: 'defi',
          inputs: [],
          outputs: [],
          steps: [],
          permissions: [],
          metadata: {}
        };
      }
    } catch (error) {
      console.error(`Error retrieving template ${templateId}:`, error);
      return null;
    }
  }
  
  /**
   * Retrieve a task execution result
   * @param taskId Task identifier
   * @returns The stored result
   */
  async getTaskResult(taskId: string): Promise<TaskResult | null> {
    try {
      if (this.arweave) {
        // Find transaction ID by tags
        const txId = await this.findArweaveTxByTags({ 'Task-ID': taskId });
        if (!txId) return null;
        
        // Get data from Arweave
        const data = await this.getFromArweave(txId);
        return JSON.parse(data);
      } else if (this.ipfsGateway) {
        // Get from IPFS (implementation depends on how you store the mappings)
        const cid = await this.findIPFSCidByTags({ 'Task-ID': taskId });
        if (!cid) return null;
        
        const data = await this.getFromIPFS(cid);
        return JSON.parse(data);
      } else {
        // Mock retrieval for development
        console.log(`[Mock] Retrieving task result: ${taskId}`);
        
        // Return mock result data
        return {
          taskId,
          status: 'success',
          outputs: { result: 'Mock result data' },
          metadata: {
            executionTime: 1000,
            resourceUsage: { processingTime: 1000, apiCalls: 5, tokenUsage: 1000 }
          }
        };
      }
    } catch (error) {
      console.error(`Error retrieving task result ${taskId}:`, error);
      return null;
    }
  }
  
  // Private helper methods
  
  private async storeOnArweave(data: string, tags: Record<string, string>): Promise<string> {
    if (!this.arweave) {
      throw new Error('Arweave not initialized');
    }
    
    try {
      // Create transaction
      const tx = await this.arweave.createTransaction({ data });
      
      // Add tags
      Object.entries(tags).forEach(([key, value]) => {
        tx.addTag(key, value);
      });
      
      // Sign and post transaction
      // Note: In a real application, you would need to handle wallet/key management
      // This is a simplified example
      // await this.arweave.transactions.sign(tx, key);
      // await this.arweave.transactions.post(tx);
      
      console.log(`[Mock] Data stored on Arweave: ${tx.id}`);
      return tx.id;
    } catch (error) {
      console.error('Arweave storage error:', error);
      throw new Error(`Arweave storage failed: ${error.message}`);
    }
  }
  
  private async storeOnIPFS(data: string, tags: Record<string, string>): Promise<string> {
    if (!this.ipfsGateway) {
      throw new Error('IPFS gateway not configured');
    }
    
    try {
      // Mock IPFS storage
      // In a real application, you would use a proper IPFS client or API
      const mockCID = `ipfs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      console.log(`[Mock] Data stored on IPFS: ${mockCID}`);
      console.log('Tags:', tags);
      
      return mockCID;
    } catch (error) {
      console.error('IPFS storage error:', error);
      throw new Error(`IPFS storage failed: ${error.message}`);
    }
  }
  
  private async getFromArweave(txId: string): Promise<string> {
    if (!this.arweave) {
      throw new Error('Arweave not initialized');
    }
    
    try {
      // Get transaction data
      const tx = await this.arweave.transactions.get(txId);
      const data = await this.arweave.transactions.getData(txId, { decode: true });
      
      return data.toString();
    } catch (error) {
      console.error(`Error retrieving data from Arweave (${txId}):`, error);
      throw error;
    }
  }
  
  private async getFromIPFS(cid: string): Promise<string> {
    if (!this.ipfsGateway) {
      throw new Error('IPFS gateway not configured');
    }
    
    try {
      // Fetch data from IPFS gateway
      const response = await axios.get(`${this.ipfsGateway}/ipfs/${cid}`);
      return JSON.stringify(response.data);
    } catch (error) {
      console.error(`Error retrieving data from IPFS (${cid}):`, error);
      throw error;
    }
  }
  
  private async findArweaveTxByTags(tags: Record<string, string>): Promise<string | null> {
    if (!this.arweave) {
      throw new Error('Arweave not initialized');
    }
    
    try {
      // Build GraphQL query to find transaction by tags
      // This is a simplified example
      console.log(`[Mock] Finding Arweave transaction by tags:`, tags);
      
      // Return mock transaction ID
      return `mock_arweave_tx_${Object.values(tags).join('_')}`;
    } catch (error) {
      console.error('Error searching Arweave transactions:', error);
      return null;
    }
  }
  
  private async findIPFSCidByTags(tags: Record<string, string>): Promise<string | null> {
    try {
      // In a real application, you would need a database or index to map tags to CIDs
      console.log(`[Mock] Finding IPFS CID by tags:`, tags);
      
      // Return mock CID
      return `mock_ipfs_cid_${Object.values(tags).join('_')}`;
    } catch (error) {
      console.error('Error searching IPFS entries:', error);
      return null;
    }
  }
} 