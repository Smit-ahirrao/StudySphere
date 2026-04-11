import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Download, Edit3, FileText, FolderPlus, Grid2X2, List, Search, Share2, Star, Trash2, Upload } from 'lucide-react';
import AIStudyTool from '../components/ai-study/AIStudyTool';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, Input, SectionHeading, Textarea } from '../components/UI';

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

const Files: React.FC = () => {
  const { addFile, deleteFile, updateFile } = useData();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<StoredFile[]>([]);
  const [folders, setFolders] = useState<string[]>(['all']);
  const [activeFolder, setActiveFolder] = useState('all');
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

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <Card title="Folders">
          <div className="space-y-4">
            <div className="space-y-2">
              {folders.map((folder) => (
                <div
                  key={folder}
                  className={`rounded-2xl px-3 py-2 transition ${
                    activeFolder === folder
                      ? 'bg-slate-950 text-white dark:bg-sky-400 dark:text-slate-950'
                      : 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveFolder(folder)}
                      className="flex min-w-0 flex-1 items-center justify-between rounded-xl px-1 py-1 text-sm font-medium"
                    >
                      <span className="truncate">{folder === 'all' ? 'All files' : folder}</span>
                      <span className="text-xs opacity-70">{folder === 'all' ? files.length : files.filter((file) => file.folder === folder).length}</span>
                    </button>

                    {folder !== 'all' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setFolderRenameTarget(folder);
                            setFolderRenameValue(folder);
                          }}
                          className="rounded-lg p-2 opacity-75 transition hover:bg-white/10 hover:opacity-100 dark:hover:bg-slate-950/20"
                          aria-label={`Rename ${folder}`}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFolderGroup(folder)}
                          className="rounded-lg p-2 opacity-75 transition hover:bg-white/10 hover:opacity-100 dark:hover:bg-slate-950/20"
                          aria-label={`Delete ${folder}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input placeholder="New folder" value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} />
              <Button
                size="sm"
                onClick={() => {
                  const trimmed = normalizeFolderName(newFolderName);
                  if (!trimmed) return;
                  persistFolders([...folders, trimmed]);
                  setNewFolderName('');
                }}
              >
                <FolderPlus size={14} />
              </Button>
            </div>

            <div className="rounded-3xl bg-slate-50/80 px-4 py-4 text-sm text-slate-600 dark:bg-slate-900/70 dark:text-slate-400">
              <div className="font-medium text-slate-900 dark:text-white">Storage used</div>
              <div className="mt-2 text-2xl font-semibold">{storageUsed} MB</div>
              <div className="mt-1">Local, private, and fast to access during demos.</div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative max-w-md flex-1">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-11" placeholder="Search files..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => inputRef.current?.click()}>
                  <Upload size={16} />
                  Import files
                </Button>
                <Button variant="secondary" onClick={() => setView((current) => (current === 'grid' ? 'list' : 'grid'))}>
                  {view === 'grid' ? <List size={16} /> : <Grid2X2 size={16} />}
                  {view === 'grid' ? 'List view' : 'Grid view'}
                </Button>
              </div>
            </div>

            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                importFiles(event.dataTransfer.files);
              }}
              className="mt-5 rounded-[28px] border border-dashed border-sky-200 bg-sky-50/50 px-6 py-8 text-center dark:border-sky-900 dark:bg-sky-950/10"
            >
              <p className="font-medium text-slate-900 dark:text-white">Drag and drop files here</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Upload notes, slides, handouts, diagrams, or reference images.</p>
            </div>
          </Card>

          <div className={view === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
            {filtered.length === 0 ? (
              <Card>
                <div className="py-14 text-center">
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white">No files here yet</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Import resources and they will appear with preview, notes, and quick actions.</p>
                </div>
              </Card>
            ) : (
              filtered.map((file) => (
                <Card key={file.id} className={view === 'list' ? '' : 'h-full'}>
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
                        <div>
                          <div className="truncate font-medium text-slate-900 dark:text-white">{file.name}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {(file.size / 1024).toFixed(1)} KB | {file.folder}
                          </div>
                        </div>
                        {file.pinned ? <Badge color="yellow">Pinned</Badge> : null}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => syncFile({ ...file, pinned: !file.pinned })}>
                          <Star size={14} />
                          Pin
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => downloadFile(file)}>
                          <Download size={14} />
                          Download
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
                          Rename
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setNotesTarget(file.id)}>
                          Notes
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyReference(file)}>
                          <Share2 size={14} />
                          Copy ref
                        </Button>
                        <Button size="sm" variant="ghost" className="text-rose-600 dark:text-rose-300" onClick={() => deleteStoredFile(file)}>
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
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
