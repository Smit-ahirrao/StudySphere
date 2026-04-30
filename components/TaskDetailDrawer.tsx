import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, BookOpen, Flag, Trash2, Folder, Hash, CheckCircle, Save, Sparkles, Wand2, HelpCircle, Loader2, Zap } from 'lucide-react';
import { Task } from '../types';
import { useData } from '../context/DataContext';
import { breakTaskIntoSubtasks, makeTaskActionable, getUnstuckMode, suggestFocusStructure } from '../utils/taskAi';
import { uuidv4 } from '../utils/taskHelpers';

interface Props {
  task: Task | null;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskDetailDrawer({ task, onClose, onUpdate, onDelete }: Props) {
  const { data, addTask } = useData();
  const [draft, setDraft] = useState<Task | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  useEffect(() => {
    setDraft(task);
  }, [task]);

  if (!task || !draft) return null;

  const handleChange = (updates: Partial<Task>) => {
    const updated = { ...draft, ...updates };
    setDraft(updated);
    onUpdate(updated); // auto-save on change
  };

  const handleAiSubtasks = async () => {
    if (!draft || aiLoading) return;
    setAiLoading('subtasks');
    try {
      const result = await breakTaskIntoSubtasks(draft.title, draft.notes);
      result.subtasks.forEach((st: string) => {
        const subtask = {
          id: uuidv4(),
          title: st,
          completed: false,
          priority: 'medium' as const,
          createdAt: Date.now(),
          children: [],
          aiGenerated: true
        };
        addTask(subtask as any, draft.id);
      });
    } catch (error) {
      alert('AI Subtasks failed');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiActionable = async () => {
    if (!draft || aiLoading) return;
    setAiLoading('actionable');
    try {
      const result = await makeTaskActionable(draft.title);
      handleChange({ title: result.title, notes: (draft.notes || '') + '\n\nAI Tip: ' + result.nextStep });
    } catch (error) {
      alert('AI Actionable failed');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiUnstuck = async () => {
    if (!draft || aiLoading) return;
    setAiLoading('unstuck');
    try {
      const result = await getUnstuckMode(draft.title, draft.notes);
      const unstuckNotes = `\n\n--- AI UNSTUCK MODE ---\nBlocker: ${result.blocker}\nNext Steps:\n${result.nextActions.map((a: string) => `- ${a}`).join('\n')}\nRecommended Start: ${result.easyStart}`;
      handleChange({ notes: (draft.notes || '') + unstuckNotes });
    } catch (error) {
      alert('AI Unstuck failed');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiFocus = async () => {
    if (!draft || aiLoading) return;
    setAiLoading('focus');
    try {
      const result = await suggestFocusStructure(draft.title);
      const focusNotes = `\n\n--- AI FOCUS PLAN ---\nStructure: ${result.structure}\nBlocks:\n${result.blocks.map((b: string) => `- ${b}`).join('\n')}`;
      handleChange({ notes: (draft.notes || '') + focusNotes });
    } catch (error) {
      alert('AI Focus failed');
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity dark:bg-slate-900/60" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-950 sm:w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleChange({ completed: !draft.completed })}
              className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                draft.completed 
                  ? 'border-emerald-500 bg-emerald-500 text-white' 
                  : 'border-slate-300 text-transparent hover:border-sky-400 dark:border-slate-600'
              }`}
            >
              <CheckCircle size={14} />
            </button>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Task Details
            </span>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="space-y-6">
            
            {/* Title */}
            <div>
              <textarea
                value={draft.title}
                onChange={(e) => handleChange({ title: e.target.value })}
                className="w-full resize-none bg-transparent text-xl font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                rows={2}
                placeholder="Task title"
              />
            </div>

            {/* Notes / Description */}
            <div>
              <textarea
                value={draft.notes || ''}
                onChange={(e) => handleChange({ notes: e.target.value })}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-[15px] text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:focus:border-sky-500"
                rows={4}
                placeholder="Add description, links, or context..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Due Date */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Calendar size={14} /> Due Date
                </label>
                <input
                  type="date"
                  value={draft.dueDate || ''}
                  onChange={(e) => handleChange({ dueDate: e.target.value || undefined })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* Time */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Clock size={14} /> Time
                </label>
                <input
                  type="time"
                  value={draft.time || ''}
                  onChange={(e) => handleChange({ time: e.target.value || undefined })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* Project */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Folder size={14} /> Project
                </label>
                <select
                  value={draft.projectId || ''}
                  onChange={(e) => handleChange({ projectId: e.target.value || undefined, sectionId: undefined })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Inbox</option>
                  {data.projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Section */}
              {draft.projectId && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <Hash size={14} /> Section
                  </label>
                  <select
                    value={draft.sectionId || ''}
                    onChange={(e) => handleChange({ sectionId: e.target.value || undefined })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">No Section</option>
                    {data.sections?.filter(s => s.projectId === draft.projectId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Flag size={14} /> Priority
                </label>
                <select
                  value={draft.priority}
                  onChange={(e) => handleChange({ priority: e.target.value as Task['priority'] })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Study State */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <BookOpen size={14} /> Study State
                </label>
                <select
                  value={draft.studyState || ''}
                  onChange={(e) => handleChange({ studyState: e.target.value as Task['studyState'] || undefined })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">None</option>
                  <option value="To Study">To Study</option>
                  <option value="In Revision">In Revision</option>
                  <option value="Ready for Exam">Ready for Exam</option>
                </select>
              </div>
            </div>

            {/* AI Actions */}
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/40">
              <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Sparkles size={14} className="text-sky-500" /> AI Assistant
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={handleAiSubtasks}
                  disabled={!!aiLoading}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-950 dark:text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 size={16} className="text-purple-500" />
                    Break into subtasks
                  </div>
                  {aiLoading === 'subtasks' && <Loader2 size={14} className="animate-spin" />}
                </button>
                <button
                  onClick={handleAiActionable}
                  disabled={!!aiLoading}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-950 dark:text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-sky-500" />
                    Make actionable
                  </div>
                  {aiLoading === 'actionable' && <Loader2 size={14} className="animate-spin" />}
                </button>
                <button
                  onClick={handleAiUnstuck}
                  disabled={!!aiLoading}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-950 dark:text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle size={16} className="text-amber-500" />
                    I'm stuck
                  </div>
                  {aiLoading === 'unstuck' && <Loader2 size={14} className="animate-spin" />}
                </button>
                <button
                  onClick={handleAiFocus}
                  disabled={!!aiLoading}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-950 dark:text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-sky-500" />
                    Focus plan
                  </div>
                  {aiLoading === 'focus' && <Loader2 size={14} className="animate-spin" />}
                </button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-1.5 flex text-xs font-semibold uppercase tracking-wider text-slate-500">
                Subject / Course
              </label>
              <input
                type="text"
                value={draft.subject || ''}
                onChange={(e) => handleChange({ subject: e.target.value || undefined })}
                placeholder="e.g., Data Structures"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if(window.confirm('Delete this task?')) {
                  onDelete(draft.id);
                  onClose();
                }
              }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <Trash2 size={16} /> Delete
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              <Save size={16} /> Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
