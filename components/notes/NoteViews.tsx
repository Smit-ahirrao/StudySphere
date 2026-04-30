import React from 'react';
import { 
  Pin, 
  Calendar, 
  Clock, 
  Tag as TagIcon, 
  ChevronRight,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  Table as TableIcon,
  Columns
} from 'lucide-react';
import { Note } from '../../types';
import { Badge, Card } from '../UI';

interface NoteViewsProps {
  view: 'list' | 'table' | 'gallery' | 'board';
  notes: Note[];
  activeNoteId: string | null;
  onSelect: (id: string) => void;
}

export const ListView: React.FC<{ notes: Note[], activeNoteId: string | null, onSelect: (id: string) => void }> = ({ notes, activeNoteId, onSelect }) => (
  <div className="space-y-1">
    {notes.map(note => (
      <button
        key={note.id}
        onClick={() => onSelect(note.id)}
        className={`w-full group flex items-center gap-4 rounded-xl px-4 py-3 text-left transition ${
          activeNoteId === note.id ? 'bg-sky-50 dark:bg-sky-950/30 ring-1 ring-sky-200 dark:ring-sky-800' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
        }`}
      >
        <div className={`h-2.5 w-2.5 rounded-full ${activeNoteId === note.id ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-slate-900 dark:text-white">{note.title}</span>
            {note.pinned && <Pin size={12} className="text-sky-500" />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
            {note.subject && <span>• {note.subject}</span>}
            {note.status && (
              <span className={`px-1.5 py-0.5 rounded-md ${
                note.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 
                'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
              }`}>
                {note.status}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeNoteId === note.id ? 'text-sky-400' : 'text-slate-300'}`} />
      </button>
    ))}
  </div>
);

export const GalleryView: React.FC<{ notes: Note[], activeNoteId: string | null, onSelect: (id: string) => void }> = ({ notes, activeNoteId, onSelect }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {notes.map(note => (
      <Card 
        key={note.id}
        onClick={() => onSelect(note.id)}
        className={`cursor-pointer group flex flex-col h-48 transition-all hover:scale-[1.02] ${
          activeNoteId === note.id ? 'ring-2 ring-sky-400 dark:ring-sky-800' : 'border-slate-200 dark:border-slate-800'
        }`}
        style={{ borderTop: `4px solid ${note.color || '#e2e8f0'}` }}
      >
        <div className="flex-1 p-4 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{note.title}</h3>
            {note.pinned && <Pin size={14} className="text-sky-500 flex-shrink-0" />}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
            {note.blocks?.[0]?.content || 'Empty note'}
          </p>
        </div>
        <div className="mt-auto px-4 py-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex gap-1.5">
            {note.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                #{tag}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-slate-400">{new Date(note.updatedAt).toLocaleDateString()}</span>
        </div>
      </Card>
    ))}
  </div>
);

export const TableView: React.FC<{ notes: Note[], onSelect: (id: string) => void }> = ({ notes, onSelect }) => (
  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Name</th>
          <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
          <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Subject</th>
          <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Difficulty</th>
          <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Edited</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {notes.map(note => (
          <tr 
            key={note.id} 
            onClick={() => onSelect(note.id)}
            className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition"
          >
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                {note.pinned && <Pin size={12} className="text-sky-500" />}
                <span className="font-medium text-slate-900 dark:text-white">{note.title}</span>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                note.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 
                note.status === 'in-progress' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {note.status || 'draft'}
              </span>
            </td>
            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{note.subject || '-'}</td>
            <td className="px-6 py-4">
              <span className={`text-xs ${
                note.difficulty === 'hard' ? 'text-rose-500' : 
                note.difficulty === 'medium' ? 'text-amber-500' : 
                'text-emerald-500'
              }`}>
                {note.difficulty || 'medium'}
              </span>
            </td>
            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
              {new Date(note.updatedAt).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const BoardView: React.FC<{ notes: Note[], onSelect: (id: string) => void }> = ({ notes, onSelect }) => {
  const columns = ['draft', 'in-progress', 'completed'];
  
  return (
    <div className="flex gap-6 overflow-x-auto pb-4 min-h-[500px]">
      {columns.map(status => {
        const columnNotes = notes.filter(n => (n.status || 'draft') === status);
        return (
          <div key={status} className="flex-shrink-0 w-80 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white capitalize">{status}</h3>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full text-xs">{columnNotes.length}</span>
              </div>
              <MoreVertical size={16} className="text-slate-400" />
            </div>
            <div className="flex-1 space-y-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 p-2 border border-slate-100 dark:border-slate-800">
              {columnNotes.map(note => (
                <Card 
                  key={note.id}
                  onClick={() => onSelect(note.id)}
                  className="p-4 cursor-pointer hover:shadow-md transition bg-white dark:bg-slate-900"
                >
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">{note.title}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    {note.subject && <Badge color="blue" size="sm">{note.subject}</Badge>}
                    {note.difficulty && (
                      <span className={`text-[10px] font-bold uppercase ${
                        note.difficulty === 'hard' ? 'text-rose-500' : 'text-amber-500'
                      }`}>{note.difficulty}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                    {note.pinned && <Pin size={10} className="text-sky-500" />}
                  </div>
                </Card>
              ))}
              {columnNotes.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 italic">No notes in this stage</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
