import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ListTodo, Repeat, Sparkles, Target } from 'lucide-react';
import { useData } from '../context/DataContext';
import TaskNode from '../components/TaskNode';
import { Badge, Button, Card, Input, SectionHeading, Select, Textarea } from '../components/UI';
import { Task } from '../types';
import { countCompletedTasks, countTasks, createTaskWithNestedChildren, flattenTasks } from '../utils/taskHelpers';

const Tasks: React.FC = () => {
  const { data, addTask, deleteTask, toggleTask, updateTask } = useData();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [nestedText, setNestedText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState<Task['recurring']>('none');
  const [filter, setFilter] = useState<'all' | 'open' | 'done' | 'high'>('all');

  const flattened = flattenTasks(data.tasks);
  const completedCount = countCompletedTasks(data.tasks);
  const totalCount = countTasks(data.tasks);
  const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return data.tasks;
    return data.tasks.filter((task) => matchesFilter(task, filter));
  }, [data.tasks, filter]);

  const dueSoon = flattened.filter((task) => !task.completed && task.priority === 'high').slice(0, 4);
  const focusByTask = useMemo(() => {
    const focusMap = new Map<string, number>();
    data.focusHistory.forEach((session) => {
      if (session.mode === 'focus' && session.taskId) {
        focusMap.set(session.taskId, (focusMap.get(session.taskId) || 0) + session.duration);
      }
    });

    return flattenTasks(data.tasks)
      .filter((task) => focusMap.has(task.id))
      .map((task) => ({ id: task.id, title: task.title, minutes: focusMap.get(task.id) || 0, completed: task.completed }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 4);
  }, [data.focusHistory, data.tasks]);

  const handleAddTask = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newTask = createTaskWithNestedChildren(trimmed, nestedText, {
      dueDate: dueDate || undefined,
      recurring,
    });

    addTask(newTask);
    setText('');
    setNestedText('');
    setDueDate('');
    setRecurring('none');
  };

  const handleAddSubtask = (parentId: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const [firstLine, ...rest] = lines;
    if (!firstLine) return;

    addTask(createTaskWithNestedChildren(firstLine.trim(), rest.join('\n')), parentId);
  };

  const focusLinkedTask = (taskId: string) => {
    navigate(`/focus?task=${encodeURIComponent(taskId)}`);
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Execution Space"
        title="Turn coursework into visible progress"
        description="Build a hierarchy of tasks, track progress instantly, and give every assignment a clearer next step."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={ListTodo} label="Total tasks" value={String(totalCount)} />
        <MiniStat icon={CheckCircle2} label="Completed" value={String(completedCount)} />
        <MiniStat icon={Target} label="Completion rate" value={`${completionRate}%`} />
        <MiniStat icon={Sparkles} label="High priority" value={String(flattened.filter((task) => !task.completed && task.priority === 'high').length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Task composer">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="Main task title"
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleAddTask();
                  }
                }}
              />
              <Button className="sm:min-w-[150px]" onClick={handleAddTask}>
                Create task
              </Button>
            </div>

            <Textarea
              rows={5}
              value={nestedText}
              onChange={(event) => setNestedText(event.target.value)}
              placeholder="Add subtasks (optional)"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="date"
                label="Due date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
              <Select value={recurring} onChange={(event) => setRecurring(event.target.value as Task['recurring'])}>
                <option value="none">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['all', 'open', 'done', 'high'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    filter === value
                      ? 'bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {value === 'all' ? 'All tasks' : value === 'open' ? 'Open only' : value === 'done' ? 'Completed' : 'High priority'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Priority radar">
          <div className="space-y-3">
            {dueSoon.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                No urgent tasks yet. This panel will surface the most important unfinished work.
              </p>
            ) : (
              dueSoon.map((task) => (
                <div key={task.id} className="rounded-3xl border border-rose-100 bg-rose-50/70 px-4 py-4 dark:border-rose-950 dark:bg-rose-950/20">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{task.title}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {task.dueDate ? <Badge color="gray"><CalendarDays size={12} className="mr-1 inline" />{task.dueDate}</Badge> : null}
                        {task.recurring && task.recurring !== 'none' ? <Badge color="blue"><Repeat size={12} className="mr-1 inline" />{task.recurring}</Badge> : null}
                      </div>
                    </div>
                    <Badge color="red">High</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{task.notes || 'Add notes or subtasks to make execution easier.'}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card title="Focus linked to tasks">
        <div className="grid gap-3 md:grid-cols-2">
          {focusByTask.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 md:col-span-2">
              Focus sessions linked to tasks will show up here, so you can see where your study time is actually going.
            </p>
          ) : (
            focusByTask.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-900 dark:text-white">{item.title}</div>
                  <Badge color={item.completed ? 'green' : 'cyan'}>{item.minutes} min</Badge>
                </div>
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.completed ? 'Completed task with tracked focus time' : 'Active task with tracked focus time'}</div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <div className="py-14 text-center">
              <h3 className="text-xl font-semibold text-slate-950 dark:text-white">No tasks in this view</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Create a new task above or switch filters to view the rest of your workload.</p>
            </div>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <TaskNode
              key={task.id}
              task={task}
              onFocusTask={focusLinkedTask}
              onAddSubtask={handleAddSubtask}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onUpdate={updateTask}
            />
          ))
        )}
      </div>
    </div>
  );
};

const MiniStat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) => (
  <Card>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
      </div>
      <div className="rounded-2xl bg-sky-50 p-3 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
        <Icon size={18} />
      </div>
    </div>
  </Card>
);

const matchesFilter = (task: Task, filter: 'open' | 'done' | 'high'): boolean => {
  const children = Array.isArray(task.children) ? task.children : [];

  if (filter === 'open') {
    return !task.completed || children.some((child) => matchesFilter(child, filter));
  }

  if (filter === 'done') {
    return task.completed || children.some((child) => matchesFilter(child, filter));
  }

  if (filter === 'high') {
    return task.priority === 'high' || children.some((child) => matchesFilter(child, filter));
  }

  return true;
};

export default Tasks;
