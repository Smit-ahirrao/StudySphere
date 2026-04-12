import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppData, Task, Note, PlannerEvent, FocusSession, FileMeta } from '../types';
import { loadData, saveData } from '../utils/storage';
import {
  addTaskToTree,
  normalizeTasks,
  updateTaskInTree,
  deleteTaskFromTree,
  toggleTaskCompletion,
  setTaskCompletion,
} from '../utils/taskHelpers';

interface DataContextType {
  data: AppData;
  injectDemoData: () => void;
  addTask: (task: Task, parentId?: string) => void;
  updateTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  setTaskComplete: (id: string, completed: boolean) => void;
  deleteTask: (id: string) => void;
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  addPlannerEvent: (event: PlannerEvent) => void;
  updatePlannerEvent: (event: PlannerEvent) => void;
  deletePlannerEvent: (id: string) => void;
  addFocusSession: (session: FocusSession) => void;
  addFile: (file: FileMeta) => void;
  updateFile: (file: FileMeta) => void;
  deleteFile: (id: string) => void;
  recordQuizOutcome: (payload: { topic: string; correct: boolean; question?: string; explanation?: string }) => void;
  clearWeakArea: (topic: string) => void;
  updateSettings: (settings: AppData['settings']) => void;
  importBackup: (jsonData: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AppData>(loadData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadData();
    const hasStoredData = Boolean(localStorage.getItem('studysphere_data_v2') || localStorage.getItem('studysphere_data_v1'));
    if (!hasStoredData && isDataEmpty(loaded)) {
      setData(buildDemoData(loaded));
    } else {
      setData(loaded);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveData(data);
    }
  }, [data, isLoaded]);

  const addTask = (task: Task, parentId?: string) =>
    setData((prev) => ({ ...prev, tasks: addTaskToTree(prev.tasks, task, parentId) }));

  const updateTask = (updated: Task) =>
    setData((prev) => ({ ...prev, tasks: updateTaskInTree(prev.tasks, updated) }));

  const toggleTask = (id: string) =>
    setData((prev) => ({ ...prev, tasks: toggleTaskCompletion(prev.tasks, id) }));

  const setTaskComplete = (id: string, completed: boolean) =>
    setData((prev) => ({ ...prev, tasks: setTaskCompletion(prev.tasks, id, completed) }));

  const deleteTask = (id: string) =>
    setData((prev) => ({ ...prev, tasks: deleteTaskFromTree(prev.tasks, id) }));

  const addNote = (note: Note) => setData((prev) => ({ ...prev, notes: [note, ...prev.notes] }));

  const updateNote = (updated: Note) =>
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((note) => (note.id === updated.id ? updated : note)),
    }));

  const deleteNote = (id: string) =>
    setData((prev) => ({
      ...prev,
      notes: prev.notes.filter((note) => note.id !== id),
    }));

  const addPlannerEvent = (event: PlannerEvent) =>
    setData((prev) => ({ ...prev, planner: [...prev.planner, event] }));

  const updatePlannerEvent = (updated: PlannerEvent) =>
    setData((prev) => ({
      ...prev,
      planner: prev.planner.map((event) => (event.id === updated.id ? updated : event)),
    }));

  const deletePlannerEvent = (id: string) =>
    setData((prev) => ({
      ...prev,
      planner: prev.planner.filter((event) => event.id !== id),
    }));

  const addFocusSession = (session: FocusSession) =>
    setData((prev) => ({ ...prev, focusHistory: [session, ...prev.focusHistory] }));

  const addFile = (file: FileMeta) =>
    setData((prev) => ({ ...prev, files: [file, ...prev.files.filter((item) => item.id !== file.id)] }));

  const updateFile = (updated: FileMeta) =>
    setData((prev) => ({
      ...prev,
      files: prev.files.map((file) => (file.id === updated.id ? updated : file)),
    }));

  const deleteFile = (id: string) =>
    setData((prev) => ({
      ...prev,
      files: prev.files.filter((file) => file.id !== id),
    }));

  const recordQuizOutcome = ({ topic, correct, question, explanation }: { topic: string; correct: boolean; question?: string; explanation?: string }) =>
    setData((prev) => {
      const now = Date.now();
      const topicMap = new Map(prev.weakAreas.map((area) => [area.topic.toLowerCase(), area]));
      const normalizedTopic = topic.trim();
      if (!normalizedTopic) return prev;

      const key = normalizedTopic.toLowerCase();
      const existing = topicMap.get(key);
      topicMap.set(key, {
        topic: existing?.topic || normalizedTopic,
        misses: correct ? existing?.misses || 0 : (existing?.misses || 0) + 1,
        corrects: correct ? (existing?.corrects || 0) + 1 : existing?.corrects || 0,
        lastMissedAt: correct ? existing?.lastMissedAt || now : now,
        lastPracticedAt: now,
        lastQuestion: question || existing?.lastQuestion || '',
        lastExplanation: explanation || existing?.lastExplanation || '',
      });

      return {
        ...prev,
        weakAreas: Array.from(topicMap.values()).sort((a, b) => b.lastPracticedAt - a.lastPracticedAt),
      };
    });

  const clearWeakArea = (topic: string) =>
    setData((prev) => ({
      ...prev,
      weakAreas: prev.weakAreas.filter((area) => area.topic.toLowerCase() !== topic.toLowerCase()),
    }));

  const updateSettings = (settings: AppData['settings']) => setData((prev) => ({ ...prev, settings }));

  const injectDemoData = () =>
    setData((prev) => {
      if (!isDataEmpty(prev)) return prev;
      return buildDemoData(prev);
    });

  const importBackup = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.notes)) {
        return false;
      }

      setData(loadDataFromImport(parsed));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        data,
        injectDemoData,
        addTask,
        updateTask,
        toggleTask,
        setTaskComplete,
        deleteTask,
        addNote,
        updateNote,
        deleteNote,
        addPlannerEvent,
        updatePlannerEvent,
        deletePlannerEvent,
        addFocusSession,
        addFile,
        updateFile,
        deleteFile,
        recordQuizOutcome,
        clearWeakArea,
        updateSettings,
        importBackup,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

const loadDataFromImport = (parsed: Partial<AppData>): AppData => {
  const loaded = loadData();
  return {
    ...loaded,
    ...parsed,
    tasks: normalizeTasks(parsed.tasks),
    settings: { ...loaded.settings, ...(parsed.settings || {}) },
  };
};

const isDataEmpty = (value: AppData) =>
  value.tasks.length === 0 &&
  value.notes.length === 0 &&
  value.focusHistory.length === 0 &&
  value.planner.length === 0 &&
  value.files.length === 0;

const buildDemoData = (base: AppData): AppData => {
  const now = Date.now();
  const toDate = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };

  const demoTasks: Task[] = [
    {
      id: 'demo-task-1',
      title: 'Prepare Data Structures revision sprint',
      completed: false,
      priority: 'high',
      dueDate: toDate(2),
      recurring: 'none',
      createdAt: now - 1000 * 60 * 60 * 30,
      notes: 'Focus on heaps, graphs, and recursion patterns.',
      isExpanded: true,
      children: [
        {
          id: 'demo-task-1-1',
          title: 'Solve 3 medium graph problems',
          completed: true,
          priority: 'medium',
          createdAt: now - 1000 * 60 * 60 * 28,
          recurring: 'none',
          children: [],
        },
        {
          id: 'demo-task-1-2',
          title: 'Review Dijkstra and Union-Find notes',
          completed: false,
          priority: 'high',
          createdAt: now - 1000 * 60 * 60 * 26,
          recurring: 'none',
          children: [],
        },
      ],
    },
    {
      id: 'demo-task-2',
      title: 'Finalize Physics lab report',
      completed: false,
      priority: 'medium',
      dueDate: toDate(1),
      recurring: 'none',
      createdAt: now - 1000 * 60 * 60 * 22,
      notes: 'Include error analysis and final chart annotation.',
      isExpanded: true,
      children: [
        {
          id: 'demo-task-2-1',
          title: 'Write methodology section',
          completed: true,
          priority: 'medium',
          createdAt: now - 1000 * 60 * 60 * 20,
          recurring: 'none',
          children: [],
        },
        {
          id: 'demo-task-2-2',
          title: 'Attach observations and charts',
          completed: false,
          priority: 'low',
          createdAt: now - 1000 * 60 * 60 * 18,
          recurring: 'none',
          children: [],
        },
      ],
    },
    {
      id: 'demo-task-3',
      title: 'Plan next week exam strategy',
      completed: false,
      priority: 'low',
      dueDate: toDate(5),
      recurring: 'weekly',
      createdAt: now - 1000 * 60 * 60 * 12,
      notes: 'Prioritize weak chapters first, then timed recall.',
      isExpanded: true,
      children: [
        {
          id: 'demo-task-3-1',
          title: 'Map chapters by difficulty',
          completed: true,
          priority: 'low',
          createdAt: now - 1000 * 60 * 60 * 10,
          recurring: 'none',
          children: [],
        },
      ],
    },
  ];

  const demoNotes: Note[] = [
    {
      id: 'demo-note-1',
      title: 'Neural Networks quick map',
      content:
        '<h2>Neural Networks</h2><p><strong>Core idea:</strong> learn a function by adjusting weights through gradient descent.</p><ul><li>Forward pass computes predictions</li><li>Backpropagation updates parameters</li><li>Regularization reduces overfitting</li></ul><blockquote>Best exam cue: explain the role of activation functions.</blockquote>',
      tags: ['AI', 'Revision'],
      createdAt: now - 1000 * 60 * 60 * 36,
      updatedAt: now - 1000 * 60 * 60 * 8,
      pinned: true,
      color: '#eff6ff',
      trashed: false,
    },
    {
      id: 'demo-note-2',
      title: 'Operating Systems crash recap',
      content:
        '<h2>Processes vs Threads</h2><p>Processes have isolated memory, threads share process memory and are lighter.</p><ol><li>Context switch cost is lower for threads</li><li>Race conditions happen in shared data access</li><li>Use mutexes/semaphores for synchronization</li></ol><p><em>Remember:</em> deadlock requires 4 conditions.</p>',
      tags: ['OS', 'Systems'],
      createdAt: now - 1000 * 60 * 60 * 30,
      updatedAt: now - 1000 * 60 * 60 * 6,
      pinned: false,
      color: '#f8fafc',
      trashed: false,
    },
  ];

  const demoFocusSessions: FocusSession[] = [
    {
      id: 'demo-focus-1',
      duration: 25,
      completedAt: now - 1000 * 60 * 60 * 3,
      mode: 'focus',
      taskId: 'demo-task-1',
    },
    {
      id: 'demo-focus-2',
      duration: 45,
      completedAt: now - 1000 * 60 * 60 * 26,
      mode: 'focus',
      taskId: 'demo-task-2',
    },
    {
      id: 'demo-focus-3',
      duration: 30,
      completedAt: now - 1000 * 60 * 60 * 50,
      mode: 'focus',
      taskId: 'demo-task-3',
    },
  ];

  return {
    ...base,
    tasks: demoTasks,
    notes: demoNotes,
    focusHistory: demoFocusSessions,
  };
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
