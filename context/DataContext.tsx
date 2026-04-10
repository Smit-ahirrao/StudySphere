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
  updateSettings: (settings: AppData['settings']) => void;
  importBackup: (jsonData: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AppData>(loadData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setData(loadData());
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

  const updateSettings = (settings: AppData['settings']) => setData((prev) => ({ ...prev, settings }));

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

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
