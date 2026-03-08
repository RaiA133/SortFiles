import { useState } from 'react';
import { Check, X, ArrowLeft } from 'lucide-react';
import { ExecutionProgress } from './ExecutionProgress';

interface RulePreviewProps {
  plan: any;
  onExecute: () => void;
  onBack: () => void;
}

export function RulePreview({ plan, onExecute, onBack }: RulePreviewProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const handleExecute = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const result = await window.electronAPI.executePlan(plan);
      // Include plan summary in the result for comparison
      setExecutionResult({
        ...result,
        planned: plan.summary,
      });
    } catch (error) {
      setExecutionResult({
        success: false,
        moved: 0,
        copied: 0,
        skipped: 0,
        planned: plan.summary,
        errors: [{ path: 'Error', error: error instanceof Error ? error.message : String(error) }],
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCloseProgress = () => {
    setExecutionResult(null);
    if (executionResult?.success) {
      onBack();
    }
  };

  return (
    <>
      <div className="w-full">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Preview Organization Plan</h2>
            <p className="text-muted-foreground">{plan.moves.length} files will be organized</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{plan.summary.filesToMove}</div>
            <div className="text-sm text-muted-foreground">Files to move</div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{plan.summary.filesToCopy}</div>
            <div className="text-sm text-muted-foreground">Files to copy</div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold text-muted-foreground">{plan.summary.filesToSkip}</div>
            <div className="text-sm text-muted-foreground">Files to skip</div>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Source</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Destination</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Rule</th>
                {plan.type === 'classification' && (
                  <>
                    <th className="px-4 py-3 text-left text-sm font-medium">Confidence</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Reasoning</th>
                  </>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {plan.moves.slice(0, 50).map(
                (move: any, index: number) => (
                  <tr key={index} className="border-t border-border">
                    <td className="px-4 py-3 text-sm truncate max-w-xs" title={move.source}>{move.source}</td>
                    <td className="px-4 py-3 text-sm truncate max-w-xs text-primary" title={move.destination}>{move.destination}</td>
                    <td className="px-4 py-3 text-sm">{move.ruleName}</td>
                    {plan.type === 'classification' && (
                      <>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              move.confidence >= 0.9
                                ? 'bg-green-100 text-green-700'
                                : move.confidence >= 0.7
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {Math.round(move.confidence * 100)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground italic max-w-xs truncate" title={move.reasoning}>
                          {move.reasoning || '-'}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          move.action === 'move'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {move.action}
                      </span>
                    </td>
                  </tr>
                )
              )}
              {plan.moves.length > 50 && (
                <tr>
                  <td colSpan={plan.type === 'classification' ? 6 : 4} className="px-4 py-3 text-sm text-center text-muted-foreground">
                    +{plan.moves.length - 50} more operations
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {plan.skips && plan.skips.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Skipped Files</h3>
            <div className="border border-border rounded-lg divide-y divide-border">
              {plan.skips.slice(0, 10).map((skip: any, index: number) => (
                <div key={index} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm truncate max-w-md" title={skip.source}>{skip.source}</span>
                  <span className="text-xs text-muted-foreground" title={skip.reason}>{skip.reason}</span>
                </div>
              ))}
              {plan.skips.length > 10 && (
                <div className="px-4 py-3 text-sm text-center text-muted-foreground">
                  +{plan.skips.length - 10} more skipped files
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            {isExecuting ? 'Executing...' : 'Execute Plan'}
          </button>
          <button
            onClick={onBack}
            disabled={isExecuting}
            className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
        </div>
      </div>

      <ExecutionProgress
        isExecuting={isExecuting}
        result={executionResult}
        onClose={handleCloseProgress}
      />
    </>
  );
}
