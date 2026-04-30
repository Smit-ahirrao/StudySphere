import React from 'react';
import { 
  BookOpen, 
  FileText, 
  GraduationCap, 
  FlaskConical, 
  PenTool, 
  ClipboardList,
  Sparkles,
  Search
} from 'lucide-react';
import { NoteTemplate } from '../../types';
import { Card } from '../UI';

interface NoteTemplateSelectorProps {
  onSelect: (template: NoteTemplate) => void;
  onClose: () => void;
}

const TEMPLATES: NoteTemplate[] = [
  {
    id: 'tpl-lecture',
    name: 'Lecture Notes',
    description: 'Structure for capturing key points, questions, and summaries during a lecture.',
    icon: 'GraduationCap',
    defaultProperties: { type: 'lecture', status: 'in-progress', examRelevance: 'high' },
    blocks: [
      { id: 't1', type: 'h1', content: 'Lecture Topic' },
      { id: 't2', type: 'callout', content: 'Objective: What do we need to learn today?' },
      { id: 't3', type: 'h2', content: 'Main Content' },
      { id: 't4', type: 'bullet', content: 'Key point 1' },
      { id: 't5', type: 'bullet', content: 'Key point 2' },
      { id: 't6', type: 'h2', content: 'Questions' },
      { id: 't7', type: 'bullet', content: 'What remains unclear?' },
      { id: 't8', type: 'divider', content: '' },
      { id: 't9', type: 'h2', content: 'Summary' },
      { id: 't10', type: 'paragraph', content: 'Summarize the core concepts in 3 sentences.' },
    ]
  },
  {
    id: 'tpl-summary',
    name: 'Chapter Summary',
    description: 'Perfect for condensing a textbook chapter into a digestible revision guide.',
    icon: 'BookOpen',
    defaultProperties: { type: 'summary', status: 'draft', difficulty: 'medium' },
    blocks: [
      { id: 's1', type: 'h1', content: 'Chapter Title' },
      { id: 's2', type: 'h2', content: 'Core Concepts' },
      { id: 's3', type: 'numbered', content: 'First major concept' },
      { id: 's4', type: 'numbered', content: 'Second major concept' },
      { id: 's5', type: 'quote', content: 'Key definition or core principle.' },
      { id: 's6', type: 'h2', content: 'Visual Map / Diagram' },
      { id: 's7', type: 'paragraph', content: '[Insert Diagram Placeholder]' },
    ]
  },
  {
    id: 'tpl-exam',
    name: 'Exam Prep Sheet',
    description: 'Strategic planning and high-yield content for upcoming exams.',
    icon: 'FileText',
    defaultProperties: { type: 'exam-prep', status: 'in-progress', examRelevance: 'high' },
    blocks: [
      { id: 'e1', type: 'h1', content: 'Exam: Subject Name' },
      { id: 'e2', type: 'todo', content: 'Complete past paper 2023' },
      { id: 'e3', type: 'todo', content: 'Review formula derivation' },
      { id: 'e4', type: 'h2', content: 'High-Yield Topics' },
      { id: 'e5', type: 'bullet', content: 'Topic A (Frequency: High)' },
      { id: 'e6', type: 'bullet', content: 'Topic B (Frequency: High)' },
      { id: 'e7', type: 'callout', content: 'Focus Area: Time management during Part B.' },
    ]
  },
  {
    id: 'tpl-lab',
    name: 'Lab Note',
    description: 'Document experiments, observations, and data results clearly.',
    icon: 'FlaskConical',
    defaultProperties: { type: 'reading', status: 'draft' },
    blocks: [
      { id: 'l1', type: 'h1', content: 'Experiment: Title' },
      { id: 'l2', type: 'h2', content: 'Objective' },
      { id: 'l3', type: 'paragraph', content: 'Hypothesis and goal.' },
      { id: 'l4', type: 'h2', content: 'Apparatus & Method' },
      { id: 'l5', type: 'bullet', content: 'Step 1' },
      { id: 'l6', type: 'h2', content: 'Observations' },
      { id: 'l7', type: 'code', content: 'Raw data / code results here' },
      { id: 'l8', type: 'h2', content: 'Conclusion' },
    ]
  }
];

const IconMap: Record<string, any> = {
  GraduationCap,
  BookOpen,
  FileText,
  FlaskConical,
  PenTool,
  ClipboardList
};

const NoteTemplateSelector: React.FC<NoteTemplateSelectorProps> = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-[32px] bg-white dark:bg-slate-950 p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-950 dark:text-white">Start with a template</h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Jumpstart your productivity with pre-built structures.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors">
            <Search className="text-slate-400" size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEMPLATES.map(template => {
            const Icon = IconMap[template.icon] || FileText;
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="group flex flex-col items-start p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-left transition hover:border-sky-200 hover:bg-sky-50/30 dark:hover:border-sky-900/50 dark:hover:bg-sky-950/20"
              >
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="text-sky-500" size={24} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{template.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{template.description}</p>
              </button>
            );
          })}
          
          <button
            onClick={() => onSelect({ id: 'empty', name: 'Empty Note', description: '', icon: '', blocks: [{ id: '1', type: 'paragraph', content: '' }], defaultProperties: {} })}
            className="flex items-center gap-4 p-6 rounded-[24px] border border-dashed border-slate-200 dark:border-slate-800 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900 col-span-1 sm:col-span-2 mt-2"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Sparkles className="text-slate-400" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Start from scratch</h3>
              <p className="text-xs text-slate-400">Blank page for complete freedom.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteTemplateSelector;
