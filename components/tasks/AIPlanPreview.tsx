import React, { useState } from 'react';
import { Check, X, Calendar, Flag, Clock, ListChecks } from 'lucide-react';
import { Task, Priority } from '../../types';
import { Button } from '../UI';

interface GeneratedTask {
  title: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedTime?: number;
  subtasks?: string[];
}

interface Props {
  plan: GeneratedTask[];
  onConfirm: (selectedTasks: GeneratedTask[]) => void;
  onCancel: () => void;
}

export default function AIPlanPreview({ plan, onConfirm, onCancel }: Props) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(plan.map((_, i) => i));

  const toggleTask = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleConfirm = () => {
    const selected = plan.filter((_, i) => selectedIndices.includes(i));
    onConfirm(selected);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
              <ListChecks size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review AI Plan</h3>
              <p className="text-sm text-slate-500">Customize your generated roadmap</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {plan.map((task, index) => (
            <div 
              key={index}
              onClick={() => toggleTask(index)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                selectedIndices.includes(index)
                  ? 'border-sky-200 bg-sky-50/50 dark:border-sky-900/50 dark:bg-sky-950/20 shadow-sm'
                  : 'border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 flex h-6 w-6 items-center justify-center rounded-lg border transition ${
                  selectedIndices.includes(index)
                    ? 'border-sky-500 bg-sky-500 text-white'
                    : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950'
                }`}>
                  {selectedIndices.includes(index) && <Check size={14} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{task.title}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      task.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' :
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  {task.notes && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{task.notes}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-3">
                    {task.dueDate && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Calendar size={12} /> {task.dueDate}
                      </span>
                    )}
                    {task.estimatedTime && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                        <Clock size={12} /> {task.estimatedTime}m
                      </span>
                    )}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                        <ListChecks size={12} /> {task.subtasks.length} subtasks
                      </span>
                    )}
                  </div>

                  {selectedIndices.includes(index) && task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {task.subtasks.map((st, si) => (
                        <div key={si} className="flex items-center gap-2 rounded-xl bg-white/60 dark:bg-slate-950/40 px-3 py-2 border border-slate-100 dark:border-slate-800">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                          <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{st}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white">{selectedIndices.length}</span> tasks selected
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button onClick={handleConfirm} disabled={selectedIndices.length === 0}>
                Insert Tasks
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
