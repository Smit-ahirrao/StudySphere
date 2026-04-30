import React from 'react';
import { 
  Calendar, 
  Tag, 
  Flag, 
  BarChart2, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle2, 
  Clock,
  BookOpen,
  Layout
} from 'lucide-react';
import { Note } from '../../types';

interface NotePropertiesProps {
  note: Note;
  onChange: (updates: Partial<Note>) => void;
}

const NoteProperties: React.FC<NotePropertiesProps> = ({ note, onChange }) => {
  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-4 py-6 md:grid-cols-2">
      <PropertyRow 
        icon={Clock} 
        label="Status"
        value={
          <select 
            value={note.status || 'draft'} 
            onChange={(e) => onChange({ status: e.target.value as any })}
            className="bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="draft">Draft</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        }
      />

      <PropertyRow 
        icon={BookOpen} 
        label="Type"
        value={
          <select 
            value={note.type || 'other'} 
            onChange={(e) => onChange({ type: e.target.value as any })}
            className="bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="lecture">Lecture</option>
            <option value="reading">Reading</option>
            <option value="research">Research</option>
            <option value="exam-prep">Exam Prep</option>
            <option value="summary">Summary</option>
            <option value="other">Other</option>
          </select>
        }
      />

      <PropertyRow 
        icon={BarChart2} 
        label="Difficulty"
        value={
          <select 
            value={note.difficulty || 'medium'} 
            onChange={(e) => onChange({ difficulty: e.target.value as any })}
            className="bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        }
      />

      <PropertyRow 
        icon={Flag} 
        label="Exam Relevance"
        value={
          <select 
            value={note.examRelevance || 'medium'} 
            onChange={(e) => onChange({ examRelevance: e.target.value as any })}
            className="bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        }
      />

      <PropertyRow 
        icon={Layout} 
        label="Subject"
        value={
          <input 
            type="text" 
            placeholder="No subject"
            value={note.subject || ''} 
            onChange={(e) => onChange({ subject: e.target.value })}
            className="bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
          />
        }
      />

      <PropertyRow 
        icon={Tag} 
        label="Topic"
        value={
          <input 
            type="text" 
            placeholder="No topic"
            value={note.topic || ''} 
            onChange={(e) => onChange({ topic: e.target.value })}
            className="bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
          />
        }
      />

      <PropertyRow 
        icon={LinkIcon} 
        label="Source Link"
        value={
          <input 
            type="text" 
            placeholder="Add source link"
            value={note.sourceLink || ''} 
            onChange={(e) => onChange({ sourceLink: e.target.value })}
            className="bg-transparent outline-none text-sm font-medium text-sky-600 dark:text-sky-400 placeholder:text-slate-400 truncate"
          />
        }
      />

      <PropertyRow 
        icon={Calendar} 
        label="Created"
        value={
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {new Date(note.createdAt).toLocaleDateString()}
          </div>
        }
      />
    </div>
  );
};

interface PropertyRowProps {
  icon: any;
  label: string;
  value: React.ReactNode;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 group">
    <div className="flex w-32 flex-shrink-0 items-center gap-2 text-slate-400 group-hover:text-slate-500 transition-colors">
      <Icon size={14} />
      <span className="text-[13px] font-medium uppercase tracking-wider">{label}</span>
    </div>
    <div className="flex-1">{value}</div>
  </div>
);

export default NoteProperties;
