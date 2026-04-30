import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { generateAiQuickPlan } from '../../utils/taskAi';
import AIPlanPreview from './AIPlanPreview';
import { useData } from '../../context/DataContext';
import { uuidv4 } from '../../utils/taskHelpers';

export default function AIPlanningBar() {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any[] | null>(null);
  const { addTask } = useData();

  const handleGenerate = async () => {
    if (!goal.trim() || loading) return;
    setLoading(true);
    try {
      const result = await generateAiQuickPlan(goal);
      setGeneratedPlan(result.tasks);
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

      // Add subtasks
      if (taskData.subtasks && taskData.subtasks.length > 0) {
        // We'll add them after inserting the main task
        // But for simplicity in this demo, let's just use the children array
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
    setGoal('');
  };

  return (
    <div className="relative">
      <div className="group relative flex items-center gap-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-1.5 shadow-sm transition-all focus-within:border-sky-300 focus-within:shadow-lg dark:border-slate-800 dark:bg-slate-950/50 dark:focus-within:border-sky-700">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md transition group-focus-within:scale-105">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
        </div>
        
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="What's your goal? e.g., 'Prepare for OS exam in 8 days'"
          className="flex-1 bg-transparent px-2 text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
        />

        <button
          onClick={handleGenerate}
          disabled={!goal.trim() || loading}
          className="flex h-11 items-center gap-2 rounded-[18px] bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400"
        >
          {loading ? 'Generating...' : 'Plan Goal'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </div>

      {generatedPlan && (
        <AIPlanPreview 
          plan={generatedPlan} 
          onConfirm={handleConfirmPlan} 
          onCancel={() => setGeneratedPlan(null)} 
        />
      )}
    </div>
  );
}
