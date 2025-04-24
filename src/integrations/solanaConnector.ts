/**
 * Solana Connector Implementation
 * Handles interactions with the Solana blockchain
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
  Commitment
} from '@solana/web3.js';
import { AnchorProvider, Program } from '@project-serum/anchor';
import { TaskTemplate, TaskContext, SolanaTransaction, SolanaAccount } from '../types';

export interface SolanaConnectorConfig {
  programId: string;
  templateAccountPrefix: string;
  executionAccountPrefix: string;
}

/**
 * Connects to Solana blockchain for MCP operations
 */
export class SolanaConnector {
  private connection: Connection;
  private config: SolanaConnectorConfig;
  private programId: PublicKey;

  constructor(
    endpoint: string,
    config?: Partial<SolanaConnectorConfig>
  ) {
    this.connection = new Connection(endpoint, 'confirmed');
    this.config = {
      programId: config?.programId || 'MCPv1111111111111111111111111111111111111',
      templateAccountPrefix: config?.templateAccountPrefix || 'template',
      executionAccountPrefix: config?.executionAccountPrefix || 'execution'
    };
    this.programId = new PublicKey(this.config.programId);
  }

  /**
   * Fetch on-chain data related to specific Solana accounts or programs
   * @param accounts List of account addresses to fetch
   * @returns Data from accounts
   */
  async fetchAccountsData(accounts: string[]): Promise<Record<string, SolanaAccount>> {
    const pubkeys = accounts.map(account => new PublicKey(account));
    const accountInfos = await this.connection.getMultipleAccountsInfo(pubkeys);
    
    const result: Record<string, SolanaAccount> = {};
    
    for (let i = 0; i < accounts.length; i++) {
      const accountInfo = accountInfos[i];
      if (accountInfo) {
        result[accounts[i]] = {
          pubkey: accounts[i],
          lamports: accountInfo.lamports,
          data: accountInfo.data,
          owner: accountInfo.owner.toString(),
          executable: accountInfo.executable,
          rentEpoch: accountInfo.rentEpoch
        };
      }
    }
    
    return result;
  }

  /**
   * Fetch transaction data from Solana
   * @param signature Transaction signature
   * @returns Transaction details
   */
  async fetchTransaction(signature: string): Promise<SolanaTransaction | null> {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      if (!transaction) return null;
      
      return {
        signature,
        slot: transaction.slot,
        blockTime: transaction.blockTime || 0,
        confirmationStatus: 'confirmed'
      };
    } catch (error) {
      console.error(`Error fetching transaction ${signature}:`, error);
      return null;
    }
  }

  /**
   * Register a template on Solana blockchain
   * @param template Template to register
   * @param creatorId Creator identifier
   * @returns Template ID
   */
  async registerTemplate(template: TaskTemplate, creatorId: string): Promise<string> {
    // Generate a deterministic template ID
    const templateId = this.generateTemplateId(template, creatorId);
    
    // Serialize template data for on-chain storage
    const templateData = JSON.stringify({
      id: templateId,
      name: template.name,
      version: template.version,
      creator: creatorId,
      category: template.category,
      timestamp: new Date().getTime()
    });
    
    // TODO: Implement actual on-chain registration when program is available
    console.log(`[Mock] Template registered on-chain: ${templateId}`);
    
    return templateId;
  }

  /**
   * Search for templates matching criteria
   * @param criteria Search criteria
   * @returns Array of template IDs
   */
  async searchTemplates(criteria: Record<string, any>): Promise<string[]> {
    // TODO: Implement actual on-chain search when program is available
    console.log(`[Mock] Searching templates with criteria:`, criteria);
    
    // Return mock template IDs
    return [
      'template_defi_01',
      'template_dao_01',
      'template_analytics_01'
    ];
  }

  /**
   * Store execution proof on-chain
   * @param context Execution context
   * @returns Proof identifier
   */
  async storeExecutionProof(context: TaskContext): Promise<string> {
    // Generate a unique proof ID
    const proofId = `proof_${context.taskId}`;
    
    // Create proof data
    const proofData = {
      taskId: context.taskId,
      userId: context.userId,
      startTime: context.startTime,
      endTime: Date.now(),
      inputsHash: this.hashData(JSON.stringify(context.inputs)),
      outputsHash: this.hashData(JSON.stringify(this.getOutputsFromContext(context))),
      executionSteps: context.history.length
    };
    
    // TODO: Implement actual on-chain storage when program is available
    console.log(`[Mock] Execution proof stored on-chain: ${proofId}`);
    
    return proofId;
  }

  /**
   * Submit a transaction to Solana
   * @param instructions Transaction instructions
   * @param signers Transaction signers
   * @param commitment Commitment level
   * @returns Transaction signature
   */
  async submitTransaction(
    instructions: TransactionInstruction[],
    signers: Keypair[],
    commitment: Commitment = 'confirmed'
  ): Promise<string> {
    const transaction = new Transaction();
    instructions.forEach(instruction => transaction.add(instruction));
    
    try {
      return await sendAndConfirmTransaction(
        this.connection,
        transaction,
        signers,
        { commitment }
      );
    } catch (error) {
      console.error('Error submitting transaction:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get the current Solana network status
   * @returns Network status information
   */
  async getNetworkStatus(): Promise<{
    blockHeight: number;
    slot: number;
    epochInfo: {
      epoch: number;
      slotIndex: number;
      slotsInEpoch: number;
      absoluteSlot: number;
      blockHeight?: number;
      transactionCount?: number;
    }
  }> {
    const [blockHeight, slot, epochInfo] = await Promise.all([
      this.connection.getBlockHeight(),
      this.connection.getSlot(),
      this.connection.getEpochInfo()
    ]);
    
    return {
      blockHeight,
      slot,
      epochInfo
    };
  }

  // Helper methods
  private generateTemplateId(template: TaskTemplate, creatorId: string): string {
    const timestamp = new Date().getTime();
    const baseString = `${template.name}_${template.version}_${creatorId}_${timestamp}`;
    return `template_${this.hashData(baseString).slice(0, 16)}`;
  }
  
  private hashData(data: string): string {
    // Simple hash function for demo purposes
    // In production, use a proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16).replace('-', '0');
  }
  
  private getOutputsFromContext(context: TaskContext): Record<string, any> {
    if (context.history.length === 0) return {};
    
    // Get outputs from the last execution step
    const lastStep = context.history[context.history.length - 1];
    return lastStep.outputs || {};
  }
} 