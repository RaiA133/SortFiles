import {
  GoogleGenerativeAI,
} from '@google/generative-ai';
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
 * Gemini Provider Implementation
 */
export class GeminiProvider implements IAIProvider {
  readonly name = 'gemini';
  readonly supportedModels = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro-001',
    'gemini-1.5-flash-001',
  ];
  readonly defaultModel = 'gemini-2.5-flash';

  private client: GoogleGenerativeAI | null = null;
  private model: any = null;
  private config: AIProviderConfig | null = null;

  get isInitialized(): boolean {
    return this._isInitialized;
  }
  private _isInitialized = false;

  async initialize(config: AIProviderConfig): Promise<void> {
    this.config = {
      ...config,
      model: config.model || this.defaultModel,
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 8192,
      timeout: config.timeout ?? 60000,
      maxRetries: config.maxRetries ?? 3,
    };

    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = this.client.getGenerativeModel({
      model: this.config.model || this.defaultModel,
    });

    this._isInitialized = true;
  }

  async classify(files: FileInfo[], options: ClassificationOptions = {}): Promise<ClassificationResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    const {
      batchSize = 30, // Reduced from 100 to prevent JSON truncation issues
      includeReasoning = false,
      customCategories,
      temperature = this.config?.temperature ?? 0.3,
    } = options;

    const allClassifications: any[] = [];
    let totalTokensUsed = 0;

    // Process files in batches
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const prompt = this.formatClassificationPrompt(
        generateClassificationPrompt(batch, {
          customCategories,
          includeReasoning,
          batchSize,
        })
      );

      try {
        const result = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: this.config?.maxTokens,
          },
        });

        totalTokensUsed += result.response.usageMetadata?.totalTokenCount || 0;

        const text = result.response.text();

        // Log raw response for debugging
        console.log(`[Gemini] Raw response length: ${text.length} chars`);

        const jsonText = this.extractJSON(text);

        // Log extracted JSON length for debugging
        console.log(`[Gemini] Extracted JSON length: ${jsonText.length} chars`);

        // Validate JSON structure before parsing
        if (!jsonText || jsonText.trim().length === 0) {
          throw new Error('Empty JSON response from Gemini');
        }

        // Check for common JSON issues
        if (!jsonText.trim().startsWith('{') && !jsonText.trim().startsWith('[')) {
          throw new Error('Response does not start with valid JSON');
        }

        const parsed = JSON.parse(jsonText);

        if (!parsed.classifications || !Array.isArray(parsed.classifications)) {
          throw new Error('Invalid response structure: missing classifications array');
        }

        allClassifications.push(...parsed.classifications);
      } catch (error) {
        console.error(`Gemini classification error for batch ${Math.floor(i / batchSize) + 1}:`, error);
        // Throw the error so it propagates to the caller
        throw new Error(`Gemini classification failed: ${error instanceof Error ? error.message : String(error)}`);
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
    const prompt = this.formatRulePrompt(generateRuleSuggestionPrompt(files, { maxRules, priority }));

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: this.config?.maxTokens,
        },
      });

      const text = result.response.text();
      const jsonText = this.extractJSON(text);
      const parsed = JSON.parse(jsonText);
      return parsed.rules || [];
    } catch (error) {
      console.error('Gemini rule suggestion error:', error);
      throw new Error(`Gemini rule suggestion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateConfig(config: AIProviderConfig): Promise<boolean> {
    try {
      const testClient = new GoogleGenerativeAI(config.apiKey);
      const testModel = testClient.getGenerativeModel({
        model: config.model || this.defaultModel,
      });

      // Simple API test
      await testModel.generateContent({ contents: [{ role: 'user', parts: [{ text: 'test' }] }] });
      return true;
    } catch (error) {
      console.error('Gemini config validation error:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    console.log('[Gemini] Testing connection...');
    console.log('[Gemini] Model initialized:', !!this.model);
    console.log('[Gemini] Provider initialized:', this._isInitialized);

    if (!this.model) {
      console.error('[Gemini] Model not initialized');
      return false;
    }

    try {
      console.log('[Gemini] Sending test request...');
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
      });
      console.log('[Gemini] Got result:', !!result);
      console.log('[Gemini] Got response:', !!result.response);

      const response = result.response;
      const text = response?.text();
      console.log('[Gemini] Response text:', text);
      console.log('[Gemini] Response valid:', !!text);

      return !!text;
    } catch (error) {
      console.error('[Gemini] Test connection error:', error);
      if (error instanceof Error) {
        console.error('[Gemini] Error name:', error.name);
        console.error('[Gemini] Error message:', error.message);
      }
      // Check for specific error types
      const err = error as any;
      if (err?.status) {
        console.error('[Gemini] Status:', err.status);
      }
      if (err?.code) {
        console.error('[Gemini] Code:', err.code);
      }
      return false;
    }
  }

  getAvailableModels(): string[] {
    return this.supportedModels;
  }

  private ensureInitialized(): void {
    if (!this._isInitialized || !this.model) {
      throw new Error(`${this.name} provider is not initialized. Call initialize() first.`);
    }
  }

  /**
   * Format prompt for Gemini API
   */
  private formatClassificationPrompt(prompt: string): string {
    return `${prompt}

IMPORTANT: Respond with valid JSON only. Do not include any explanations outside the JSON structure.`;
  }

  /**
   * Format rule prompt for Gemini API
   */
  private formatRulePrompt(prompt: string): string {
    return `${prompt}

IMPORTANT: Respond with valid JSON only. Do not include any explanations outside the JSON structure.`;
  }

  /**
   * Extract JSON from text, handling markdown code blocks
   */
  private extractJSON(text: string): string {
    // First, try to match complete code blocks (```json ... ```)
    let codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }

    // If no closing ```, try to extract content between first ``` and end of string
    const firstBacktickMatch = text.indexOf('```');
    if (firstBacktickMatch !== -1) {
      // Find the content after the first ``` and any language identifier
      const afterFirstBacktick = text.substring(firstBacktickMatch + 3);
      const afterNewline = afterFirstBacktick.replace(/^[^\n]*\n/, ''); // Remove first line (language identifier)
      return afterNewline.trim();
    }

    // No code blocks found, return as-is
    return text.trim();
  }
}
