import React, { useState, useCallback } from 'react';
import { Check, X, Calendar, Clock, ListChecks, Sparkles, Download, Bookmark, Wand2, Loader2, Send, ChevronRight } from 'lucide-react';
import { generateAiQuickPlan } from '../../utils/taskAi';
import { generatePlanPDF } from '../../utils/planPdf';

interface GeneratedTask {
  title: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedTime?: number;
  subtasks?: string[];
}

interface SmartAnalysis {
  specific: boolean;
  measurable: boolean;
  achievable: boolean;
  relevant: boolean;
  timeBound: boolean;
}

interface SavedPlan {
  id: string;
  goal: string;
  tasks: GeneratedTask[];
  smartAnalysis?: SmartAnalysis;
  savedAt: number;
}

interface Props {
  plan: GeneratedTask[];
  goal: string;
  onConfirm: (selectedTasks: GeneratedTask[]) => void;
  onCancel: () => void;
  onPlanUpdated?: (newPlan: GeneratedTask[], newSmart?: SmartAnalysis) => void;
  smartAnalysis?: SmartAnalysis;
}

const SAVED_PLANS_KEY = 'studysphere_saved_plans';

const loadSavedPlans = (): SavedPlan[] => {
  try { return JSON.parse(localStorage.getItem(SAVED_PLANS_KEY) || '[]'); }
  catch { return []; }
};

const savePlanToStorage = (plan: SavedPlan) => {
  const plans = loadSavedPlans();
  plans.unshift(plan);
  localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(plans.slice(0, 20)));
};

const deleteSavedPlan = (id: string) => {
  const plans = loadSavedPlans().filter(p => p.id !== id);
  localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(plans));
};

type TabKey = 'review' | 'saved';

export default function AIPlanPreview({ plan, goal, onConfirm, onCancel, onPlanUpdated, smartAnalysis }: Props) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(plan.map((_, i) => i));
  const [activeTab, setActiveTab] = useState<TabKey>('review');
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(loadSavedPlans);
  const [editPrompt, setEditPrompt] = useState('');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleTask = (index: number) => {
    setSelectedIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleConfirm = () => {
    onConfirm(plan.filter((_, i) => selectedIndices.includes(i)));
  };

  const handleSavePlan = () => {
    const entry: SavedPlan = {
      id: crypto.randomUUID(),
      goal,
      tasks: plan,
      smartAnalysis,
      savedAt: Date.now(),
    };
    savePlanToStorage(entry);
    setSavedPlans(loadSavedPlans());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteSaved = (id: string) => {
    deleteSavedPlan(id);
    setSavedPlans(loadSavedPlans());
  };

  const handleLoadSaved = (sp: SavedPlan) => {
    if (onPlanUpdated) {
      onPlanUpdated(sp.tasks, sp.smartAnalysis);
    }
    setActiveTab('review');
    setSelectedIndices(sp.tasks.map((_, i) => i));
  };

  const handleEditWithAI = async () => {
    if (!editPrompt.trim() || editing) return;
    setEditing(true);
    try {
      const combined = `${goal}. Additional instruction: ${editPrompt}`;
      const result = await generateAiQuickPlan(combined);
      if (onPlanUpdated) {
        onPlanUpdated(result.tasks, result.smartAnalysis);
      }
      setSelectedIndices(result.tasks.map((_: any, i: number) => i));
      setEditPrompt('');
    } catch (err) {
      console.error('Edit failed', err);
    } finally {
      setEditing(false);
    }
  };

  const handleDownloadPDF = () => {
    generatePlanPDF(goal, plan, smartAnalysis);
  };

  const smartCriteria = smartAnalysis ? [
    { label: 'Specific', ok: smartAnalysis.specific },
    { label: 'Measurable', ok: smartAnalysis.measurable },
    { label: 'Achievable', ok: smartAnalysis.achievable },
    { label: 'Relevant', ok: smartAnalysis.relevant },
    { label: 'Time-bound', ok: smartAnalysis.timeBound },
  ] : null;

  const totalTime = plan.reduce((s, t) => s + (t.estimatedTime || 0), 0);
  const totalSubtasks = plan.reduce((s, t) => s + (t.subtasks?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white dark:bg-slate-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md">
            <ListChecks size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Study Plan</h2>
            <p className="text-xs text-slate-500 truncate max-w-[220px] sm:max-w-md">{goal}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="hidden sm:flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900">
            {([['review', 'Plan'], ['saved', 'Saved']] as [TabKey, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition ${activeTab === key ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {label} {key === 'saved' && savedPlans.length > 0 && <span className="ml-1 rounded-full bg-sky-100 px-1.5 text-[10px] text-sky-700 dark:bg-sky-900/50 dark:text-sky-400">{savedPlans.length}</span>}
              </button>
            ))}
          </div>
          <button onClick={onCancel} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 sm:hidden shrink-0">
        {([['review', 'Plan'], ['saved', `Saved (${savedPlans.length})`]] as [TabKey, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 py-2.5 text-xs font-bold transition ${activeTab === key ? 'border-b-2 border-sky-500 text-sky-600 dark:text-sky-400' : 'text-slate-500'}`}
          >{label}</button>
        ))}
      </div>

      {activeTab === 'review' ? (
        <>
          {/* SMART + Stats Bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-2.5 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
            {smartCriteria && (
              <div className="flex items-center gap-1.5 mr-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">SMART:</span>
                {smartCriteria.map(c => (
                  <span key={c.label} className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${c.ok ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'}`}>
                    {c.ok ? <Check size={8} /> : <Sparkles size={8} />} {c.label}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 text-[11px] text-slate-500 ml-auto">
              <span><b className="text-slate-700 dark:text-slate-300">{plan.length}</b> tasks</span>
              <span><b className="text-slate-700 dark:text-slate-300">{totalSubtasks}</b> subtasks</span>
              {totalTime > 0 && <span>~<b className="text-slate-700 dark:text-slate-300">{Math.round(totalTime / 60)}h {totalTime % 60}m</b></span>}
            </div>
          </div>

          {/* Scrollable Task List */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="mx-auto max-w-3xl space-y-4">
              {plan.map((task, index) => (
                <div key={index} onClick={() => toggleTask(index)}
                  className={`group cursor-pointer rounded-2xl border p-4 transition-all ${selectedIndices.includes(index) ? 'border-sky-200 bg-sky-50/40 shadow-sm dark:border-sky-900/40 dark:bg-sky-950/15' : 'border-slate-100 bg-white opacity-50 dark:border-slate-800 dark:bg-slate-900/40'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${selectedIndices.includes(index) ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                      {selectedIndices.includes(index) && <Check size={12} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">{task.title}</h4>
                        <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${task.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' : task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{task.priority}</span>
                      </div>
                      {task.notes && <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">{task.notes}</p>}
                      <div className="mt-2 flex flex-wrap gap-2.5">
                        {task.dueDate && <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"><Calendar size={11} />{task.dueDate}</span>}
                        {task.estimatedTime && <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400"><Clock size={11} />{task.estimatedTime}m</span>}
                        {task.subtasks && task.subtasks.length > 0 && <span className="flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400"><ListChecks size={11} />{task.subtasks.length} subtasks</span>}
                      </div>
                      {selectedIndices.includes(index) && task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {task.subtasks.map((st, si) => (
                            <div key={si} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-100 dark:bg-slate-950/40 dark:border-slate-800">
                              <div className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                              <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate">{st}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit with AI Bar */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50 shrink-0">
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                <Wand2 size={14} />
              </div>
              <input
                value={editPrompt} onChange={e => setEditPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEditWithAI()}
                placeholder="Edit plan: 'Make it more spread out' or 'Add more subtasks'"
                className="flex-1 bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              />
              <button onClick={handleEditWithAI} disabled={!editPrompt.trim() || editing}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-purple-500 px-3 text-[12px] font-bold text-white transition hover:bg-purple-600 disabled:opacity-50"
              >
                {editing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                {editing ? 'Editing...' : 'Edit'}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-950 shrink-0">
            <div className="mx-auto flex max-w-3xl items-center justify-between">
              <p className="text-sm text-slate-500"><b className="text-slate-900 dark:text-white">{selectedIndices.length}</b> selected</p>
              <div className="flex items-center gap-2">
                <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                  <Download size={13} /> PDF
                </button>
                <button onClick={handleSavePlan} className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition ${saved ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                  <Bookmark size={13} /> {saved ? 'Saved!' : 'Save'}
                </button>
                <button onClick={onCancel} className="rounded-xl px-3 py-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                <button onClick={handleConfirm} disabled={selectedIndices.length === 0}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
                >
                  <Check size={13} /> Insert Tasks
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Saved Plans Tab */
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="mx-auto max-w-3xl">
            {savedPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bookmark size={40} className="text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No saved plans yet</h3>
                <p className="text-sm text-slate-500 mt-1">Save a plan to revisit and work on it later.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedPlans.map(sp => (
                  <div key={sp.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{sp.goal}</h4>
                        <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-slate-500">
                          <span>{sp.tasks.length} tasks</span>
                          <span>{new Date(sp.savedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => handleLoadSaved(sp)}
                          className="flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-[11px] font-bold text-sky-600 hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-400"
                        >
                          <ChevronRight size={11} /> Load
                        </button>
                        <button onClick={() => {
                          generatePlanPDF(sp.goal, sp.tasks, sp.smartAnalysis);
                        }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Download size={13} />
                        </button>
                        <button onClick={() => handleDeleteSaved(sp.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sp.tasks.slice(0, 4).map((t, i) => (
                        <span key={i} className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400 truncate max-w-[140px]">{t.title}</span>
                      ))}
                      {sp.tasks.length > 4 && <span className="text-[10px] text-slate-400">+{sp.tasks.length - 4} more</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
