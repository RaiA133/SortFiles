import { ipcMain } from 'electron';
import { RuleEngine, getDefaultRules } from '@sortfiles/core';

/**
 * Rule engine handlers
 */
export function registerRuleHandlers(): void {
  // Generate sorting plan
  ipcMain.handle('rules:generatePlan', async (_event, files, destination) => {
    try {
      const engine = new RuleEngine(getDefaultRules());
      const plan = engine.generatePlan(files, destination);
      return plan;
    } catch (error) {
      throw new Error(`Plan generation failed: ${error}`);
    }
  });

  // Validate rule
  ipcMain.handle('rules:validate', async (_event, rule) => {
    try {
      const engine = new RuleEngine();
      const validation = engine.validateRule(rule);
      return validation;
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  });

  // Get default rules
  ipcMain.handle('rules:getDefaults', async () => {
    return getDefaultRules();
  });

  console.log('Rule handlers registered');
}
