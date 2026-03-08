import { useEffect, useState } from 'react';
import { FileIcon, FolderIcon, Sparkles } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { ClassificationPreview } from './ClassificationPreview';

const providers = [
  { id: 'openai', name: 'OpenAI', color: 'text-green-600' },
  { id: 'gemini', name: 'Google Gemini', color: 'text-blue-600' },
  { id: 'deepseek', name: 'DeepSeek', color: 'text-purple-600' },
];

const operationModes = [
  { id: 'generate-plan', name: 'Generate Plan', description: 'Create sorting plan without AI' },
  { id: 'ai-classify', name: 'AI Classify', description: 'Use AI to classify files automatically' },
];

interface FileGridProps {
  files: any[];
  onGeneratePlan: () => void;
  onFilesUpdate: (files: any[]) => void;
  sourceDir: string;
  aiProvider: string;
  classificationResults: any[];
  onClassificationResultsChange: (results: any[]) => void;
  onMoveToPreview: (results?: any[]) => void;
}

const STORAGE_KEY = 'sortfiles_ai_config';

export function FileGrid({ files, onGeneratePlan, onFilesUpdate, sourceDir, aiProvider, classificationResults, onClassificationResultsChange, onMoveToPreview }: FileGridProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [classifying, setClassifying] = useState(false);
  const [operationMode, setOperationMode] = useState<'ai-classify' | 'generate-plan'>('generate-plan');
  const [generating, setGenerating] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleScan = async () => {
    setScanning(true);
    setProgress(0);

    // Listen to progress updates
    window.electronAPI.onScanProgress((prog: any) => {
      setProgress(prog.percentComplete || prog.found || 0);
    });

    try {
      const result = await window.electronAPI.scanDirectory(sourceDir);
      console.log('Scan result:', result);
      // Update parent's files state
      onFilesUpdate(result.files || []);
      setScanning(false);
    } catch (error) {
      console.error('Scan failed:', error);
      setScanning(false);
    }
  };

  const handleClassify = async () => {
    setClassifying(true);
    onClassificationResultsChange([]);

    try {
      // Load API key from localStorage
      const localConfig = localStorage.getItem(STORAGE_KEY);
      if (!localConfig) {
        showError('Please configure and save your API key first!');
        setClassifying(false);
        return;
      }

      const parsed = JSON.parse(localConfig);
      const apiKey = parsed[aiProvider]?.apiKey;

      if (!apiKey) {
        showError(`No API key found for ${aiProvider}. Please configure it first.`);
        setClassifying(false);
        return;
      }

      console.log(`Classifying ${files.length} files using ${aiProvider}...`);

      const result = await window.electronAPI.classifyFiles(
        files,
        aiProvider,
        { apiKey }
      );

      console.log('Classifications:', result);

      // Store classification results in state and localStorage
      if (result.classifications && Array.isArray(result.classifications)) {
        onClassificationResultsChange(result.classifications);
        localStorage.setItem('sortfiles_classification_results', JSON.stringify(result.classifications));
        showSuccess(`Successfully classified ${result.classifications.length} files!`);
      } else {
        showError('Classification completed but returned invalid results');
      }
    } catch (error) {
      console.error('Classification failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showError('Classification failed', errorMessage);
    } finally {
      setClassifying(false);
    }
  };

  const handleExecutePlan = () => {
    console.log('Moving to preview with classifications:', classificationResults);
    // Only call if we have valid results
    if (classificationResults && Array.isArray(classificationResults) && classificationResults.length > 0) {
      onMoveToPreview(classificationResults);
    }
  };

  const handleClearResults = () => {
    onClassificationResultsChange([]);
    localStorage.removeItem('sortfiles_classification_results');
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);

    try {
      console.log(`Generating sorting plan for ${files.length} files (without AI)...`);

      // Generate plan using simple heuristic-based approach
      const plan = generateSimplePlan(files);

      console.log('Generated plan:', plan);
      showSuccess(`Generated sorting plan for ${files.length} files!`);
      onGeneratePlan();
    } catch (error) {
      console.error('Generate plan failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showError('Generate plan failed', errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  // Simple heuristic-based plan generation (no AI required)
  const generateSimplePlan = (fileList: any[]) => {
    const extensions = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'zip', 'rar', 'exe'];
    const rules: any[] = [];

    extensions.forEach(ext => {
      const filesWithExt = fileList.filter(f => f.extension?.toLowerCase() === ext.toLowerCase());
      if (filesWithExt.length > 0) {
        rules.push({
          id: `${ext}-rule`,
          name: `Move ${ext.toUpperCase()} files`,
          condition: `extension == "${ext}"`,
          actions: [
            { type: 'move', destination: `./${ext.toUpperCase()}/` }
          ],
          priority: 5
        });
      }
    });

    // Add a catch-all rule for unclassified files
    rules.push({
      id: 'misc-rule',
      name: 'Move miscellaneous files',
      condition: 'true', // Always matches
      actions: [
        { type: 'move', destination: './Misc/' }
      ],
      priority: 10
    });

    return {
      rules,
      totalFiles: fileList.length,
      estimatedTime: Math.ceil(fileList.length / 10) * 1000 // Rough estimate
    };
  };

  return (
    <div className="space-y-6">
      {/* Classification Results Preview */}
      {classificationResults && classificationResults.length > 0 && (
        <ClassificationPreview
          classifications={classificationResults}
          onMoveToPreview={handleExecutePlan}
          onClear={handleClearResults}
        />
      )}

      {/* Operation Mode Selector */}
      <div className="grid md:grid-cols-2 gap-4">
        {operationModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setOperationMode(mode.id as any)}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              operationMode === mode.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="font-medium mb-1">{mode.name}</div>
            <div className="text-sm text-muted-foreground">{mode.description}</div>
          </button>
        ))}
      </div>

      {/* AI Provider Indicator - only show in AI Classify mode */}
      {operationMode === 'ai-classify' && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <span className="text-sm text-muted-foreground">AI Provider: </span>
              <span className={`font-semibold ${providers.find(p => p.id === aiProvider)?.color || 'text-foreground'}`}>
                {providers.find(p => p.id === aiProvider)?.name || aiProvider}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {scanning ? 'Scanning...' : 'Scan Files'}
          </button>

          {scanning && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {operationMode === 'ai-classify' ? (
            <button
              onClick={handleClassify}
              disabled={files.length === 0 || classifying}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              {classifying ? 'Classifying...' : 'AI Classify'}
            </button>
          ) : (
            <button
              onClick={handleGeneratePlan}
              disabled={files.length === 0 || generating}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Plan'}
            </button>
          )}
        </div>
      </div>

      {files.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.slice(0, 100).map((file, index) => (
            <div
              key={index}
              className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer"
            >
              <FileIcon className="w-8 h-8 text-muted-foreground mb-2" />
              <div className="text-sm font-medium truncate">{file.name}</div>
              <div className="text-xs text-muted-foreground">{file.extension}</div>
            </div>
          ))}
          {files.length > 100 && (
            <div className="p-4 border border-dashed border-border rounded-lg flex items-center justify-center">
              <span className="text-sm text-muted-foreground">
                +{files.length - 100} more files
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <FolderIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No files to display. Click "Scan Files" to get started.</p>
        </div>
      )}
    </div>
  );
}
