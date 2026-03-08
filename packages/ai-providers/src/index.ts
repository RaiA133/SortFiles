/**
 * @shortfiles/ai-providers
 *
 * AI provider implementations for ShortFiles file organizer.
 * Supports OpenAI, Gemini, DeepSeek, and custom providers.
 */

// Export interfaces
export * from './interfaces';

// Export providers
export {
  OpenAIProvider,
  GeminiProvider,
  DeepSeekProvider,
  ProviderFactory,
} from './providers';

// Export prompts
export {
  generateClassificationPrompt,
  generateRuleSuggestionPrompt,
  DEFAULT_CATEGORIES,
} from './prompts';
