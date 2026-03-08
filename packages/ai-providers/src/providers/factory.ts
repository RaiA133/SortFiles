import { IAIProvider, AIProviderConfig } from '../interfaces/provider';
import { OpenAIProvider } from './openai/provider';
import { GeminiProvider } from './gemini/provider';
import { ClaudeProvider } from './claude/provider';
import { DeepSeekProvider } from './deepseek/provider';

/**
 * Provider Factory - Creates and manages AI provider instances
 */
export class ProviderFactory {
  private static providers = new Map<string, IAIProvider>();
  private static providerClasses = new Map<string, new () => IAIProvider>([
    ['openai', OpenAIProvider],
    ['gemini', GeminiProvider],
    ['claude', ClaudeProvider],
    ['deepseek', DeepSeekProvider],
  ]);

  /**
   * Create a new provider instance
   */
  static create(providerName: string): IAIProvider {
    const normalizedName = providerName.toLowerCase();
    const ProviderClass = this.providerClasses.get(normalizedName);

    if (!ProviderClass) {
      throw new Error(
        `Unknown provider: ${providerName}. Available providers: ${this.getAvailableProviders().join(', ')}`
      );
    }

    const provider = new ProviderClass();
    this.providers.set(normalizedName, provider);

    return provider;
  }

  /**
   * Get an existing provider instance or create a new one
   */
  static async getOrCreate(
    providerName: string,
    config: AIProviderConfig
  ): Promise<IAIProvider> {
    const normalizedName = providerName.toLowerCase();
    let provider = this.providers.get(normalizedName);

    if (!provider) {
      provider = this.create(providerName);
      await provider.initialize(config);
    } else if (!provider.isInitialized) {
      await provider.initialize(config);
    }

    return provider;
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders(): string[] {
    return Array.from(this.providerClasses.keys());
  }

  /**
   * Check if a provider is available
   */
  static isProviderAvailable(providerName: string): boolean {
    return this.providerClasses.has(providerName.toLowerCase());
  }

  /**
   * Remove a provider instance
   */
  static remove(providerName: string): boolean {
    return this.providers.delete(providerName.toLowerCase());
  }

  /**
   * Clear all provider instances
   */
  static clearAll(): void {
    this.providers.clear();
  }

  /**
   * Get provider instance without creating
   */
  static get(providerName: string): IAIProvider | undefined {
    return this.providers.get(providerName.toLowerCase());
  }

  /**
   * Register a custom provider
   */
  static registerProvider(name: string, providerClass: new () => IAIProvider): void {
    this.providerClasses.set(name.toLowerCase(), providerClass);
  }

  /**
   * Unregister a provider
   */
  static unregisterProvider(name: string): boolean {
    return this.providerClasses.delete(name.toLowerCase());
  }

  /**
   * Get provider capabilities
   */
  static getProviderCapabilities(providerName: string) {
    const capabilities = {
      openai: {
        supportsJsonMode: true,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        maxInputTokens: 128000,
        maxOutputTokens: 4096,
      },
      gemini: {
        supportsJsonMode: true,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        maxInputTokens: 1000000,
        maxOutputTokens: 8192,
      },
      claude: {
        supportsJsonMode: true,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        maxInputTokens: 200000,
        maxOutputTokens: 8192,
      },
      deepseek: {
        supportsJsonMode: true,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        maxInputTokens: 64000,
        maxOutputTokens: 4096,
      },
    };

    return capabilities[providerName.toLowerCase() as keyof typeof capabilities] || null;
  }
}
