import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, Flag, Plus, Repeat, StickyNote, Trash2 } from 'lucide-react';
import { Task } from '../types';
import { Badge, Button, Input, Textarea } from './UI';

interface Props {
  task: Task;
  onAddSubtask: (parentId: string, title: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (task: Task) => void;
  level?: number;
}

export default function TaskNode({ task, onAddSubtask, onToggle, onDelete, onUpdate, level = 0 }: Props) {
  const safeChildren = Array.isArray(task.children) ? task.children : [];
  const [expanded, setExpanded] = useState(task.isExpanded ?? true);
  const [showInput, setShowInput] = useState(false);
  const [showNotes, setShowNotes] = useState(Boolean(task.notes));
  const [showMeta, setShowMeta] = useState(Boolean(task.dueDate) || (task.recurring && task.recurring !== 'none'));
  const [titleText, setTitleText] = useState(task.title);
  const [subtaskDraft, setSubtaskDraft] = useState('');

  useEffect(() => {
    setTitleText(task.title);
  }, [task.title]);

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

  return (
    <div className="space-y-3" style={{ marginLeft: level * 18 }}>
      <div className={`rounded-[26px] border ${task.completed ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/70'} p-4 shadow-sm transition`}>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className={`mt-1 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${safeChildren.length === 0 ? 'invisible' : ''}`}
            aria-label="Toggle subtasks"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            className="mt-1 h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900"
          />

          <div className="min-w-0 flex-1 space-y-3">
            <input
              value={titleText}
              onChange={(event) => setTitleText(event.target.value)}
              onBlur={saveTitle}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  saveTitle();
                }
              }}
              className={`w-full bg-transparent text-base font-medium outline-none ${task.completed ? 'text-slate-500 line-through dark:text-slate-500' : 'text-slate-950 dark:text-white'}`}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Badge color={priorityColor}>{task.priority} priority</Badge>
              <Badge color="cyan">{progress.done}/{progress.total} complete</Badge>
              {task.dueDate ? (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <CalendarDays size={12} />
                  {task.dueDate}
                </span>
              ) : null}
              {task.recurring && task.recurring !== 'none' ? (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Repeat size={12} />
                  {task.recurring}
                </span>
              ) : null}
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all" style={{ width: `${percent}%` }} />
            </div>

            {showNotes ? (
              <Textarea
                rows={3}
                value={task.notes || ''}
                onChange={(event) => onUpdate({ ...task, notes: event.target.value })}
                placeholder="Add context, links, or revision notes for this task..."
              />
            ) : null}

            {showMeta ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="date"
                  label="Due date"
                  value={task.dueDate || ''}
                  onChange={(event) => onUpdate({ ...task, dueDate: event.target.value || undefined })}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Recurring</label>
                  <select
                    value={task.recurring || 'none'}
                    onChange={(event) => onUpdate({ ...task, recurring: event.target.value as Task['recurring'] })}
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-950"
                  >
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={cyclePriority}>
                <Flag size={14} />
                Cycle priority
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowNotes((value) => !value)}>
                <StickyNote size={14} />
                {showNotes ? 'Hide notes' : 'Add notes'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowMeta((value) => !value)}>
                <CalendarDays size={14} />
                {showMeta ? 'Hide dates' : 'Due date & repeat'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowInput((value) => !value)}>
                <Plus size={14} />
                Add subtask
              </Button>
              <Button size="sm" variant="ghost" className="text-rose-600 dark:text-rose-300" onClick={() => onDelete(task.id)}>
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showInput ? (
        <div className="ml-10 space-y-2">
          <Textarea
            rows={4}
            value={subtaskDraft}
            onChange={(event) => setSubtaskDraft(event.target.value)}
            placeholder={`Add one or more subtasks
- Review lecture slides
  - Highlight key formulas
- Solve practice set`}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setShowInput(false);
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addSubtask}>
              Save list
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowInput(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {expanded ? (
        <div className="space-y-3">
          {safeChildren.map((child) => (
            <TaskNode
              key={child.id}
              task={child}
              level={level + 1}
              onAddSubtask={onAddSubtask}
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
