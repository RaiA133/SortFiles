import { ipcMain } from 'electron';
import { ProviderFactory } from '@sortfiles/ai-providers';
import axios from 'axios';

// Cache of initialized providers
const providerCache = new Map<string, any>();

/**
 * AI operation handlers
 */
export function registerAIHandlers(): void {
  // Classify files
  ipcMain.handle('ai:classify', async (_event, files, providerName, config) => {
    try {
      const provider = await getProvider(providerName, config);
      const result = await provider.classify(files);
      return result;
    } catch (error) {
      throw new Error(`Classification failed: ${error}`);
    }
  });

  // Suggest rules
  ipcMain.handle('ai:suggestRules', async (_event, files, providerName, config) => {
    try {
      const provider = await getProvider(providerName, config);
      const rules = await provider.suggestRules(files);
      return rules;
    } catch (error) {
      throw new Error(`Rule suggestion failed: ${error}`);
    }
  });

  // Test AI connection
  ipcMain.handle('ai:testConnection', async (_event, providerName, config) => {
    console.log(`[Main] Testing connection for provider: ${providerName}`);
    console.log('[Main] Config:', { ...config, apiKey: '***' });

    try {
      console.log('[Main] Creating provider...');
      const provider = ProviderFactory.create(providerName);
      console.log('[Main] Provider created:', provider.name);

      console.log('[Main] Initializing provider...');
      await provider.initialize(config);
      console.log('[Main] Provider initialized');

      console.log('[Main] Testing connection...');
      const result = await provider.testConnection();
      console.log('[Main] Test connection result:', result);

      return { success: result, error: null };
    } catch (error) {
      console.error('[Main] AI connection test failed:', error);

      let errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'Unknown';
      const errorStack = error instanceof Error ? error.stack : '';

      // Extract more detailed error message from Axios errors (DeepSeek, etc.)
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;
        if (responseData?.error?.message) {
          errorMessage = responseData.error.message;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (error.response?.statusText) {
          errorMessage = error.response.statusText;
        }
      }

      console.error('[Main] Error name:', errorName);
      console.error('[Main] Error message:', errorMessage);
      console.error('[Main] Error stack:', errorStack);

      return { success: false, error: errorMessage, errorName, errorStack };
    }
  });

  // Get available AI providers
  ipcMain.handle('ai:getProviders', async () => {
    return ProviderFactory.getAvailableProviders();
  });

  console.log('AI handlers registered');
}

/**
 * Get or create a provider instance
 */
async function getProvider(providerName: string, config: any) {
  const cacheKey = `${providerName}:${config.apiKey}`;

  if (!providerCache.has(cacheKey)) {
    const provider = ProviderFactory.create(providerName);
    await provider.initialize(config);
    providerCache.set(cacheKey, provider);
  }

  return providerCache.get(cacheKey);
}
