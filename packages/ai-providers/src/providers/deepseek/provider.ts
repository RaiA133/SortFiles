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
 * DeepSeek API Response structure (OpenAI-compatible)
 */
interface DeepSeekMessage {
  role: string;
  content: string;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: DeepSeekMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * DeepSeek Provider Implementation
 * Supports DeepSeek V3 and R1 models via DeepSeek API
 */
export class DeepSeekProvider implements IAIProvider {
  readonly name = 'deepseek';
  readonly supportedModels = [
    'deepseek-chat',
    'deepseek-reasoner',
    'deepseek-coder',
  ];
  readonly defaultModel = 'deepseek-chat';

  private client: AxiosInstance | null = null;
  private config: AIProviderConfig | null = null;

  get isInitialized(): boolean {
    return this._isInitialized;
  }
  private _isInitialized = false;
  private readonly baseURL = 'https://api.deepseek.com/v1';

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

        const content = response.choices[0]?.message?.content || '';
        const parsed = JSON.parse(content);
        allClassifications.push(...(parsed.classifications || []));
      } catch (error) {
        console.error(`DeepSeek classification error for batch ${Math.floor(i / batchSize) + 1}:`, error);
        // Throw the error so it propagates to the caller
        throw new Error(`DeepSeek classification failed: ${error instanceof Error ? error.message : String(error)}`);
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
      const content = response.choices[0]?.message?.content || '';
      const parsed = JSON.parse(content);
      return parsed.rules || [];
    } catch (error) {
      console.error('DeepSeek rule suggestion error:', error);
      throw new Error(`DeepSeek rule suggestion failed: ${error instanceof Error ? error.message : String(error)}`);
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
      await testClient.post('/chat/completions', {
        model: config.model || this.defaultModel,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });

      return true;
    } catch (error) {
      console.error('DeepSeek config validation error:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    console.log('[DeepSeek] Testing connection...');
    console.log('[DeepSeek] Client initialized:', !!this.client);
    console.log('[DeepSeek] Provider initialized:', this._isInitialized);
    console.log('[DeepSeek] Model:', this.config?.model || this.defaultModel);

    if (!this.client) {
      console.error('[DeepSeek] Client not initialized');
      return false;
    }

    try {
      console.log('[DeepSeek] Sending test request...');
      const response = await this.client!.post('/chat/completions', {
        model: this.config?.model || this.defaultModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });

      console.log('[DeepSeek] Got response');
      console.log('[DeepSeek] Response status:', response.status);
      console.log('[DeepSeek] Response data:', JSON.stringify(response.data).slice(0, 200));

      // Check if response is valid
      const isValid = !!(response.data?.choices?.[0]?.message?.content);
      console.log('[DeepSeek] Response valid:', isValid);

      return isValid;
    } catch (error) {
      console.error('[DeepSeek] Test connection error:', error);

      if (axios.isAxiosError(error)) {
        console.error('[DeepSeek] Axios error:');
        console.error('[DeepSeek] Status:', error.response?.status);
        console.error('[DeepSeek] Status text:', error.response?.statusText);
        console.error('[DeepSeek] Response data:', error.response?.data);
        console.error('[DeepSeek] Headers:', error.response?.headers);
      }

      if (error instanceof Error) {
        console.error('[DeepSeek] Error name:', error.name);
        console.error('[DeepSeek] Error message:', error.message);
      }

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
   * Make request to DeepSeek API (OpenAI-compatible)
   */
  private async makeRequest(prompt: string, temperature: number): Promise<DeepSeekResponse> {
    const requestBody = {
      model: this.config?.model || this.defaultModel,
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
      temperature,
      max_tokens: this.config?.maxTokens,
    };

    const response = await this.client!.post('/chat/completions', requestBody);
    return response.data as DeepSeekResponse;
  }
}
