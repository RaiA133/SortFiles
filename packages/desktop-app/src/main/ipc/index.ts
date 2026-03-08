import { registerFileHandlers } from './handlers/file';
import { registerScannerHandlers } from './handlers/scanner';
import { registerRuleHandlers } from './handlers/rules';
import { registerAIHandlers } from './handlers/ai';
import { registerConfigHandlers } from './handlers/config';
import { registerUndoHandlers } from './handlers/undo';

/**
 * Register all IPC handlers
 */
export async function registerIPCHandlers(): Promise<void> {
  registerFileHandlers();
  registerScannerHandlers();
  registerRuleHandlers();
  registerAIHandlers();
  await registerConfigHandlers();
  registerUndoHandlers();

  console.log('All IPC handlers registered');
}
