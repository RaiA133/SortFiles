import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
import { FileMover } from '@sortfiles/core';

/**
 * File operation handlers
 */
export function registerFileHandlers(): void {
  // Open external URL in default browser
  ipcMain.handle('app:openExternal', async (_event, url: string) => {
    await shell.openExternal(url);
    return true;
  });

  // Select directory dialog
  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Select file dialog
  ipcMain.handle('dialog:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Execute sorting plan
  ipcMain.handle('files:executePlan', async (_event, plan) => {
    const fileMover = new FileMover();
    const results = [];

    for (let i = 0; i < plan.moves.length; i++) {
      const move = plan.moves[i];
      const result = await fileMover.moveFile(move.source, move.destination, {
        overwrite: false,
        createDirectory: true,
      });

      results.push(result);

      // Send progress update
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send('files:progress', {
          current: i + 1,
          total: plan.moves.length,
          operation: move,
          result,
        });
      });
    }

    // Count results
    const successful = results.filter((r) => r.success && !r.skipped);
    const operationSkipped = results.filter((r) => r.skipped);
    const failed = results.filter((r) => !r.success && !r.skipped);

    // Count moved vs copied
    let moved = 0;
    let copied = 0;

    for (const result of successful) {
      const originalMove = plan.moves.find((m: any) => m.source === result.source);
      if (originalMove?.action === 'copy') {
        copied++;
      } else {
        moved++;
      }
    }

    // Collect errors
    const errors = failed.map((r) => ({
      path: r.source,
      error: r.error || 'Unknown error',
    }));

    // Add plan skips to total skipped
    const totalSkipped = operationSkipped.length + (plan.skips?.length || 0);

    return {
      success: failed.length === 0,
      moved,
      copied,
      skipped: totalSkipped,
      errors,
    };
  });

  console.log('File handlers registered');
}
