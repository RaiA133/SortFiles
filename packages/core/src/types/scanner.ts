import { FileInfo } from './files';

/**
 * File scanner options
 */
export interface ScanOptions {
  /** Maximum number of files to scan (default: unlimited) */
  maxFiles?: number;
  /** Include hidden files (default: false) */
  includeHidden?: boolean;
  /** Follow symbolic links (default: false) */
  followSymlinks?: boolean;
  /** Only scan files with these extensions */
  extensions?: string[];
  /** Exclude files matching these patterns */
  excludePatterns?: RegExp[];
  /** Maximum recursion depth */
  maxDepth?: number;
  /** Progress callback */
  onProgress?: (progress: ScanProgress) => void;
  /** Number of files to process concurrently */
  concurrency?: number;
  /** Filter function for additional filtering */
  filter?: (file: FileInfo) => boolean;
  /** Sort results */
  sortResults?: boolean;
  /** Minimum file size in bytes */
  minSize?: number;
  /** Maximum file size in bytes */
  maxSize?: number;
}

/**
 * Scan progress information
 */
export interface ScanProgress {
  /** Number of files scanned so far */
  scanned: number;
  /** Estimated total files (may be 0 if counting is disabled) */
  total: number;
  /** Current path being scanned */
  currentPath: string;
  /** Number of files found */
  found: number;
  /** Percentage complete (0-100) */
  percentComplete?: number;
}

/**
 * Scan result
 */
export interface ScanResult {
  /** Files found during scan */
  files: FileInfo[];
  /** Number of files scanned */
  totalScanned: number;
  /** Number of files matching filters */
  totalFound: number;
  /** Scan duration in milliseconds */
  durationMs: number;
  /** Any errors that occurred during scan */
  errors: string[];
  /** Directories that couldn't be accessed */
  skippedDirectories: string[];
}

/**
 * Directory statistics
 */
export interface DirectoryStats {
  /** Total number of files */
  fileCount: number;
  /** Total number of directories */
  directoryCount: number;
  /** Total size in bytes */
  totalSize: number;
  /** Size by extension */
  sizeByExtension: Record<string, number>;
  /** Count by extension */
  countByExtension: Record<string, number>;
  /** Largest file */
  largestFile: FileInfo | null;
  /** Smallest file */
  smallestFile: FileInfo | null;
}
