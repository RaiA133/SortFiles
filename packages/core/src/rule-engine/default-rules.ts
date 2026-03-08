import { Rule } from '../types';

/**
 * Default rules for common file organization
 */
export const defaultRules: Rule[] = [
  {
    id: 'images',
    name: 'Images',
    description: 'Move image files to Images folder',
    conditions: [
      { type: 'extension', operator: 'equals', value: '.jpg' },
      { type: 'extension', operator: 'equals', value: '.jpeg' },
      { type: 'extension', operator: 'equals', value: '.png' },
      { type: 'extension', operator: 'equals', value: '.gif' },
      { type: 'extension', operator: 'equals', value: '.webp' },
      { type: 'extension', operator: 'equals', value: '.svg' },
      { type: 'extension', operator: 'equals', value: '.bmp' },
      { type: 'extension', operator: 'equals', value: '.ico' },
      { type: 'extension', operator: 'equals', value: '.tiff' },
      { type: 'extension', operator: 'equals', value: '.tif' },
      { type: 'extension', operator: 'equals', value: '.raw' },
      { type: 'extension', operator: 'equals', value: '.heic' },
      { type: 'extension', operator: 'equals', value: '.heif' },
      { type: 'extension', operator: 'equals', value: '.avif' },
      { type: 'extension', operator: 'equals', value: '.jxl' },
      { type: 'extension', operator: 'equals', value: '.psd' },
      { type: 'extension', operator: 'equals', value: '.ai' },
      { type: 'extension', operator: 'equals', value: '.eps' },
      { type: 'extension', operator: 'equals', value: '.xcf' },
    ],
    action: {
      type: 'move',
      destination: 'Images/{year}/{month}',
      createFolder: true,
    },
    priority: 10,
    enabled: true,
    tags: ['media', 'images'],
  },
  {
    id: 'videos',
    name: 'Videos',
    description: 'Move video files to Videos folder',
    conditions: [
      {
        type: 'extension',
        operator: 'equals',
        value: '.mp4',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.avi',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.mkv',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.mov',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.wmv',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.flv',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.webm',
      },
    ],
    action: {
      type: 'move',
      destination: 'Videos/{year}',
      createFolder: true,
    },
    priority: 10,
    enabled: true,
    tags: ['media', 'videos'],
  },
  {
    id: 'audio',
    name: 'Audio',
    description: 'Move audio files to Audio folder',
    conditions: [
      {
        type: 'extension',
        operator: 'equals',
        value: '.mp3',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.wav',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.flac',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.aac',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.ogg',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.wma',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.m4a',
      },
    ],
    action: {
      type: 'move',
      destination: 'Audio',
      createFolder: true,
    },
    priority: 10,
    enabled: true,
    tags: ['media', 'audio'],
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Move document files to Documents folder',
    conditions: [
      { type: 'extension', operator: 'equals', value: '.pdf' },
      { type: 'extension', operator: 'equals', value: '.doc' },
      { type: 'extension', operator: 'equals', value: '.docx' },
      { type: 'extension', operator: 'equals', value: '.txt' },
      { type: 'extension', operator: 'equals', value: '.rtf' },
      { type: 'extension', operator: 'equals', value: '.odt' },
      { type: 'extension', operator: 'equals', value: '.ods' },
      { type: 'extension', operator: 'equals', value: '.odp' },
      { type: 'extension', operator: 'equals', value: '.xls' },
      { type: 'extension', operator: 'equals', value: '.xlsx' },
      { type: 'extension', operator: 'equals', value: '.xlsm' },
      { type: 'extension', operator: 'equals', value: '.ppt' },
      { type: 'extension', operator: 'equals', value: '.pptx' },
      { type: 'extension', operator: 'equals', value: '.csv' },
      { type: 'extension', operator: 'equals', value: '.tsv' },
      { type: 'extension', operator: 'equals', value: '.pages' },
      { type: 'extension', operator: 'equals', value: '.numbers' },
      { type: 'extension', operator: 'equals', value: '.key' },
      { type: 'extension', operator: 'equals', value: '.tex' },
      { type: 'extension', operator: 'equals', value: '.epub' },
      { type: 'extension', operator: 'equals', value: '.mobi' },
    ],
    action: {
      type: 'move',
      destination: 'Documents',
      createFolder: true,
    },
    priority: 10,
    enabled: true,
    tags: ['documents'],
  },
  {
    id: 'archives',
    name: 'Archives',
    description: 'Move archive files to Archives folder',
    conditions: [
      {
        type: 'extension',
        operator: 'equals',
        value: '.zip',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.rar',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.7z',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.tar',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.gz',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.bz2',
      },
    ],
    action: {
      type: 'move',
      destination: 'Archives',
      createFolder: true,
    },
    priority: 10,
    enabled: true,
    tags: ['archives'],
  },
  {
    id: 'code',
    name: 'Code',
    description: 'Move code files to Code folder',
    conditions: [
      {
        type: 'extension',
        operator: 'equals',
        value: '.js',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.ts',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.jsx',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.tsx',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.py',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.java',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.cpp',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.c',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.cs',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.php',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.rb',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.go',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.rs',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.swift',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.kt',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.html',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.css',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.scss',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.json',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.xml',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.yaml',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.yml',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.md',
      },
    ],
    action: {
      type: 'move',
      destination: 'Code/{ext}',
      createFolder: true,
    },
    priority: 10,
    enabled: true,
    tags: ['code', 'development'],
  },
  {
    id: 'executables',
    name: 'Executables',
    description: 'Move executable files to Applications folder',
    conditions: [
      {
        type: 'extension',
        operator: 'equals',
        value: '.exe',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.app',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.dmg',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.deb',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.rpm',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.appimage',
      },
      {
        type: 'extension',
        operator: 'equals',
        value: '.msi',
      },
    ],
    action: {
      type: 'move',
      destination: 'Applications',
      createFolder: true,
    },
    priority: 10,
    enabled: true,
    tags: ['executables', 'applications'],
  },
  {
    id: 'receipts',
    name: 'Receipts',
    description: 'Move receipt-like files to Receipts folder',
    conditions: [
      {
        type: 'name_pattern',
        operator: 'contains',
        value: 'receipt',
      },
      {
        type: 'name_pattern',
        operator: 'contains',
        value: 'invoice',
      },
      {
        type: 'name_pattern',
        operator: 'contains',
        value: 'bill',
      },
    ],
    action: {
      type: 'move',
      destination: 'Documents/Receipts/{year}',
      createFolder: true,
    },
    priority: 20, // Higher priority to catch receipts before general documents
    enabled: true,
    tags: ['documents', 'financial'],
  },
];

/**
 * Get default rules
 */
export function getDefaultRules(): Rule[] {
  return JSON.parse(JSON.stringify(defaultRules));
}

/**
 * Get rules by category
 */
export function getRulesByCategory(category: string): Rule[] {
  return defaultRules.filter((rule) => rule.tags?.includes(category));
}

/**
 * Get rule by ID
 */
export function getRuleById(id: string): Rule | undefined {
  return defaultRules.find((rule) => rule.id === id);
}
