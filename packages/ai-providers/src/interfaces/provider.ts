/**
 * File information for AI classification
 */
export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  mimeType?: string;
  createdAt: Date;
  modifiedAt: Date;
}

/**
 * Single file classification result
 */
export interface FileClassification {
  filePath: string;
  category: string;
  subcategory?: string;
  confidence: number;
  suggestedFolder: string;
  reasoning?: string;
}

/**
 * Complete classification result from AI provider
 */
export interface ClassificationResult {
  classifications: FileClassification[];
  suggestedRules?: Rule[];
  metadata: {
    provider: string;
    model: string;
    tokensUsed?: number;
    processingTimeMs: number;
  };
}

/**
 * Sorting rule structure
 */
export interface Rule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  action: RuleAction;
  priority: number;
  enabled?: boolean;
  tags?: string[];
}

/**
 * Rule condition
 */
export interface RuleCondition {
  type: 'extension' | 'name_pattern' | 'size' | 'date' | 'mime_type';
  operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than';
  value: string | number | RegExp;
  negate?: boolean;
  caseSensitive?: boolean;
}

/**
 * Rule action
 */
export interface RuleAction {
  type: 'move' | 'copy';
  destination: string;
  createFolder?: boolean;
  overwrite?: boolean;
  addSuffixIfExists?: boolean;
}

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * AI provider interface - All providers must implement this
 */
export interface IAIProvider {
  /** Unique provider name */
  readonly name: string;

  /** List of supported models */
  readonly supportedModels: string[];

  /** Default model to use */
  readonly defaultModel: string;

  /**
   * Initialize the provider with configuration
   */
  initialize(config: AIProviderConfig): Promise<void>;

  /**
   * Classify files into categories
   */
  classify(files: FileInfo[]): Promise<ClassificationResult>;

  /**
   * Suggest organization rules based on file analysis
   */
  suggestRules(files: FileInfo[]): Promise<Rule[]>;

  /**
   * Validate the provider configuration
   */
  validateConfig(config: AIProviderConfig): Promise<boolean>;

  /**
   * Test connection to the AI service
   */
  testConnection(): Promise<boolean>;

  /**
   * Get available models
   */
  getAvailableModels(): string[];

  /**
   * Check if provider is initialized
   */
  isInitialized: boolean;
}

/**
 * Provider factory options
 */
export interface ProviderFactoryOptions {
  timeout?: number;
  maxRetries?: number;
}

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  supportsJsonMode: boolean;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  maxInputTokens: number;
  maxOutputTokens: number;
}

/**
 * Classification options
 */
export interface ClassificationOptions {
  batchSize?: number;
  includeReasoning?: boolean;
  customCategories?: string[];
  temperature?: number;
}

/**
 * Rule suggestion options
 */
export interface RuleSuggestionOptions {
  maxRules?: number;
  includeDefaultRules?: boolean;
  priority?: number;
}
