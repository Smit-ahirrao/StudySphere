import React from 'react';
import { Bold, Heading1, Heading2, Highlighter, Italic, Lightbulb, List, ListChecks, ListOrdered, MessageSquareQuote, Minus, ScanLine, SquareCode } from 'lucide-react';
import { NoteFormatAction } from '../../utils/noteFormatting';

const ACTIONS: Array<{
  id: NoteFormatAction;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: 'heading', label: 'H1', icon: Heading1 },
  { id: 'subheading', label: 'H2', icon: Heading2 },
  { id: 'bold', label: 'Bold', icon: Bold },
  { id: 'italic', label: 'Italic', icon: Italic },
  { id: 'highlight', label: 'Highlight', icon: Highlighter },
  { id: 'bullet', label: 'Bullets', icon: List },
  { id: 'numbered', label: 'Numbered', icon: ListOrdered },
  { id: 'checklist', label: 'Checklist', icon: ListChecks },
  { id: 'quote', label: 'Quote', icon: MessageSquareQuote },
  { id: 'callout', label: 'Callout', icon: Lightbulb },
  { id: 'code', label: 'Code', icon: SquareCode },
  { id: 'divider', label: 'Divider', icon: Minus },
];

interface Props {
  onAction: (action: NoteFormatAction) => void;
}

const NoteToolbar: React.FC<Props> = ({ onAction }) => (
  <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/72">
    <div className="flex items-center gap-2 pr-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
      <ScanLine size={14} />
      Format
    </div>
    {ACTIONS.map((action) => (
      <button
        key={action.id}
        type="button"
        onClick={() => onAction(action.id)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:bg-white hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-800 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <action.icon size={13} />
        {action.label}
      </button>
    ))}
  </div>
);

export default NoteToolbar;
