import { AppData, FileMeta, Note, PlannerEvent, WeakArea } from '../types';
import { normalizeTasks } from './taskHelpers';

const STORAGE_KEY = 'studysphere_data_v2';

const DEFAULT_DATA: AppData = {
  tasks: [],
  notes: [],
  planner: [],
  focusHistory: [],
  files: [],
  weakAreas: [],
  settings: {
    theme: 'light',
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
  },
};

const normalizeNotes = (notes: unknown): Note[] => {
  if (!Array.isArray(notes)) return [];
  return notes.map((note: any) => ({
    id: String(note.id),
    title: note.title || 'Untitled Note',
    content: note.content || '',
    tags: Array.isArray(note.tags) ? note.tags : [],
    createdAt: Number(note.createdAt || Date.now()),
    updatedAt: Number(note.updatedAt || Date.now()),
    pinned: Boolean(note.pinned),
    color: note.color || '#ffffff',
    trashed: Boolean(note.trashed),
    isDemo: Boolean(note.isDemo),
  }));
};

const normalizePlanner = (planner: unknown): PlannerEvent[] => {
  if (!Array.isArray(planner)) return [];
  return planner.map((event: any) => ({
    id: String(event.id),
    title: event.title || 'Untitled Session',
    startTime: Number(event.startTime || 9),
    duration: Number(event.duration || 1),
    day: event.day || new Date().toISOString().slice(0, 10),
    taskId: event.taskId || undefined,
    label: event.label || 'study',
    notes: event.notes || event.note || '',
    repeat: event.repeat || 'none',
    reminder: Boolean(event.reminder),
    color: event.color || 'blue',
    isDemo: Boolean(event.isDemo),
  }));
};

const normalizeFiles = (files: unknown): FileMeta[] => {
  if (!Array.isArray(files)) return [];
  return files.map((file: any) => ({
    id: String(file.id),
    name: file.name || 'Untitled file',
    size: Number(file.size || 0),
    type: file.type || 'application/octet-stream',
    uploadedAt: Number(file.uploadedAt || Date.now()),
    previewUrl: file.previewUrl || undefined,
    folder: file.folder || 'all',
    pinned: Boolean(file.pinned),
    notes: file.notes || '',
    isDemo: Boolean(file.isDemo),
  }));
};

const normalizeWeakAreas = (weakAreas: unknown): WeakArea[] => {
  if (!Array.isArray(weakAreas)) return [];
  return weakAreas
    .map((item: any) => ({
      topic: typeof item?.topic === 'string' ? item.topic : '',
      misses: Math.max(1, Number(item?.misses || 1)),
      corrects: Math.max(0, Number(item?.corrects || 0)),
      lastMissedAt: Number(item?.lastMissedAt || Date.now()),
      lastPracticedAt: Number(item?.lastPracticedAt || item?.lastMissedAt || Date.now()),
      lastQuestion: typeof item?.lastQuestion === 'string' ? item.lastQuestion : '',
      lastExplanation: typeof item?.lastExplanation === 'string' ? item.lastExplanation : '',
    }))
    .filter((item) => item.topic.trim().length > 0);
};

export const loadData = (): AppData => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('studysphere_data_v1');
    if (!serialized) return DEFAULT_DATA;

    const parsed = JSON.parse(serialized);
    return {
      ...DEFAULT_DATA,
      ...parsed,
      tasks: normalizeTasks(parsed.tasks || []),
      notes: normalizeNotes(parsed.notes),
      planner: normalizePlanner(parsed.planner),
      files: [], // Files are strictly managed via IndexedDB in Files.tsx
      focusHistory: Array.isArray(parsed.focusHistory) ? parsed.focusHistory : [],
      weakAreas: normalizeWeakAreas(parsed.weakAreas),
      settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
    };
  } catch (error) {
    console.error('Failed to load data:', error);
    return DEFAULT_DATA;
  }
};

export const saveData = (data: AppData): void => {
  try {
    const { files, ...dataToSave } = data; // Omit files from localStorage sync
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Failed to save data:', error);
    alert('Failed to save data. Local storage might be full.');
  }
};

export const exportData = (data: AppData) => {
  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', 'studysphere_backup.json');
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
