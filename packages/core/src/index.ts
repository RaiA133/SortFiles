/**
 * @shortfiles/core
 *
 * Core business logic for ShortFiles file organizer.
 * Provides file scanning, rule engine, file operations, and undo/redo functionality.
 */

// Export all types
export * from './types';

// Export file scanner
export { FileScanner, FileFilters } from './file-scanner';

// Export file operator
export { FileMover, FileValidator } from './file-operator';

// Export rule engine
export {
  RuleEngine,
  defaultRules,
  getDefaultRules,
  RuleParser,
  RuleBuilder,
} from './rule-engine';

// Export undo manager
export {
  SnapshotManager,
  HistoryManager,
  UndoManager,
} from './undo-manager';
