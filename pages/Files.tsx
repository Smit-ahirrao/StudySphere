import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Download, Edit3, FileText, FolderPlus, Grid2X2, Image as ImageIcon, List, Search, Share2, Star, Trash2, Upload } from 'lucide-react';
import AIStudyTool from '../components/ai-study/AIStudyTool';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, Input, SectionHeading, Textarea } from '../components/UI';
import { InteractiveFolder } from '../components/InteractiveFolder';

type StoredFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  folder: string;
  pinned: boolean;
  notes: string;
  blob: Blob;
};

const DB_NAME = 'studysphere-files';
const STORE = 'files';
const FOLDER_STORAGE_KEY = 'studysphere_file_folders_v1';

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const getAllFiles = async (): Promise<StoredFile[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
};

const saveFile = async (file: StoredFile) => {
  const db = await openDB();
  db.transaction(STORE, 'readwrite').objectStore(STORE).put(file);
};

const removeFileFromDB = async (id: string) => {
  const db = await openDB();
  db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
};

const loadFolderNames = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(FOLDER_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
};

const saveFolderNames = (folders: string[]) => {
  localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(folders));
};

const FOLDER_COLORS = [
  '#5227FF', // Purple
  '#FF3366', // Pink
  '#00D1FF', // Cyan
  '#FF9F0A', // Orange
  '#30D158', // Green
  '#BF5AF2', // Indigo
  '#FF453A', // Red
];

const getFolderColor = (folderName: string) => {
  if (folderName === 'all') return '#1e293b';
  let hash = 0;
  for (let i = 0; i < folderName.length; i++) {
    hash = folderName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FOLDER_COLORS[Math.abs(hash) % FOLDER_COLORS.length];
};

const Files: React.FC = () => {
  const { addFile, deleteFile, updateFile } = useData();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<StoredFile[]>([]);
  const [folders, setFolders] = useState<string[]>(['all']);
  const [activeFolder, setActiveFolder] = useState('all');
  const [isInsideFolder, setIsInsideFolder] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [newFolderName, setNewFolderName] = useState('');
  const [folderRenameTarget, setFolderRenameTarget] = useState<string | null>(null);
  const [folderRenameValue, setFolderRenameValue] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [notesTarget, setNotesTarget] = useState<string | null>(null);

  useEffect(() => {
    getAllFiles().then((stored) => {
      setFiles(stored);
      setFolders(buildFolderList(stored, loadFolderNames()));
      stored.forEach((file) =>
        addFile({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: file.uploadedAt,
          folder: file.folder,
          pinned: file.pinned,
          notes: file.notes,
        })
      );
    });
  }, []);

  const previewFile = files.find((file) => file.id === previewId) || null;
  const renameFile = files.find((file) => file.id === renameTarget) || null;
  const notesFile = files.find((file) => file.id === notesTarget) || null;

  const filtered = useMemo(() => {
    let result = [...files];
    if (activeFolder !== 'all') result = result.filter((file) => file.folder === activeFolder);
    if (search) result = result.filter((file) => file.name.toLowerCase().includes(search.toLowerCase()));
    return result.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.uploadedAt - a.uploadedAt);
  }, [files, activeFolder, search]);

  const storageUsed = useMemo(() => (files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1), [files]);

  const syncFile = async (updated: StoredFile) => {
    await saveFile(updated);
    setFiles((current) => current.map((file) => (file.id === updated.id ? updated : file)));
    updateFile({
      id: updated.id,
      name: updated.name,
      size: updated.size,
      type: updated.type,
      uploadedAt: updated.uploadedAt,
      folder: updated.folder,
      pinned: updated.pinned,
      notes: updated.notes,
    });
  };

  const persistFolders = (nextFolders: string[], sourceFiles: StoredFile[] = files) => {
    const uniqueFolders = buildFolderList(sourceFiles, nextFolders);
    setFolders(uniqueFolders);
    saveFolderNames(uniqueFolders.filter((folder) => folder !== 'all'));
  };

  const importFiles = async (list: FileList | File[] | null) => {
    if (!list) return;
    const imported: StoredFile[] = [];

    for (const file of Array.from(list)) {
      const stored: StoredFile = {
        id: uuidv4(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploadedAt: Date.now(),
        folder: activeFolder === 'all' ? 'general' : activeFolder,
        pinned: false,
        notes: '',
        blob: file,
      };

      await saveFile(stored);
      imported.push(stored);
      addFile({
        id: stored.id,
        name: stored.name,
        size: stored.size,
        type: stored.type,
        uploadedAt: stored.uploadedAt,
        folder: stored.folder,
        pinned: stored.pinned,
        notes: stored.notes,
      });
    }

    setFiles((current) => [...imported, ...current]);
    persistFolders([...folders, ...imported.map((file) => file.folder)]);
  };

  const downloadFile = (file: StoredFile) => {
    const url = URL.createObjectURL(file.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const deleteStoredFile = async (file: StoredFile) => {
    await removeFileFromDB(file.id);
    const nextFiles = files.filter((item) => item.id !== file.id);
    setFiles(nextFiles);
    persistFolders(folders, nextFiles);
    deleteFile(file.id);
  };

  const renameFolder = async () => {
    if (!folderRenameTarget) return;

    const nextName = normalizeFolderName(folderRenameValue);
    if (!nextName || nextName === 'all') return;

    const affectedFiles = files.filter((file) => file.folder === folderRenameTarget);
    await Promise.all(
      affectedFiles.map((file) =>
        saveFile({
          ...file,
          folder: nextName,
        })
      )
    );

    const nextFiles = files.map((file) =>
      file.folder === folderRenameTarget ? { ...file, folder: nextName } : file
    );

    setFiles(nextFiles);
    nextFiles
      .filter((file) => file.folder === nextName)
      .forEach((file) =>
        updateFile({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: file.uploadedAt,
          folder: file.folder,
          pinned: file.pinned,
          notes: file.notes,
        })
      );

    const nextFolders = folders.map((folder) => (folder === folderRenameTarget ? nextName : folder));
    persistFolders(nextFolders, nextFiles);
    if (activeFolder === folderRenameTarget) {
      setActiveFolder(nextName);
    }
    setFolderRenameTarget(null);
    setFolderRenameValue('');
  };

  const deleteFolderGroup = async (folder: string) => {
    if (folder === 'all') return;

    const hasFiles = files.some((file) => file.folder === folder);
    const confirmed = window.confirm(
      hasFiles
        ? `Delete folder "${folder}"? Files inside it will be moved to "general".`
        : `Delete folder "${folder}"?`
    );
    if (!confirmed) return;

    let nextFiles = files;

    if (hasFiles) {
      nextFiles = files.map((file) => (file.folder === folder ? { ...file, folder: 'general' } : file));
      await Promise.all(nextFiles.map((file) => saveFile(file)));
      nextFiles.forEach((file) =>
        updateFile({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: file.uploadedAt,
          folder: file.folder,
          pinned: file.pinned,
          notes: file.notes,
        })
      );
      setFiles(nextFiles);
    }

    persistFolders(folders.filter((item) => item !== folder), nextFiles);
    if (activeFolder === folder) {
      setActiveFolder(hasFiles ? 'general' : 'all');
    }
  };

  const copyReference = (file: StoredFile) => {
    navigator.clipboard.writeText(
      JSON.stringify(
        {
          name: file.name,
          folder: file.folder,
          sizeKB: Number((file.size / 1024).toFixed(1)),
          notes: file.notes || '',
          message: 'This file stays local inside StudySphere and cannot be shared through a public URL.',
        },
        null,
        2
      )
    );
    alert('A local file reference summary was copied. Public link sharing is not supported because files stay on your device.');
  };

  const studyFiles = useMemo(
    () =>
      files.map((file) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        file: file.blob instanceof File ? file.blob : new File([file.blob], file.name, { type: file.type, lastModified: file.uploadedAt }),
      })),
    [files]
  );

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Study Lab"
        title="Manage resources and generate revision packs in one flow"
        description="Organize study material, then turn the right document into structured revision content without wasting space."
      />

      <AIStudyTool files={studyFiles} onImportFiles={importFiles} />

      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="space-y-4">
            <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Navigation</h3>
            <nav className="flex flex-col gap-1">
              {folders.map((folder) => {
                const isActive = activeFolder === folder;
                const count = folder === 'all' ? files.length : files.filter(f => f.folder === folder).length;
                
                return (
                  <button
                    key={folder}
                    onClick={() => {
                      setActiveFolder(folder);
                      setIsInsideFolder(true);
                    }}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 dark:bg-sky-500 dark:text-slate-950 dark:shadow-none' 
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full`} style={{ backgroundColor: getFolderColor(folder) }} />
                      <span className="capitalize">{folder === 'all' ? 'All Resources' : folder.replace(/-/g, ' ')}</span>
                    </div>
                    <span className={`text-xs ${isActive ? 'opacity-100' : 'opacity-50'}`}>{count}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Storage</div>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{storageUsed}</span>
              <span className="mb-1 text-sm font-medium text-slate-500">MB</span>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div 
                className="h-full bg-slate-900 transition-all dark:bg-sky-400" 
                style={{ width: `${Math.min(100, (parseFloat(storageUsed) / 50) * 100)}%` }} 
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Ready to Add</h3>
            <div className="space-y-4 rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  className="h-10 rounded-xl border-none bg-slate-50 pl-10 text-sm dark:bg-slate-950" 
                  placeholder="Search files..." 
                  value={search} 
                  onChange={(event) => setSearch(event.target.value)} 
                />
              </div>
              
              <Button onClick={() => inputRef.current?.click()} className="h-11 w-full justify-center rounded-xl">
                <Upload size={16} className="mr-2" />
                Import Files
              </Button>

              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  importFiles(event.dataTransfer.files);
                }}
                className="group relative flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/20"
              >
                <Upload size={16} className="text-slate-400 transition-transform group-hover:-translate-y-0.5" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Drop to Upload</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="space-y-10">
          {!isInsideFolder ? (
            <section className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Collections</h2>
                  <p className="text-sm text-slate-500">Double-click a folder to view its contents</p>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
                  <Input
                    placeholder="New collection name..."
                    value={newFolderName}
                    onChange={(event) => setNewFolderName(event.target.value)}
                    className="h-9 w-48 border-none bg-transparent text-sm focus:ring-0"
                  />
                  <Button
                    size="sm"
                    className="h-9 rounded-xl"
                    onClick={() => {
                      const trimmed = normalizeFolderName(newFolderName);
                      if (!trimmed) return;
                      persistFolders([...folders, trimmed]);
                      setNewFolderName('');
                    }}
                  >
                    <FolderPlus size={14} className="mr-2" />
                    Add Folder
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {folders.map((folder) => {
                  const folderFiles = files.filter(f => f.folder === folder || (folder === 'all' && true));
                  const items = folderFiles.slice(0, 3).map((file) => (
                    <div key={file.id} className="flex h-full w-full items-center justify-center">
                      {file.type.startsWith('image') ? (
                        <ImageIcon className="h-5 w-5 text-slate-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  ));

                  return (
                    <Card 
                      key={folder} 
                      className={`group relative overflow-visible transition-all hover:shadow-xl cursor-pointer ${activeFolder === folder ? 'ring-2 ring-slate-900 dark:ring-sky-500' : ''}`}
                      onDoubleClick={() => {
                        setActiveFolder(folder);
                        setIsInsideFolder(true);
                      }}
                      onClick={() => setActiveFolder(folder)}
                    >
                      <div className="flex flex-col items-center gap-6 py-4">
                        <InteractiveFolder
                          label={folder === 'all' ? 'FILES' : folder.toUpperCase()}
                          color={getFolderColor(folder)}
                          size={0.7}
                          items={items}
                          isActive={activeFolder === folder}
                        />
                        
                        <div className="w-full text-center">
                          <div className="text-lg font-bold capitalize text-slate-900 dark:text-white">
                            {folder === 'all' ? 'All Resources' : folder.replace(/-/g, ' ')}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {folder === 'all' ? files.length : files.filter(f => f.folder === folder).length} items
                          </div>
                        </div>

                        {folder !== 'all' && (
                          <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFolderRenameTarget(folder);
                                setFolderRenameValue(folder);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-md hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFolderGroup(folder);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-500 shadow-md hover:bg-slate-50 dark:bg-slate-800"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ) : (
            <div className="space-y-8">
              <header className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsInsideFolder(false)}
                    className="rounded-full bg-white shadow-sm dark:bg-slate-900"
                  >
                    <ArrowLeft size={18} className="mr-1" />
                    Back
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold capitalize text-slate-900 dark:text-white">
                      {activeFolder === 'all' ? 'All Resources' : activeFolder.replace(/-/g, ' ')}
                    </h2>
                    <p className="text-sm text-slate-500">Viewing files in this collection</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={() => inputRef.current?.click()} className="h-11 rounded-2xl px-6">
                    <Upload size={18} className="mr-2" />
                    Add Files
                  </Button>
                  <div className="flex rounded-2xl bg-slate-50 p-1 dark:bg-slate-950">
                    <button 
                      onClick={() => setView('grid')}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${view === 'grid' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <Grid2X2 size={16} />
                    </button>
                    <button 
                      onClick={() => setView('list')}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${view === 'list' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </header>

              <div className={view === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
                {filtered.length === 0 ? (
                  <Card className="col-span-full">
                    <div className="py-20 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 dark:bg-slate-800">
                        <FileText size={32} />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">No files found</h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">This folder is currently empty. Use the sidebar to upload files.</p>
                    </div>
                  </Card>
                ) : (
                  filtered.map((file) => (
                    <Card key={file.id} className={view === 'list' ? '' : 'h-full transition-all hover:shadow-md'}>
                      <div className={`flex ${view === 'list' ? 'items-center gap-4' : 'flex-col gap-4'}`}>
                        <button type="button" onClick={() => setPreviewId(file.id)} className={view === 'list' ? 'w-20' : 'w-full'}>
                          {file.type.startsWith('image') ? (
                            <img src={URL.createObjectURL(file.blob)} className={`${view === 'list' ? 'h-20 w-20' : 'h-40 w-full'} rounded-2xl object-cover`} />
                          ) : (
                            <div className={`${view === 'list' ? 'h-20 w-20' : 'h-40 w-full'} flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400`}>
                              <FileText size={28} />
                            </div>
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-bold text-slate-900 dark:text-white">{file.name}</div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {(file.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                            {file.pinned ? <Badge color="yellow">Pinned</Badge> : null}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button size="sm" variant="secondary" onClick={() => syncFile({ ...file, pinned: !file.pinned })}>
                              <Star size={14} />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => downloadFile(file)}>
                              <Download size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setRenameTarget(file.id);
                                setRenameValue(file.name);
                              }}
                            >
                              <Edit3 size={14} />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setNotesTarget(file.id)}>
                              Notes
                            </Button>
                            <Button size="sm" variant="ghost" className="text-rose-600 dark:text-rose-300" onClick={() => deleteStoredFile(file)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" multiple hidden onChange={(event) => importFiles(event.target.files)} />

      {previewFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <Card className="w-full max-w-3xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">{previewFile.name}</h3>
                <Button variant="ghost" onClick={() => setPreviewId(null)}>
                  Close
                </Button>
              </div>
              {previewFile.type.startsWith('image') ? (
                <img src={URL.createObjectURL(previewFile.blob)} className="max-h-[70vh] w-full rounded-3xl object-contain bg-slate-50 dark:bg-slate-900" />
              ) : previewFile.type === 'application/pdf' ? (
                <iframe src={URL.createObjectURL(previewFile.blob)} className="h-[70vh] w-full rounded-3xl" />
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-16 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Preview is available for images and PDFs. You can still download this file.
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {renameFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <Card className="w-full max-w-md">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">Rename file</h3>
              <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setRenameTarget(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    syncFile({ ...renameFile, name: renameValue.trim() || renameFile.name });
                    setRenameTarget(null);
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {folderRenameTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <Card className="w-full max-w-md">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">Rename folder</h3>
              <Input value={folderRenameValue} onChange={(event) => setFolderRenameValue(event.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setFolderRenameTarget(null)}>
                  Cancel
                </Button>
                <Button onClick={renameFolder}>
                  Save
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {notesFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <Card className="w-full max-w-xl">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">File notes</h3>
              <Textarea
                rows={6}
                value={notesFile.notes}
                onChange={(event) => setFiles((current) => current.map((file) => (file.id === notesFile.id ? { ...file, notes: event.target.value } : file)))}
                placeholder="Add context about this resource, like chapters covered or how it should be used."
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setNotesTarget(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const updated = files.find((file) => file.id === notesFile.id);
                    if (updated) syncFile(updated);
                    setNotesTarget(null);
                  }}
                >
                  Save notes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

const normalizeFolderName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-');

const buildFolderList = (files: StoredFile[], customFolders: string[]) =>
  Array.from(
    new Set([
      'all',
      ...customFolders.map((folder) => normalizeFolderName(folder)).filter(Boolean),
      ...files.map((file) => normalizeFolderName(file.folder || 'general')).filter(Boolean),
    ])
  );

export default Files;
