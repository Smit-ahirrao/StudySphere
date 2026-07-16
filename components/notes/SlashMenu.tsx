import React, { useEffect, useRef, useState } from 'react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  Code, 
  Divide, 
  AlertCircle,
  MessageSquare,
  Sparkles,
  EyeOff
} from 'lucide-react';
import { BlockType } from '../../types';

interface SlashMenuProps {
  position: { x: number; y: number };
  onSelect: (type: BlockType | string) => void;
  onClose: () => void;
}

const COMMANDS: { type: BlockType | string; label: string; description: string; icon: any }[] = [
  { type: 'paragraph', label: 'Text', description: 'Just start writing with plain text.', icon: Type },
  { type: 'active-recall', label: 'Active Recall', description: 'Hide text behind a click-to-reveal mask.', icon: EyeOff },
  { type: 'h1', label: 'Heading 1', description: 'Big section heading.', icon: Heading1 },
  { type: 'h2', label: 'Heading 2', description: 'Medium section heading.', icon: Heading2 },
  { type: 'h3', label: 'Heading 3', description: 'Small section heading.', icon: Heading3 },
  { type: 'bullet', label: 'Bulleted list', description: 'Create a simple bulleted list.', icon: List },
  { type: 'numbered', label: 'Numbered list', description: 'Create a list with numbering.', icon: ListOrdered },
  { type: 'todo', label: 'To-do list', description: 'Track tasks with checkboxes.', icon: CheckSquare },
  { type: 'quote', label: 'Quote', description: 'Capture a quotation.', icon: Quote },
  { type: 'callout', label: 'Callout', description: 'Make writing stand out.', icon: AlertCircle },
  { type: 'code', label: 'Code', description: 'Capture a code snippet.', icon: Code },
  { type: 'divider', label: 'Divider', description: 'Visually divide your content.', icon: Divide },
];

const AI_COMMANDS: { type: string; label: string; description: string; icon: any }[] = [
  { type: 'ai-simplify', label: 'Simplify this', description: 'Rewrite simply.', icon: Sparkles },
  { type: 'ai-flashcard', label: 'Make Flashcard', description: 'Turn into Q&A.', icon: Sparkles },
  { type: 'ai-expand', label: 'Expand Concept', description: 'Flesh out details.', icon: Sparkles },
];

const ALL_COMMANDS = [...AI_COMMANDS, ...COMMANDS];

const SlashMenu: React.FC<SlashMenuProps> = ({ position, onSelect, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % ALL_COMMANDS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + ALL_COMMANDS.length) % ALL_COMMANDS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(ALL_COMMANDS[selectedIndex].type);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onClose]);

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 w-72 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      style={{ left: position.x, top: position.y }}
    >
      <div className="mb-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-500 flex items-center gap-1.5">
        <Sparkles size={12} /> Magic Commands
      </div>
      <div className="space-y-0.5 mb-3">
        {AI_COMMANDS.map((cmd, index) => {
          const isSelected = selectedIndex === index;
          return (
            <button
              key={cmd.type}
              onClick={() => onSelect(cmd.type)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                isSelected ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${
                isSelected ? 'border-purple-200 bg-white text-purple-500 dark:border-purple-800 dark:bg-slate-900' : 'border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950'
              }`}>
                <cmd.icon size={18} />
              </div>
              <div>
                <div className="text-sm font-medium">{cmd.label}</div>
                <div className="text-[11px] opacity-70">{cmd.description}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mb-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Basic Blocks
      </div>
      <div className="space-y-0.5">
        {COMMANDS.map((cmd, index) => {
          const globalIndex = index + AI_COMMANDS.length;
          const isSelected = selectedIndex === globalIndex;
          return (
            <button
              key={cmd.type}
              onClick={() => onSelect(cmd.type)}
              onMouseEnter={() => setSelectedIndex(globalIndex)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                isSelected ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${
                isSelected ? 'border-sky-200 bg-white dark:border-sky-800 dark:bg-slate-900' : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950'
              }`}>
                <cmd.icon size={18} />
              </div>
              <div>
                <div className="text-sm font-medium">{cmd.label}</div>
                <div className="text-[11px] opacity-70">{cmd.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SlashMenu;
