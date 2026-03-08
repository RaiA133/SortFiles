import { ipcMain, BrowserWindow } from 'electron';
import { FileScanner } from '@sortfiles/core';

const scanner = new FileScanner();

/**
 * File scanner handlers
 */
export function registerScannerHandlers(): void {
  // Scan directory
  ipcMain.handle('scanner:scan', async (_event, directoryPath, options = {}) => {
    try {
      const result = await scanner.scan(directoryPath, {
        onProgress: (progress) => {
          BrowserWindow.getAllWindows().forEach((win) => {
            win.webContents.send('scan:progress', progress);
          });
        },
        ...options,
      });

      return result;
    } catch (error) {
      throw new Error(`Scan failed: ${error}`);
    }
  });

  // Get directory statistics
  ipcMain.handle('scanner:getStats', async (_event, directoryPath) => {
    try {
      const stats = await scanner.getStats(directoryPath);
      return stats;
    } catch (error) {
      throw new Error(`Get stats failed: ${error}`);
    }
  });

  console.log('Scanner handlers registered');
}
