import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Download,
  Highlighter,
  Italic,
  Loader2,
  List,
  ListOrdered,
  Palette,
  Pin,
  Plus,
  Search,
  Strikethrough,
  Tag,
  Trash2,
  Type,
  Underline,
  X,
  Sparkles,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Note } from '../types';
import { Badge, Button, Card, Input, SectionHeading } from '../components/UI';
import { summarizeNoteContent } from '../utils/aiStudy';

const NOTE_COLORS = ['#fffdf8', '#f8fafc', '#eff6ff', '#ecfeff', '#f0fdf4', '#fef3c7'];
const EXTRA_NOTE_COLORS = ['#fde68a', '#fecdd3', '#ddd6fe', '#bfdbfe', '#bbf7d0', '#fde2e4'];
const TEXT_COLORS = ['#0f172a', '#2563eb', '#0f766e', '#7c3aed', '#c2410c', '#be123c'];
const HIGHLIGHT_COLORS = ['#fef08a', '#bfdbfe', '#a7f3d0', '#fecaca', '#ddd6fe', '#fdba74'];
const FONT_FAMILIES = [
  { label: 'Sans', value: 'Inter, ui-sans-serif, system-ui' },
  { label: 'Serif', value: 'Georgia, Cambria, serif' },
  { label: 'Mono', value: '"JetBrains Mono", Consolas, monospace' },
  { label: 'Display', value: '"Trebuchet MS", "Segoe UI", sans-serif' },
];
const FONT_SIZES = [
  { label: 'Small', value: '3' },
  { label: 'Normal', value: '4' },
  { label: 'Large', value: '5' },
  { label: 'XL', value: '6' },
];

const Notes: React.FC = () => {
  const { data, addNote, updateNote } = useData();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showExtraPalette, setShowExtraPalette] = useState(false);
  const [showTextPalette, setShowTextPalette] = useState(false);
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const [aiSummaryByNote, setAiSummaryByNote] = useState<Record<string, string>>({});
  const [summaryDismissed, setSummaryDismissed] = useState<Record<string, boolean>>({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const editorRef = useRef<HTMLDivElement | null>(null);

  const filteredNotes = useMemo(
    () =>
      [...data.notes]
        .filter((note) => (showTrash ? note.trashed : !note.trashed))
        .filter((note) => {
          const plain = stripHtml(note.content).toLowerCase();
          const query = searchTerm.toLowerCase();
          return note.title.toLowerCase().includes(query) || plain.includes(query) || note.tags.some((tag) => tag.toLowerCase().includes(query));
        })
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt),
    [data.notes, searchTerm, showTrash]
  );

  const activeNote = filteredNotes.find((note) => note.id === activeNoteId) || filteredNotes[0] || null;
  const activeNoteWords = useMemo(() => countWords(stripHtml(activeNote?.content || '')), [activeNote?.content]);

  useEffect(() => {
    if (activeNote && editorRef.current && editorRef.current.innerHTML !== activeNote.content) {
      editorRef.current.innerHTML = activeNote.content || '';
    }
  }, [activeNote]);

  const createNote = () => {
    const note: Note = {
      id: uuidv4(),
      title: 'Untitled note',
      content: '<p></p>',
      tags: [],
      pinned: false,
      color: NOTE_COLORS[0],
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
    window.setTimeout(() => setSaving(false), 250);
  };

  const handleAiSummarize = async () => {
    if (!activeNote) return;
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const summary = await summarizeNoteContent(stripHtml(activeNote.content), activeNote.title);
      setAiSummaryByNote((prev) => ({ ...prev, [activeNote.id]: summary }));
      setSummaryDismissed((prev) => ({ ...prev, [activeNote.id]: false }));
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : 'Failed to generate summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const exportNote = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeFilename(activeNote.title)}.html`;
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

  const syncEditor = () => {
    if (!activeNote || !editorRef.current) return;
    patchActiveNote({ content: editorRef.current.innerHTML || '<p></p>' });
  };

  const runCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    syncEditor();
  };

  const applyColor = (value: string, type: 'text' | 'highlight') => {
    runCommand(type === 'text' ? 'foreColor' : 'hiliteColor', value);
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Knowledge Hub"
        title="Capture, format, and revise notes without friction"
        description="Keep study notes clean, searchable, and presentation-ready with a richer editor and a calmer workspace."
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[340px_1fr]">
        <Card className="h-[calc(100vh-15rem)] overflow-hidden">
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
                <Input className="pl-11" placeholder="Search notes..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
              </div>

              <Button variant="ghost" size="sm" onClick={() => setShowTrash((value) => !value)} className="justify-start">
                {showTrash ? 'Back to active notes' : 'Open trash'}
              </Button>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {filteredNotes.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  No notes here yet. Create one to start your study vault.
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setActiveNoteId(note.id)}
                    style={{ background: note.color }}
                    className={`w-full rounded-[24px] border p-4 text-left shadow-sm transition ${
                      activeNote?.id === note.id ? 'border-sky-400 ring-4 ring-sky-100 dark:ring-sky-950' : 'border-slate-200 hover:border-sky-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate font-medium text-slate-900">{note.title}</div>
                      {note.pinned ? <Pin size={14} className="text-slate-700" /> : null}
                    </div>
                    <p className="mt-2 max-h-12 overflow-hidden text-sm text-slate-600">{truncate(stripHtml(note.content) || 'Empty note', 110)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="min-h-[calc(100vh-15rem)] min-w-0 flex flex-col">
          {!activeNote ? (
            <div className="flex h-full min-h-[480px] flex-col items-center justify-center text-center">
              <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">Select a note or create a new one</h3>
              <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">The new editor keeps the formatting tools visible while leaving the canvas uncluttered.</p>
            </div>
          ) : (
            <div className="flex h-full min-h-[480px] flex-col">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex-1">
                  <Input
                    value={activeNote.title}
                    onChange={(event) => patchActiveNote({ title: event.target.value || 'Untitled note' })}
                    className="border-none bg-transparent px-0 py-0 text-3xl font-semibold tracking-tight shadow-none focus:ring-0"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge color="blue">{activeNoteWords} words</Badge>
                    <Badge color="gray">{Math.max(1, Math.ceil(activeNoteWords / 200))} min read</Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{saving ? 'Saving...' : 'Saved locally'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={handleAiSummarize} isLoading={summaryLoading}>
                    {summaryLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    AI Summarize
                  </Button>
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

              {aiSummaryByNote[activeNote.id] && !summaryDismissed[activeNote.id] ? (
                <div className="mt-4 rounded-[20px] border border-cyan-200 bg-cyan-50/50 px-4 py-3 text-sm text-cyan-900 dark:border-cyan-700/60 dark:bg-cyan-950/35 dark:text-cyan-100">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                      <Sparkles size={13} />
                      AI Summary
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-cyan-200 bg-white/85 px-2 py-1 text-[11px] text-cyan-700 dark:border-cyan-800 dark:bg-slate-900/70 dark:text-cyan-300"
                      onClick={() => setSummaryDismissed((prev) => ({ ...prev, [activeNote.id]: true }))}
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="whitespace-pre-line leading-6">{aiSummaryByNote[activeNote.id]}</p>
                </div>
              ) : null}

              {summaryError ? (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                  {summaryError}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => patchActiveNote({ color })}
                    style={{ background: color }}
                    className={`h-9 w-9 rounded-full border shadow-sm ${activeNote.color === color ? 'ring-4 ring-sky-100 dark:ring-sky-950' : 'border-slate-200'}`}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setShowExtraPalette((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300"
                >
                  <Palette size={14} />
                  More colors
                  <ChevronDown size={14} className={`transition ${showExtraPalette ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showExtraPalette ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  {EXTRA_NOTE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => patchActiveNote({ color })}
                      style={{ background: color }}
                      className={`h-9 w-9 rounded-full border shadow-sm ${activeNote.color === color ? 'ring-4 ring-sky-100 dark:ring-sky-950' : 'border-slate-200'}`}
                    />
                  ))}
                </div>
              ) : null}

              <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Tag size={14} />
                  Tags
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeNote.tags.length === 0 ? (
                    <span className="text-sm text-slate-500 dark:text-slate-400">Add subject tags, units, or revision themes so notes stay easy to group.</span>
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

              <div className="mt-5 rounded-[26px] border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/45">
                <div className="flex flex-wrap items-center gap-3">
                  <ToolbarGroup title="Type">
                    <select onChange={(event) => event.target.value && runCommand('fontName', event.target.value)} className={toolbarSelectClass}>
                      <option value="">Font</option>
                      {FONT_FAMILIES.map((item) => (
                        <option key={item.label} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <select onChange={(event) => event.target.value && runCommand('fontSize', event.target.value)} className={toolbarSelectClass}>
                      <option value="">Size</option>
                      {FONT_SIZES.map((item) => (
                        <option key={item.label} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ToolButton icon={Type} label="Paragraph" onClick={() => runCommand('formatBlock', '<p>')} />
                    <ToolButton label="H1" onClick={() => runCommand('formatBlock', '<h1>')} />
                    <ToolButton label="H2" onClick={() => runCommand('formatBlock', '<h2>')} />
                  </ToolbarGroup>

                  <ToolbarGroup title="Format">
                    <ToolButton icon={Bold} label="Bold" onClick={() => runCommand('bold')} />
                    <ToolButton icon={Italic} label="Italic" onClick={() => runCommand('italic')} />
                    <ToolButton icon={Underline} label="Underline" onClick={() => runCommand('underline')} />
                    <ToolButton icon={Strikethrough} label="Strike" onClick={() => runCommand('strikeThrough')} />
                  </ToolbarGroup>

                  <ToolbarGroup title="Align">
                    <ToolButton icon={AlignLeft} label="Left" onClick={() => runCommand('justifyLeft')} />
                    <ToolButton icon={AlignCenter} label="Center" onClick={() => runCommand('justifyCenter')} />
                    <ToolButton icon={AlignRight} label="Right" onClick={() => runCommand('justifyRight')} />
                    <ToolButton icon={List} label="Bullets" onClick={() => runCommand('insertUnorderedList')} />
                    <ToolButton icon={ListOrdered} label="Numbered" onClick={() => runCommand('insertOrderedList')} />
                  </ToolbarGroup>

                  <ToolbarGroup title="Color">
                    <button type="button" onClick={() => setShowTextPalette((value) => !value)} className={toolbarButtonClass}>
                      <Type size={13} />
                      Text color
                    </button>
                    <button type="button" onClick={() => setShowHighlightPalette((value) => !value)} className={toolbarButtonClass}>
                      <Highlighter size={13} />
                      Highlight
                    </button>
                  </ToolbarGroup>
                </div>

                {showTextPalette ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {TEXT_COLORS.map((color) => (
                      <button key={color} type="button" onClick={() => applyColor(color, 'text')} style={{ background: color }} className="h-8 w-8 rounded-full border border-white shadow-sm" />
                    ))}
                  </div>
                ) : null}

                {showHighlightPalette ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button key={color} type="button" onClick={() => applyColor(color, 'highlight')} style={{ background: color }} className="h-8 w-8 rounded-full border border-white shadow-sm" />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 rounded-[28px] border border-slate-100 bg-white/75 p-5 shadow-inner dark:border-slate-800 dark:bg-slate-950/55">
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={syncEditor}
                  className="min-h-[420px] max-w-full overflow-x-hidden break-words whitespace-pre-wrap outline-none [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:min-h-[1.5rem]"
                  style={{ fontFamily: 'Inter, ui-sans-serif, system-ui' }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const ToolbarGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white/88 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-950/72">
    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</span>
    {children}
  </div>
);

const ToolButton = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon?: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
}) => (
  <button type="button" onClick={onClick} className={toolbarButtonClass}>
    {Icon ? <Icon size={13} /> : null}
    {label}
  </button>
);

const toolbarButtonClass =
  'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:bg-white hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-800 dark:hover:bg-slate-800 dark:hover:text-white';

const toolbarSelectClass =
  'rounded-full border border-slate-200 bg-slate-50/90 px-3 py-2 text-xs font-medium text-slate-600 outline-none transition focus:border-sky-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300';

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const truncate = (value: string, length: number) => (value.length > length ? `${value.slice(0, length)}...` : value);

const countWords = (value: string) => (value.trim() ? value.trim().split(/\s+/).length : 0);

const safeFilename = (value: string) => value.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'note';

export default Notes;
