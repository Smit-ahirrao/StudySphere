import React, { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Download, Pin, Plus, Search, Tag, Trash2, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Note } from '../types';
import { Badge, Button, Card, Input, SectionHeading, Textarea } from '../components/UI';

const COLORS = ['#ffffff', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#ede9fe'];

const Notes: React.FC = () => {
  const { data, addNote, updateNote } = useData();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const filteredNotes = useMemo(
    () =>
      [...data.notes]
        .filter((note) => (showTrash ? note.trashed : !note.trashed))
        .filter(
          (note) =>
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt),
    [data.notes, searchTerm, showTrash]
  );

  const activeNote = filteredNotes.find((note) => note.id === activeNoteId) || filteredNotes[0] || null;
  const activeNoteWords = activeNote?.content.trim() ? activeNote.content.trim().split(/\s+/).length : 0;

  const createNote = () => {
    const note: Note = {
      id: uuidv4(),
      title: 'Untitled note',
      content: '',
      tags: [],
      pinned: false,
      color: '#ffffff',
      trashed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addNote(note);
    setActiveNoteId(note.id);
  };

  const patchActiveNote = (changes: Partial<Note>) => {
    if (!activeNote) return;
    setSaving(true);
    updateNote({ ...activeNote, ...changes, updatedAt: Date.now() });
    window.setTimeout(() => setSaving(false), 350);
  };

  const exportNote = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${activeNote.title}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const addTag = () => {
    if (!activeNote) return;
    const cleaned = tagInput.trim().replace(/^#/, '');
    if (!cleaned || activeNote.tags.includes(cleaned)) return;
    patchActiveNote({ tags: [...activeNote.tags, cleaned] });
    setTagInput('');
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Knowledge Hub"
        title="Capture what matters while it is still fresh"
        description="Create revision notes, brainstorm ideas, and keep important material pinned and searchable."
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="h-[calc(100vh-16rem)] overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="space-y-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Notes library</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{filteredNotes.length} visible</p>
                </div>
                <Button size="sm" onClick={createNote}>
                  <Plus size={14} />
                  New
                </Button>
              </div>

              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-11" placeholder="Search title or content..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
              </div>

              <Button variant="ghost" size="sm" onClick={() => setShowTrash((value) => !value)} className="justify-start">
                {showTrash ? 'Back to active notes' : 'Open trash'}
              </Button>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  No notes here yet. Create one to start building your study vault.
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setActiveNoteId(note.id)}
                    style={{ background: note.color }}
                    className={`w-full rounded-[24px] border p-4 text-left shadow-sm transition ${
                      activeNote?.id === note.id ? 'border-cyan-400 ring-4 ring-cyan-100 dark:ring-cyan-950' : 'border-slate-200 hover:border-cyan-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate font-medium text-slate-900">{note.title}</div>
                      {note.pinned ? <Pin size={14} className="text-slate-700" /> : null}
                    </div>
                    <p className="mt-2 max-h-10 overflow-hidden text-sm text-slate-600">{note.content || 'Empty note'}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="min-h-[calc(100vh-16rem)]">
          {!activeNote ? (
            <div className="flex h-full min-h-[480px] flex-col items-center justify-center text-center">
              <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">Select a note or create a new one</h3>
              <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                StudySphere notes are now built to feel calmer and more intentional, so your content stays the focus.
              </p>
            </div>
          ) : (
            <div className="flex h-full min-h-[480px] flex-col">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex-1">
                  <input
                    value={activeNote.title}
                    onChange={(event) => patchActiveNote({ title: event.target.value })}
                    className="w-full bg-transparent text-3xl font-semibold tracking-tight text-slate-950 outline-none dark:text-white"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge color="cyan">{activeNoteWords} words</Badge>
                    <Badge color="gray">{Math.max(1, Math.ceil(activeNoteWords / 200))} min read</Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{saving ? 'Saving...' : 'Saved locally'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => patchActiveNote({ pinned: !activeNote.pinned })}>
                    <Pin size={14} />
                    {activeNote.pinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={exportNote}>
                    <Download size={14} />
                    Export
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-600 dark:text-rose-300" onClick={() => patchActiveNote({ trashed: true })}>
                    <Trash2 size={14} />
                    Move to trash
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => patchActiveNote({ color })}
                    style={{ background: color }}
                    className={`h-9 w-9 rounded-full border shadow-sm ${activeNote.color === color ? 'ring-4 ring-cyan-100 dark:ring-cyan-950' : 'border-slate-200'}`}
                  />
                ))}
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Tag size={14} />
                  Tags
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeNote.tags.length === 0 ? (
                    <span className="text-sm text-slate-500 dark:text-slate-400">No tags yet. Add tags for subjects, units, or revision themes.</span>
                  ) : (
                    activeNote.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                        #{tag}
                        <button type="button" onClick={() => patchActiveNote({ tags: activeNote.tags.filter((item) => item !== tag) })}>
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') addTag();
                    }}
                  />
                  <Button size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex-1">
                <Textarea
                  value={activeNote.content}
                  onChange={(event) => patchActiveNote({ content: event.target.value })}
                  placeholder="Write lecture summaries, revision points, formulas, or quick ideas..."
                  className="h-full min-h-[420px] resize-none border-none bg-transparent px-0 py-2 text-base leading-8 shadow-none focus:ring-0"
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Notes;
