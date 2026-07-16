import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, Focus, Plus, Trash2, Folder, BookOpen, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Task } from '../types';
import { Badge, Button, Textarea } from './UI';
import { triggerConfetti } from '../utils/confetti';
import { useData } from '../context/DataContext';

interface Props {
  task: Task;
  onAddSubtask: (parentId: string, title: string) => void;
  onFocusTask: (taskId: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (task: Task) => void;
  onSelect?: (task: Task) => void;
  level?: number;
}

export default function TaskNode({ task, onAddSubtask, onFocusTask, onToggle, onDelete, onUpdate, onSelect, level = 0 }: Props) {
  const { data } = useData();
  const [expanded, setExpanded] = useState(task.isExpanded ?? false);
  const [showInput, setShowInput] = useState(false);
  const [titleText, setTitleText] = useState(task.title);
  const [subtaskDraft, setSubtaskDraft] = useState('');

  if (!task) return null;
  const safeChildren = Array.isArray(task.children) ? task.children : [];

  useEffect(() => setTitleText(task.title), [task.title]);
  useEffect(() => setExpanded(task.isExpanded ?? false), [task.isExpanded]);

  const progress = useMemo(() => getProgress(task), [task]);
  const percent = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);

  const saveTitle = () => {
    const trimmed = titleText.trim();
    if (!trimmed) {
      setTitleText(task.title);
      return;
    }
    if (trimmed !== task.title) onUpdate({ ...task, title: trimmed });
  };

  const addSubtask = () => {
    const trimmed = subtaskDraft.trim();
    if (!trimmed) return;
    onAddSubtask(task.id, trimmed);
    setSubtaskDraft('');
    setShowInput(false);
    setExpanded(true);
  };

  const priorityColor = task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'gray';
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    onUpdate({ ...task, isExpanded: nextExpanded });
  };

  const hasChildren = safeChildren.length > 0;
  const isTopLevel = level === 0;
  const shellClass = task.completed
    ? 'border-emerald-200/80 bg-emerald-50/75 dark:border-emerald-900/70 dark:bg-emerald-950/20'
    : 'border-slate-200/90 bg-white/88 dark:border-slate-800 dark:bg-slate-950/72 hover:border-sky-300 dark:hover:border-sky-800';
  const titleClass = task.completed ? 'text-slate-500 line-through dark:text-slate-500' : 'text-slate-950 dark:text-white';

  const project = task.projectId ? data.projects?.find(p => p.id === task.projectId) : null;
  const section = task.sectionId ? data.sections?.find(s => s.id === task.sectionId) : null;

  return (
    <div className="space-y-2.5" style={{ marginLeft: level === 0 ? 0 : 18 }}>
      <div
        className={`group relative cursor-pointer rounded-[20px] border px-3.5 py-3 shadow-[0_4px_20px_-10px_rgba(15,23,42,0.1)] transition-all priority-strip-${task.priority} ${shellClass} ${isTopLevel ? '' : 'backdrop-blur-sm'}`}
        onClick={() => onSelect?.(task)}
      >
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={hasChildren ? toggleExpanded : undefined}
            className={`mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border transition ${
              hasChildren
                ? 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 dark:border-sky-900/80 dark:bg-sky-950/45 dark:text-sky-300 dark:hover:bg-sky-950'
                : 'border-transparent bg-transparent text-transparent'
            }`}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          <input
            type="checkbox"
            checked={task.completed}
            onClick={(e) => e.stopPropagation()}
            onChange={() => {
              if (isTopLevel && !task.completed) triggerConfetti('task');
              onToggle(task.id);
            }}
            className="mt-1 h-4.5 w-4.5 flex-shrink-0 cursor-pointer rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
          />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <input
                  value={titleText}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(event) => setTitleText(event.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(event) => event.key === 'Enter' && saveTitle()}
                  className={`w-full bg-transparent text-[15px] font-semibold outline-none ${titleClass}`}
                />

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge color={priorityColor}>{task.priority}</Badge>
                  {task.aiRisk && (
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      task.aiRisk === 'urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                      task.aiRisk === 'at-risk' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                      task.aiRisk === 'can-defer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    }`}>
                      {task.aiRisk === 'urgent' ? <AlertCircle size={10} /> : <TrendingUp size={10} />}
                      {task.aiRisk}
                    </span>
                  )}
                  {hasChildren && <Badge color="cyan">{progress.done}/{progress.total}</Badge>}
                  {project && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <Folder size={10} /> {project.name} {section ? `/ ${section.name}` : ''}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <CalendarDays size={11} /> {task.dueDate}
                    </span>
                  )}
                  {task.time && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                      <Clock size={11} /> {task.time}
                    </span>
                  )}
                  {task.studyState && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                      <BookOpen size={11} /> {task.studyState}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions appearing on hover */}
              <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="sm" variant="secondary" className="mr-1 h-8 px-2 text-[11px]" onClick={(e) => { e.stopPropagation(); setShowInput(!showInput); }}>
                  <Plus size={12} /> <span className="hidden sm:inline">Add subtask</span>
                </Button>
                <button
                  onClick={(e) => { e.stopPropagation(); onFocusTask(task.id); }}
                  className="mr-1 flex h-8 items-center rounded-lg bg-slate-100 px-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  title="Focus on this task"
                >
                  <Focus size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                  className="flex h-8 items-center rounded-lg bg-rose-50 px-2 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50"
                  title="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {hasChildren && (
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/60">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 transition-all" style={{ width: `${percent}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {showInput && (
        <div className="ml-10 rounded-[16px] border border-dashed border-sky-200 bg-sky-50/60 p-2.5 dark:border-sky-900/70 dark:bg-sky-950/15">
          <Textarea
            rows={2}
            value={subtaskDraft}
            onChange={(e) => setSubtaskDraft(e.target.value)}
            placeholder="Subtask title..."
            onKeyDown={(e) => e.key === 'Escape' && setShowInput(false)}
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={addSubtask}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowInput(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {expanded && hasChildren && (
        <div className="ml-4 border-l-2 border-slate-100 pl-3 dark:border-slate-800/60">
          {safeChildren.map((child) => (
            <TaskNode
              key={child.id}
              task={child}
              level={level + 1}
              onAddSubtask={onAddSubtask}
              onFocusTask={onFocusTask}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const getProgress = (task: Task): { total: number; done: number } => {
  let total = 1;
  let done = task.completed ? 1 : 0;
  const safeChildren = Array.isArray(task.children) ? task.children : [];
  for (const child of safeChildren) {
    const childProgress = getProgress(child);
    total += childProgress.total;
    done += childProgress.done;
  }
  return { total, done };
};
