import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ChevronDown,
  Download,
  Loader2,
  Pin,
  Plus,
  Search,
  Trash2,
  Archive,
  ArrowLeft,
  Copy,
  History,
  MoreHorizontal,
  Share2,
  Settings,
  Filter,
  ArrowUpDown,
  BookMarked,
  X,
  Sparkles
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Note, NoteTemplate, Block } from '../types';
import { Badge, Button, Card, Input } from '../components/UI';
import { summarizeNoteContent } from '../utils/aiStudy';
import BlockEditor from '../components/notes/BlockEditor';
import NoteTemplateSelector from '../components/notes/NoteTemplateSelector';
import AIChatTutor from '../components/ai-study/AIChatTutor';
import { PanelRightOpen, PanelRightClose, BookOpen } from 'lucide-react';

const Notes: React.FC = () => {
  const { data, addNote, updateNote, deleteNote } = useData();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [view, setView] = useState<'list' | 'table' | 'gallery' | 'board'>('gallery');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showResearchPane, setShowResearchPane] = useState(false);
  
  // Filtering & Sorting
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');

  const filteredNotes = useMemo(() => {
    return data.notes
      .filter((note) => (showTrash ? note.trashed : !note.trashed))
      .filter((note) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = 
          note.title.toLowerCase().includes(query) || 
          note.subject?.toLowerCase().includes(query) ||
          note.tags.some(tag => tag.toLowerCase().includes(query));
        const matchesStatus = filterStatus === 'all' || note.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return b[sortBy] - a[sortBy];
      });
  }, [data.notes, searchTerm, showTrash, filterStatus, sortBy]);

  const activeNote = data.notes.find((note) => note.id === activeNoteId) || null;

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const blocksToText = (blocks: Block[]): string => {
    return blocks.map(b => b.content).join('\n');
  };

  const handleAiSummarize = async () => {
    if (!activeNote) return;
    setSummaryLoading(true);
    try {
      const summary = await summarizeNoteContent(blocksToText(activeNote.blocks), activeNote.title);
      setAiSummary(summary);
    } catch (error) {
      console.error(error);
    } finally {
      setSummaryLoading(true);
      setTimeout(() => setSummaryLoading(false), 800); // Simulate some thought
    }
  };

  const handleCreateNote = (template?: NoteTemplate) => {
    const newNote: Note = {
      id: uuidv4(),
      title: template?.name || 'Untitled note',
      content: '',
      blocks: template?.blocks || [{ id: uuidv4(), type: 'paragraph', content: '' }],
      tags: [],
      pinned: false,
      trashed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: (template?.defaultProperties?.status as any) || 'draft',
      type: (template?.defaultProperties?.type as any) || 'other',
      examRelevance: (template?.defaultProperties?.examRelevance as any) || 'medium',
      difficulty: (template?.defaultProperties?.difficulty as any) || 'medium',
      ...template?.defaultProperties
    };
    addNote(newNote);
    setActiveNoteId(newNote.id);
    setShowTemplateSelector(false);
  };

  const handleUpdateNote = (updates: Partial<Note>) => {
    if (!activeNote) return;
    setSaving(true);
    updateNote({ ...activeNote, ...updates, updatedAt: Date.now() });
    setTimeout(() => setSaving(false), 300);
  };

  const handleDuplicate = () => {
    if (!activeNote) return;
    const duplicate: Note = {
      ...activeNote,
      id: uuidv4(),
      title: `${activeNote.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false
    };
    addNote(duplicate);
    setActiveNoteId(duplicate.id);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* LEFT SIDEBAR (Library) */}
      <div className="w-[320px] flex-shrink-0 flex flex-col bg-white/60 dark:bg-slate-950/60 backdrop-blur-md rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <BookMarked size={20} className="text-sky-500" />
              My Vault
            </h2>
            <Button size="sm" onClick={() => handleCreateNote()}>
              <Plus size={16} />
            </Button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-none text-sm outline-none focus:ring-2 focus:ring-sky-100 transition"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Sidebar List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          {filteredNotes.length === 0 ? (
             <div className="text-center py-8 text-sm text-slate-400">No notes found</div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`w-full group flex flex-col items-start gap-1 rounded-2xl px-4 py-3 text-left transition ${
                  activeNoteId === note.id ? 'bg-sky-50 dark:bg-sky-950/30 ring-1 ring-sky-200 dark:ring-sky-800 shadow-sm' : 'hover:bg-white dark:hover:bg-slate-900 hover-lift border border-transparent hover:border-slate-100 dark:hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-semibold truncate ${activeNoteId === note.id ? 'text-sky-900 dark:text-sky-100' : 'text-slate-900 dark:text-white'}`}>
                    {note.title}
                  </span>
                  {note.pinned && <Pin size={12} className="text-sky-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {note.blocks?.[0]?.content || 'Empty note'}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[10px] font-medium text-slate-400">
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  {note.subject && <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{note.subject}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT MAIN CANVAS (Editor) */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
        {activeNote ? (
          <>
            {/* Editor Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-slate-50 dark:border-slate-900 bg-white/50 backdrop-blur-md dark:bg-slate-950/50 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">
                  {saving ? 'Saving...' : 'All changes saved'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleUpdateNote({ pinned: !activeNote.pinned })}>
                  <Pin size={16} className={activeNote.pinned ? 'text-sky-500 fill-sky-500' : ''} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {}}>
                  <Settings size={16} />
                </Button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                <Button variant="ghost" size="sm" onClick={handleDuplicate}>
                  <Copy size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="text-rose-500" onClick={() => handleUpdateNote({ trashed: true })}>
                  <Trash2 size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowResearchPane(!showResearchPane)} className={showResearchPane ? 'text-sky-500 bg-sky-50 dark:bg-sky-950/30' : ''}>
                  {showResearchPane ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                </Button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto px-8 md:px-16 py-12 scrollbar-hide">
              <div className="max-w-3xl mx-auto">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNote({ title: e.target.value })}
                  placeholder="Untitled Note"
                  className="w-full text-5xl font-extrabold text-slate-950 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-200 mb-8 tracking-tight"
                />
                
                <div className="h-px bg-slate-100 dark:bg-slate-800 w-full my-6" />

                <BlockEditor 
                  blocks={activeNote.blocks || []} 
                  onChange={(blocks) => handleUpdateNote({ blocks })} 
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Create space for your thoughts</h3>
            <p className="text-slate-500 max-w-sm mt-3 leading-relaxed">
              Select a note from your vault on the left, or create a new one to start writing. Use Magic Slash commands inside the editor to study smarter.
            </p>
            <Button className="mt-8 shadow-md" onClick={() => handleCreateNote()}>
              <Plus size={18} className="mr-2" /> Create New Note
            </Button>
          </div>
        )}
      </div>

      {/* RESEARCH PANE (Right Slide-in) */}
      {showResearchPane && activeNote && (
        <div className="w-[400px] flex-shrink-0 flex flex-col bg-slate-50/80 dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-sky-500" />
              <span className="font-bold text-slate-900 dark:text-white">Research & AI</span>
            </div>
            <button onClick={() => setShowResearchPane(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <AIChatTutor documentText={blocksToText(activeNote.blocks)} fileName={activeNote.title} />
          </div>
        </div>
      )}

      {showTemplateSelector && (
        <NoteTemplateSelector 
          onSelect={handleCreateNote} 
          onClose={() => setShowTemplateSelector(false)} 
        />
      )}
    </div>
  );
};

export default Notes;
