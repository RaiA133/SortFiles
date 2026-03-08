import { promises as fs } from 'fs';
import { dirname } from 'path';
import { FileMoveResult } from '../types';

/**
 * File operation options
 */
export interface FileOperationOptions {
  /** Whether to overwrite existing files */
  overwrite?: boolean;
  /** Whether to create destination directory if it doesn't exist */
  createDirectory?: boolean;
  /** Whether to add suffix if file exists (e.g., file_1.txt) */
  addSuffixIfExists?: boolean;
  /** Dry run - don't actually move files */
  dryRun?: boolean;
}

/**
 * File Mover - Handles file and directory operations
 */
export class FileMover {
  /**
   * Move a single file
   */
  async moveFile(
    source: string,
    destination: string,
    options: FileOperationOptions = {}
  ): Promise<FileMoveResult> {
    const {
      overwrite = false,
      createDirectory = true,
      dryRun = false,
    } = options;

    try {
      // Validate source exists
      try {
        await fs.access(source);
      } catch {
        return {
          source,
          destination,
          success: false,
          error: 'Source file does not exist',
        };
      }

      // Create destination directory if needed
      if (createDirectory) {
        const destDir = dirname(destination);
        await fs.mkdir(destDir, { recursive: true });
      }

      // Check if destination file already exists
      let finalDestination = destination;
      try {
        await fs.access(destination);
        // File exists - skip it, don't overwrite
        if (!overwrite) {
          return {
            source,
            destination,
            success: false,
            error: 'Destination file already exists (not overwritten)',
            skipped: true,
          };
        }
        // If overwrite is true, remove existing file first
        await fs.unlink(destination);
      } catch {
        // File doesn't exist, which is good
      }

      // Perform the move
      if (!dryRun) {
        await fs.rename(source, finalDestination);
      }

      return {
        source,
        destination: finalDestination,
        success: true,
      };
    } catch (error) {
      return {
        source,
        destination,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Copy a single file
   */
  async copyFile(
    source: string,
    destination: string,
    options: FileOperationOptions = {}
  ): Promise<FileMoveResult> {
    const {
      overwrite = false,
      createDirectory = true,
      dryRun = false,
    } = options;

    try {
      // Validate source exists
      try {
        await fs.access(source);
      } catch {
        return {
          source,
          destination,
          success: false,
          error: 'Source file does not exist',
        };
      }

      // Create destination directory if needed
      if (createDirectory) {
        const destDir = dirname(destination);
        await fs.mkdir(destDir, { recursive: true });
      }

      // Check if destination file already exists
      try {
        await fs.access(destination);
        // File exists - skip it, don't overwrite
        if (!overwrite) {
          return {
            source,
            destination,
            success: false,
            error: 'Destination file already exists (not overwritten)',
            skipped: true,
          };
        }
        // If overwrite is true, remove existing file first
        await fs.unlink(destination);
      } catch {
        // File doesn't exist, which is good
      }

      // Perform the copy
      if (!dryRun) {
        await fs.copyFile(source, destination);
      }

      return {
        source,
        destination,
        success: true,
      };
    } catch (error) {
      return {
        source,
        destination,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Move multiple files
   */
  async moveFiles(
    operations: Array<{ source: string; destination: string }>,
    options: FileOperationOptions = {},
    onProgress?: (current: number, total: number) => void
  ): Promise<FileMoveResult[]> {
    const results: FileMoveResult[] = [];

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      if (!op) continue;
      const result = await this.moveFile(
        op.source,
        op.destination,
        options
      );
      results.push(result);
      onProgress?.(i + 1, operations.length);
    }

    return results;
  }

  /**
   * Copy multiple files
   */
  async copyFiles(
    operations: Array<{ source: string; destination: string }>,
    options: FileOperationOptions = {},
    onProgress?: (current: number, total: number) => void
  ): Promise<FileMoveResult[]> {
    const results: FileMoveResult[] = [];

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      if (!op) continue;
      const result = await this.copyFile(
        op.source,
        op.destination,
        options
      );
      results.push(result);
      onProgress?.(i + 1, operations.length);
    }

    return results;
  }

  /**
   * Batch move files with parallel processing
   */
  async moveFilesParallel(
    operations: Array<{ source: string; destination: string }>,
    options: FileOperationOptions = {},
    concurrency: number = 10,
    onProgress?: (current: number, total: number) => void
  ): Promise<FileMoveResult[]> {
    const results: FileMoveResult[] = [];
    const chunks: Array<typeof operations> = [];

    // Split into chunks
    for (let i = 0; i < operations.length; i += concurrency) {
      chunks.push(operations.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((op) => this.moveFile(op.source, op.destination, options))
      );
      results.push(...chunkResults);
      onProgress?.(results.length, operations.length);
    }

    return results;
  }
}
