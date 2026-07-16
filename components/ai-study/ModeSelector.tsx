import React from 'react';
import { Brain, Rocket, TimerReset, FileQuestion } from 'lucide-react';
import { LearningMode } from '../../types';

const MODES: Array<{
  id: LearningMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  {
    id: 'quick-revision',
    label: 'Quick Revision',
    description: 'Short summary, sharp key points, rapid review.',
    icon: Rocket,
  },
  {
    id: 'exam-mode',
    label: 'Exam Mode',
    description: 'Timer-ready MCQs with stronger quiz pressure.',
    icon: TimerReset,
  },
  {
    id: 'deep-learning',
    label: 'Deep Learning',
    description: 'More explanation, concepts, and understanding checks.',
    icon: Brain,
  },
  {
    id: 'question-solver',
    label: 'Question Solver',
    description: 'Provide a question bank, get professional solutions.',
    icon: FileQuestion,
  },
];

interface Props {
  value: LearningMode;
  onChange: (mode: LearningMode) => void;
}

const ModeSelector: React.FC<Props> = ({ value, onChange }) => (
  <div className="space-y-3">
    <div>
      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Step 2: choose a learning mode</div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Each mode tunes the summary depth, recall style, and quiz pressure while keeping the interface calm.</p>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      {MODES.map((mode) => {
        const active = mode.id === value;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={`rounded-[24px] border p-4 text-left transition ${
              active
                ? 'border-sky-400 bg-slate-950 text-white shadow-lg shadow-sky-500/10 dark:bg-sky-400 dark:text-slate-950'
                : 'border-slate-200 bg-white/80 hover:border-sky-200 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-sky-800 dark:hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${active ? 'bg-white/15 dark:bg-slate-950/15' : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'}`}>
                <mode.icon size={18} />
              </div>
              <div>
                <div className="font-semibold">{mode.label}</div>
                <div className={`mt-1 text-sm ${active ? 'text-white/75 dark:text-slate-900/75' : 'text-slate-500 dark:text-slate-400'}`}>
                  {mode.description}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default ModeSelector;
