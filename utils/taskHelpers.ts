import { Task } from '../types';

export const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

export const uuidv4 = generateId;

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
  typeof value === 'string' ? value : 'none';

const normalizeTaskNode = (task: any): Task => ({
  id: typeof task?.id === 'string' && task.id.trim() ? task.id : generateId(),
  title: typeof task?.title === 'string' && task.title.trim() ? task.title : 'Untitled task',
  completed: Boolean(task?.completed),
  priority: normalizePriority(task?.priority),
  dueDate: typeof task?.dueDate === 'string' && task.dueDate.trim() ? task.dueDate : undefined,
  time: typeof task?.time === 'string' && task.time.trim() ? task.time : undefined,
  deadline: typeof task?.deadline === 'string' && task.deadline.trim() ? task.deadline : undefined,
  recurring: normalizeRecurring(task?.recurring),
  recurringRule: typeof task?.recurringRule === 'string' ? task.recurringRule : undefined,
  reminders: Array.isArray(task?.reminders) ? task.reminders : undefined,
  projectId: typeof task?.projectId === 'string' ? task.projectId : undefined,
  sectionId: typeof task?.sectionId === 'string' ? task.sectionId : undefined,
  labels: Array.isArray(task?.labels) ? task.labels : undefined,
  studyState: task?.studyState || undefined,
  subject: typeof task?.subject === 'string' ? task.subject : undefined,
  taskType: typeof task?.taskType === 'string' ? task.taskType : undefined,
  estimatedTime: typeof task?.estimatedTime === 'number' ? task.estimatedTime : undefined,
  effortLevel: typeof task?.effortLevel === 'number' ? task.effortLevel : undefined,
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

export const parseNaturalLanguageTask = (input: string): Partial<Task> => {
  let title = input;
  const result: Partial<Task> = {};

  // Priority: p1 (high), p2 (medium), p3 (low)
  const pMatch = title.match(/\bp([1-3])\b/i);
  if (pMatch) {
    result.priority = pMatch[1] === '1' ? 'high' : pMatch[1] === '2' ? 'medium' : 'low';
    title = title.replace(pMatch[0], '');
  }

  // Recurring: every day, every week, etc.
  const rMatch = title.match(/\bevery\s+(day|week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (rMatch) {
    result.recurring = rMatch[1].toLowerCase() === 'day' ? 'daily' : rMatch[1].toLowerCase() === 'week' ? 'weekly' : `every ${rMatch[1].toLowerCase()}`;
    title = title.replace(rMatch[0], '');
  }

  // Time: 7pm, 14:00, 7:30am
  const tMatch = title.match(/\b([0-2]?[0-9])(:[0-5][0-9])?\s*(am|pm)\b|\b([0-2][0-9]):([0-5][0-9])\b/i);
  if (tMatch) {
    result.time = tMatch[0].toLowerCase();
    title = title.replace(tMatch[0], '');
  }

  // Due Date (simple heuristic): tomorrow, today, next friday, etc.
  const dMatch = title.match(/\b(tomorrow|today|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i);
  if (dMatch) {
    const today = new Date();
    if (dMatch[0].toLowerCase() === 'tomorrow') {
      today.setDate(today.getDate() + 1);
      result.dueDate = today.toISOString().split('T')[0];
    } else if (dMatch[0].toLowerCase() === 'today') {
      result.dueDate = today.toISOString().split('T')[0];
    } else if (dMatch[0].toLowerCase().startsWith('next ')) {
      // rough logic for "next X" - just set to 7 days from now for simplicity in a heuristic parser
      today.setDate(today.getDate() + 7);
      result.dueDate = today.toISOString().split('T')[0];
    }
    title = title.replace(dMatch[0], '');
  }

  result.title = title.replace(/\s+/g, ' ').trim();
  return result;
};
