import React from 'react';
import { BrainCircuit, FileQuestion, ListChecks } from 'lucide-react';

export type StudyOutputTab = 'summary' | 'flashcards' | 'quiz';

interface Props {
  activeTab: StudyOutputTab;
  onChange: (tab: StudyOutputTab) => void;
}

const tabs: Array<{
  id: StudyOutputTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: 'summary', label: 'Summary', icon: ListChecks },
  { id: 'flashcards', label: 'Flashcards', icon: BrainCircuit },
  { id: 'quiz', label: 'Quiz', icon: FileQuestion },
];

const OutputTabs: React.FC<Props> = ({ activeTab, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {tabs.map((tab) => {
      const active = tab.id === activeTab;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            active
              ? 'bg-slate-950 text-white shadow-md shadow-sky-500/10 dark:bg-sky-400 dark:text-slate-950'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <tab.icon size={15} />
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default OutputTabs;
