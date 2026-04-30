import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, LayoutList, KanbanSquare, Folder, Inbox, Sun, Calendar, Hash, Tag, Plus } from 'lucide-react';
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

type ViewMode = 'list' | 'board' | 'calendar';

export default function Tasks() {
  const { data, addTask, deleteTask, toggleTask, updateTask, addProject } = useData();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<FilterState>({ type: 'inbox' });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<{ message: string; action: () => void } | null>(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return flattenTasks(data.tasks).find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, data.tasks]);

  const handleAddQuickTask = (parsed: Partial<Task>) => {
    // If we are in a specific project, assign it by default unless user specified otherwise
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
    
    // Sort logic (can be expanded)
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

  // Derive title for main area
  const viewTitle = useMemo(() => {
    switch (filter.type) {
      case 'inbox': return 'Inbox';
      case 'today': return 'Today';
      case 'upcoming': return 'Upcoming';
      case 'all': return 'All Tasks';
      case 'project': return data.projects?.find(p => p.id === filter.id)?.name || 'Project';
    }
  }, [filter, data.projects]);

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2">
        <div className="space-y-1">
          <NavItem 
            icon={<Inbox size={18} />} label="Inbox" 
            active={filter.type === 'inbox'} 
            onClick={() => setFilter({ type: 'inbox' })} 
          />
          <NavItem 
            icon={<Sun size={18} />} label="Today" 
            active={filter.type === 'today'} 
            onClick={() => setFilter({ type: 'today' })} 
          />
          <NavItem 
            icon={<Calendar size={18} />} label="Upcoming" 
            active={filter.type === 'upcoming'} 
            onClick={() => setFilter({ type: 'upcoming' })} 
          />
          <NavItem 
            icon={<LayoutList size={18} />} label="All Tasks" 
            active={filter.type === 'all'} 
            onClick={() => setFilter({ type: 'all' })} 
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between px-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Projects</span>
            <button 
              onClick={() => {
                const name = window.prompt('Project Name:');
                if (name) {
                  addProject({ id: crypto.randomUUID(), name, color: 'sky' });
                }
              }} 
              className="hover:text-sky-500"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {data.projects?.map(proj => (
              <NavItem 
                key={proj.id}
                icon={<Folder size={16} />} 
                label={proj.name} 
                active={filter.type === 'project' && filter.id === proj.id} 
                onClick={() => setFilter({ type: 'project', id: proj.id })} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-inner dark:bg-slate-900/30">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/50 px-8 py-5 dark:border-slate-800/50">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{viewTitle}</h2>
          
          <div className="flex rounded-lg bg-white p-1 shadow-sm dark:bg-slate-950">
            <button onClick={() => setViewMode('list')} className={`rounded-md p-1.5 transition ${viewMode === 'list' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}><LayoutList size={18} /></button>
            <button onClick={() => setViewMode('board')} className={`rounded-md p-1.5 transition ${viewMode === 'board' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}><KanbanSquare size={18} /></button>
            <button onClick={() => setViewMode('calendar')} className={`rounded-md p-1.5 transition ${viewMode === 'calendar' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}><CalendarDays size={18} /></button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto max-w-4xl space-y-6">
            
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
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-800">
                <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <Inbox size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No tasks here</h3>
                <p className="mt-1 text-sm text-slate-500">You're all caught up! Enjoy your free time or add a new task above.</p>
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
            ) : viewMode === 'board' ? (
              <BoardView 
                tasks={filteredTasks} 
                filter={filter} 
                sections={data.sections} 
                onSelect={(t) => setSelectedTaskId(t.id)} 
                onToggle={toggleTask}
              />
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                <CalendarDays size={48} className="mx-auto mb-4 opacity-20" />
                Calendar view is currently in preview. Use List or Board to manage tasks.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Undo Toast */}
      {undoToast && (
        <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-slate-900 px-6 py-3 text-sm text-white shadow-2xl dark:bg-sky-600">
          <span>{undoToast.message}</span>
          <button 
            onClick={() => {
              undoToast.action();
              setUndoToast(null);
            }}
            className="font-bold uppercase tracking-wider text-sky-400 hover:text-sky-300 dark:text-sky-100"
          >
            Undo
          </button>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="mb-4 text-xl font-bold dark:text-white">Bulk Add Tasks</h3>
            <p className="mb-4 text-sm text-slate-500">Each line will become a separate task. You can paste lists from your notes or syllabus here.</p>
            <textarea
              autoFocus
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="mb-6 h-64 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-sky-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="Finish assignment&#10;Study for midterms&#10;Submit project proposal..."
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

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      active 
        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300' 
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300'
    }`}
  >
    {icon}
    {label}
  </button>
);

// Simple Board View implementation
const BoardView = ({ tasks, filter, sections, onSelect, onToggle }: { tasks: Task[], filter: FilterState, sections: any[], onSelect: (t: Task) => void, onToggle: (id: string) => void }) => {
  // If in a project, group by sections. Otherwise, group by Study State.
  const isProject = filter.type === 'project';
  
  const columns = useMemo(() => {
    if (isProject) {
      const projSections = sections.filter(s => s.projectId === filter.id).sort((a, b) => a.order - b.order);
      const cols = [{ id: 'no-section', name: 'No Section', tasks: tasks.filter(t => !t.sectionId) }];
      projSections.forEach(s => {
        cols.push({ id: s.id, name: s.name, tasks: tasks.filter(t => t.sectionId === s.id) });
      });
      return cols.filter(c => c.tasks.length > 0 || c.id !== 'no-section'); // hide 'No Section' if empty
    } else {
      const states = ['To Study', 'In Revision', 'Ready for Exam'];
      const cols = [
        { id: 'no-state', name: 'No Status', tasks: tasks.filter(t => !states.includes(t.studyState || '')) },
        ...states.map(state => ({ id: state, name: state, tasks: tasks.filter(t => t.studyState === state) }))
      ];
      return cols;
    }
  }, [tasks, filter, sections, isProject]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(col => (
        <div key={col.id} className="w-80 flex-shrink-0 space-y-3 rounded-2xl bg-slate-100/50 p-4 dark:bg-slate-800/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.name}</h3>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-400">{col.tasks.length}</span>
          </div>
          
          <div className="space-y-3">
            {col.tasks.map(task => (
              <div 
                key={task.id}
                onClick={() => onSelect(task)}
                className={`cursor-pointer rounded-xl border p-3 shadow-sm transition hover:border-sky-300 hover:shadow-md ${task.completed ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}
              >
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} onClick={e => e.stopPropagation()} className="mt-1 flex-shrink-0 cursor-pointer" />
                  <div>
                    <p className={`text-sm font-medium ${task.completed ? 'text-slate-500 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>{task.title}</p>
                    {(task.dueDate || task.priority) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
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
