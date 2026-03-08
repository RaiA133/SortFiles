import OpenAI from 'openai';
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
 * OpenAI Provider Implementation
 */
export class OpenAIProvider implements IAIProvider {
  readonly name = 'openai';
  readonly supportedModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ];
  readonly defaultModel = 'gpt-4o-mini';

  private client: OpenAI | null = null;
  private config: AIProviderConfig | null = null;

  async initialize(config: AIProviderConfig): Promise<void> {
    this.config = {
      ...config,
      model: config.model || this.defaultModel,
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 4096,
      timeout: config.timeout ?? 60000,
      maxRetries: config.maxRetries ?? 3,
    };

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
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
        const response = await this.client!.chat.completions.create({
          model: this.config?.model || this.defaultModel,
          messages: [
            {
              role: 'system',
              content:
                'You are a file organization expert. Analyze files and classify them into appropriate categories. Always respond with valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature,
          max_tokens: this.config?.maxTokens,
        });

        totalTokensUsed += response.usage?.total_tokens || 0;

        const content = response.choices[0]?.message?.content;
        const result = JSON.parse(content || '{}');
        allClassifications.push(...(result.classifications || []));
      } catch (error) {
        console.error(`OpenAI classification error for batch ${Math.floor(i / batchSize) + 1}:`, error);
        // Throw the error so it propagates to the caller
        throw new Error(`OpenAI classification failed: ${error instanceof Error ? error.message : String(error)}`);
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
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o', // Use more capable model for rule generation
        messages: [
          {
            role: 'system',
            content:
              'You are a file organization expert. Generate rules for automatic file sorting. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: this.config?.maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      const result = JSON.parse(content || '{}');
      return result.rules || [];
    } catch (error) {
      console.error('OpenAI rule suggestion error:', error);
      throw new Error(`OpenAI rule suggestion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateConfig(config: AIProviderConfig): Promise<boolean> {
    try {
      const testClient = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        timeout: 10000,
      });

      // Simple API test
      await testClient.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI config validation error:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  getAvailableModels(): string[] {
    return this.supportedModels;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  private _isInitialized = false;

  private ensureInitialized(): void {
    if (!this._isInitialized || !this.client) {
      throw new Error(`${this.name} provider is not initialized. Call initialize() first.`);
    }
  }

  /**
   * Stream classification results (if needed in future)
   */
  async classifyStream(
    files: FileInfo[],
    onChunk: (classifications: any[]) => void,
    options: ClassificationOptions = {}
  ): Promise<ClassificationResult> {
    this.ensureInitialized();

    const { includeReasoning = false, temperature = this.config?.temperature ?? 0.3 } = options;
    const prompt = generateClassificationPrompt(files, {
      includeReasoning,
    });

    const stream = await this.client!.chat.completions.create({
      model: this.config?.model || this.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are a file organization expert.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature,
      stream: true,
    });

    let accumulatedContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        accumulatedContent += content;
        // Try to parse and emit if we have valid JSON
        try {
          const parsed = JSON.parse(accumulatedContent);
          if (parsed.classifications) {
            onChunk(parsed.classifications);
          }
        } catch {
          // Not yet valid JSON, continue accumulating
        }
      }
    }

    // Final parse
    const result = JSON.parse(accumulatedContent);
    return {
      classifications: result.classifications || [],
      metadata: {
        provider: this.name,
        model: this.config?.model || this.defaultModel,
        processingTimeMs: 0,
      },
    };
  }
}
