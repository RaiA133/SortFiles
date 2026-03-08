import axios, { AxiosInstance } from 'axios';
import {
  IAIProvider,
  FileInfo,
  ClassificationResult,
  Rule,
  AIProviderConfig,
  ClassificationOptions,
  RuleSuggestionOptions,
} from '../../interfaces/provider';
import { generateClassificationPrompt, generateRuleSuggestionPrompt } from '../../prompts';

/**
 * Qwen API Response structure
 */
interface QwenResponse {
  output: {
    text: string;
    finish_reason: string;
  };
  usage: {
    output_tokens: number;
    input_tokens: number;
    total_tokens: number;
  };
}

/**
 * Qwen Provider Implementation
 * Supports Alibaba Cloud's Qwen models via DashScope API
 */
export class QwenProvider implements IAIProvider {
  readonly name = 'qwen';
  readonly supportedModels = [
    'qwen-max',
    'qwen-plus',
    'qwen-turbo',
    'qwen-long',
  ];
  readonly defaultModel = 'qwen-turbo';

  private client: AxiosInstance | null = null;
  private config: AIProviderConfig | null = null;

  get isInitialized(): boolean {
    return this._isInitialized;
  }
  private _isInitialized = false;
  private readonly baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

  async initialize(config: AIProviderConfig): Promise<void> {
    this.config = {
      ...config,
      model: config.model || this.defaultModel,
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 4096,
      timeout: config.timeout ?? 60000,
      maxRetries: config.maxRetries ?? 3,
    };

    this.client = axios.create({
      baseURL: config.baseURL || this.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this._isInitialized = true;
  }

  async classify(files: FileInfo[], options: ClassificationOptions = {}): Promise<ClassificationResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    const {
      batchSize = 100,
      includeReasoning = false,
      customCategories,
      temperature = this.config?.temperature ?? 0.3,
    } = options;

    const allClassifications: any[] = [];
    let totalTokensUsed = 0;

    // Process files in batches
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const prompt = generateClassificationPrompt(batch, {
        customCategories,
        includeReasoning,
        batchSize,
      });

      try {
        const response = await this.makeRequest(prompt, temperature);

        totalTokensUsed += response.usage.total_tokens;

        const parsed = JSON.parse(response.output.text);
        allClassifications.push(...(parsed.classifications || []));
      } catch (error) {
        console.error(`Qwen classification error for batch ${i / batchSize + 1}:`, error);
        // Add placeholder classifications for failed batch
        allClassifications.push(
          ...batch.map((f) => ({
            filePath: f.path,
            category: 'Unknown',
            confidence: 0,
            suggestedFolder: './Unknown',
          }))
        );
      }
    }

    return {
      classifications: allClassifications,
      metadata: {
        provider: this.name,
        model: this.config?.model || this.defaultModel,
        tokensUsed: totalTokensUsed,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  async suggestRules(files: FileInfo[], options: RuleSuggestionOptions = {}): Promise<Rule[]> {
    this.ensureInitialized();

    const { maxRules = 20, priority = 10 } = options;
    const prompt = generateRuleSuggestionPrompt(files, { maxRules, priority });

    try {
      const response = await this.makeRequest(prompt, 0.4);
      const parsed = JSON.parse(response.output.text);
      return parsed.rules || [];
    } catch (error) {
      console.error('Qwen rule suggestion error:', error);
      return [];
    }
  }

  async validateConfig(config: AIProviderConfig): Promise<boolean> {
    try {
      const testClient = axios.create({
        baseURL: config.baseURL || this.baseURL,
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Simple API test
      await testClient.post('/', {
        model: config.model || this.defaultModel,
        input: {
          messages: [{ role: 'user', content: 'test' }],
        },
      });

      return true;
    } catch (error) {
      console.error('Qwen config validation error:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.post('/', {
        model: this.config?.model || this.defaultModel,
        input: {
          messages: [{ role: 'user', content: 'test' }],
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  getAvailableModels(): string[] {
    return this.supportedModels;
  }

  private ensureInitialized(): void {
    if (!this._isInitialized || !this.client) {
      throw new Error(`${this.name} provider is not initialized. Call initialize() first.`);
    }
  }

  /**
   * Make request to Qwen API
   */
  private async makeRequest(prompt: string, temperature: number): Promise<QwenResponse> {
    const requestBody = {
      model: this.config?.model || this.defaultModel,
      input: {
        messages: [
          {
            role: 'system',
            content: 'You are a file organization expert. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      parameters: {
        result_format: 'message',
        temperature,
        max_tokens: this.config?.maxTokens,
        enable_search: false,
      },
    };

    const response = await this.client!.post('', requestBody);
    return response.data as QwenResponse;
  }
}
