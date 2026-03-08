/**
 * Application constants
 */

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  GEMINI: 'gemini',
  CLAUDE: 'claude',
  DEEPSEEK: 'deepseek',
} as const;

export const AI_PROVIDER_INFO = {
  [AI_PROVIDERS.OPENAI]: {
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4 Turbo, GPT-3.5',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
  },
  [AI_PROVIDERS.GEMINI]: {
    name: 'Google Gemini',
    description: 'Gemini Pro, Gemini Flash',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-1.5-flash',
  },
  [AI_PROVIDERS.CLAUDE]: {
    name: 'Anthropic Claude',
    description: 'Claude 4.5, Claude 3.5',
    models: ['claude-4.5-sonnet', 'claude-4.5-sonnet-latest', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
    defaultModel: 'claude-4.5-sonnet',
  },
  [AI_PROVIDERS.DEEPSEEK]: {
    name: 'DeepSeek',
    description: 'DeepSeek V3, DeepSeek R1',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
  },
} as const;

export const DEFAULT_RULES = [
  'images',
  'videos',
  'audio',
  'documents',
  'archives',
  'code',
  'executables',
] as const;
