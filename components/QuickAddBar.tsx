import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, Clock, Repeat, Flag } from 'lucide-react';
import { Task } from '../types';
import { parseNaturalLanguageTask } from '../utils/taskHelpers';

interface Props {
  onAdd: (task: Partial<Task>) => void;
  autoFocus?: boolean;
}

export default function QuickAddBar({ onAdd, autoFocus = false }: Props) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<Partial<Task>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    setParsed(parseNaturalLanguageTask(input));
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!parsed.title?.trim()) return;
      onAdd({ ...parsed });
      setInput('');
      setParsed({});
    }
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur-sm transition-all focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-md dark:border-slate-800 dark:bg-slate-950/50 dark:focus-within:border-sky-700 dark:focus-within:bg-slate-900">
      <div className="flex items-center gap-3 px-3 py-2">
        <Plus size={20} className="text-slate-400 dark:text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add task e.g., 'Finish essay tomorrow p1'"
          className="flex-1 bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
        />
        <button
          onClick={() => {
            if (parsed.title?.trim()) {
              onAdd({ ...parsed });
              setInput('');
              setParsed({});
            }
          }}
          className="rounded-xl bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-600 transition hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-800/40"
        >
          Add
        </button>
      </div>

      {(parsed.dueDate || parsed.time || parsed.priority || parsed.recurring) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2 dark:border-slate-800/60">
          {parsed.dueDate && (
            <span className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <Calendar size={12} /> {parsed.dueDate}
            </span>
          )}
          {parsed.time && (
            <span className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
              <Clock size={12} /> {parsed.time}
            </span>
          )}
          {parsed.recurring && (
            <span className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
              <Repeat size={12} /> {parsed.recurring}
            </span>
          )}
          {parsed.priority && (
            <span className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
              parsed.priority === 'high' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' :
              parsed.priority === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
              'bg-slate-50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400'
            }`}>
              <Flag size={12} /> {parsed.priority}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
