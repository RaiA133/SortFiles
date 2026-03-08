import { useState, useEffect } from 'react';
import { FileBrowser } from './components/FileBrowser';
import { AIProviderSelect } from './components/AIProviderSelect';
import { RulePreview } from './components/RulePreview';
import { FileGrid } from './components/FileGrid';
import { FolderOpen, Sparkles, Settings, Undo2, Redo2 } from 'lucide-react';
import { ToastProvider } from './contexts/ToastContext';

type Page = 'setup' | 'dashboard' | 'preview' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('setup');
  const [sourceDir, setSourceDir] = useState<string | null>(null);
  const [destDir, setDestDir] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string>('openai');
  const [files, setFiles] = useState<any[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [classificationResults, setClassificationResults] = useState<any[]>([]);

  // Load classification results from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sortfiles_classification_results');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setClassificationResults(parsed);
        } else {
          console.error('Invalid classification results format in localStorage');
          setClassificationResults([]);
        }
      } catch (e) {
        console.error('Failed to load classification results from localStorage:', e);
        setClassificationResults([]);
      }
    }
  }, []);

  // Convert classification results to a plan format
  const convertClassificationsToPlan = (classifications: any[]) => {
    // Safety check
    if (!classifications || !Array.isArray(classifications)) {
      console.error('Invalid classifications data:', classifications);
      return null;
    }

    const moves = classifications.map((item, index) => {
      // Get the filename from the filePath
      const filename = item.filePath.split('/').pop() || item.filePath;

      return {
        source: sourceDir ? `${sourceDir}/${item.filePath}` : item.filePath,
        destination: destDir
          ? `${destDir}/${item.suggestedFolder}/${filename}`
          : `${item.suggestedFolder}/${filename}`,
        ruleName: `AI Classification: ${item.category}${item.subcategory ? ` / ${item.subcategory}` : ''}`,
        action: 'move',
        confidence: item.confidence,
        reasoning: item.reasoning,
      };
    });

    return {
      type: 'classification',
      moves,
      summary: {
        filesToMove: classifications.length,
        filesToCopy: 0,
        filesToSkip: 0,
      },
      totalFiles: classifications.length,
      sourceDir,
      destDir,
      classifications, // Keep original data for reference
    };
  };

  const handleMoveToPreview = (results?: any[] | null) => {
    const resultsToUse = results || classificationResults;
    console.log('handleMoveToPreview called with:', { results, resultsToUse, classificationResults });

    if (resultsToUse && Array.isArray(resultsToUse) && resultsToUse.length > 0) {
      const newPlan = convertClassificationsToPlan(resultsToUse);
      console.log('Created plan:', newPlan);
      if (newPlan) {
        setPlan(newPlan);
        setCurrentPage('preview');
      } else {
        console.error('Failed to create plan');
      }
    } else {
      console.error('Invalid results:', { results, resultsToUse, classificationResults });
    }
  };

  const handleClearClassifications = () => {
    setClassificationResults([]);
    localStorage.removeItem('sortfiles_classification_results');
  };

  const handleExecutePlan = () => {
    // Clear classification results after executing the plan
    handleClearClassifications();
  };

  return (
    <ToastProvider>
      <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">SortFiles</h1>
            <p className="text-sm text-muted-foreground">AI-Powered File Organizer</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage('setup')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'setup'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Setup
          </button>
          <button
            onClick={() => setCurrentPage('dashboard')}
            disabled={!sourceDir || !destDir}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'dashboard'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted disabled:opacity-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentPage('preview')}
            disabled={!plan}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'preview'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted disabled:opacity-50'
            }`}
          >
            Preview
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Undo">
            <Undo2 className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Redo">
            <Redo2 className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Settings">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {currentPage === 'setup' && (
          <div className="w-full p-8">
            <h2 className="text-2xl font-bold mb-6">Get Started</h2>

            {/* AI Provider Selection */}
            <div className="mb-8">
              <AIProviderSelect
                value={aiProvider}
                onChange={setAiProvider}
              />
            </div>

            {/* Directory Selection */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2">Source Directory</label>
                <FileBrowser
                  value={sourceDir}
                  onChange={setSourceDir}
                  placeholder="Select folder to organize"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Destination Directory</label>
                <FileBrowser
                  value={destDir}
                  onChange={setDestDir}
                  placeholder="Select destination folder"
                />
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={async () => {
                if (sourceDir && destDir) {
                  setCurrentPage('dashboard');
                }
              }}
              disabled={!sourceDir || !destDir}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Dashboard
            </button>
          </div>
        )}

        {currentPage === 'dashboard' && (
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
              <p className="text-muted-foreground">
                Source: {sourceDir}<br/>
                Destination: {destDir}<br/>
                {files.length} files found
              </p>
            </div>

            <FileGrid
              files={files}
              sourceDir={sourceDir!}
              aiProvider={aiProvider}
              onFilesUpdate={setFiles}
              onGeneratePlan={async () => {
                const result = await window.electronAPI.generatePlan(files, destDir!);
                setPlan(result);
                setCurrentPage('preview');
              }}
              classificationResults={classificationResults}
              onClassificationResultsChange={setClassificationResults}
              onMoveToPreview={handleMoveToPreview}
            />
          </div>
        )}

        {currentPage === 'preview' && plan && (
          <div className="p-8">
            <RulePreview
              plan={plan}
              onExecute={async () => {
                const result = await window.electronAPI.executePlan(plan);
                console.log('Execution result:', result);
                // Clear classification results after execution
                if (plan.type === 'classification') {
                  setClassificationResults([]);
                  localStorage.removeItem('sortfiles_classification_results');
                }
              }}
              onBack={() => setCurrentPage('dashboard')}
            />
          </div>
        )}
      </main>
    </div>
    </ToastProvider>
  );
}

export default App;
