import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, Flag, Focus, Plus, Repeat, StickyNote, Trash2 } from 'lucide-react';
import { Task } from '../types';
import { Badge, Button, Input, Textarea } from './UI';

interface Props {
  task: Task;
  onAddSubtask: (parentId: string, title: string) => void;
  onFocusTask: (taskId: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (task: Task) => void;
  level?: number;
}

export default function TaskNode({ task, onAddSubtask, onFocusTask, onToggle, onDelete, onUpdate, level = 0 }: Props) {
  if (!task) return null;
  const safeChildren = Array.isArray(task.children) ? task.children : [];
  const [expanded, setExpanded] = useState(task.isExpanded ?? true);
  const [showInput, setShowInput] = useState(false);
  const [showNotes, setShowNotes] = useState(Boolean(task.notes));
  const [showMeta, setShowMeta] = useState(Boolean(task.dueDate) || (task.recurring && task.recurring !== 'none'));
  const [titleText, setTitleText] = useState(task.title);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState(task.notes || '');

  useEffect(() => {
    setTitleText(task.title);
  }, [task.title]);

  useEffect(() => {
    setExpanded(task.isExpanded ?? true);
  }, [task.isExpanded]);

  useEffect(() => {
    setNoteDraft(task.notes || '');
  }, [task.notes]);

  const progress = useMemo(() => getProgress(task), [task]);
  const percent = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);

  const cyclePriority = () => {
    const next = task.priority === 'low' ? 'medium' : task.priority === 'medium' ? 'high' : 'low';
    onUpdate({ ...task, priority: next });
  };

  const saveTitle = () => {
    const trimmed = titleText.trim();
    if (!trimmed) {
      setTitleText(task.title);
      return;
    }
    if (trimmed !== task.title) {
      onUpdate({ ...task, title: trimmed });
    }
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
  const toggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    onUpdate({ ...task, isExpanded: nextExpanded });
  };
  const hasChildren = safeChildren.length > 0;
  const childCount = safeChildren.length;
  const isTopLevel = level === 0;
  const shellClass = task.completed
    ? 'border-emerald-200/80 bg-emerald-50/75 dark:border-emerald-900/70 dark:bg-emerald-950/20'
    : 'border-slate-200/90 bg-white/88 dark:border-slate-800 dark:bg-slate-950/72';
  const titleClass = task.completed ? 'text-slate-500 line-through dark:text-slate-500' : 'text-slate-950 dark:text-white';

  return (
    <div className="space-y-2.5" style={{ marginLeft: level === 0 ? 0 : 18 }}>
      <div
        className={`rounded-[22px] border px-3.5 py-3 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.55)] transition ${shellClass} ${
          isTopLevel ? '' : 'backdrop-blur-sm'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={hasChildren ? toggleExpanded : undefined}
            className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-2xl border transition ${
              hasChildren
                ? 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 dark:border-sky-900/80 dark:bg-sky-950/45 dark:text-sky-300 dark:hover:bg-sky-950'
                : 'border-transparent bg-transparent text-transparent'
            }`}
            aria-label="Toggle subtasks"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
          />

          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={titleText}
                    onChange={(event) => setTitleText(event.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        saveTitle();
                      }
                    }}
                    className={`min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none ${titleClass}`}
                  />
                  {hasChildren ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      {childCount} subtask{childCount > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge color={priorityColor}>{task.priority}</Badge>
                  <Badge color="cyan">{progress.done}/{progress.total}</Badge>
                  {task.dueDate ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                      <CalendarDays size={11} />
                      {task.dueDate}
                    </span>
                  ) : null}
                  {task.recurring && task.recurring !== 'none' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                      <Repeat size={11} />
                      {task.recurring}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="secondary" className="px-3 py-2 text-[12px]" onClick={cyclePriority}>
                  <Flag size={13} />
                  Priority
                </Button>
                <Button size="sm" variant="secondary" className="px-3 py-2 text-[12px]" onClick={() => setShowNotes((value) => !value)}>
                  <StickyNote size={13} />
                  Notes
                </Button>
                <Button size="sm" variant="secondary" className="px-3 py-2 text-[12px]" onClick={() => setShowMeta((value) => !value)}>
                  <CalendarDays size={13} />
                  Date
                </Button>
                <Button size="sm" variant="secondary" className="px-3 py-2 text-[12px]" onClick={() => setShowInput((value) => !value)}>
                  <Plus size={13} />
                  Subtask
                </Button>
                <Button size="sm" variant="secondary" className="px-3 py-2 text-[12px]" onClick={() => onFocusTask(task.id)}>
                  <Focus size={13} />
                  Focus
                </Button>
                <Button size="sm" variant="ghost" className="px-2.5 py-2 text-[12px] text-rose-600 dark:text-rose-300" onClick={() => onDelete(task.id)}>
                  <Trash2 size={13} />
                  Delete
                </Button>
              </div>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 transition-all" style={{ width: `${percent}%` }} />
            </div>

            {showNotes ? (
              <div className="rounded-[18px] border border-slate-200/80 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                <Textarea
                  rows={3}
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Add context, links, or revision notes for this task..."
                  className="border-none bg-transparent px-0 py-0 shadow-none focus:ring-0"
                />
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => onUpdate({ ...task, notes: noteDraft.trim() || undefined })}>
                    Save note
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setNoteDraft(task.notes || '')}>
                    Reset
                  </Button>
                </div>
              </div>
            ) : null}

            {showMeta ? (
              <div className="grid gap-3 rounded-[18px] border border-slate-200/80 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/70 sm:grid-cols-2">
                <Input
                  type="date"
                  label="Due date"
                  value={task.dueDate || ''}
                  onChange={(event) => onUpdate({ ...task, dueDate: event.target.value || undefined })}
                  className="py-2.5"
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Recurring</label>
                  <select
                    value={task.recurring || 'none'}
                    onChange={(event) => onUpdate({ ...task, recurring: event.target.value as Task['recurring'] })}
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-950"
                  >
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      </div>

      {showInput ? (
        <div className="ml-12 rounded-[20px] border border-dashed border-sky-200 bg-sky-50/60 p-3 dark:border-sky-900/70 dark:bg-sky-950/15">
          <Textarea
            rows={4}
            value={subtaskDraft}
            onChange={(event) => setSubtaskDraft(event.target.value)}
            placeholder="Add subtasks"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setShowInput(false);
            }}
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={addSubtask}>
              Save list
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowInput(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {expanded && hasChildren ? (
        <div className="ml-5 border-l border-slate-200/80 pl-4 dark:border-slate-800">
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
            />
          ))}
        </div>
      ) : null}
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
