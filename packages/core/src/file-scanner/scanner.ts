import { readdir, stat } from 'fs/promises';
import { join, basename, extname } from 'path';
import { FileInfo, ScanOptions, ScanResult, DirectoryStats } from '../types';

/**
 * File Scanner - Recursively scan directories and collect file information
 */
export class FileScanner {
  private readonly DEFAULT_CONCURRENCY = 100;

  /**
   * Scan a directory for files
   */
  async scan(directory: string, options: ScanOptions = {}): Promise<ScanResult> {
    const startTime = Date.now();

    const {
      maxFiles = Infinity,
      includeHidden = false,
      followSymlinks = false,
      extensions,
      excludePatterns = [],
      maxDepth = Infinity,
      onProgress,
      concurrency = this.DEFAULT_CONCURRENCY,
      filter,
      sortResults = true,
      minSize,
      maxSize,
    } = options;

    const results: FileInfo[] = [];
    const errors: string[] = [];
    const skippedDirectories: string[] = [];
    let scannedCount = 0;

    // Process queue: [path, depth]
    const queue: [string, number][] = [[directory, 0]];

    while (queue.length > 0 && results.length < maxFiles) {
      // Process batch concurrently
      const batch = queue.splice(0, Math.min(concurrency, queue.length));

      for (const [path, depth] of batch) {
        if (depth > maxDepth) continue;

        try {
          const { files, subdirectories } = await this.processPath(path, {
            includeHidden,
            followSymlinks,
          });

          // Process files
          for (const file of files) {
            if (results.length >= maxFiles) break;

            // Apply filters
            if (!includeHidden && file.name.startsWith('.')) continue;
            if (extensions && !extensions.includes(file.extension)) continue;
            if (excludePatterns.some((pattern) => pattern.test(file.name))) continue;
            if (minSize !== undefined && file.size < minSize) continue;
            if (maxSize !== undefined && file.size > maxSize) continue;
            if (filter && !filter(file)) continue;

            results.push(file);
            scannedCount++;

            onProgress?.({
              scanned: scannedCount,
              total: maxFiles === Infinity ? 0 : maxFiles,
              currentPath: file.path,
              found: results.length,
              percentComplete: maxFiles === Infinity ? undefined : (scannedCount / maxFiles) * 100,
            });
          }

          // Add subdirectories to queue
          for (const subdir of subdirectories) {
            queue.push([subdir, depth + 1]);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`${path}: ${errorMsg}`);
          skippedDirectories.push(path);
        }
      }
    }

    // Sort results if requested
    if (sortResults) {
      results.sort((a, b) => a.path.localeCompare(b.path));
    }

    return {
      files: results,
      totalScanned: scannedCount,
      totalFound: results.length,
      durationMs: Date.now() - startTime,
      errors,
      skippedDirectories,
    };
  }

  /**
   * Get statistics about a directory
   */
  async getStats(directory: string, options: ScanOptions = {}): Promise<DirectoryStats> {
    const result = await this.scan(directory, {
      ...options,
      sortResults: false,
    });

    const files = result.files;
    const sizeByExtension: Record<string, number> = {};
    const countByExtension: Record<string, number> = {};

    for (const file of files) {
      const ext = file.extension.toLowerCase() || '(no extension)';
      sizeByExtension[ext] = (sizeByExtension[ext] || 0) + file.size;
      countByExtension[ext] = (countByExtension[ext] || 0) + 1;
    }

    const sortedBySize = [...files].sort((a, b) => b.size - a.size);

    return {
      fileCount: files.length,
      directoryCount: 0, // Could be tracked separately
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      sizeByExtension,
      countByExtension,
      largestFile: sortedBySize[0] || null,
      smallestFile: sortedBySize[sortedBySize.length - 1] || null,
    };
  }

  /**
   * Get file info for a single file
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await stat(filePath);
    const parsedPath = this.parsePath(filePath);

    return {
      path: filePath,
      name: parsedPath.name,
      extension: parsedPath.extension,
      size: stats.size,
      mimeType: this.detectMimeType(parsedPath.extension),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isSymbolicLink: stats.isSymbolicLink(),
    };
  }

  /**
   * Process a single directory path
   */
  private async processPath(
    path: string,
    options: { includeHidden: boolean; followSymlinks: boolean }
  ): Promise<{ files: FileInfo[]; subdirectories: string[] }> {
    const entries = await readdir(path, { withFileTypes: true });
    const files: FileInfo[] = [];
    const subdirectories: string[] = [];

    for (const entry of entries) {
      const fullPath = join(path, entry.name);

      try {
        if (entry.isDirectory()) {
          if (options.includeHidden || !entry.name.startsWith('.')) {
            subdirectories.push(fullPath);
          }
        } else if (entry.isFile() || (options.followSymlinks && entry.isSymbolicLink())) {
          const stats = await stat(fullPath);
          const parsedPath = this.parsePath(fullPath);

          files.push({
            path: fullPath,
            name: entry.name,
            extension: parsedPath.extension,
            size: stats.size,
            mimeType: this.detectMimeType(parsedPath.extension),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            isSymbolicLink: entry.isSymbolicLink(),
          });
        }
      } catch (error) {
        // Skip files we can't read
        continue;
      }
    }

    return { files, subdirectories };
  }

  /**
   * Parse a file path into name and extension
   */
  private parsePath(filePath: string): { name: string; extension: string } {
    const name = basename(filePath);
    const ext = extname(filePath);

    return {
      name,
      extension: ext,
    };
  }

  /**
   * Detect MIME type based on file extension
   */
  private detectMimeType(extension: string): string | undefined {
    const mimeTypes: Record<string, string> = {
      // Documents
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',
      '.odt': 'application/vnd.oasis.opendocument.text',
      '.ods': 'application/vnd.oasis.opendocument.spreadsheet',

      // Images
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
      '.tiff': 'image/tiff',

      // Videos
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',

      // Audio
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.wma': 'audio/x-ms-wma',
      '.m4a': 'audio/mp4',

      // Archives
      '.zip': 'application/zip',
      '.rar': 'application/vnd.rar',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      '.bz2': 'application/x-bzip2',

      // Code
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.jsx': 'text/jsx',
      '.tsx': 'text/tsx',
      '.py': 'text/x-python',
      '.java': 'text/x-java-source',
      '.cpp': 'text/x-c++src',
      '.c': 'text/x-csrc',
      '.cs': 'text/x-csharp',
      '.php': 'text/x-php',
      '.rb': 'text/x-ruby',
      '.go': 'text/x-go',
      '.rs': 'text/x-rust',
      '.swift': 'text/x-swift',
      '.kt': 'text/x-kotlin',
      '.html': 'text/html',
      '.css': 'text/css',
      '.scss': 'text/x-scss',
      '.sass': 'text/x-sass',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.yaml': 'text/yaml',
      '.yml': 'text/yaml',
      '.md': 'text/markdown',
      '.sh': 'application/x-sh',
      '.bat': 'application/x-bat',

      // Executables
      '.exe': 'application/x-msdownload',
      '.app': 'application/x-apple-diskimage',
      '.dmg': 'application/x-apple-diskimage',
      '.deb': 'application/vnd.debian.binary-package',
      '.rpm': 'application/x-rpm',
      '.appimage': 'application/x-appimage',

      // Other
      '.csv': 'text/csv',
    };

    return mimeTypes[extension.toLowerCase()];
  }
}
