import React from 'react';
import { BrainCircuit, FileQuestion, ListChecks, CheckSquare } from 'lucide-react';

export type StudyOutputTab = 'summary' | 'flashcards' | 'quiz' | 'solutions';

interface Props {
  activeTab: StudyOutputTab;
  onChange: (tab: StudyOutputTab) => void;
  showSolutions?: boolean;
}

const tabs: Array<{
  id: StudyOutputTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  condition?: (props: Props) => boolean;
}> = [
  { id: 'summary', label: 'Summary', icon: ListChecks, condition: (p) => !p.showSolutions },
  { id: 'flashcards', label: 'Flashcards', icon: BrainCircuit, condition: (p) => !p.showSolutions },
  { id: 'quiz', label: 'Quiz', icon: FileQuestion, condition: (p) => !p.showSolutions },
  { id: 'solutions', label: 'Solutions', icon: CheckSquare, condition: (p) => !!p.showSolutions },
];

const OutputTabs: React.FC<Props> = (props) => (
  <div className="flex flex-wrap gap-2">
    {tabs.filter(t => t.condition ? t.condition(props) : true).map((tab) => {
      const active = tab.id === props.activeTab;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => props.onChange(tab.id)}
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
