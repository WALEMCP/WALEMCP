/**
 * WALEMCP Type Definitions
 */

// Task Template Interface
export interface TaskTemplate {
  id?: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'defi' | 'dao' | 'analytics' | 'content' | 'development' | 'other';
  inputs: InputDefinition[];
  outputs: OutputDefinition[];
  steps: StepDefinition[];
  permissions: PermissionRequest[];
  metadata: Record<string, any>;
}

// Input Definition
export interface InputDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'address' | 'file';
  description: string;
  required: boolean;
  default?: any;
  validation?: ValidationRule;
}

// Validation Rules
export interface ValidationRule {
  pattern?: string;
  min?: number;
  max?: number;
  allowedValues?: any[];
}

// Output Definition
export interface OutputDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'address' | 'file';
  description: string;
}

// Step Definition
export interface StepDefinition {
  id: string;
  name: string;
  type: 'api_call' | 'solana_transaction' | 'ai_analysis' | 'data_transformation' | 'conditional';
  description: string;
  inputs: StepInput[];
  outputs: StepOutput[];
  config: Record<string, any>;
  retry?: RetryConfig;
  condition?: string;
}

// Step Input
export interface StepInput {
  name: string;
  source: 'user_input' | 'previous_step' | 'environment' | 'constant';
  sourceReference?: string;
  transformation?: string;
}

// Step Output
export interface StepOutput {
  name: string;
  mapping: string;
}

// Retry Configuration
export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoffFactor: number;
  retryCondition: string;
}

// Permission Request
export interface PermissionRequest {
  type: 'data_access' | 'transaction_execution' | 'api_access' | 'storage_access';
  description: string;
  scope: string;
}

// Intent Interface
export interface Intent {
  id: string;
  type: string; // 'query', 'transaction', 'analysis', etc.
  content: string;
  action?: string;
  entities?: Entity[];
  timestamp: number;
  userId: string;
  metadata?: Record<string, any>;
}

// Entity Interface
export interface Entity {
  type: string; // 'token', 'amount', 'address', etc.
  value: string;
  metadata?: Record<string, any>;
}

// Execution Plan
export interface ExecutionPlan {
  taskId: string;
  templateId: string;
  steps: PlannedStep[];
  expectedOutputs: Record<string, any>;
  estimatedResources: ResourceEstimate;
}

// Planned Step
export interface PlannedStep {
  stepId: string;
  toolId: string;
  description: string;
  inputs: Record<string, any>;
  expectedOutputs: string[];
  condition?: StepCondition;
}

// Resource Estimate
export interface ResourceEstimate {
  computeUnits: number;
  timeEstimateMs: number;
  tokenUsage: number;
  solanaFees?: number;
}

// Solana Specific Types
export interface SolanaTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
}

export interface SolanaAccount {
  pubkey: string;
  lamports: number;
  data: any;
  owner: string;
  executable: boolean;
  rentEpoch: number;
}

// Template Search Result
export interface TemplateSearchResult {
  template: TaskTemplate;
  score: number;
  usageCount: number;
  avgRating: number;
}

// Execution Result
export interface StepExecutionResult {
  stepId: string;
  status: 'success' | 'failure' | 'in_progress';
  outputs: Record<string, any>;
  error?: string;
  duration: number;
  tokenUsage: number;
}

// Tool Definition
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  connectionConfig: Record<string, any>;
}

/**
 * Core type definitions for the MCP system
 */

/**
 * Context for intent processing
 */
export interface IntentContext {
  userProfile?: UserProfile;
  preferences?: Record<string, any>;
  environment?: EnvironmentData;
  sessionData?: Record<string, any>;
  history?: Intent[];
}

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  preferences?: Record<string, any>;
  wallets?: WalletInfo[];
  permissions?: string[];
}

/**
 * Wallet information
 */
export interface WalletInfo {
  address: string;
  chain: string;
  type: string;
  label?: string;
}

/**
 * Environmental data
 */
export interface EnvironmentData {
  timestamp: number;
  marketData?: Record<string, any>;
  priceData?: Record<string, any>;
  networkStatus?: Record<string, any>;
}

/**
 * Condition for conditional step execution
 */
export interface StepCondition {
  source: string; // stepId
  key: string;
  expected: any;
}

/**
 * Context for plan execution
 */
export interface PlanExecutionContext {
  stepResults: Map<string, any>;
  environment: EnvironmentData;
  userContext: IntentContext;
  executedSteps: string[];
  failedSteps: string[];
  currentStep?: string;
}

/**
 * Result of a tool execution
 */
export interface ToolExecutionResult {
  success: boolean;
  outputs: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Result of plan execution
 */
export interface PlanExecutionResult {
  success: boolean;
  executedSteps: string[];
  failedSteps: string[];
  finalOutputs: Record<string, any>;
  error?: string;
} 