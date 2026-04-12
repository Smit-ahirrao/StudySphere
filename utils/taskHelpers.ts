import { Task } from '../types';

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

const createTaskNode = (title: string): Task => ({
  id: generateId(),
  title: title || 'Untitled task',
  completed: false,
  priority: 'medium',
  createdAt: Date.now(),
  children: [],
  notes: '',
  recurring: 'none',
  isExpanded: true,
});

const getIndentLevel = (line: string) => {
  const normalized = line.replace(/\t/g, '  ');
  const leadingSpaces = normalized.match(/^\s*/)?.[0].length ?? 0;
  return Math.floor(leadingSpaces / 2);
};

const getLineTitle = (line: string) => line.replace(/^\s*([-*+]|\d+[.)])?\s*/, '').trim();

export const createTaskWithNestedChildren = (
  title: string,
  nestedText: string,
  options?: Pick<Task, 'dueDate' | 'recurring'>
): Task => {
  const root = createTaskNode(title.trim());
  root.dueDate = options?.dueDate || undefined;
  root.recurring = options?.recurring || 'none';

  const stack: Array<{ level: number; node: Task }> = [{ level: -1, node: root }];
  const lines = nestedText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/, ''))
    .filter((line) => getLineTitle(line).length > 0);

  for (const line of lines) {
    const level = getIndentLevel(line);
    const titleText = getLineTitle(line);
    if (!titleText) continue;

    const node = createTaskNode(titleText);

    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.node ?? root;
    parent.children = [...parent.children, node];
    stack.push({ level, node });
  }

  if (root.children.length > 0) {
    root.isExpanded = false;
  }

  return root;
};

// Flatten the tree into a list
export const flattenTasks = (tasks: Task[]): Task[] => {
  return tasks.reduce((acc, task) => {
    const children = Array.isArray(task.children) ? task.children : [];
    return [...acc, { ...task, children }, ...flattenTasks(children)];
  }, [] as Task[]);
};

// Count total tasks recursively
export const countTasks = (tasks: Task[]): number => {
  return tasks.reduce((acc, task) => acc + 1 + countTasks(Array.isArray(task.children) ? task.children : []), 0);
};

// Count completed tasks recursively
export const countCompletedTasks = (tasks: Task[]): number => {
  return tasks.reduce((acc, task) => {
    return acc + (task.completed ? 1 : 0) + countCompletedTasks(Array.isArray(task.children) ? task.children : []);
  }, 0);
};

// Add task to tree
export const addTaskToTree = (tasks: Task[], newTask: Task, parentId?: string): Task[] => {
  if (!parentId) {
    return [...tasks, newTask];
  }

  const visit = (list: Task[]): { tasks: Task[]; inserted: boolean } => {
    let inserted = false;

    const nextTasks = list.map((task) => {
      if (task.id === parentId) {
        inserted = true;
        return {
          ...task,
          children: [...(Array.isArray(task.children) ? task.children : []), newTask],
          isExpanded: true,
        };
      }

      if (Array.isArray(task.children) && task.children.length > 0) {
        const result = visit(task.children);
        if (result.inserted) {
          inserted = true;
          return { ...task, children: result.tasks, isExpanded: true };
        }
      }

      return task;
    });

    return { tasks: nextTasks, inserted };
  };

  const result = visit(tasks);
  return result.inserted ? result.tasks : tasks;
};

// Update task in tree
export const updateTaskInTree = (tasks: Task[], updatedTask: Task): Task[] => {
  return tasks.map(task => {
    if (task.id === updatedTask.id) {
      return updatedTask;
    }
    if (Array.isArray(task.children)) {
      return { ...task, children: updateTaskInTree(task.children, updatedTask) };
    }
    return task;
  });
};

// Delete task from tree
export const deleteTaskFromTree = (tasks: Task[], id: string): Task[] => {
  return tasks.filter(task => task.id !== id).map(task => ({
    ...task,
    children: deleteTaskFromTree(Array.isArray(task.children) ? task.children : [], id)
  }));
};

// Toggle completion with cascading logic
// 1. If parent is toggled, all children match parent.
// 2. If child is toggled, parent state is re-evaluated (all children done = parent done).
export const toggleTaskCompletion = (tasks: Task[], id: string): Task[] => {
  
  const toggleRecursive = (list: Task[], targetId: string): { tasks: Task[], changed: boolean } => {
    let listChanged = false;
    
    const newTasks = list.map(task => {
      if (task.id === targetId) {
        // Toggle this task
        const newStatus = !task.completed;
        listChanged = true;
        // Cascade down to children
        return setAllChildrenStatus(task, newStatus);
      }
      
      // Traverse down
      if (Array.isArray(task.children) && task.children.length > 0) {
        const result = toggleRecursive(task.children, targetId);
        if (result.changed) {
          listChanged = true;
          // Re-evaluate self based on children
          const allChildrenComplete = result.tasks.every(c => c.completed);
          return { ...task, children: result.tasks, completed: allChildrenComplete };
        }
      }
      return task;
    });

    return { tasks: newTasks, changed: listChanged };
  };

  return toggleRecursive(tasks, id).tasks;
};

export const setTaskCompletion = (tasks: Task[], id: string, completed: boolean): Task[] => {
  const updateRecursive = (list: Task[]): { tasks: Task[]; changed: boolean } => {
    let changed = false;

    const next = list.map((task) => {
      if (task.id === id) {
        changed = true;
        return setAllChildrenStatus(task, completed);
      }

      if (task.children && task.children.length > 0) {
        const result = updateRecursive(task.children);
        if (result.changed) {
          changed = true;
          const allChildrenComplete = result.tasks.every((child) => child.completed);
          return { ...task, children: result.tasks, completed: allChildrenComplete };
        }
      }

      return task;
    });

    return { tasks: next, changed };
  };

  return updateRecursive(tasks).tasks;
};

// Helper to set status recursively downwards
const setAllChildrenStatus = (task: Task, status: boolean): Task => {
  return {
    ...task,
    completed: status,
    children: (Array.isArray(task.children) ? task.children : []).map(c => setAllChildrenStatus(c, status))
  };
};

const normalizePriority = (value: unknown): Task['priority'] =>
  value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';

const normalizeRecurring = (value: unknown): Task['recurring'] =>
  value === 'daily' || value === 'weekly' || value === 'none' ? value : 'none';

const normalizeTaskNode = (task: any): Task => ({
  id: typeof task?.id === 'string' && task.id.trim() ? task.id : generateId(),
  title: typeof task?.title === 'string' && task.title.trim() ? task.title : 'Untitled task',
  completed: Boolean(task?.completed),
  priority: normalizePriority(task?.priority),
  dueDate: typeof task?.dueDate === 'string' && task.dueDate.trim() ? task.dueDate : undefined,
  recurring: normalizeRecurring(task?.recurring),
  createdAt: Number.isFinite(Number(task?.createdAt)) ? Number(task.createdAt) : Date.now(),
  children: normalizeTasks(task?.children),
  notes: typeof task?.notes === 'string' ? task.notes : '',
  isExpanded: task?.isExpanded ?? false,
  isDemo: Boolean(task?.isDemo),
});

// Ensure migration for old or malformed data
export const normalizeTasks = (tasks: unknown): Task[] => {
  if (!Array.isArray(tasks)) return [];
  return tasks
    .filter((task) => task && typeof task === 'object')
    .map((task) => normalizeTaskNode(task));
};
