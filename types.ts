export type Priority = 'low' | 'medium' | 'high';
export type PlannerLabel = 'study' | 'break' | 'personal';
export type PlannerRepeat = 'none' | 'daily' | 'weekly' | 'monthly';
export type LearningMode = 'quick-revision' | 'exam-mode' | 'deep-learning';

export interface Project {
  id: string;
  name: string;
  color?: string;
  isDemo?: boolean;
}

export interface Section {
  id: string;
  projectId: string;
  name: string;
  order?: number;
  isDemo?: boolean;
}

export interface Label {
  id: string;
  name: string;
  color?: string;
  isDemo?: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  time?: string;
  deadline?: string;
  recurring?: string;
  recurringRule?: string;
  reminders?: string[];
  projectId?: string;
  sectionId?: string;
  labels?: string[];
  studyState?: 'To Study' | 'In Revision' | 'Ready for Exam';
  subject?: string;
  taskType?: string;
  estimatedTime?: number;
  effortLevel?: number;
  createdAt: number;
  children: Task[];
  notes?: string;
  isExpanded?: boolean;
  aiRisk?: 'on-track' | 'at-risk' | 'urgent' | 'can-defer';
  aiSuggestedPriority?: 'low' | 'medium' | 'high';
  aiSuggestedNextStep?: string;
  aiGenerated?: boolean;
  isDemo?: boolean;
}

export type BlockType = 
  | 'paragraph' 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'bullet' 
  | 'numbered' 
  | 'todo' 
  | 'toggle' 
  | 'quote' 
  | 'callout' 
  | 'divider' 
  | 'code' 
  | 'toc' 
  | 'image' 
  | 'file' 
  | 'embed';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  children?: Block[];
  metadata?: Record<string, any>;
  isExpanded?: boolean;
}

export interface NoteProperty {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'link' | 'relation';
  value: any;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Keep for backward compatibility/preview
  blocks: Block[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  color?: string;
  trashed?: boolean;
  isDemo?: boolean;
  
  // Rich Properties
  subject?: string;
  topic?: string;
  status?: 'draft' | 'in-progress' | 'completed' | 'archived';
  type?: 'lecture' | 'reading' | 'research' | 'exam-prep' | 'summary' | 'other';
  examRelevance?: 'low' | 'medium' | 'high';
  difficulty?: 'easy' | 'medium' | 'hard';
  favorite?: boolean;
  sourceLink?: string;
  relatedTaskId?: string;
  relatedSessionId?: string;
  relatedPlannerId?: string;
  revisionStage?: number; // 0-5 for spaced repetition
  
  // Knowledge Linkage
  backlinks?: string[]; // IDs of notes linking here
}

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  blocks: Block[];
  defaultProperties: Partial<Note>;
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
  isDemo?: boolean;
}

export interface FocusSession {
  id: string;
  duration: number;
  completedAt: number;
  mode: 'focus' | 'short-break' | 'long-break';
  taskId?: string;
  isDemo?: boolean;
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
  isDemo?: boolean;
}

export interface StudySummary {
  headline: string;
  concise: string;
  bullets: string[];
  memoryHooks?: string[];
  examSignals?: string[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  suggestedSeconds?: number;
}

export interface StudyPack {
  keyTopics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  summary: StudySummary;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  studyPlan: string[];
  conceptChecks: string[];
}

export interface WeakArea {
  topic: string;
  misses: number;
  corrects: number;
  lastMissedAt: number;
  lastPracticedAt: number;
  lastQuestion?: string;
  lastExplanation?: string;
}

export interface AppData {
  tasks: Task[];
  projects: Project[];
  sections: Section[];
  labels: Label[];
  notes: Note[];
  planner: PlannerEvent[];
  focusHistory: FocusSession[];
  files: FileMeta[];
  weakAreas: WeakArea[];
  settings: {
    theme: 'light' | 'dark';
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
  };
}
