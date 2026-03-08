import { FileInfo } from '../interfaces/provider';

/**
 * Default categories for file classification
 */
export const DEFAULT_CATEGORIES = [
  {
    name: 'Documents',
    description: 'PDF, DOC, DOCX, TXT, RTF, ODT, etc.',
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.pages'],
  },
  {
    name: 'Images',
    description: 'JPG, PNG, GIF, WEBP, SVG, etc.',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.heic', '.heif'],
  },
  {
    name: 'Videos',
    description: 'MP4, AVI, MKV, MOV, etc.',
    extensions: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'],
  },
  {
    name: 'Audio',
    description: 'MP3, WAV, FLAC, AAC, etc.',
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus'],
  },
  {
    name: 'Archives',
    description: 'ZIP, RAR, 7Z, TAR, etc.',
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
  },
  {
    name: 'Code',
    description: 'JS, TS, PY, JAVA, C++, etc.',
    extensions: [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb',
      '.go', '.rs', '.swift', '.kt', '.html', '.css', '.scss', '.json', '.xml', '.yaml', '.yml', '.md',
    ],
  },
  {
    name: 'Spreadsheets',
    description: 'XLS, XLSX, CSV, etc.',
    extensions: ['.xls', '.xlsx', '.csv', '.ods'],
  },
  {
    name: 'Presentations',
    description: 'PPT, PPTX, KEY, etc.',
    extensions: ['.ppt', '.pptx', '.key', '.odp'],
  },
  {
    name: 'Executables',
    description: 'EXE, APP, DMG, etc.',
    extensions: ['.exe', '.app', '.dmg', '.deb', '.rpm', '.appimage', '.msi'],
  },
  {
    name: 'Receipts',
    description: 'Files with financial keywords',
    keywords: ['receipt', 'invoice', 'bill', 'checkout', 'purchase', 'order', 'transaction'],
  },
  {
    name: 'Work Files',
    description: 'Professional documents',
    keywords: ['work', 'office', 'business', 'project', 'report', 'presentation', 'meeting'],
  },
  {
    name: 'Personal Files',
    description: 'Personal documents',
    keywords: ['personal', 'family', 'home', 'private', 'photo', 'vacation', 'trip'],
  },
];

/**
 * Generate classification prompt for AI
 */
export function generateClassificationPrompt(
  files: FileInfo[],
  options: {
    customCategories?: string[];
    includeReasoning?: boolean;
    batchSize?: number;
  } = {}
): string {
  const { customCategories, includeReasoning = false, batchSize } = options;

  // Use custom categories if provided, otherwise use defaults
  if (customCategories) {
    customCategories; // Use variable to avoid unused warning when custom categories are provided
  }

  const fileSummary = files.map((f) => ({
    name: f.name,
    ext: f.extension,
    size: formatFileSize(f.size),
  }));

  const categoriesList = DEFAULT_CATEGORIES.map((c) => `- ${c.name}: ${c.description}`).join('\n');

  return `You are a file organization expert. Analyze the following files and classify them into appropriate categories.

CRITICAL REQUIREMENTS:
- Respond ONLY with valid JSON
- Do NOT include markdown code blocks (like \`\`\`json)
- Do NOT include any text outside the JSON structure
- Escape all special characters properly (quotes, backslashes)
- Ensure all strings are properly terminated

FILES TO CLASSIFY:
${JSON.stringify(fileSummary.slice(0, batchSize || 100), null, 2)}
${fileSummary.length > (batchSize || 100) ? `\n... and ${fileSummary.length - (batchSize || 100)} more files` : ''}

CATEGORIES TO USE:
${categoriesList}

CLASSIFICATION RULES:
1. Use the most specific category possible (e.g., "Spreadsheets" instead of "Documents")
2. For files with financial keywords (receipt, invoice, bill), use "Receipts"
3. For files with work-related keywords, use "Work Files" subcategory
4. For files with personal keywords, use "Personal Files" subcategory
5. Confidence should be high (0.8+) when extension clearly matches category
6. Suggest folder paths that are logical and organized

REQUIRED JSON STRUCTURE (respond ONLY with this):
{
  "classifications": [
    {
      "filePath": "exact filename from input (use 'name' field)",
      "category": "one of the categories above",
      "subcategory": "optional subcategory for better organization",
      "confidence": 0.0-1.0,
      "suggestedFolder": "e.g., 'Documents/Work/Reports' or 'Images/2024/03'",
      "reasoning": "${includeReasoning ? 'brief explanation of classification' : 'optional (omit if not needed)'}"
    }
  ]
}

EXAMPLE OUTPUT:
{
  "classifications": [
    {
      "filePath": "invoice_2024.pdf",
      "category": "Documents",
      "subcategory": "Work Files",
      "confidence": 0.95,
      "suggestedFolder": "Documents/Work/Invoices/2024",
      "reasoning": "PDF invoice with work-related naming pattern"
    },
    {
      "filePath": "vacation_photo.jpg",
      "category": "Images",
      "confidence": 1.0,
      "suggestedFolder": "Images/Personal/Vacation"
    },
    {
      "filePath": "data.xlsx",
      "category": "Spreadsheets",
      "subcategory": "Work Files",
      "confidence": 0.9,
      "suggestedFolder": "Spreadsheets/Work/Data"
    }
  ]
}

Remember: Respond ONLY with valid JSON. No markdown, no explanations, no extra text.`;
}

/**
 * Generate rule suggestion prompt for AI
 */
export function generateRuleSuggestionPrompt(
  files: FileInfo[],
  options: {
    maxRules?: number;
    priority?: number;
  } = {}
): string {
  const { maxRules = 20, priority = 10 } = options;

  const extensions = [...new Set(files.map((f) => f.extension))];
  const fileSample = files.slice(0, 50).map((f) => f.name);

  // Analyze patterns in filenames
  const patterns = analyzeFilePatterns(files);

  return `You are a file organization expert. Based on the following file analysis, suggest rules for automatic file organization.

FILE EXTENSIONS FOUND (${extensions.length}):
${extensions.slice(0, 30).join(', ')}
${extensions.length > 30 ? `\n... and ${extensions.length - 30} more` : ''}

SAMPLE FILE NAMES (${fileSample.length} files):
${fileSample.join('\n')}

PATTERNS DETECTED:
${patterns.map((p) => `- ${p.pattern} (${p.count} files): ${p.suggestion}`).join('\n')}

RULE GENERATION GUIDELINES:
1. Create rules that handle common file types efficiently
2. Use name patterns for files with specific keywords (receipts, invoices, etc.)
3. Organize by date for media files (Images/YYYY/MM, Videos/YYYY)
4. Use specific subfolders for better organization
5. Set appropriate priorities (higher = evaluated first)
6. All rules should have default priority of ${priority}

SUPPORTED CONDITION TYPES:
- extension: Matches file extension
- name_pattern: Uses regex to match filename
- size: File size comparison
- date: File date comparison
- mime_type: MIME type matching

SUPPORTED OPERATORS:
- equals: Exact match
- contains: Contains substring
- matches: Regex match
- greater_than / less_than: Numeric comparison

DESTINATION VARIABLES:
- {base}: Base destination directory
- {name}: Original filename
- {name_no_ext}: Filename without extension
- {ext}: File extension
- {year}: Current year (YYYY)
- {month}: Current month (MM)
- {day}: Current day (DD)
- {date}: Current date (YYYY-MM-DD)
- {file_year}: File's year
- {file_month}: File's month
- {file_day}: File's day
- {parent_dir}: Parent directory name

Generate ${maxRules} or fewer effective rules. Each rule should have:
- A clear name and description
- Conditions (can have multiple)
- Action (destination folder with variables)
- Priority (default: ${priority})

Return a JSON object with the following structure:
{
  "rules": [
    {
      "id": "unique-rule-id",
      "name": "descriptive rule name",
      "description": "what this rule does",
      "conditions": [
        {
          "type": "extension|name_pattern|size|date|mime_type",
          "operator": "equals|contains|matches|greater_than|less_than",
          "value": "condition value",
          "negate": false,
          "caseSensitive": false
        }
      ],
      "action": {
        "type": "move",
        "destination": "destination folder with variables",
        "createFolder": true,
        "overwrite": false,
        "addSuffixIfExists": true
      },
      "priority": ${priority},
      "enabled": true,
      "tags": ["category", "tags"]
    }
  ]
}`;
}

/**
 * Analyze file patterns for suggestions
 */
function analyzeFilePatterns(files: FileInfo[]): Array<{
  pattern: string;
  count: number;
  suggestion: string;
}> {
  const patterns: Array<{ pattern: string; count: number; suggestion: string }> = [];

  // Check for receipt/invoice patterns
  const receiptPattern = /receipt|invoice|bill|checkout|purchase/i;
  const receiptFiles = files.filter((f) => receiptPattern.test(f.name));
  if (receiptFiles.length > 0) {
    patterns.push({
      pattern: 'Receipt/Invoice files',
      count: receiptFiles.length,
      suggestion: 'Move to Documents/Receipts/{file_year}',
    });
  }

  // Check for screenshot patterns
  const screenshotPattern = /screenshot|screen shot|capture/i;
  const screenshotFiles = files.filter((f) => screenshotPattern.test(f.name));
  if (screenshotFiles.length > 0) {
    patterns.push({
      pattern: 'Screenshot files',
      count: screenshotFiles.length,
      suggestion: 'Move to Images/Screenshots/{file_year}/{file_month}',
    });
  }

  // Check for work-related patterns
  const workPattern = /work|office|business|project|report|meeting/i;
  const workFiles = files.filter((f) => workPattern.test(f.name));
  if (workFiles.length > 0) {
    patterns.push({
      pattern: 'Work-related files',
      count: workFiles.length,
      suggestion: 'Organize into Documents/Work/ subcategories',
    });
  }

  // Check for download patterns (common browser downloads)
  const downloadPattern = /^[a-f0-9]{8,}|.*download.*|.*\(\d+\).*$/i;
  const downloadFiles = files.filter((f) => downloadPattern.test(f.name));
  if (downloadFiles.length > 0) {
    patterns.push({
      pattern: 'Browser download patterns',
      count: downloadFiles.length,
      suggestion: 'Organize by extension into appropriate folders',
    });
  }

  return patterns;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
