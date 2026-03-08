import {
  FileInfo,
  TrackedOperation,
  HistoryEntry,
  UndoManagerOptions,
  FileMoveResult,
  UndoResult,
  RedoResult,
} from '../types';
import { SnapshotManager, SnapshotDiff } from './snapshot';
import { HistoryManager } from './history';

/**
 * Undo Manager - Complete undo/redo functionality for file operations
 */
export class UndoManager {
  private historyManager: HistoryManager;
  private snapshotManager: SnapshotManager;
  private options: Required<UndoManagerOptions>;

  constructor(options: UndoManagerOptions = {}) {
    this.options = {
      maxHistorySize: options.maxHistorySize ?? 50,
      snapshotDirectory: options.snapshotDirectory ?? '.shortfiles/snapshots',
      compressSnapshots: options.compressSnapshots ?? false,
      maxSnapshotAge: options.maxSnapshotAge ?? 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    this.snapshotManager = new SnapshotManager();
    this.historyManager = new HistoryManager(this.options.maxHistorySize);

    // Clean up old snapshots periodically
    this.cleanupOldSnapshots();
  }

  /**
   * Start tracking a new operation
   */
  async startOperation(
    directoryPath: string,
    files: FileInfo[],
    description?: string
  ): Promise<string> {
    const snapshot = await this.snapshotManager.createSnapshot(
      directoryPath,
      'before',
      files,
      [],
      {
        description,
        tags: ['pending'],
      }
    );

    return snapshot.id;
  }

  /**
   * End an operation and record it in history
   */
  async endOperation(
    snapshotId: string,
    operations: TrackedOperation[],
    finalFiles: FileInfo[],
    description?: string
  ): Promise<HistoryEntry> {
    const beforeSnapshot = this.snapshotManager.getSnapshot(snapshotId);

    if (!beforeSnapshot) {
      throw new Error('Snapshot not found');
    }

    const afterSnapshot = await this.snapshotManager.createSnapshot(
      beforeSnapshot.directoryPath,
      'after',
      finalFiles,
      operations,
      {
        description,
        tags: ['completed'],
      }
    );

    const entry = await this.historyManager.createEntry(
      beforeSnapshot,
      operations,
      afterSnapshot,
      description
    );

    // Update before snapshot to remove pending tag
    beforeSnapshot.metadata = beforeSnapshot.metadata || {};
    beforeSnapshot.metadata.tags = beforeSnapshot.metadata.tags?.filter((t) => t !== 'pending');

    return entry;
  }

  /**
   * Track file moves for undo
   */
  async trackMoves(
    moves: FileMoveResult[],
    snapshotId: string
  ): Promise<TrackedOperation[]> {
    const snapshot = this.snapshotManager.getSnapshot(snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    const operations: TrackedOperation[] = [];

    for (const move of moves) {
      if (move.success) {
        const operation: TrackedOperation = {
          id: this.generateOperationId(),
          type: move.destination.includes(move.source) ? 'copy' : 'move',
          originalPath: move.source,
          newPath: move.destination,
          timestamp: new Date(),
          success: true,
          snapshotId,
        };

        operations.push(operation);
      }
    }

    snapshot.operations.push(...operations);

    return operations;
  }

  /**
   * Undo the last operation
   */
  async undo(): Promise<UndoResult> {
    return this.historyManager.undo();
  }

  /**
   * Redo the previously undone operation
   */
  async redo(): Promise<RedoResult> {
    return this.historyManager.redo();
  }

  /**
   * Get current history entry
   */
  getCurrentEntry(): HistoryEntry | undefined {
    return this.historyManager.getCurrentEntry();
  }

  /**
   * Get all history entries
   */
  getAllEntries(): HistoryEntry[] {
    return this.historyManager.getAllEntries();
  }

  /**
   * Get entries for a specific directory
   */
  getEntriesForDirectory(directoryPath: string): HistoryEntry[] {
    return this.historyManager.getEntriesForDirectory(directoryPath);
  }

  /**
   * Get comparison between before and after snapshots
   */
  getSnapshotDiff(entry: HistoryEntry): SnapshotDiff | null {
    if (!entry.afterSnapshot) {
      return null;
    }

    return this.snapshotManager.compareSnapshots(
      entry.beforeSnapshot,
      entry.afterSnapshot
    );
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.historyManager.clearHistory();
    this.snapshotManager.clearAllSnapshots();
  }

  /**
   * Save history to disk
   */
  async saveHistory(filePath: string): Promise<void> {
    await this.historyManager.saveToFile(filePath);
  }

  /**
   * Load history from disk
   */
  async loadHistory(filePath: string): Promise<void> {
    await this.historyManager.loadFromFile(filePath);
  }

  /**
   * Export history as JSON
   */
  exportHistory(): string {
    const entries = this.historyManager.getAllEntries();
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Import history from JSON
   */
  async importHistory(json: string): Promise<void> {
    const parsedEntries = JSON.parse(json) as HistoryEntry[];
    // This would need to be integrated with the history manager
    // For now, it's a placeholder for future implementation
    parsedEntries; // Use variable to avoid unused warning
  }

  /**
   * Get statistics about the history
   */
  getStatistics(): HistoryStatistics {
    const entries = this.historyManager.getAllEntries();
    const snapshots = this.snapshotManager.getAllSnapshots();

    const totalOperations = entries.reduce((sum, entry) => sum + entry.operations.length, 0);
    const successfulOperations = entries.reduce(
      (sum, entry) => sum + entry.operations.filter((op) => op.success).length,
      0
    );

    return {
      totalEntries: entries.length,
      totalSnapshots: snapshots.length,
      totalOperations,
      successfulOperations,
      failedOperations: totalOperations - successfulOperations,
      currentIndex: this.historyManager.getCurrentIndex(),
      canUndo: this.historyManager.getCurrentIndex() >= 0,
      canRedo: this.historyManager.getCurrentIndex() < entries.length - 1,
    };
  }

  /**
   * Clean up old snapshots
   */
  private cleanupOldSnapshots(): void {
    const cutoffDate = new Date(Date.now() - this.options.maxSnapshotAge);
    this.snapshotManager.deleteSnapshotsOlderThan(cutoffDate);
  }

  /**
   * Generate a unique operation ID
   */
  private generateOperationId(): string {
    return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * History statistics
 */
export interface HistoryStatistics {
  totalEntries: number;
  totalSnapshots: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}
