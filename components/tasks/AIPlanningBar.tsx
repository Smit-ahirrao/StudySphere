import React, { useState, useMemo } from 'react';
import { Sparkles, Loader2, ArrowRight, Check, AlertTriangle, Bookmark, ChevronRight, Download, X, Trash2, Calendar, Clock, ListChecks } from 'lucide-react';
import { generateAiQuickPlan } from '../../utils/taskAi';
import AIPlanPreview from './AIPlanPreview';
import { generatePlanPDF } from '../../utils/planPdf';
import { useData } from '../../context/DataContext';
import { uuidv4 } from '../../utils/taskHelpers';

const SAVED_PLANS_KEY = 'studysphere_saved_plans';

const loadSavedPlans = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_PLANS_KEY) || '[]'); }
  catch { return []; }
};

const deleteSavedPlan = (id: string) => {
  const plans = loadSavedPlans().filter((p: any) => p.id !== id);
  localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(plans));
};

// Lightweight client-side SMART hint analysis
const analyzeSmartHints = (goal: string) => {
  const lower = goal.toLowerCase().trim();
  if (!lower) return null;

  const specific = /\b(learn|build|complete|finish|prepare|study|write|create|read|solve|practice|review|implement|master)\b/i.test(goal);
  const measurable = /\b(\d+|all|every|each|quiz|exam|test|chapters?|modules?|problems?|questions?|pages?|projects?)\b/i.test(goal);
  const timeBound = /\b(\d+\s*(days?|weeks?|hours?|months?))|by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight|end of)/i.test(goal);
  const relevant = goal.trim().length > 10;
  const achievable = goal.trim().split(/\s+/).length >= 3;

  return { specific, measurable, achievable, relevant, timeBound };
};

export default function AIPlanningBar() {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any[] | null>(null);
  const [smartAnalysis, setSmartAnalysis] = useState<any>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [savedPlans, setSavedPlans] = useState<any[]>(loadSavedPlans);
  const { addTask } = useData();

  const smartHints = useMemo(() => analyzeSmartHints(goal), [goal]);
  const smartCount = smartHints ? Object.values(smartHints).filter(Boolean).length : 0;

  const refreshSaved = () => setSavedPlans(loadSavedPlans());

  const handleGenerate = async () => {
    if (!goal.trim() || loading) return;
    setLoading(true);
    try {
      const result = await generateAiQuickPlan(goal);
      setGeneratedPlan(result.tasks);
      setSmartAnalysis(result.smartAnalysis || smartHints);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'AI Planning failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPlan = (selectedTasks: any[]) => {
    selectedTasks.forEach(taskData => {
      const taskId = uuidv4();
      const mainTask = {
        id: taskId,
        title: taskData.title,
        notes: taskData.notes,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        estimatedTime: taskData.estimatedTime,
        completed: false,
        createdAt: Date.now(),
        children: [],
        aiGenerated: true
      };

      if (taskData.subtasks && taskData.subtasks.length > 0) {
        (mainTask as any).children = taskData.subtasks.map((stTitle: string) => ({
          id: uuidv4(),
          title: stTitle,
          completed: false,
          priority: 'medium',
          createdAt: Date.now(),
          children: [],
          aiGenerated: true
        }));
      }

      addTask(mainTask as any);
    });
    setGeneratedPlan(null);
    setSmartAnalysis(null);
    setGoal('');
  };

  const handleDeleteSaved = (id: string) => {
    deleteSavedPlan(id);
    refreshSaved();
  };

  const handleLoadSaved = (sp: any) => {
    setGoal(sp.goal);
    setGeneratedPlan(sp.tasks);
    setSmartAnalysis(sp.smartAnalysis || null);
    setShowSaved(false);
  };

  return (
    <div className="relative space-y-2">
      {/* Main input bar */}
      <div className="flex gap-2">
        <div className={`group relative flex flex-1 items-center gap-3 overflow-hidden rounded-[24px] border p-1.5 shadow-sm transition-all focus-within:shadow-lg ${
          loading
            ? 'border-sky-300 ai-pulse-glow dark:border-sky-700'
            : 'border-slate-200 bg-white focus-within:border-sky-300 dark:border-slate-800 dark:bg-slate-950/50 dark:focus-within:border-sky-700'
        }`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md transition group-focus-within:scale-105">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          </div>

          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="What's your goal? e.g., 'Prepare for OS exam in 8 days'"
            className="flex-1 bg-transparent px-2 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          />

          <button
            onClick={handleGenerate}
            disabled={!goal.trim() || loading}
            className="flex h-10 items-center gap-2 rounded-[16px] bg-slate-900 px-5 text-[13px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            {loading ? 'Planning...' : 'Plan Goal'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </div>

        {/* Saved Plans toggle button */}
        <button
          onClick={() => { refreshSaved(); setShowSaved(!showSaved); }}
          className={`flex h-[52px] items-center gap-1.5 rounded-2xl border px-3.5 text-[12px] font-bold transition ${
            showSaved
              ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <Bookmark size={14} />
          <span className="hidden sm:inline">Saved</span>
          {savedPlans.length > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white">
              {savedPlans.length}
            </span>
          )}
        </button>
      </div>

      {/* SMART Hints (shown while typing) */}
      {smartHints && goal.trim().length > 5 && (
        <div className="flex flex-wrap items-center gap-1.5 px-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">SMART:</span>
          {[
            { label: 'Specific', ok: smartHints.specific },
            { label: 'Measurable', ok: smartHints.measurable },
            { label: 'Achievable', ok: smartHints.achievable },
            { label: 'Relevant', ok: smartHints.relevant },
            { label: 'Time-bound', ok: smartHints.timeBound },
          ].map(c => (
            <span
              key={c.label}
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold transition-all ${
                c.ok
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              }`}
            >
              {c.ok ? <Check size={8} /> : <AlertTriangle size={8} />}
              {c.label}
            </span>
          ))}
          {smartCount < 3 && (
            <span className="text-[9px] text-amber-600 dark:text-amber-400 ml-1">
              Tip: Add a timeframe and specific target for better results
            </span>
          )}
        </div>
      )}

      {/* Shimmer while loading */}
      {loading && (
        <div className="space-y-2 pt-1">
          <div className="ai-shimmer h-4 w-2/3" />
          <div className="ai-shimmer h-4 w-1/2" />
        </div>
      )}

      {/* ========== Saved Plans Panel ========== */}
      {showSaved && (
        <div className="rounded-[24px] border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950 animate-fade-scale-in overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Bookmark size={16} className="text-sky-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Saved Plans</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {savedPlans.length}
              </span>
            </div>
            <button onClick={() => setShowSaved(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={16} />
            </button>
          </div>

          {/* Panel body */}
          <div className="max-h-[400px] overflow-y-auto">
            {savedPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Bookmark size={32} className="text-slate-300 dark:text-slate-700 mb-3" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">No saved plans</h4>
                <p className="text-xs text-slate-500 mt-1">Generate a plan and click "Save" to keep it here for later.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {savedPlans.map((sp: any) => {
                  const totalTime = sp.tasks.reduce((s: number, t: any) => s + (t.estimatedTime || 0), 0);
                  const totalSubs = sp.tasks.reduce((s: number, t: any) => s + (t.subtasks?.length || 0), 0);
                  return (
                    <div key={sp.id} className="group px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <div className="flex items-start gap-3">
                        {/* Plan info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14px] font-bold text-slate-900 dark:text-white truncate">{sp.goal}</h4>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <ListChecks size={11} /> {sp.tasks.length} tasks
                            </span>
                            {totalSubs > 0 && (
                              <span className="flex items-center gap-1">
                                <ChevronRight size={10} /> {totalSubs} subtasks
                              </span>
                            )}
                            {totalTime > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock size={11} /> {Math.ceil(totalTime / 60)}h {totalTime % 60}m
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {new Date(sp.savedAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Task preview chips */}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {sp.tasks.slice(0, 3).map((t: any, i: number) => (
                              <span key={i} className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold truncate max-w-[160px] ${
                                t.priority === 'high' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' :
                                t.priority === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
                                'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {t.title}
                              </span>
                            ))}
                            {sp.tasks.length > 3 && (
                              <span className="text-[10px] text-slate-400 self-center">+{sp.tasks.length - 3} more</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-1 pt-0.5">
                          <button
                            onClick={() => handleLoadSaved(sp)}
                            className="flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-[11px] font-bold text-sky-600 transition hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:hover:bg-sky-900/40"
                          >
                            <ChevronRight size={11} /> Open
                          </button>
                          <button
                            onClick={() => generatePlanPDF(sp.goal, sp.tasks, sp.smartAnalysis)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSaved(sp.id)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                            title="Delete plan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {generatedPlan && (
        <AIPlanPreview
          plan={generatedPlan}
          goal={goal}
          onConfirm={handleConfirmPlan}
          onCancel={() => { setGeneratedPlan(null); setSmartAnalysis(null); }}
          onPlanUpdated={(newPlan, newSmart) => {
            setGeneratedPlan(newPlan);
            if (newSmart) setSmartAnalysis(newSmart);
          }}
          smartAnalysis={smartAnalysis}
        />
      )}
    </div>
  );
}
