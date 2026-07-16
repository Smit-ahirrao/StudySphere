import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, BookOpen, Flag, Trash2, Folder, Hash, CheckCircle, Save, Sparkles, Wand2, HelpCircle, Loader2, Zap, Check } from 'lucide-react';
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

interface AiResult {
  type: 'unstuck' | 'focus';
  data: any;
}

interface SubtaskPreview {
  subtasks: string[];
  selected: boolean[];
}

export default function TaskDetailDrawer({ task, onClose, onUpdate, onDelete }: Props) {
  const { data, addTask } = useData();
  const [draft, setDraft] = useState<Task | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [subtaskPreview, setSubtaskPreview] = useState<SubtaskPreview | null>(null);

  useEffect(() => {
    setDraft(task);
    setAiResult(null);
    setSubtaskPreview(null);
  }, [task]);

  if (!task || !draft) return null;

  const handleChange = (updates: Partial<Task>) => {
    const updated = { ...draft, ...updates };
    setDraft(updated);
    onUpdate(updated);
  };

  const handleAiSubtasks = async () => {
    if (!draft || aiLoading) return;
    setAiLoading('subtasks');
    try {
      const result = await breakTaskIntoSubtasks(draft.title, draft.notes);
      // Show preview instead of inserting immediately
      setSubtaskPreview({
        subtasks: result.subtasks,
        selected: result.subtasks.map(() => true),
      });
    } catch (error) {
      console.error('AI Subtasks failed', error);
    } finally {
      setAiLoading(null);
    }
  };

  const confirmSubtasks = () => {
    if (!subtaskPreview || !draft) return;
    subtaskPreview.subtasks.forEach((st, i) => {
      if (subtaskPreview.selected[i]) {
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
      }
    });
    setSubtaskPreview(null);
  };

  const toggleSubtaskSelection = (index: number) => {
    if (!subtaskPreview) return;
    const newSelected = [...subtaskPreview.selected];
    newSelected[index] = !newSelected[index];
    setSubtaskPreview({ ...subtaskPreview, selected: newSelected });
  };

  const handleAiActionable = async () => {
    if (!draft || aiLoading) return;
    setAiLoading('actionable');
    try {
      const result = await makeTaskActionable(draft.title);
      handleChange({ title: result.title, notes: (draft.notes || '') + '\n\nAI Tip: ' + result.nextStep });
    } catch (error) {
      console.error('AI Actionable failed', error);
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiUnstuck = async () => {
    if (!draft || aiLoading) return;
    setAiLoading('unstuck');
    try {
      const result = await getUnstuckMode(draft.title, draft.notes);
      setAiResult({ type: 'unstuck', data: result });
    } catch (error) {
      console.error('AI Unstuck failed', error);
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiFocus = async () => {
    if (!draft || aiLoading) return;
    setAiLoading('focus');
    try {
      const result = await suggestFocusStructure(draft.title);
      setAiResult({ type: 'focus', data: result });
    } catch (error) {
      console.error('AI Focus failed', error);
    } finally {
      setAiLoading(null);
    }
  };

  const copyAiResultToNotes = () => {
    if (!aiResult || !draft) return;
    let text = '';
    if (aiResult.type === 'unstuck') {
      text = `\n\n--- AI Coaching ---\nBlocker: ${aiResult.data.blocker}\nNext Steps:\n${aiResult.data.nextActions.map((a: string) => `• ${a}`).join('\n')}\nEasy Start: ${aiResult.data.easyStart}`;
    } else if (aiResult.type === 'focus') {
      text = `\n\n--- Focus Plan ---\n${aiResult.data.structure}\nBlocks:\n${aiResult.data.blocks.map((b: string) => `• ${b}`).join('\n')}`;
    }
    handleChange({ notes: (draft.notes || '') + text });
    setAiResult(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[130] flex w-full max-w-md flex-col bg-white shadow-[-20px_0_80px_-20px_rgba(15,23,42,0.25)] dark:bg-slate-950 sm:w-[440px] animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800 shrink-0">
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

            {/* Notes */}
            <div>
              <textarea
                value={draft.notes || ''}
                onChange={(e) => handleChange({ notes: e.target.value })}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-[15px] text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:focus:border-sky-500"
                rows={4}
                placeholder="Add description, links, or context..."
              />
            </div>

            {/* Fields Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Calendar size={14} /> Due Date
                </label>
                <input type="date" value={draft.dueDate || ''} onChange={(e) => handleChange({ dueDate: e.target.value || undefined })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Clock size={14} /> Time
                </label>
                <input type="time" value={draft.time || ''} onChange={(e) => handleChange({ time: e.target.value || undefined })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Folder size={14} /> Project
                </label>
                <select value={draft.projectId || ''} onChange={(e) => handleChange({ projectId: e.target.value || undefined, sectionId: undefined })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                  <option value="">Inbox</option>
                  {data.projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {draft.projectId && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <Hash size={14} /> Section
                  </label>
                  <select value={draft.sectionId || ''} onChange={(e) => handleChange({ sectionId: e.target.value || undefined })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                    <option value="">No Section</option>
                    {data.sections?.filter(s => s.projectId === draft.projectId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Flag size={14} /> Priority
                </label>
                <select value={draft.priority} onChange={(e) => handleChange({ priority: e.target.value as Task['priority'] })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <BookOpen size={14} /> Study State
                </label>
                <select value={draft.studyState || ''} onChange={(e) => handleChange({ studyState: e.target.value as Task['studyState'] || undefined })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                  <option value="">None</option>
                  <option value="To Study">To Study</option>
                  <option value="In Revision">In Revision</option>
                  <option value="Ready for Exam">Ready for Exam</option>
                </select>
              </div>
            </div>

            {/* AI Intelligence Section */}
            <div className="relative overflow-hidden rounded-[20px] border border-sky-100 bg-gradient-to-br from-white to-sky-50/30 p-4 shadow-sm dark:border-sky-900/30 dark:from-slate-900 dark:to-sky-950/20">
              <div className="relative z-10">
                <label className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                  <Sparkles size={12} className={aiLoading ? 'animate-spin' : 'animate-pulse'} /> Task Intelligence
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'subtasks', label: 'Subtasks', sub: 'Break it down', icon: Wand2, color: 'purple', handler: handleAiSubtasks },
                    { key: 'actionable', label: 'Refine', sub: 'Make actionable', icon: Sparkles, color: 'sky', handler: handleAiActionable },
                    { key: 'unstuck', label: 'Unstuck', sub: 'Quick rescue', icon: HelpCircle, color: 'amber', handler: handleAiUnstuck },
                    { key: 'focus', label: 'Focus', sub: 'Session plan', icon: Zap, color: 'indigo', handler: handleAiFocus },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={item.handler}
                      disabled={!!aiLoading}
                      className="group flex flex-col items-start gap-1.5 rounded-xl border border-slate-100 bg-white p-2.5 text-left transition-all hover:border-sky-200 hover:shadow-md disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-sky-800"
                    >
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-${item.color}-50 text-${item.color}-600 dark:bg-${item.color}-900/20 dark:text-${item.color}-400`}>
                        {aiLoading === item.key ? <Loader2 size={14} className="animate-spin" /> : <item.icon size={14} />}
                      </div>
                      <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
                      <span className="text-[9px] text-slate-400 -mt-1">{item.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-sky-200/20 blur-2xl dark:bg-sky-500/10" />
            </div>

            {/* Subtask Preview */}
            {subtaskPreview && (
              <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/30 p-4 dark:border-purple-800/40 dark:bg-purple-950/15 animate-fade-scale-in">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Wand2 size={14} className="text-purple-500" /> AI Suggested Subtasks
                </h4>
                <div className="space-y-2 mb-4">
                  {subtaskPreview.subtasks.map((st, i) => (
                    <label key={i} className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2 transition hover:bg-white dark:hover:bg-slate-900/50">
                      <input
                        type="checkbox"
                        checked={subtaskPreview.selected[i]}
                        onChange={() => toggleSubtaskSelection(i)}
                        className="h-4 w-4 rounded border-slate-300 text-purple-500 focus:ring-purple-400"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{st}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={confirmSubtasks} className="flex items-center gap-1.5 rounded-xl bg-purple-500 px-4 py-2 text-xs font-bold text-white hover:bg-purple-600">
                    <Check size={12} /> Add {subtaskPreview.selected.filter(Boolean).length} Subtasks
                  </button>
                  <button onClick={() => setSubtaskPreview(null)} className="rounded-xl px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Structured AI Result Card */}
            {aiResult && (
              <div className={`rounded-2xl border p-4 animate-fade-scale-in ${
                aiResult.type === 'unstuck'
                  ? 'border-amber-200 bg-amber-50/30 dark:border-amber-800/40 dark:bg-amber-950/15'
                  : 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-800/40 dark:bg-indigo-950/15'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {aiResult.type === 'unstuck' ? <HelpCircle size={14} className="text-amber-500" /> : <Zap size={14} className="text-indigo-500" />}
                    {aiResult.type === 'unstuck' ? 'AI Coaching' : 'Focus Session Plan'}
                  </h4>
                  <button onClick={() => setAiResult(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                </div>

                {aiResult.type === 'unstuck' && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Likely Blocker</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{aiResult.data.blocker}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">5-Minute Actions</span>
                      <ul className="mt-1 space-y-1">
                        {aiResult.data.nextActions.map((a: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Easiest Start</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5 font-medium">{aiResult.data.easyStart}</p>
                    </div>
                  </div>
                )}

                {aiResult.type === 'focus' && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Structure</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{aiResult.data.structure}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Session Blocks</span>
                      <ul className="mt-1 space-y-1">
                        {aiResult.data.blocks.map((b: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <button
                  onClick={copyAiResultToNotes}
                  className="mt-4 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <Save size={11} /> Copy to Notes
                </button>
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="mb-1.5 flex text-xs font-semibold uppercase tracking-wider text-slate-500">Subject / Course</label>
              <input type="text" value={draft.subject || ''} onChange={(e) => handleChange({ subject: e.target.value || undefined })} placeholder="e.g., Data Structures"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { if(window.confirm('Delete this task?')) { onDelete(draft.id); onClose(); } }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <Trash2 size={16} /> Delete
            </button>
            <button onClick={onClose} className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400">
              <Save size={16} /> Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
