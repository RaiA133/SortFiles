import { useState } from 'react';
import { FolderOpen } from 'lucide-react';

interface FileBrowserProps {
  value: string | null;
  onChange: (path: string | null) => void;
  placeholder?: string;
}

export function FileBrowser({ value, onChange, placeholder }: FileBrowserProps) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async () => {
    setLoading(true);
    try {
      const path = await window.electronAPI.selectDirectory();
      onChange(path);
    } catch (error) {
      console.error('Failed to select directory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSelect}
      disabled={loading}
      className="w-full p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors disabled:opacity-50"
    >
      <div className="flex items-center gap-3">
        <FolderOpen className="w-6 h-6 text-muted-foreground" />
        <div className="text-left flex-1">
          {value ? (
            <span className="text-sm font-medium truncate block">{value}</span>
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder || 'Select directory'}</span>
          )}
        </div>
        {loading && (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </button>
  );
}
