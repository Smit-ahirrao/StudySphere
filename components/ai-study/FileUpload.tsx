import React, { useCallback, useState } from 'react';
import { BrainCircuit, FileText, UploadCloud, File, CheckCircle2 } from 'lucide-react';
import { Button, Card } from '../UI';

interface StudyFileOption {
  id: string;
  name: string;
  type: string;
  size: number;
}

interface Props {
  files: StudyFileOption[];
  selectedFileIds: string[];
  onToggleFile: (id: string) => void;
  onUploadClick: () => void;
  busy?: boolean;
}

const FileUpload: React.FC<Props> = ({ files, selectedFileIds, onToggleFile, onUploadClick, busy }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onUploadClick();
  }, [onUploadClick]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Card className={`border-sky-100/80 bg-gradient-to-br from-white via-slate-50 to-sky-50/55 dark:border-sky-900/50 dark:bg-[linear-gradient(160deg,rgba(8,15,35,0.98),rgba(15,23,42,0.96),rgba(17,24,39,0.94))] transition-all ${dragOver ? 'ring-2 ring-sky-400 border-sky-300 dark:ring-sky-500 dark:border-sky-700 scale-[1.005]' : ''}`}>
      <div className="space-y-5" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Upload Study Material</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Choose or drag documents to combine into a single AI study session.
              </p>
            </div>
          </div>

          <Button onClick={onUploadClick} disabled={busy}>
            <UploadCloud size={16} />
            Upload file
          </Button>
        </div>

        {/* File selector and info */}
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Select files to include in Study Pack</label>
            <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
              {files.length === 0 ? (
                <div className="p-3 text-sm text-slate-500 text-center">No files uploaded yet.</div>
              ) : (
                <div className="space-y-1">
                  {files.map((file) => (
                    <label key={file.id} className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <input
                        type="checkbox"
                        checked={selectedFileIds.includes(file.id)}
                        onChange={() => onToggleFile(file.id)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</span>
                        <span className="text-[11px] text-slate-500">{formatSize(file.size)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
            <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
              <FileText size={15} />
              Supported formats
            </div>
            <div className="mt-1 flex gap-2">
              {['PDF', 'DOCX', 'TXT'].map(ext => (
                <span key={ext} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">{ext}</span>
              ))}
            </div>
          </div>
        </div>

        {/* File count summary */}
        {files.length > 0 ? (
          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>{files.length} supported file{files.length > 1 ? 's' : ''} in your library</span>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center dark:border-slate-800 dark:bg-slate-900/30">
            <UploadCloud size={28} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-medium text-slate-500">Drop a file here or click "Upload file" to get started</p>
            <p className="text-[11px] text-slate-400 mt-1">PDF, DOCX, or TXT files up to 10 MB</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FileUpload;
