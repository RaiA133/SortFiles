import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script - Bridge between main and renderer processes
 */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),

  // File scanner
  scanDirectory: (path: string, options?: any) =>
    ipcRenderer.invoke('scanner:scan', path, options),
  getDirectoryStats: (path: string) =>
    ipcRenderer.invoke('scanner:getStats', path),

  // Rule engine
  generatePlan: (files: any[], destination: string) =>
    ipcRenderer.invoke('rules:generatePlan', files, destination),
  validateRule: (rule: any) =>
    ipcRenderer.invoke('rules:validate', rule),

  // AI operations
  classifyFiles: (files: any[], provider: string, config: any) =>
    ipcRenderer.invoke('ai:classify', files, provider, config),
  suggestRules: (files: any[], provider: string, config: any) =>
    ipcRenderer.invoke('ai:suggestRules', files, provider, config),
  testAIConnection: (provider: string, config: any) =>
    ipcRenderer.invoke('ai:testConnection', provider, config),

  // File operations
  executePlan: (plan: any) => ipcRenderer.invoke('files:executePlan', plan),

  // Undo/Redo
  undo: () => ipcRenderer.invoke('undo:undo'),
  redo: () => ipcRenderer.invoke('undo:redo'),
  getHistory: () => ipcRenderer.invoke('undo:getHistory'),

  // Configuration
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config: any) => ipcRenderer.invoke('config:set', config),
  setAIConfig: (provider: string, config: any) =>
    ipcRenderer.invoke('config:setAIConfig', provider, config),
  getAIConfig: (provider: string) =>
    ipcRenderer.invoke('config:getAIConfig', provider),
  getAIProviders: () => ipcRenderer.invoke('config:getAIProviders'),

  // Events
  onScanProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('scan:progress', (_event, progress) => callback(progress));
  },
  onFileOperationProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('files:progress', (_event, progress) => callback(progress));
  },
});

// TypeScript declarations for the exposed API
export interface ElectronAPI {
  selectDirectory: () => Promise<string | null>;
  selectFile: () => Promise<string | null>;
  scanDirectory: (path: string, options?: any) => Promise<any>;
  getDirectoryStats: (path: string) => Promise<any>;
  generatePlan: (files: any[], destination: string) => Promise<any>;
  validateRule: (rule: any) => Promise<any>;
  classifyFiles: (files: any[], provider: string, config: any) => Promise<any>;
  suggestRules: (files: any[], provider: string, config: any) => Promise<any>;
  testAIConnection: (provider: string, config: any) => Promise<boolean>;
  executePlan: (plan: any) => Promise<any>;
  undo: () => Promise<any>;
  redo: () => Promise<any>;
  getHistory: () => Promise<any>;
  getConfig: () => Promise<any>;
  setConfig: (config: any) => Promise<void>;
  setAIConfig: (provider: string, config: any) => Promise<any>;
  getAIConfig: (provider: string) => Promise<any>;
  getAIProviders: () => Promise<string[]>;
  onScanProgress: (callback: (progress: any) => void) => void;
  onFileOperationProgress: (callback: (progress: any) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
