/**
 * Shared types for desktop app
 */

export interface AppConfig {
  sourceDir: string | null;
  destDir: string | null;
  aiProvider: string;
  aiProviders: Record<string, AIProviderConfig>;
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
}

export interface ScanProgress {
  scanned: number;
  total: number;
  currentPath: string;
  percentComplete?: number;
}

export interface FileOperationProgress {
  current: number;
  total: number;
  operation: {
    source: string;
    destination: string;
  };
  result: {
    success: boolean;
    error?: string;
  };
}
