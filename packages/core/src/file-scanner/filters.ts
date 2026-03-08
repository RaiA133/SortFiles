import { FileInfo } from '../types';

/**
 * Common file filters
 */
export class FileFilters {
  /**
   * Filter for image files
   */
  static isImage(file: FileInfo): boolean {
    const imageExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.bmp', '.ico', '.tiff', '.tif', '.psd', '.raw',
      '.heic', '.heif', '.avif', '.jxl'
    ];
    return imageExtensions.includes(file.extension.toLowerCase());
  }

  /**
   * Filter for video files
   */
  static isVideo(file: FileInfo): boolean {
    const videoExtensions = [
      '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv',
      '.webm', '.m4v', '.mpeg', '.mpg', '.3gp', '.ogv'
    ];
    return videoExtensions.includes(file.extension.toLowerCase());
  }

  /**
   * Filter for audio files
   */
  static isAudio(file: FileInfo): boolean {
    const audioExtensions = [
      '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma',
      '.m4a', '.opus', '.aiff', '.aif', '.au', '.ra'
    ];
    return audioExtensions.includes(file.extension.toLowerCase());
  }

  /**
   * Filter for document files
   */
  static isDocument(file: FileInfo): boolean {
    const docExtensions = [
      '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',
      '.xls', '.xlsx', '.ppt', '.pptx', '.csv'
    ];
    return docExtensions.includes(file.extension.toLowerCase());
  }

  /**
   * Filter for archive files
   */
  static isArchive(file: FileInfo): boolean {
    const archiveExtensions = [
      '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
      '.xz', '.tar.gz', '.tar.bz2', '.tar.xz'
    ];
    return archiveExtensions.includes(file.extension.toLowerCase());
  }

  /**
   * Filter for code files
   */
  static isCode(file: FileInfo): boolean {
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java',
      '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs',
      '.swift', '.kt', '.html', '.css', '.scss', '.json',
      '.xml', '.yaml', '.yml', '.md', '.sh', '.bat'
    ];
    return codeExtensions.includes(file.extension.toLowerCase());
  }

  /**
   * Filter for executable files
   */
  static isExecutable(file: FileInfo): boolean {
    const exeExtensions = [
      '.exe', '.app', '.dmg', '.deb', '.rpm', '.appimage',
      '.msi', '.apk', '.run', '.bin'
    ];
    return exeExtensions.includes(file.extension.toLowerCase());
  }

  /**
   * Create a filter from file extension list
   */
  static byExtensions(extensions: string[]): (file: FileInfo) => boolean {
    const normalizedExts = extensions.map((e) =>
      e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`
    );
    return (file: FileInfo) => normalizedExts.includes(file.extension.toLowerCase());
  }

  /**
   * Create a filter from name pattern (regex)
   */
  static byNamePattern(pattern: RegExp): (file: FileInfo) => boolean {
    return (file: FileInfo) => pattern.test(file.name);
  }

  /**
   * Create a filter from size range
   */
  static bySizeRange(minBytes?: number, maxBytes?: number): (file: FileInfo) => boolean {
    return (file: FileInfo) => {
      if (minBytes !== undefined && file.size < minBytes) return false;
      if (maxBytes !== undefined && file.size > maxBytes) return false;
      return true;
    };
  }

  /**
   * Create a filter from date range
   */
  static byDateRange(startDate?: Date, endDate?: Date): (file: FileInfo) => boolean {
    return (file: FileInfo) => {
      const fileDate = file.modifiedAt;
      if (startDate && fileDate < startDate) return false;
      if (endDate && fileDate > endDate) return false;
      return true;
    };
  }

  /**
   * Combine multiple filters with AND logic
   */
  static and(...filters: ((file: FileInfo) => boolean)[]): (file: FileInfo) => boolean {
    return (file: FileInfo) => filters.every((filter) => filter(file));
  }

  /**
   * Combine multiple filters with OR logic
   */
  static or(...filters: ((file: FileInfo) => boolean)[]): (file: FileInfo) => boolean {
    return (file: FileInfo) => filters.some((filter) => filter(file));
  }

  /**
   * Negate a filter
   */
  static not(filter: (file: FileInfo) => boolean): (file: FileInfo) => boolean {
    return (file: FileInfo) => !filter(file);
  }

  /**
   * Filter for receipt-like files
   */
  static isReceipt(file: FileInfo): boolean {
    const receiptKeywords = [
      'receipt', 'invoice', 'bill', 'checkout',
      'purchase', 'order', 'transaction'
    ];
    const name = file.name.toLowerCase();
    return receiptKeywords.some((keyword) => name.includes(keyword));
  }

  /**
   * Filter for work-related files
   */
  static isWorkFile(file: FileInfo): boolean {
    const workKeywords = [
      'work', 'office', 'business', 'project',
      'report', 'presentation', 'meeting'
    ];
    const name = file.name.toLowerCase();
    return workKeywords.some((keyword) => name.includes(keyword));
  }

  /**
   * Filter for personal files
   */
  static isPersonalFile(file: FileInfo): boolean {
    const personalKeywords = [
      'personal', 'family', 'home', 'private',
      'photo', 'vacation', 'trip'
    ];
    const name = file.name.toLowerCase();
    return personalKeywords.some((keyword) => name.includes(keyword));
  }
}
