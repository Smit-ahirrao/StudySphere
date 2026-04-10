import React from 'react';
import { BrainCircuit, FileText, UploadCloud } from 'lucide-react';
import { Button, Card } from '../UI';

interface StudyFileOption {
  id: string;
  name: string;
  type: string;
  size: number;
}

interface Props {
  files: StudyFileOption[];
  selectedFileId: string;
  onSelectFile: (id: string) => void;
  onUploadClick: () => void;
  busy?: boolean;
}

const FileUpload: React.FC<Props> = ({ files, selectedFileId, onSelectFile, onUploadClick, busy }) => (
  <Card className="border-cyan-100/80 bg-gradient-to-br from-white via-cyan-50/55 to-sky-50/40 dark:border-cyan-900/60 dark:bg-[linear-gradient(160deg,rgba(8,15,35,0.98),rgba(15,23,42,0.96),rgba(17,24,39,0.94))]">
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">AI Study Tool</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Step 1: choose a PDF, DOCX, or TXT file to convert into revision-ready outputs.
            </p>
          </div>
        </div>

        <Button onClick={onUploadClick} disabled={busy}>
          <UploadCloud size={16} />
          Upload file
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Choose from your library</label>
          <select
            value={selectedFileId}
            onChange={(event) => onSelectFile(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-950"
          >
            <option value="">Select a study file</option>
            {files.map((file) => (
              <option key={file.id} value={file.id}>
                {file.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
          <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
            <FileText size={15} />
            Supported
          </div>
          <div className="mt-1">PDF, DOCX, TXT</div>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          No supported study documents yet. Upload one to start the AI pipeline.
        </div>
      ) : null}
    </div>
  </Card>
);

export default FileUpload;
