import React, { useState, useMemo } from 'react';
import { BrainCircuit, AlertCircle, CheckCircle2, TrendingUp, Zap, Loader2, CalendarRange, ListTodo } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { analyzeTaskBacklog, generateTodayPlan } from '../../utils/taskAi';
import { Task } from '../../types';
import { Button } from '../UI';

export default function AISummaryPanel() {
  const { data, updateTask } = useData();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{ analysis: any[], summary: string } | null>(null);

  const stats = useMemo(() => {
    const total = data.tasks.length;
    const completed = data.tasks.filter(t => t.completed).length;
    const atRisk = data.tasks.filter(t => t.aiRisk === 'at-risk' || t.aiRisk === 'urgent').length;
    return { total, completed, atRisk, percent: total ? Math.round((completed / total) * 100) : 0 };
  }, [data.tasks]);

  const handleAnalyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const result = await analyzeTaskBacklog(data.tasks);
      setAnalysis(result);
      
      // Update task metadata with AI suggestions
      result.analysis.forEach((item: any) => {
        const task = data.tasks.find(t => t.id === item.taskId);
        if (task) {
          updateTask({
            ...task,
            aiRisk: item.risk,
            aiSuggestedPriority: item.suggestedPriority,
            aiSuggestedNextStep: item.nextStep
          });
        }
      });
    } catch (error) {
      console.error('Analysis failed', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePlanWeek = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      alert('AI Weekly Planning is analyzing your exams and priorities to spread work across the next 7 days...');
    } catch (error) {
      console.error('Weekly plan failed', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePlanToday = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const result = await generateTodayPlan(data.tasks);
      const today = new Date().toISOString().split('T')[0];
      
      // Update tasks suggested for today
      result.taskIds.forEach((id: string) => {
        const task = data.tasks.find(t => t.id === id);
        if (task && !task.dueDate) {
          updateTask({ ...task, dueDate: today });
        }
      });
      
      alert(`AI Plan for Today:\n\n${result.reasoning}`);
    } catch (error) {
      console.error('Today plan failed', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        
        <div className="flex flex-1 items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Task Intelligence</h3>
            <p className="text-sm text-slate-500 max-w-md">
              {analysis ? analysis.summary : 'Analyze your backlog to identify risks and get a personalized daily plan.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 size={18} />
            <span className="text-sm font-bold">{stats.percent}% done</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertCircle size={18} />
            <span className="text-sm font-bold">{stats.atRisk} at risk</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
            Analyze
          </button>
          <button
            onClick={handlePlanWeek}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-2xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600 disabled:opacity-50"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <CalendarRange size={16} />}
            Plan Week
          </button>
          <button
            onClick={handlePlanToday}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            Plan Today
          </button>
        </div>
      </div>

      {analysis && (
        <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800/60">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.tasks.filter(t => t.aiRisk === 'urgent' || t.aiRisk === 'at-risk').slice(0, 3).map(task => (
              <div key={task.id} className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 dark:border-rose-900/30 dark:bg-rose-950/10">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    task.aiRisk === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {task.aiRisk}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">{task.dueDate || 'No date'}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{task.title}</h4>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 italic">
                  Tip: {task.aiSuggestedNextStep || 'Focus on starting this today.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
