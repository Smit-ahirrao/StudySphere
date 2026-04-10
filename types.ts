export type Priority = 'low' | 'medium' | 'high';
export type PlannerLabel = 'study' | 'break' | 'personal';
export type PlannerRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  recurring?: 'daily' | 'weekly' | 'none';
  createdAt: number;
  children: Task[];
  notes?: string;
  isExpanded?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  color?: string;
  trashed?: boolean;
}

export interface PlannerEvent {
  id: string;
  title: string;
  startTime: number;
  duration: number;
  day: string;
  taskId?: string;
  label?: PlannerLabel;
  notes?: string;
  repeat?: PlannerRepeat;
  reminder?: boolean;
  color?: string;
}

export interface FocusSession {
  id: string;
  duration: number;
  completedAt: number;
  mode: 'focus' | 'short-break' | 'long-break';
  taskId?: string;
}

export interface FileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  previewUrl?: string;
  folder?: string;
  pinned?: boolean;
  notes?: string;
}

export interface AppData {
  tasks: Task[];
  notes: Note[];
  planner: PlannerEvent[];
  focusHistory: FocusSession[];
  files: FileMeta[];
  settings: {
    theme: 'light' | 'dark';
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
  };
}
