import Anthropic from '@anthropic-ai/sdk';
import {
  IAIProvider,
  FileInfo,
  ClassificationResult,
  Rule,
  AIProviderConfig,
} from '../../interfaces/provider';
import { generateClassificationPrompt, generateRuleSuggestionPrompt } from '../../prompts';

/**
 * Anthropic Claude Provider Implementation
 */
export class ClaudeProvider implements IAIProvider {
  readonly name = 'claude';
  readonly supportedModels = [
    'claude-4.5-sonnet',
    'claude-4.5-sonnet-latest',
    'claude-3-5-sonnet-latest',
    'claude-3-5-haiku-latest',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
  ];
  readonly defaultModel = 'claude-4.5-sonnet';

  private client: Anthropic | null = null;
  private config: AIProviderConfig | null = null;
  private _isInitialized = false;

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  async initialize(config: AIProviderConfig): Promise<void> {
    this.config = {
      ...config,
      model: config.model || this.defaultModel,
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 4096,
      timeout: config.timeout ?? 60000,
      maxRetries: config.maxRetries ?? 3,
    };

    this.client = new Anthropic({
      apiKey: config.apiKey,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });

    this._isInitialized = true;
  }

  async classify(files: FileInfo[]): Promise<ClassificationResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    const batchSize = 100;
    const temperature = this.config?.temperature ?? 0.3;

    const allClassifications: any[] = [];
    let totalTokensUsed = 0;

    // Process files in batches
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const prompt = generateClassificationPrompt(batch, {
        batchSize,
      });

      try {
        const response = await this.client!.messages.create({
          model: this.config?.model || this.defaultModel,
          max_tokens: this.config?.maxTokens ?? 8192,
          temperature,
          system: 'You are a file organization expert. Analyze files and classify them into appropriate categories. Always respond with valid JSON.',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        // Extract content from response
        const content = response.content[0];
        let responseText = '';

        if (content && content.type === 'text') {
          responseText = content.text;
        }

        // Parse JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const classifications = parsed.classifications || parsed;

          if (Array.isArray(classifications)) {
            allClassifications.push(...classifications);
          }
        }

        totalTokensUsed += response.usage.input_tokens + response.usage.output_tokens;
      } catch (error) {
        console.error(`[Claude] Classification error for batch ${Math.floor(i / batchSize) + 1}:`, error);
        throw new Error(`Claude classification failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const endTime = Date.now();

    return {
      classifications: allClassifications,
      metadata: {
        provider: this.name,
        model: this.config?.model || this.defaultModel,
        tokensUsed: totalTokensUsed,
        processingTimeMs: endTime - startTime,
      },
    };
  }

  async suggestRules(files: FileInfo[]): Promise<Rule[]> {
    this.ensureInitialized();

    const prompt = generateRuleSuggestionPrompt(files, {});

    try {
      const response = await this.client!.messages.create({
        model: this.config?.model || this.defaultModel,
        max_tokens: this.config?.maxTokens ?? 8192,
        temperature: this.config?.temperature ?? 0.3,
        system: 'You are a file organization expert. Suggest rules for organizing files. Always respond with valid JSON.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      let responseText = '';

      if (content && content.type === 'text') {
        responseText = content.text;
      }

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.rules || parsed;
      }

      return [];
    } catch (error) {
      console.error('[Claude] Rule suggestion error:', error);
      throw new Error(`Claude rule suggestion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateConfig(config: AIProviderConfig): Promise<boolean> {
    try {
      if (!config.apiKey || config.apiKey.trim().length === 0) {
        return false;
      }

      const client = new Anthropic({
        apiKey: config.apiKey,
        timeout: 5000,
      });

      await client.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
      });

      return true;
    } catch (error) {
      console.error('[Claude] Config validation failed:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    this.ensureInitialized();

    try {
      const response = await this.client!.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
      });

      return response.content.length > 0;
    } catch (error) {
      console.error('[Claude] Connection test failed:', error);
      return false;
    }
  }

  getAvailableModels(): string[] {
    return this.supportedModels;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.client) {
      throw new Error('Claude provider is not initialized. Call initialize() first.');
    }
  }
}
