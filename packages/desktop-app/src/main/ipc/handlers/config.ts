import { ipcMain } from 'electron';
import ConfigStore from '../../config/store';

interface AppConfig {
  ai: {
    currentProvider: string;
    providers: {
      openai: {
        apiKey: string;
        model: string;
      };
      gemini: {
        apiKey: string;
        model: string;
      };
      claude: {
        apiKey: string;
        model: string;
      };
      deepseek: {
        apiKey: string;
        model: string;
      };
    };
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
  scan: {
    maxDepth: number;
    maxFiles: number;
    excludePatterns: string[];
  };
}

const defaults: AppConfig = {
  ai: {
    currentProvider: 'gemini',
    providers: {
      openai: {
        apiKey: '',
        model: 'gpt-4o-mini',
      },
      gemini: {
        apiKey: '',
        model: 'gemini-pro',
      },
      claude: {
        apiKey: '',
        model: 'claude-4.5-sonnet',
      },
      deepseek: {
        apiKey: '',
        model: 'deepseek-chat',
      },
    },
  },
  theme: 'system',
  language: 'en',
  scan: {
    maxDepth: 10,
    maxFiles: 10000,
    excludePatterns: ['node_modules', '.git', 'dist', 'build'],
  },
};

const store = new ConfigStore<AppConfig>(defaults);

/**
 * Configuration handlers
 */
export async function registerConfigHandlers(): Promise<void> {
  await store.init();

  // Get all configuration
  ipcMain.handle('config:get', async () => {
    return store.getAll();
  });

  // Set configuration
  ipcMain.handle('config:set', async (_event, config) => {
    const current = await store.getAll();
    const merged = { ...current, ...config };
    await store.setAll(merged);
    return store.getAll();
  });

  // Get specific config value
  ipcMain.handle('config:getValue', async (_event, key) => {
    const data = await store.getAll();
    return key.split('.').reduce((obj: any, k: string) => obj?.[k], data);
  });

  // Set specific config value
  ipcMain.handle('config:setValue', async (_event, key, value) => {
    const data = await store.getAll();
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    let target: any = data;
    for (const k of keys) {
      if (!target[k]) target[k] = {};
      target = target[k];
    }
    target[lastKey] = value;
    await store.setAll(data);
    return value;
  });

  // Get available AI providers
  ipcMain.handle('config:getAIProviders', async () => {
    return ['openai', 'gemini', 'qwen'];
  });

  // Get AI provider config
  ipcMain.handle('config:getAIConfig', async (_event, provider) => {
    const data = await store.getAll();
    return data.ai.providers[provider as keyof typeof data.ai.providers] || {};
  });

  // Set AI provider config
  ipcMain.handle('config:setAIConfig', async (_event, provider, config) => {
    const data = await store.getAll();
    data.ai.providers[provider as keyof typeof data.ai.providers] = {
      ...data.ai.providers[provider as keyof typeof data.ai.providers],
      ...config,
    };
    await store.setAll(data);
    return data.ai.providers[provider as keyof typeof data.ai.providers];
  });

  console.log('Config handlers registered');
}
