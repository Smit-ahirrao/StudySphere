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
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  Table as TableIcon,
  Columns,
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
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Note, NoteTemplate, Block } from '../types';
import { Badge, Button, Card, Input, SectionHeading } from '../components/UI';
import { summarizeNoteContent } from '../utils/aiStudy';
import BlockEditor from '../components/notes/BlockEditor';
import NoteProperties from '../components/notes/NoteProperties';
import { ListView, GalleryView, TableView, BoardView } from '../components/notes/NoteViews';
import NoteTemplateSelector from '../components/notes/NoteTemplateSelector';

const Notes: React.FC = () => {
  const { data, addNote, updateNote, deleteNote } = useData();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [view, setView] = useState<'list' | 'table' | 'gallery' | 'board'>('gallery');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {activeNote ? (
        // Workspace View
        <div className="flex flex-col h-full bg-white dark:bg-slate-950 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Workspace Header */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-slate-50 dark:border-slate-900">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveNoteId(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors text-slate-400"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">My Vault /</span>
                <span className="text-xs text-slate-900 dark:text-white font-bold">{activeNote.title}</span>
              </div>
              <span className="text-[10px] text-slate-300 ml-2">
                {saving ? 'Saving...' : 'All changes saved'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleUpdateNote({ pinned: !activeNote.pinned })}>
                <Pin size={16} className={activeNote.pinned ? 'text-sky-500 fill-sky-500' : ''} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDuplicate}>
                <Copy size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="text-rose-500" onClick={() => handleUpdateNote({ trashed: true })}>
                <Trash2 size={16} />
              </Button>
              <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-2" />
              <Button size="sm">
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Workspace Content */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8 md:px-16 py-12 scrollbar-hide">
              <div className="max-w-4xl mx-auto">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNote({ title: e.target.value })}
                  placeholder="Untitled Note"
                  className="w-full text-5xl font-extrabold text-slate-950 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-200 mb-8 tracking-tight"
                />
                
                <NoteProperties 
                  note={activeNote} 
                  onChange={handleUpdateNote} 
                />

                <div className="h-px bg-slate-100 dark:bg-slate-800 w-full my-8" />

                <BlockEditor 
                  blocks={activeNote.blocks || []} 
                  onChange={(blocks) => handleUpdateNote({ blocks })} 
                />
              </div>
            </div>

            {/* Sidebar for AI & Knowledge */}
            <div className="w-80 border-l border-slate-50 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10 p-6 overflow-y-auto hidden lg:block">
              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Sparkles size={14} className="text-sky-500" />
                    AI Intelligence
                  </h4>
                  <div className="space-y-3">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full justify-start" 
                      onClick={handleAiSummarize}
                      isLoading={summaryLoading}
                    >
                      {summaryLoading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <History size={14} className="mr-2" />}
                      Generate Summary
                    </Button>
                    {aiSummary && (
                      <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 text-[11px] text-sky-800 dark:text-sky-200 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold uppercase tracking-wider">AI Summary</span>
                          <button onClick={() => setAiSummary(null)}><X size={12} /></button>
                        </div>
                        <p className="leading-relaxed">{aiSummary}</p>
                      </div>
                    )}
                    <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => {}}>
                      <BookMarked size={14} className="mr-2" />
                      Create Flashcards
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => {}}>
                      <LayoutGrid size={14} className="mr-2" />
                      Generate Quiz
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <History size={14} />
                    Linked Knowledge
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 mb-2">Backlinks</div>
                      <div className="text-xs text-slate-400 italic">No notes link here yet</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 mb-2">Related by Topic</div>
                      <div className="space-y-2">
                        {data.notes
                          .filter(n => n.id !== activeNote.id && n.topic === activeNote.topic && activeNote.topic)
                          .slice(0, 3)
                          .map(n => (
                            <button 
                              key={n.id} 
                              onClick={() => setActiveNoteId(n.id)}
                              className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs hover:border-sky-200 transition"
                            >
                              <div className="font-medium text-slate-900 dark:text-white truncate">{n.title}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{n.subject}</div>
                            </button>
                          ))}
                        {(!activeNote.topic || data.notes.filter(n => n.id !== activeNote.id && n.topic === activeNote.topic).length === 0) && (
                          <div className="text-xs text-slate-400 italic">No related notes found</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Library View
        <div className="space-y-8 h-full flex flex-col">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Knowledge Base"
              title="Your Second Brain"
              description="Organize your study material with structured blocks and rich properties."
            />
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => setShowTemplateSelector(true)}>
                <Sparkles size={18} className="mr-2" />
                Templates
              </Button>
              <Button onClick={() => handleCreateNote()}>
                <Plus size={18} className="mr-2" />
                New Note
              </Button>
            </div>
          </div>

          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-[32px]">
            {/* View Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b border-slate-50 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    className="pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-sm outline-none w-64 focus:ring-2 focus:ring-sky-100 transition"
                    placeholder="Search your notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                  <ViewButton active={view === 'gallery'} onClick={() => setView('gallery')} icon={LayoutGrid} />
                  <ViewButton active={view === 'list'} onClick={() => setView('list')} icon={ListIcon} />
                  <ViewButton active={view === 'table'} onClick={() => setView('table')} icon={TableIcon} />
                  <ViewButton active={view === 'board'} onClick={() => setView('board')} icon={Columns} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Filter size={14} />
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent border-none outline-none font-bold text-slate-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <ArrowUpDown size={14} />
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent border-none outline-none font-bold text-slate-900 dark:text-white"
                  >
                    <option value="updatedAt">Last Edited</option>
                    <option value="createdAt">Created Date</option>
                    <option value="title">Alphabetical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {filteredNotes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                    <BookMarked size={32} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">No notes found</h3>
                  <p className="text-slate-500 max-w-xs mt-2">Try adjusting your search or filters, or create a new note to get started.</p>
                </div>
              ) : (
                <>
                  {view === 'gallery' && <GalleryView notes={filteredNotes} activeNoteId={activeNoteId} onSelect={setActiveNoteId} />}
                  {view === 'list' && <ListView notes={filteredNotes} activeNoteId={activeNoteId} onSelect={setActiveNoteId} />}
                  {view === 'table' && <TableView notes={filteredNotes} onSelect={setActiveNoteId} />}
                  {view === 'board' && <BoardView notes={filteredNotes} onSelect={setActiveNoteId} />}
                </>
              )}
            </div>
          </Card>
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

const ViewButton = ({ active, onClick, icon: Icon }: { active: boolean, onClick: () => void, icon: any }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded-lg transition-all ${
      active ? 'bg-white dark:bg-slate-800 shadow-sm text-sky-500' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <Icon size={16} />
  </button>
);

export default Notes;
