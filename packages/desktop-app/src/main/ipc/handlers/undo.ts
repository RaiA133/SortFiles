import { ipcMain } from 'electron';
import { UndoManager } from '@sortfiles/core';

const undoManager = new UndoManager({
  maxHistorySize: 50,
});

/**
 * Undo/Redo handlers
 */
export function registerUndoHandlers(): void {
  // Undo last operation
  ipcMain.handle('undo:undo', async () => {
    try {
      const result = await undoManager.undo();
      return result;
    } catch (error) {
      throw new Error(`Undo failed: ${error}`);
    }
  });

  // Redo last undone operation
  ipcMain.handle('undo:redo', async () => {
    try {
      const result = await undoManager.redo();
      return result;
    } catch (error) {
      throw new Error(`Redo failed: ${error}`);
    }
  });

  // Get history
  ipcMain.handle('undo:getHistory', async () => {
    return undoManager.getAllEntries();
  });

  // Get history statistics
  ipcMain.handle('undo:getStats', async () => {
    return undoManager.getStatistics();
  });

  // Clear history
  ipcMain.handle('undo:clear', async () => {
    undoManager.clearHistory();
    return { success: true };
  });

  console.log('Undo handlers registered');
}
