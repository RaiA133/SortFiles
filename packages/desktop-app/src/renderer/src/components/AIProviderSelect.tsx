import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface AIProviderSelectProps {
  value: string;
  onChange: (provider: string) => void;
}

const providers = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4 Turbo, GPT-3.5',
    apiKeyUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro, Gemini Flash',
    apiKeyUrl: 'https://aistudio.google.com/api-keys'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Claude 4.5, Claude 3.5',
    apiKeyUrl: 'https://platform.claude.com/settings/keys'
  },
  // DeepSeek hidden for now
  // { id: 'deepseek', name: 'DeepSeek', description: 'DeepSeek V3, DeepSeek R1', apiKeyUrl: '...' },
];

// Storage key for localStorage
const STORAGE_KEY = 'sortfiles_ai_config';

export function AIProviderSelect({ value, onChange }: AIProviderSelectProps) {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const loadApiKey = async () => {
      // Try localStorage first (renderer-side)
      const localConfig = localStorage.getItem(STORAGE_KEY);
      if (localConfig) {
        try {
          const parsed = JSON.parse(localConfig);
          if (parsed[value]?.apiKey) {
            setApiKey(parsed[value].apiKey);
          }
        } catch (e) {
          console.error('Failed to parse local config:', e);
        }
      }

      // Also try to load from electron config (main process)
      try {
        const config = await window.electronAPI.getAIConfig(value);
        if (config?.apiKey) {
          setApiKey(config.apiKey);
        }
      } catch (e) {
        console.error('Failed to load config from main process:', e);
      }
    };

    loadApiKey();
  }, [value]);

  const testConnection = async () => {
    if (!apiKey) return;

    console.log(`[Renderer] Testing connection for provider: ${value}`);
    console.log('[Renderer] API Key length:', apiKey.length);

    setTesting(true);
    setConnectionStatus('idle');
    setErrorMessage(null);
    setErrorDetails(null);

    try {
      // Save to both localStorage and electron config
      await saveApiKey(apiKey);
      console.log('[Renderer] API Key saved');

      // Then test connection
      console.log('[Renderer] Calling testAIConnection...');
      const result = await window.electronAPI.testAIConnection(value, { apiKey }) as { success: boolean; error: string | null; errorName?: string; errorStack?: string };
      console.log('[Renderer] Test connection result:', result);

      if (result.success) {
        setConnectionStatus('success');
        setErrorMessage(null);
        setErrorDetails(null);
        showSuccess('Connection successful! API key saved.');
      } else {
        setConnectionStatus('error');
        const errorMsg = result.error || 'Connection failed. Check your API key.';
        setErrorMessage(errorMsg);
        setErrorDetails(result.errorStack || null);

        // Show toast with error details
        showError('Connection test failed', errorMsg);

        // Log detailed error information
        console.error('[Renderer] Connection failed:');
        console.error('[Renderer] Error:', errorMsg);
        if (result.errorName) console.error('[Renderer] Error name:', result.errorName);
        if (result.errorStack) console.error('[Renderer] Stack:', result.errorStack);
      }
    } catch (error) {
      console.error('[Renderer] Test connection failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setConnectionStatus('error');
      setErrorMessage(errorMsg);
      setErrorDetails(error instanceof Error ? error.stack : null);

      // Show toast with error details
      showError('Connection test failed', errorMsg);

      if (error instanceof Error) {
        console.error('[Renderer] Error message:', error.message);
        console.error('[Renderer] Error stack:', error.stack);
      }
    } finally {
      setTesting(false);
    }
  };

  const saveApiKey = async (key: string) => {
    // Save to localStorage
    const localConfig = localStorage.getItem(STORAGE_KEY);
    const parsed = localConfig ? JSON.parse(localConfig) : {};
    parsed[value] = { apiKey: key, provider: value };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    // Also save to electron config
    try {
      await window.electronAPI.setAIConfig(value, { apiKey: key });
    } catch (e) {
      console.error('Failed to save config to main process:', e);
    }
  };

  return (
    <div className="border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-primary" />
        <div>
          <h3 className="font-semibold">AI Provider</h3>
          <p className="text-sm text-muted-foreground">Select your AI provider</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onChange(provider.id)}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              value === provider.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="font-medium mb-1">{provider.name}</div>
            <div className="text-sm text-muted-foreground mb-2">{provider.description}</div>
            <hr className="my-2 border-border" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.electronAPI.openExternal(provider.apiKeyUrl);
              }}
              className="text-xs text-primary hover:underline flex items-center gap-1 w-full text-left"
            >
              Get API Key
            </button>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${value} API key`}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={testConnection}
              disabled={!apiKey || testing}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test & Save'}
            </button>
          </div>

          {connectionStatus === 'success' && (
            <p className="text-sm text-green-600 mt-2">✓ Connection successful! API key saved.</p>
          )}
          {connectionStatus === 'error' && errorMessage && (
            <div className="mt-2">
              <p className="text-sm text-destructive">✗ {errorMessage}</p>
              {errorDetails && (
                <details className="mt-1">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Show technical details</summary>
                  <pre className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded overflow-auto max-h-32">
                    {errorDetails}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
