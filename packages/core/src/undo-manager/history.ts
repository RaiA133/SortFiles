import { Snapshot, TrackedOperation, HistoryEntry, UndoResult, RedoResult } from '../types';
import { SnapshotManager } from './snapshot';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Undo History Manager - Manages undo/redo history for file operations
 */
export class HistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number;
  private snapshotManager: SnapshotManager;

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize;
    this.snapshotManager = new SnapshotManager();
  }

  /**
   * Create a new history entry
   */
  async createEntry(
    beforeSnapshot: Snapshot,
    operations: TrackedOperation[],
    afterSnapshot?: Snapshot,
    description?: string
  ): Promise<HistoryEntry> {
    const entry: HistoryEntry = {
      id: this.generateEntryId(),
      beforeSnapshot,
      afterSnapshot,
      operations,
      timestamp: new Date(),
      description,
      canUndo: true,
      canRedo: false,
    };

    // Remove any entries after current index (redo history)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new entry
    this.history.push(entry);
    this.currentIndex++;

    // Enforce max history size
    if (this.history.length > this.maxHistorySize) {
      const removed = this.history.shift();
      if (removed) {
        this.snapshotManager.deleteSnapshot(removed.beforeSnapshot.id);
        if (removed.afterSnapshot) {
          this.snapshotManager.deleteSnapshot(removed.afterSnapshot.id);
        }
      }
      this.currentIndex--;
    }

    return entry;
  }

  /**
   * Undo the current operation
   */
  async undo(): Promise<UndoResult> {
    if (this.currentIndex < 0) {
      return {
        success: false,
        operationsUndone: 0,
        errors: ['Nothing to undo'],
        snapshot: this.snapshotManager.getAllSnapshots()[0] || this.createEmptySnapshot(),
      };
    }

    const entry = this.history[this.currentIndex];
    if (!entry) {
      return {
        success: false,
        operationsUndone: 0,
        errors: ['Entry not found'],
        snapshot: this.createEmptySnapshot(),
      };
    }

    if (!entry.canUndo) {
      return {
        success: false,
        operationsUndone: 0,
        errors: ['Cannot undo this operation'],
        snapshot: entry.beforeSnapshot,
      };
    }

    const errors: string[] = [];
    let operationsUndone = 0;

    // Reverse operations
    for (let i = entry.operations.length - 1; i >= 0; i--) {
      const operation = entry.operations[i];
      if (!operation) continue;

      try {
        await this.reverseOperation(operation);
        operationsUndone++;
      } catch (error) {
        errors.push(`${operation.originalPath}: ${error}`);
      }
    }

    // Update indices
    entry.canRedo = true;
    if (this.currentIndex > 0) {
      const prevEntry = this.history[this.currentIndex - 1];
      if (prevEntry) prevEntry.canRedo = false;
    }
    this.currentIndex--;

    return {
      success: errors.length === 0,
      operationsUndone,
      errors,
      snapshot: entry.beforeSnapshot,
    };
  }

  /**
   * Redo the previously undone operation
   */
  async redo(): Promise<RedoResult> {
    if (this.currentIndex >= this.history.length - 1) {
      return {
        success: false,
        operationsRedone: 0,
        errors: ['Nothing to redo'],
        snapshot: this.snapshotManager.getAllSnapshots()[0] || this.createEmptySnapshot(),
      };
    }

    const entry = this.history[this.currentIndex + 1];
    if (!entry) {
      return {
        success: false,
        operationsRedone: 0,
        errors: ['Entry not found'],
        snapshot: this.createEmptySnapshot(),
      };
    }

    if (!entry.canRedo) {
      return {
        success: false,
        operationsRedone: 0,
        errors: ['Cannot redo this operation'],
        snapshot: entry.afterSnapshot || entry.beforeSnapshot,
      };
    }

    const errors: string[] = [];
    let operationsRedone = 0;

    // Re-apply operations
    for (const operation of entry.operations) {
      try {
        await this.applyOperation(operation);
        operationsRedone++;
      } catch (error) {
        errors.push(`${operation.originalPath}: ${error}`);
      }
    }

    // Update indices
    this.currentIndex++;
    entry.canRedo = false;
    if (this.currentIndex < this.history.length - 1) {
      const nextEntry = this.history[this.currentIndex + 1];
      if (nextEntry) nextEntry.canUndo = true;
    }

    return {
      success: errors.length === 0,
      operationsRedone,
      errors,
      snapshot: entry.afterSnapshot || entry.beforeSnapshot,
    };
  }

  /**
   * Get current history entry
   */
  getCurrentEntry(): HistoryEntry | undefined {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return undefined;
  }

  /**
   * Get all history entries
   */
  getAllEntries(): HistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get history entries for a directory
   */
  getEntriesForDirectory(directoryPath: string): HistoryEntry[] {
    return this.history.filter(
      (entry) => entry.beforeSnapshot.directoryPath === directoryPath
    );
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
    this.snapshotManager.clearAllSnapshots();
  }

  /**
   * Get history size
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Get current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Save history to file
   */
  async saveToFile(filePath: string): Promise<void> {
    const data = JSON.stringify(this.history, null, 2);
    await fs.mkdir(join(filePath, '..'), { recursive: true });
    await fs.writeFile(filePath, data, 'utf-8');
  }

  /**
   * Load history from file
   */
  async loadFromFile(filePath: string): Promise<void> {
    const data = await fs.readFile(filePath, 'utf-8');
    const loaded = JSON.parse(data) as HistoryEntry[];

    this.history = loaded.map((entry) => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
      beforeSnapshot: {
        ...entry.beforeSnapshot,
        timestamp: new Date(entry.beforeSnapshot.timestamp),
        files: entry.beforeSnapshot.files.map((f) => ({
          ...f,
          createdAt: new Date(f.createdAt),
          modifiedAt: new Date(f.modifiedAt),
        })),
        operations: entry.beforeSnapshot.operations.map((op) => ({
          ...op,
          timestamp: new Date(op.timestamp),
        })),
      },
      afterSnapshot: entry.afterSnapshot
        ? {
            ...entry.afterSnapshot,
            timestamp: new Date(entry.afterSnapshot.timestamp),
            files: entry.afterSnapshot.files.map((f) => ({
              ...f,
              createdAt: new Date(f.createdAt),
              modifiedAt: new Date(f.modifiedAt),
            })),
            operations: entry.afterSnapshot.operations.map((op) => ({
              ...op,
              timestamp: new Date(op.timestamp),
            })),
          }
        : undefined,
      operations: entry.operations.map((op) => ({
        ...op,
        timestamp: new Date(op.timestamp),
      })),
    }));

    this.currentIndex = this.history.length - 1;
  }

  /**
   * Reverse a single operation
   */
  private async reverseOperation(operation: TrackedOperation): Promise<void> {
    switch (operation.type) {
      case 'move':
        // Move back to original location
        await fs.rename(operation.newPath!, operation.originalPath);
        break;

      case 'copy':
        // Delete the copied file
        if (operation.newPath) {
          await fs.unlink(operation.newPath);
        }
        break;

      case 'delete':
        // Restore from backup
        if (operation.backupPath) {
          await fs.rename(operation.backupPath, operation.originalPath);
        }
        break;

      case 'create':
        // Delete the created file
        await fs.unlink(operation.originalPath);
        break;
    }
  }

  /**
   * Apply a single operation
   */
  private async applyOperation(operation: TrackedOperation): Promise<void> {
    switch (operation.type) {
      case 'move':
        if (operation.newPath) {
          await fs.rename(operation.originalPath, operation.newPath);
        }
        break;

      case 'copy':
        if (operation.newPath) {
          await fs.copyFile(operation.originalPath, operation.newPath);
        }
        break;

      case 'delete':
        // Create backup and delete
        if (!operation.backupPath) {
          operation.backupPath = `${operation.originalPath}.backup`;
        }
        await fs.rename(operation.originalPath, operation.backupPath);
        break;

      case 'create':
        // Recreate file (would need content from snapshot)
        break;
    }
  }

  /**
   * Generate a unique entry ID
   */
  private generateEntryId(): string {
    return `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create an empty snapshot for error cases
   */
  private createEmptySnapshot(): Snapshot {
    return {
      id: 'empty',
      type: 'before',
      directoryPath: '',
      timestamp: new Date(),
      files: [],
      operations: [],
    };
  }
}
