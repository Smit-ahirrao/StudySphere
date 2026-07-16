import React, { useState, useMemo, useCallback } from 'react';
import { BrainCircuit, AlertCircle, CheckCircle2, TrendingUp, Zap, Loader2, CalendarRange, X, Sparkles, ChevronRight, Clock, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { analyzeTaskBacklog, generateTodayPlan, generateAiWeeklyPlan } from '../../utils/taskAi';
import { Task } from '../../types';
import { flattenTasks } from '../../utils/taskHelpers';

// Simple hash for cache invalidation
const getTaskFingerprint = (tasks: Task[]): string => {
  const flat = flattenTasks(tasks);
  return flat.map(t => `${t.id}:${t.completed}:${t.priority}:${t.dueDate || ''}`).join('|');
};

interface PendingChange {
  type: 'today' | 'week';
  updates: Record<string, Partial<Task>>;
  reasoning: string;
  weeklyDays?: any[];
}

export default function AISummaryPanel() {
  const { data, bulkUpdateTasks } = useData();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{ analysis: any[], summary: string } | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<{ days: any[], recommendation: string } | null>(null);
  const [todayReasoning, setTodayReasoning] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [cachedFingerprint, setCachedFingerprint] = useState<string | null>(null);

  const allTasks = useMemo(() => flattenTasks(data.tasks), [data.tasks]);

  const stats = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const atRisk = allTasks.filter(t => t.aiRisk === 'at-risk' || t.aiRisk === 'urgent').length;
    return { total, completed, atRisk, percent: total ? Math.round((completed / total) * 100) : 0 };
  }, [allTasks]);

  const handleAnalyze = useCallback(async () => {
    if (analyzing) return;

    // Cache check
    const fp = getTaskFingerprint(data.tasks);
    if (fp === cachedFingerprint && analysis) return;

    setAnalyzing(true);
    try {
      const result = await analyzeTaskBacklog(data.tasks);
      setAnalysis(result);
      setCachedFingerprint(fp);

      const updates: Record<string, Partial<Task>> = {};
      result.analysis.forEach((item: any) => {
        updates[item.taskId] = {
          aiRisk: item.risk,
          aiSuggestedPriority: item.suggestedPriority,
          aiSuggestedNextStep: item.nextStep
        };
      });
      bulkUpdateTasks(updates);
    } catch (error) {
      console.error('Analysis failed', error);
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, data.tasks, cachedFingerprint, analysis, bulkUpdateTasks]);

  const handlePlanWeek = useCallback(async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const result = await generateAiWeeklyPlan(data.tasks);

      const updates: Record<string, Partial<Task>> = {};
      result.days.forEach((day: any) => {
        day.taskIds.forEach((id: string) => {
          updates[id] = { dueDate: day.date };
        });
      });

      // Show confirmation instead of applying immediately
      setPendingChange({
        type: 'week',
        updates,
        reasoning: result.recommendation,
        weeklyDays: result.days,
      });
    } catch (error) {
      console.error('Weekly plan failed', error);
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, data.tasks]);

  const handlePlanToday = useCallback(async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const result = await generateTodayPlan(data.tasks);
      const today = new Date().toISOString().split('T')[0];

      const updates: Record<string, Partial<Task>> = {};
      result.taskIds.forEach((id: string) => {
        updates[id] = { dueDate: today };
      });

      // Show confirmation instead of applying immediately
      setPendingChange({
        type: 'today',
        updates,
        reasoning: result.reasoning,
      });
    } catch (error) {
      console.error('Today plan failed', error);
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, data.tasks]);

  const confirmPendingChange = () => {
    if (!pendingChange) return;
    bulkUpdateTasks(pendingChange.updates);
    if (pendingChange.type === 'today') {
      setTodayReasoning(pendingChange.reasoning);
    }
    if (pendingChange.type === 'week' && pendingChange.weeklyDays) {
      setWeeklyPlan({ days: pendingChange.weeklyDays, recommendation: pendingChange.reasoning });
    }
    setPendingChange(null);
  };

  return (
    <div className="space-y-4">
      {/* Main Intelligence Card */}
      <div className={`rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-950/40 ${analyzing ? 'ai-pulse-glow' : ''}`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          {/* Title area */}
          <div className="flex flex-1 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <BrainCircuit size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Task Intelligence</h3>
              <p className="text-[13px] text-slate-500 line-clamp-2 max-w-sm">
                {analysis ? analysis.summary : 'Analyze your backlog to identify risks and get a personalized plan.'}
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 size={15} />
              <span className="text-xs font-bold">{stats.percent}% done</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle size={15} />
              <span className="text-xs font-bold">{stats.atRisk} at risk</span>
            </div>
          </div>

          {/* Action buttons – wraps on small screens */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-[13px] font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {analyzing ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
              Analyze
            </button>
            <button
              onClick={handlePlanWeek}
              disabled={analyzing}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-indigo-600 disabled:opacity-50"
            >
              {analyzing ? <Loader2 size={14} className="animate-spin" /> : <CalendarRange size={14} />}
              Plan Week
            </button>
            <button
              onClick={handlePlanToday}
              disabled={analyzing}
              className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
            >
              {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              Plan Today
            </button>
          </div>
        </div>

        {/* Shimmer Loading Skeleton */}
        {analyzing && (
          <div className="mt-5 space-y-3">
            <div className="ai-shimmer h-5 w-3/4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="ai-shimmer h-24" />
              <div className="ai-shimmer h-24" />
              <div className="ai-shimmer h-24" />
            </div>
          </div>
        )}

        {/* Risk Cards (after analysis) */}
        {!analyzing && analysis && (
          <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allTasks.filter(t => t.aiRisk === 'urgent' || t.aiRisk === 'at-risk').slice(0, 3).map(task => (
                <div key={task.id} className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 dark:border-rose-900/30 dark:bg-rose-950/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      task.aiRisk === 'urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                    }`}>
                      {task.aiRisk}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">{task.dueDate || 'No date'}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{task.title}</h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2">
                    Tip: {task.aiSuggestedNextStep || 'Focus on starting this today.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inline Today Reasoning Card */}
      {todayReasoning && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 dark:border-sky-900/30 dark:bg-sky-950/15 animate-fade-scale-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
                <Zap size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Plan for Today</h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{todayReasoning}</p>
              </div>
            </div>
            <button onClick={() => setTodayReasoning(null)} className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Preview Modal */}
      {pendingChange && (
        <div className="rounded-[28px] border-2 border-sky-200 bg-white p-5 shadow-lg dark:border-sky-800/50 dark:bg-slate-900 animate-fade-scale-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-sky-500" />
              <h4 className="font-bold text-slate-900 dark:text-white">
                {pendingChange.type === 'today' ? 'Today\'s Plan' : 'Weekly Schedule'} – Review Changes
              </h4>
            </div>
            <button onClick={() => setPendingChange(null)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-4 italic">{pendingChange.reasoning}</p>

          {/* Show affected tasks */}
          <div className="max-h-48 overflow-y-auto space-y-2 mb-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/30">
            {Object.entries(pendingChange.updates).map(([taskId, fields]) => {
              const task = allTasks.find(t => t.id === taskId);
              if (!task) return null;
              return (
                <div key={taskId} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm dark:bg-slate-900">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.dueDate && (
                      <span className="text-[10px] text-slate-400 line-through">{task.dueDate}</span>
                    )}
                    <ChevronRight size={10} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">{fields.dueDate}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setPendingChange(null)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button onClick={confirmPendingChange} className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-5 py-2 text-sm font-bold text-white hover:bg-sky-600">
              <Check size={14} /> Apply {Object.keys(pendingChange.updates).length} Changes
            </button>
          </div>
        </div>
      )}

      {/* Weekly Plan Visualization */}
      {weeklyPlan && (
        <div className="rounded-[28px] border border-sky-100 bg-sky-50/30 p-5 dark:border-sky-900/20 dark:bg-sky-950/10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400">
                <Sparkles size={16} />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">AI Weekly Schedule</h4>
            </div>
            <button onClick={() => setWeeklyPlan(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={16} />
            </button>
          </div>

          {/* Responsive grid: 2 cols mobile, 4 tablet, 7 desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {weeklyPlan.days.map((day, i) => (
              <div key={i} className="flex flex-col rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{day.date}</span>
                <span className="mt-1 text-xs font-bold text-sky-600 dark:text-sky-400 line-clamp-1">{day.focusTopic}</span>
                <div className="mt-3 flex-1 space-y-1.5">
                  {day.taskIds.slice(0, 3).map((tid: string) => {
                    const t = allTasks.find(task => task.id === tid);
                    return t ? (
                      <div key={tid} className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.priority === 'high' ? 'bg-rose-400' : t.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate">{t.title}</span>
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock size={9} />
                  <span>{day.taskIds.length} tasks</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500 italic">{weeklyPlan.recommendation}</p>
        </div>
      )}
    </div>
  );
}
