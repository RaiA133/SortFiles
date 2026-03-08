import { useState, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

interface ExecutionResult {
  success: boolean;
  moved: number;
  copied: number;
  skipped: number;
  errors: Array<{ path: string; error: string }>;
  planned?: {
    filesToMove: number;
    filesToCopy: number;
    filesToSkip: number;
  };
}

interface ExecutionProgressProps {
  isExecuting: boolean;
  result: ExecutionResult | null;
  onClose: () => void;
}

export function ExecutionProgress({ isExecuting, result, onClose }: ExecutionProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isExecuting) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      return () => clearInterval(interval);
    } else if (result) {
      setProgress(100);
    }
  }, [isExecuting, result]);

  if (!isExecuting && !result) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        {isExecuting ? (
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Organizing Files...</h3>
            <p className="text-sm text-muted-foreground mb-4">Please wait while we organize your files</p>
            <div className="w-full bg-secondary rounded-full h-2 mb-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{Math.round(Math.min(progress, 100))}%</p>
          </div>
        ) : result ? (
          <div>
            <div className="flex items-center justify-center mb-4">
              {result.success ? (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-6 h-6 text-red-600" />
                </div>
              )}
            </div>

            <h3 className={`text-lg font-semibold text-center mb-4 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              {result.success ? 'Organization Complete!' : 'Organization Failed'}
            </h3>

            {result.planned && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">PLAN (Preview)</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-semibold text-blue-600">{result.planned.filesToMove}</div>
                    <div className="text-xs text-muted-foreground">To Move</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-blue-600">{result.planned.filesToCopy}</div>
                    <div className="text-xs text-muted-foreground">To Copy</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground">{result.planned.filesToSkip}</div>
                    <div className="text-xs text-muted-foreground">To Skip</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {result.planned ? 'ACTUAL RESULT' : 'RESULT'}
              </h4>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">Files Moved</span>
                <span className="font-semibold text-green-600">{result.moved}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">Files Copied</span>
                <span className="font-semibold text-blue-600">{result.copied}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">Files Skipped</span>
                <span className="font-semibold text-muted-foreground">{result.skipped}</span>
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <span className="text-sm font-semibold text-destructive">
                    {result.errors.length} Error{result.errors.length > 1 ? 's' : ''}
                  </span>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 5).map((err, idx) => (
                      <div key={idx} className="text-xs text-destructive/80 mt-1">
                        {err.path}: {err.error}
                      </div>
                    ))}
                    {result.errors.length > 5 && (
                      <div className="text-xs text-destructive/80 mt-1">
                        ...and {result.errors.length - 5} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
