import { promises as fs } from 'fs';
import { join } from 'path';
import { Snapshot, FileInfo, TrackedOperation } from '../types';

/**
 * Snapshot Manager - Creates and manages snapshots of directory state
 */
export class SnapshotManager {
  private snapshots: Map<string, Snapshot> = new Map();

  /**
   * Create a snapshot of a directory
   */
  async createSnapshot(
    directoryPath: string,
    type: 'before' | 'after',
    files: FileInfo[],
    operations: TrackedOperation[] = [],
    metadata?: Snapshot['metadata']
  ): Promise<Snapshot> {
    const snapshotId = this.generateSnapshotId();

    const snapshot: Snapshot = {
      id: snapshotId,
      type,
      directoryPath,
      timestamp: new Date(),
      files: [...files],
      operations: [...operations],
      metadata,
    };

    this.snapshots.set(snapshotId, snapshot);
    return snapshot;
  }

  /**
   * Get a snapshot by ID
   */
  getSnapshot(snapshotId: string): Snapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots(): Snapshot[] {
    return Array.from(this.snapshots.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get snapshots for a directory
   */
  getSnapshotsForDirectory(directoryPath: string): Snapshot[] {
    return this.getAllSnapshots().filter(
      (s) => s.directoryPath === directoryPath
    );
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId: string): boolean {
    return this.snapshots.delete(snapshotId);
  }

  /**
   * Delete snapshots older than a certain date
   */
  deleteSnapshotsOlderThan(date: Date): number {
    let deleted = 0;

    for (const [id, snapshot] of this.snapshots) {
      if (snapshot.timestamp < date) {
        this.snapshots.delete(id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Delete snapshots for a directory
   */
  deleteSnapshotsForDirectory(directoryPath: string): number {
    let deleted = 0;

    for (const [id, snapshot] of this.snapshots) {
      if (snapshot.directoryPath === directoryPath) {
        this.snapshots.delete(id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Clear all snapshots
   */
  clearAllSnapshots(): void {
    this.snapshots.clear();
  }

  /**
   * Compare two snapshots
   */
  compareSnapshots(snapshot1: Snapshot, snapshot2: Snapshot): SnapshotDiff {
    const files1 = new Map(snapshot1.files.map((f) => [f.path, f]));
    const files2 = new Map(snapshot2.files.map((f) => [f.path, f]));

    const added: FileInfo[] = [];
    const removed: FileInfo[] = [];
    const modified: Array<{ file: FileInfo; previous: FileInfo }> = [];
    const unchanged: FileInfo[] = [];

    // Check for added and modified files
    for (const [path, file] of files2) {
      const previous = files1.get(path);

      if (!previous) {
        added.push(file);
      } else if (file.size !== previous.size || file.modifiedAt !== previous.modifiedAt) {
        modified.push({ file, previous });
      } else {
        unchanged.push(file);
      }
    }

    // Check for removed files
    for (const [path, file] of files1) {
      if (!files2.has(path)) {
        removed.push(file);
      }
    }

    return {
      added,
      removed,
      modified,
      unchanged,
      totalChanges: added.length + removed.length + modified.length,
    };
  }

  /**
   * Save snapshot to file
   */
  async saveSnapshotToFile(snapshot: Snapshot, filePath: string): Promise<void> {
    const data = JSON.stringify(snapshot, null, 2);
    await fs.mkdir(join(filePath, '..'), { recursive: true });
    await fs.writeFile(filePath, data, 'utf-8');
  }

  /**
   * Load snapshot from file
   */
  async loadSnapshotFromFile(filePath: string): Promise<Snapshot> {
    const data = await fs.readFile(filePath, 'utf-8');
    const snapshot = JSON.parse(data);

    // Convert date strings back to Date objects
    snapshot.timestamp = new Date(snapshot.timestamp);
    snapshot.files = snapshot.files.map((f: any) => ({
      ...f,
      createdAt: new Date(f.createdAt),
      modifiedAt: new Date(f.modifiedAt),
    }));
    snapshot.operations = snapshot.operations.map((op: any) => ({
      ...op,
      timestamp: new Date(op.timestamp),
    }));

    return snapshot;
  }

  /**
   * Generate a unique snapshot ID
   */
  private generateSnapshotId(): string {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Snapshot comparison result
 */
export interface SnapshotDiff {
  added: FileInfo[];
  removed: FileInfo[];
  modified: Array<{ file: FileInfo; previous: FileInfo }>;
  unchanged: FileInfo[];
  totalChanges: number;
}
