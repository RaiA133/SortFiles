import { FileIcon, FolderOpen, ChevronRight } from 'lucide-react';

interface ClassificationItem {
  filePath: string;
  category: string;
  subcategory?: string;
  confidence: number;
  suggestedFolder: string;
  reasoning?: string;
}

interface ClassificationPreviewProps {
  classifications: ClassificationItem[];
  onMoveToPreview: () => void;
  onClear: () => void;
}

export function ClassificationPreview({ classifications, onMoveToPreview, onClear }: ClassificationPreviewProps) {
  // Safety check
  if (!classifications || !Array.isArray(classifications) || classifications.length === 0) {
    return null;
  }

  // Group by category for better organization
  const groupedByCategory = classifications.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ClassificationItem[]>);

  const categories = Object.keys(groupedByCategory).sort();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <FileIcon className="w-5 h-5 text-primary" />
          <div>
            <div className="font-semibold">Classification Results</div>
            <div className="text-sm text-muted-foreground">
              {classifications.length} files classified
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Clear
          </button>
          <button
            onClick={onMoveToPreview}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Move to Preview
          </button>
        </div>
      </div>

      {/* Classification Details */}
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category} className="border border-border rounded-lg overflow-hidden">
            {/* Category Header */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">{category}</span>
              <span className="text-xs text-muted-foreground">
                ({groupedByCategory[category].length} files)
              </span>
            </div>

            {/* Files in this category */}
            <div className="divide-y divide-border">
              {groupedByCategory[category].slice(0, 10).map((item, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileIcon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium truncate">{item.filePath}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded flex-shrink-0">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>→</span>
                        <span className="truncate">{item.suggestedFolder}</span>
                      </div>
                      {item.reasoning && (
                        <div className="mt-1 text-xs text-muted-foreground italic">
                          {item.reasoning}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {groupedByCategory[category].length > 10 && (
                <div className="px-4 py-2 text-xs text-muted-foreground text-center bg-muted/20">
                  +{groupedByCategory[category].length - 10} more files in this category
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-muted/30 rounded-lg border border-border">
          <div className="text-2xl font-bold">{classifications.length}</div>
          <div className="text-xs text-muted-foreground">Total Files</div>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg border border-border">
          <div className="text-2xl font-bold">{categories.length}</div>
          <div className="text-xs text-muted-foreground">Categories</div>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg border border-border">
          <div className="text-2xl font-bold">
            {Math.round(classifications.reduce((sum, item) => sum + item.confidence, 0) / classifications.length * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">Avg Confidence</div>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg border border-border">
          <div className="text-2xl font-bold">
            {classifications.filter(item => item.confidence >= 0.9).length}
          </div>
          <div className="text-xs text-muted-foreground">High Confidence</div>
        </div>
      </div>
    </div>
  );
}
