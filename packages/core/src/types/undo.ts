import { FileInfo } from './files';

/**
 * Snapshot type for undo/redo operations
 */
export type SnapshotType = 'before' | 'after';

/**
 * File operation type for tracking
 */
export type FileOperationType = 'move' | 'copy' | 'delete' | 'create';

/**
 * Tracked file operation
 */
export interface TrackedOperation {
  /** Unique operation ID */
  id: string;
  /** Type of operation */
  type: FileOperationType;
  /** Original file location */
  originalPath: string;
  /** New file location (for move/copy) */
  newPath?: string;
  /** File backup location */
  backupPath?: string;
  /** Timestamp of operation */
  timestamp: Date;
  /** Whether operation was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Associated snapshot ID */
  snapshotId: string;
}

/**
 * Snapshot of directory state
 */
export interface Snapshot {
  /** Unique snapshot ID */
  id: string;
  /** Type of snapshot */
  type: SnapshotType;
  /** Directory path that was snapshotted */
  directoryPath: string;
  /** Timestamp of snapshot */
  timestamp: Date;
  /** All files in snapshot */
  files: FileInfo[];
  /** Associated operations */
  operations: TrackedOperation[];
  /** Snapshot metadata */
  metadata?: {
    /** User who created snapshot */
    user?: string;
    /** Description */
    description?: string;
    /** Tags */
    tags?: string[];
  };
}

/**
 * Undo history entry
 */
export interface HistoryEntry {
  /** Entry ID */
  id: string;
  /** Snapshot before operation */
  beforeSnapshot: Snapshot;
  /** Snapshot after operation */
  afterSnapshot?: Snapshot;
  /** Operations performed */
  operations: TrackedOperation[];
  /** Timestamp */
  timestamp: Date;
  /** Entry description */
  description?: string;
  /** Whether this entry can be undone */
  canUndo: boolean;
  /** Whether this entry can be redone */
  canRedo: boolean;
}

/**
 * Undo result
 */
export interface UndoResult {
  /** Whether undo was successful */
  success: boolean;
  /** Number of operations undone */
  operationsUndone: number;
  /** Errors that occurred */
  errors: string[];
  /** New snapshot after undo */
  snapshot: Snapshot;
}

/**
 * Redo result
 */
export interface RedoResult {
  /** Whether redo was successful */
  success: boolean;
  /** Number of operations redone */
  operationsRedone: number;
  /** Errors that occurred */
  errors: string[];
  /** New snapshot after redo */
  snapshot: Snapshot;
}

/**
 * Undo manager options
 */
export interface UndoManagerOptions {
  /** Maximum number of history entries to keep */
  maxHistorySize?: number;
  /** Directory for storing snapshots */
  snapshotDirectory?: string;
  /** Whether to compress snapshots */
  compressSnapshots?: boolean;
  /** Maximum age of snapshots in milliseconds */
  maxSnapshotAge?: number;
}
