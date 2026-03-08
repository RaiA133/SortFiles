import { promises as fs } from 'fs';
import { stat } from 'fs/promises';
import { FileValidationResult, FileInfo } from '../types';
import { dirname, extname } from 'path';

/**
 * File validation options
 */
export interface ValidationOptions {
  /** Check if file is readable */
  checkReadable?: boolean;
  /** Check if file is writable */
  checkWritable?: boolean;
  /** Check if parent directory is writable */
  checkParentWritable?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Minimum file size in bytes */
  minSize?: number;
  /** Allowed extensions */
  allowedExtensions?: string[];
}

/**
 * File Validator - Validates file states before operations
 */
export class FileValidator {
  /**
   * Validate a single file
   */
  async validateFile(
    filePath: string,
    options: ValidationOptions = {}
  ): Promise<FileValidationResult> {
    const {
      checkReadable = true,
      checkWritable = false,
      checkParentWritable = true,
      maxSize,
      minSize,
      allowedExtensions,
    } = options;

    try {
      // Check if file exists
      const stats = await stat(filePath);
      if (!stats.isFile()) {
        return {
          valid: false,
          error: 'Path is not a file',
        };
      }

      // Check readability
      if (checkReadable) {
        try {
          await fs.access(filePath, fs.constants.R_OK);
        } catch {
          return {
            valid: false,
            error: 'File is not readable',
          };
        }
      }

      // Check writability
      let writable = false;
      if (checkWritable) {
        try {
          await fs.access(filePath, fs.constants.W_OK);
          writable = true;
        } catch {
          return {
            valid: false,
            error: 'File is not writable',
          };
        }
      }

      // Check parent directory writability
      if (checkParentWritable) {
        const parentDir = dirname(filePath);
        try {
          await fs.access(parentDir, fs.constants.W_OK);
        } catch {
          return {
            valid: false,
            error: 'Parent directory is not writable',
          };
        }
      }

      // Check size constraints
      if (maxSize !== undefined && stats.size > maxSize) {
        return {
          valid: false,
          error: `File size exceeds maximum allowed size (${maxSize} bytes)`,
        };
      }

      if (minSize !== undefined && stats.size < minSize) {
        return {
          valid: false,
          error: `File size is below minimum required size (${minSize} bytes)`,
        };
      }

      // Check extension
      if (allowedExtensions && allowedExtensions.length > 0) {
        const ext = extname(filePath).toLowerCase();
        const normalizedAllowed = allowedExtensions.map((e) =>
          e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`
        );

        if (!normalizedAllowed.includes(ext)) {
          return {
            valid: false,
            error: `File extension "${ext}" is not allowed`,
          };
        }
      }

      return {
        valid: true,
        metadata: {
          exists: true,
          readable: true,
          writable: checkWritable ? writable : true,
          size: stats.size,
        },
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          valid: false,
          error: 'File does not exist',
        };
      }

      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Validate multiple files
   */
  async validateFiles(
    filePaths: string[],
    options: ValidationOptions = {}
  ): Promise<Map<string, FileValidationResult>> {
    const results = new Map<string, FileValidationResult>();

    await Promise.all(
      filePaths.map(async (path) => {
        const result = await this.validateFile(path, options);
        results.set(path, result);
      })
    );

    return results;
  }

  /**
   * Validate FileInfo objects
   */
  validateFileInfo(file: FileInfo, options: ValidationOptions = {}): FileValidationResult {
    const { maxSize, minSize, allowedExtensions } = options;

    // Check size constraints
    if (maxSize !== undefined && file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size (${maxSize} bytes)`,
      };
    }

    if (minSize !== undefined && file.size < minSize) {
      return {
        valid: false,
        error: `File size is below minimum required size (${minSize} bytes)`,
      };
    }

    // Check extension
    if (allowedExtensions && allowedExtensions.length > 0) {
      const ext = file.extension.toLowerCase();
      const normalizedAllowed = allowedExtensions.map((e) =>
        e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`
      );

      if (!normalizedAllowed.includes(ext)) {
        return {
          valid: false,
          error: `File extension "${ext}" is not allowed`,
        };
      }
    }

    return {
      valid: true,
    };
  }

  /**
   * Validate destination path is valid
   */
  async validateDestination(
    destinationPath: string,
    createIfNotExists: boolean = true
  ): Promise<FileValidationResult> {
    try {
      await fs.access(destinationPath);

      // Path exists, check if it's a directory
      const stats = await stat(destinationPath);
      if (!stats.isDirectory()) {
        return {
          valid: false,
          error: 'Destination exists but is not a directory',
        };
      }

      // Check if directory is writable
      try {
        await fs.access(destinationPath, fs.constants.W_OK);
      } catch {
        return {
          valid: false,
          error: 'Destination directory is not writable',
        };
      }

      return { valid: true };
    } catch {
      // Path doesn't exist
      if (createIfNotExists) {
        try {
          await fs.mkdir(destinationPath, { recursive: true });
          return { valid: true };
        } catch (error) {
          return {
            valid: false,
            error: `Cannot create destination directory: ${error}`,
          };
        }
      }

      return {
        valid: false,
        error: 'Destination directory does not exist',
      };
    }
  }

  /**
   * Check if there will be any filename conflicts
   */
  async detectConflicts(
    operations: Array<{ source: string; destination: string }>
  ): Promise<Map<string, string[]>> {
    const conflicts = new Map<string, string[]>();
    const destMap = new Map<string, string[]>();

    // Group by destination
    for (const op of operations) {
      if (!destMap.has(op.destination)) {
        destMap.set(op.destination, []);
      }
      destMap.get(op.destination)!.push(op.source);
    }

    // Find conflicts
    for (const [dest, sources] of destMap) {
      if (sources.length > 1) {
        conflicts.set(dest, sources);
      }
    }

    return conflicts;
  }
}
