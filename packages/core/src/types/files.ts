/**
 * File information type
 */
export interface FileInfo {
  /** Full path to the file */
  path: string;
  /** File name with extension */
  name: string;
  /** File extension including dot (e.g., '.txt') */
  extension: string;
  /** File size in bytes */
  size: number;
  /** MIME type if detected */
  mimeType?: string;
  /** File creation date */
  createdAt: Date;
  /** File modification date */
  modifiedAt: Date;
  /** Whether this is a symbolic link */
  isSymbolicLink?: boolean;
}

/**
 * File move operation result
 */
export interface FileMoveResult {
  /** Source file path */
  source: string;
  /** Destination file path */
  destination: string;
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  /** Original file path before any conflict resolution */
  originalDestination?: string;
  /** Whether the file was skipped (not moved because it already exists) */
  skipped?: boolean;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  /** Whether the file is valid for operations */
  valid: boolean;
  /** Validation error if invalid */
  error?: string;
  /** Additional metadata about the file */
  metadata?: {
    exists: boolean;
    readable: boolean;
    writable: boolean;
    size: number;
  };
}
