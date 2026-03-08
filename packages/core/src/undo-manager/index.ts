/**
 * Undo Manager Module
 *
 * Provides undo/redo functionality for file operations.
 */

export { SnapshotManager, type SnapshotDiff } from './snapshot';
export { HistoryManager } from './history';
export { UndoManager, type HistoryStatistics } from './manager';
