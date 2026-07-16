import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, LayoutList, KanbanSquare, Folder, Inbox, Sun, Calendar, Plus, ChevronDown, Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import TaskNode from '../components/TaskNode';
import QuickAddBar from '../components/QuickAddBar';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import AIPlanningBar from '../components/tasks/AIPlanningBar';
import AISummaryPanel from '../components/tasks/AISummaryPanel';
import { Task } from '../types';
import { createTaskWithNestedChildren, flattenTasks } from '../utils/taskHelpers';

type FilterState = 
  | { type: 'inbox' }
  | { type: 'today' }
  | { type: 'upcoming' }
  | { type: 'all' }
  | { type: 'project'; id: string };

type ViewMode = 'list' | 'board';

export default function Tasks() {
  const { data, addTask, deleteTask, toggleTask, updateTask, addProject } = useData();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<FilterState>({ type: 'inbox' });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<{ message: string; action: () => void } | null>(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allFlat = useMemo(() => flattenTasks(data.tasks), [data.tasks]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return allFlat.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, allFlat]);

  // Task counts for nav badges
  const counts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomStr = tomorrow.toISOString().split('T')[0];

    return {
      inbox: data.tasks.filter(t => !t.projectId && !t.completed).length,
      today: allFlat.filter(t => t.dueDate === today && !t.completed).length,
      upcoming: allFlat.filter(t => t.dueDate && t.dueDate >= tomStr && !t.completed).length,
      all: allFlat.filter(t => !t.completed).length,
    };
  }, [data.tasks, allFlat]);

  const handleAddQuickTask = (parsed: Partial<Task>) => {
    let projectId = parsed.projectId;
    if (!projectId && filter.type === 'project') {
      projectId = filter.id;
    }
    const newTask = createTaskWithNestedChildren(parsed.title || 'Untitled', '', {
      dueDate: parsed.dueDate,
      recurring: parsed.recurring,
    });
    const finalTask = { ...newTask, ...parsed, title: newTask.title, projectId };
    addTask(finalTask);
  };

  const handleAddSubtask = (parentId: string, value: string) => {
    const lines = value.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const [firstLine, ...rest] = lines;
    if (firstLine) addTask(createTaskWithNestedChildren(firstLine.trim(), rest.join('\n')), parentId);
  };

  const handleBulkAdd = () => {
    const lines = bulkInput.split('\n').filter(l => l.trim());
    lines.forEach(line => handleAddQuickTask({ title: line }));
    setBulkInput('');
    setShowBulkAdd(false);
  };

  const handleDeleteWithUndo = (task: Task) => {
    deleteTask(task.id);
    setUndoToast({
      message: `Deleted "${task.title}"`,
      action: () => addTask(task)
    });
    setTimeout(() => setUndoToast(null), 5000);
  };

  const filteredTasks = useMemo(() => {
    let tasks = data.tasks;
    tasks = [...tasks].sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return 0;
    });

    switch (filter.type) {
      case 'inbox':
        return tasks.filter(t => !t.projectId);
      case 'project':
        return tasks.filter(t => t.projectId === filter.id);
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(t => t.dueDate === today);
      case 'upcoming':
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomStr = tomorrow.toISOString().split('T')[0];
        return tasks.filter(t => t.dueDate && t.dueDate >= tomStr);
      case 'all':
      default:
        return tasks;
    }
  }, [data.tasks, filter]);

  const viewTitle = useMemo(() => {
    switch (filter.type) {
      case 'inbox': return 'Inbox';
      case 'today': return 'Today';
      case 'upcoming': return 'Upcoming';
      case 'all': return 'All Tasks';
      case 'project': return data.projects?.find(p => p.id === filter.id)?.name || 'Project';
    }
  }, [filter, data.projects]);

  const navItems = [
    { key: 'inbox', label: 'Inbox', icon: Inbox, count: counts.inbox, filter: { type: 'inbox' as const } },
    { key: 'today', label: 'Today', icon: Sun, count: counts.today, filter: { type: 'today' as const } },
    { key: 'upcoming', label: 'Upcoming', icon: Calendar, count: counts.upcoming, filter: { type: 'upcoming' as const } },
    { key: 'all', label: 'All Tasks', icon: LayoutList, count: counts.all, filter: { type: 'all' as const } },
  ];

  const setFilterAndClose = (f: FilterState) => {
    setFilter(f);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-0 lg:gap-6">

      {/* Mobile filter pill bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2 overflow-x-auto border-t border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.filter)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              filter.type === item.key
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <item.icon size={13} />
            {item.label}
            {item.count > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 text-[10px] ${filter.type === item.key ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>{item.count}</span>
            )}
          </button>
        ))}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        >
          <Filter size={12} /> Projects
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden w-56 shrink-0 flex-col gap-5 overflow-y-auto pr-2 lg:flex">
        <div className="space-y-1">
          {navItems.map(item => (
            <NavItem
              key={item.key}
              icon={<item.icon size={16} />}
              label={item.label}
              count={item.count}
              active={filter.type === item.key}
              onClick={() => setFilter(item.filter)}
            />
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Projects</span>
            <button
              onClick={() => {
                const name = window.prompt('Project Name:');
                if (name) addProject({ id: crypto.randomUUID(), name, color: 'sky' });
              }}
              className="hover:text-sky-500"
            >
              <Plus size={13} />
            </button>
          </div>
          <div className="space-y-1">
            {data.projects?.map(proj => (
              <NavItem
                key={proj.id}
                icon={<Folder size={14} />}
                label={proj.name}
                active={filter.type === 'project' && filter.id === proj.id}
                onClick={() => setFilter({ type: 'project', id: proj.id })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-[105] w-64 bg-white p-5 shadow-2xl dark:bg-slate-950 lg:hidden animate-slide-in-right" style={{ animationName: 'slideInLeft' }}>
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Projects</h3>
            <div className="space-y-1">
              {data.projects?.map(proj => (
                <NavItem
                  key={proj.id}
                  icon={<Folder size={14} />}
                  label={proj.name}
                  active={filter.type === 'project' && filter.id === proj.id}
                  onClick={() => setFilterAndClose({ type: 'project', id: proj.id })}
                />
              ))}
              <button
                onClick={() => {
                  const name = window.prompt('Project Name:');
                  if (name) addProject({ id: crypto.randomUUID(), name, color: 'sky' });
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Plus size={14} /> New Project
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-inner dark:bg-slate-900/30">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/50 px-4 py-4 sm:px-8 sm:py-5 dark:border-slate-800/50 shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{viewTitle}</h2>
          <div className="flex rounded-lg bg-white p-1 shadow-sm dark:bg-slate-950">
            <button onClick={() => setViewMode('list')} className={`rounded-md p-1.5 transition ${viewMode === 'list' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}><LayoutList size={16} /></button>
            <button onClick={() => setViewMode('board')} className={`rounded-md p-1.5 transition ${viewMode === 'board' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}><KanbanSquare size={16} /></button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-20 sm:px-8 sm:py-6 lg:pb-6">
          <div className="mx-auto max-w-4xl space-y-5">

            <AIPlanningBar />
            <AISummaryPanel />

            <div className="flex gap-2">
              <div className="flex-1">
                <QuickAddBar onAdd={handleAddQuickTask} />
              </div>
              <button
                onClick={() => setShowBulkAdd(true)}
                className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400"
              >
                Bulk
              </button>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-800">
                <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <Inbox size={28} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No tasks here</h3>
                <p className="mt-1 text-sm text-slate-500">You're all caught up! Add a task above or use AI Goal Planner.</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <TaskNode
                    key={task.id}
                    task={task}
                    onAddSubtask={handleAddSubtask}
                    onFocusTask={(id) => navigate(`/focus?task=${encodeURIComponent(id)}`)}
                    onToggle={toggleTask}
                    onDelete={() => handleDeleteWithUndo(task)}
                    onUpdate={updateTask}
                    onSelect={(t) => setSelectedTaskId(t.id)}
                  />
                ))}
              </div>
            ) : (
              <BoardView
                tasks={filteredTasks}
                filter={filter}
                sections={data.sections}
                onSelect={(t) => setSelectedTaskId(t.id)}
                onToggle={toggleTask}
              />
            )}
          </div>
        </div>
      </div>

      {/* Undo Toast */}
      {undoToast && (
        <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-slate-900 px-6 py-3 text-sm text-white shadow-2xl dark:bg-sky-600 lg:bottom-8">
          <span>{undoToast.message}</span>
          <button
            onClick={() => { undoToast.action(); setUndoToast(null); }}
            className="font-bold uppercase tracking-wider text-sky-400 hover:text-sky-300 dark:text-sky-100"
          >
            Undo
          </button>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-fade-scale-in">
            <h3 className="mb-4 text-xl font-bold dark:text-white">Bulk Add Tasks</h3>
            <p className="mb-4 text-sm text-slate-500">Each line will become a separate task.</p>
            <textarea
              autoFocus
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="mb-6 h-64 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-sky-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder={"Finish assignment\nStudy for midterms\nSubmit project proposal..."}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBulkAdd(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleBulkAdd} className="rounded-xl bg-sky-500 px-6 py-2 text-sm font-bold text-white hover:bg-sky-600">Add Tasks</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={updateTask}
        onDelete={(id) => {
          if (selectedTask) handleDeleteWithUndo(selectedTask);
          setSelectedTaskId(null);
        }}
      />
    </div>
  );
}

// Nav item with count badge
const NavItem = ({ icon, label, active, onClick, count }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void, count?: number }) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
      active
        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300'
    }`}
  >
    <div className="flex items-center gap-2.5">
      {icon}
      {label}
    </div>
    {count !== undefined && count > 0 && (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        active ? 'bg-sky-200/60 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// Board View with priority strips
const BoardView = ({ tasks, filter, sections, onSelect, onToggle }: { tasks: Task[], filter: FilterState, sections: any[], onSelect: (t: Task) => void, onToggle: (id: string) => void }) => {
  const isProject = filter.type === 'project';

  const columns = useMemo(() => {
    if (isProject) {
      const projSections = sections.filter(s => s.projectId === filter.id).sort((a: any, b: any) => a.order - b.order);
      const cols = [{ id: 'no-section', name: 'No Section', tasks: tasks.filter(t => !t.sectionId) }];
      projSections.forEach((s: any) => {
        cols.push({ id: s.id, name: s.name, tasks: tasks.filter(t => t.sectionId === s.id) });
      });
      return cols.filter(c => c.tasks.length > 0 || c.id !== 'no-section');
    } else {
      const states = ['To Study', 'In Revision', 'Ready for Exam'];
      return [
        { id: 'no-state', name: 'No Status', tasks: tasks.filter(t => !states.includes(t.studyState || '')) },
        ...states.map(state => ({ id: state, name: state, tasks: tasks.filter(t => t.studyState === state) }))
      ];
    }
  }, [tasks, filter, sections, isProject]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2">
      {columns.map(col => (
        <div key={col.id} className="w-72 shrink-0 space-y-3 rounded-2xl bg-slate-100/50 p-4 dark:bg-slate-800/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.name}</h3>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-400">{col.tasks.length}</span>
          </div>
          <div className="space-y-2.5">
            {col.tasks.map(task => (
              <div
                key={task.id}
                onClick={() => onSelect(task)}
                className={`cursor-pointer rounded-xl border p-3 shadow-sm transition hover:border-sky-300 hover:shadow-md priority-strip-${task.priority} ${
                  task.completed
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} onClick={e => e.stopPropagation()} className="mt-1 shrink-0 cursor-pointer" />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${task.completed ? 'text-slate-500 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>{task.title}</p>
                    {(task.dueDate || task.priority === 'high') && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {task.priority === 'high' && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-950 dark:text-rose-400">High</span>}
                        {task.dueDate && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">{task.dueDate}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
