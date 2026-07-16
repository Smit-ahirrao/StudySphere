import React, { useEffect, useMemo, useRef, useState } from 'react';
import RichText from '../components/ai-study/RichText';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, BookOpen, Clock, Download, FileText, Layers, MessageCircle, Network, TrendingUp, Upload, Loader2, AlertCircle, CheckCircle2, Target, Zap, CheckSquare } from 'lucide-react';
import { useData } from '../context/DataContext';
import { LearningMode, QuizQuestion, StudyPack } from '../types';
import { extractTextFromStudyFile, generateStudyPack, isStudySupportedFile } from '../utils/aiStudy';
import { generateStudyPackPDF } from '../utils/studyPackPdf';
import { Badge, Button, Card, SectionHeading } from '../components/UI';
import FileUpload from '../components/ai-study/FileUpload';
import ModeSelector from '../components/ai-study/ModeSelector';
import OutputTabs, { StudyOutputTab } from '../components/ai-study/OutputTabs';
import FlashcardCard from '../components/ai-study/FlashcardCard';
import QuizCard from '../components/ai-study/QuizCard';
import QuizTimer from '../components/ai-study/QuizTimer';
import AIChatTutor from '../components/ai-study/AIChatTutor';
import TopicMindMap from '../components/ai-study/TopicMindMap';
import StudyHistory, { SavedSession, saveStudySession, loadStudySessions } from '../components/ai-study/StudyHistory';

interface StudySourceFile {
  id: string; name: string; type: string; size: number; file: File;
}

const DB_NAME = 'studysphere-files';
const STORE = 'files';

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const getAllFiles = async () => {
  const db = await openDB();
  return new Promise<any[]>((resolve) => {
    const r = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    r.onsuccess = () => resolve(r.result || []);
  });
};

type LabTab = 'generate' | 'history' | 'tutor' | 'mindmap' | 'weakness';

const StudyLab: React.FC = () => {
  const { data, recordQuizOutcome, clearWeakArea } = useData();
  const hiddenRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<StudySourceFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [mode, setMode] = useState<LearningMode>('quick-revision');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studyPack, setStudyPack] = useState<StudyPack | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<StudyOutputTab>('summary');
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({});
  const [flashcardCount, setFlashcardCount] = useState(6);
  const [quizCount, setQuizCount] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState<'mixed'|'easy'|'medium'|'hard'>('mixed');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [labTab, setLabTab] = useState<LabTab>('generate');
  const [docText, setDocText] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [timedQuiz, setTimedQuiz] = useState(false);
  const [confidenceMap, setConfidenceMap] = useState<Record<string, 'knew' | 'review'>>({});
  const [customInstruction, setCustomInstruction] = useState('');

  // Stats from history
  const historyStats = useMemo(() => {
    const sessions = loadStudySessions();
    const totalCards = sessions.reduce((s, se) => s + se.pack.flashcards.length, 0);
    const totalQuiz = sessions.reduce((s, se) => s + se.pack.quiz.length, 0);
    const totalTopics = new Set(sessions.flatMap(se => se.pack.keyTopics)).size;
    return { sessions: sessions.length, totalCards, totalQuiz, totalTopics };
  }, [studyPack]);

  // Load files from IndexedDB (shared with Files page)
  useEffect(() => {
    getAllFiles().then(stored => {
      const mapped: StudySourceFile[] = stored
        .filter((f: any) => isStudySupportedFile({ name: f.name, type: f.type } as any))
        .map((f: any) => ({
          id: f.id, name: f.name, type: f.type, size: f.size,
          file: f.blob instanceof File ? f.blob : new File([f.blob], f.name, { type: f.type }),
        }));
      setFiles(mapped);
      if (mapped.length > 0 && selectedFileIds.length === 0) setSelectedFileIds([mapped[0].id]);
    });
  }, []);

  const selectedFiles = files.filter(f => selectedFileIds.includes(f.id));
  const weakAreas = useMemo(() => [...data.weakAreas].sort((a, b) => (b.misses - b.corrects) - (a.misses - a.corrects)).slice(0, 8), [data.weakAreas]);

  const quizStats = useMemo(() => {
    if (!studyPack) return { answered: 0, correct: 0, incorrect: 0 };
    const answered = studyPack.quiz.filter(q => Boolean(answerMap[q.id]));
    const correct = answered.filter(q => answerMap[q.id] === q.correctAnswer).length;
    return { answered: answered.length, correct, incorrect: answered.length - correct };
  }, [studyPack, answerMap]);

  const handleGenerate = async () => {
    if (selectedFiles.length === 0 || loading) return;
    setLoading(true); setError(''); setStudyPack(null); setAnswerMap({}); setFlashcardIndex(0); setTimedQuiz(false);
    try {
      // Extract text from ALL selected files
      const texts = await Promise.all(selectedFiles.map(f => extractTextFromStudyFile(f.file)));
      const combinedText = texts.map((t, i) => `--- SOURCE: ${selectedFiles[i].name} ---\n${t}`).join('\n\n');
      const combinedNames = selectedFiles.map(f => f.name).join(', ');
      
      setDocText(combinedText); setDocFileName(combinedNames);
      const pack = await generateStudyPack({ text: combinedText, fileName: combinedNames, mode, flashcardCount, quizCount, quizDifficulty, customInstruction });
      setStudyPack(pack); 
      setActiveOutputTab(mode === 'question-solver' ? 'solutions' : 'summary');
      // Auto-save session
      saveStudySession({ id: crypto.randomUUID(), fileName: combinedNames, mode, pack, createdAt: Date.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.');
    } finally { setLoading(false); }
  };

  const handleAnswer = (q: QuizQuestion, answer: string) => {
    setAnswerMap(prev => ({ ...prev, [q.id]: answer }));
    recordQuizOutcome({ topic: q.topic, correct: answer === q.correctAnswer, question: q.question, explanation: q.explanation });
  };

  const handleUpload = async (list: FileList | null) => {
    if (!list) return;
    const valid = Array.from(list).filter(f => isStudySupportedFile(f));
    if (!valid.length) { setError('Upload PDF, DOCX, or TXT files.'); return; }
    const mapped = valid.map(f => ({ id: crypto.randomUUID(), name: f.name, type: f.type, size: f.size, file: f }));
    setFiles(prev => [...mapped, ...prev]);
    setSelectedFileIds([mapped[0].id]); setError('');
  };

  const handleLoadSession = (session: SavedSession) => {
    setStudyPack(session.pack); setAnswerMap({}); setFlashcardIndex(0);
    setDocFileName(session.fileName); setLabTab('generate'); setActiveOutputTab('summary'); setTimedQuiz(false);
  };

  const handleConfidence = (cardId: string, level: 'knew' | 'review') => {
    setConfidenceMap(prev => ({ ...prev, [cardId]: level }));
  };

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPDF = async () => {
    if (!studyPack) return;
    setPdfLoading(true);
    try {
      await generateStudyPackPDF(studyPack, docFileName || 'study-pack');
    } catch (e) {
      console.error('PDF generation failed:', e);
    } finally {
      setPdfLoading(false);
    }
  };

  const tabs: Array<{ key: LabTab; label: string; icon: React.ReactNode }> = [
    { key: 'generate', label: 'Generate', icon: <Sparkles size={14} /> },
    { key: 'mindmap', label: 'Mind Map', icon: <Network size={14} /> },
    { key: 'history', label: 'History', icon: <BookOpen size={14} /> },
    { key: 'tutor', label: 'AI Tutor', icon: <MessageCircle size={14} /> },
    { key: 'weakness', label: 'Weaknesses', icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="AI Study Lab"
        title="Transform documents into deep study sessions"
        description="Upload any PDF, DOCX, or TXT — generate flashcards, quizzes, summaries, mind maps, and chat with your material."
      />

      {/* Stats Hero */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Sessions', value: historyStats.sessions, icon: <Layers size={16} />, color: 'from-purple-500 to-indigo-600' },
          { label: 'Flashcards', value: historyStats.totalCards, icon: <Zap size={16} />, color: 'from-sky-500 to-cyan-600' },
          { label: 'Quiz Qs', value: historyStats.totalQuiz, icon: <CheckCircle2 size={16} />, color: 'from-emerald-500 to-teal-600' },
          { label: 'Topics', value: historyStats.totalTopics, icon: <Brain size={16} />, color: 'from-amber-500 to-orange-600' },
        ].map(s => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br ${s.color} opacity-10`} />
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} text-white`}>{s.icon}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Lab Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setLabTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
              labTab === t.key ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>{t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ==================== GENERATE TAB ==================== */}
      {labTab === 'generate' && (
        <div className="space-y-6">
          <FileUpload files={files} selectedFileIds={selectedFileIds} onToggleFile={(id) => setSelectedFileIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
            onUploadClick={() => hiddenRef.current?.click()} busy={loading} />

          <Card>
            <div className="space-y-5">
              <ModeSelector value={mode} onChange={setMode} />
              <div className="grid gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-3">
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Flashcards</div>
                  <select value={flashcardCount} onChange={e => setFlashcardCount(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white">
                    {[4,6,8,10,12].map(n => <option key={n} value={n}>{n} cards</option>)}
                  </select>
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Quiz length</div>
                  <select value={quizCount} onChange={e => setQuizCount(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white">
                    {[3,5,8,10].map(n => <option key={n} value={n}>{n} questions</option>)}
                  </select>
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Difficulty</div>
                  <select value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value as any)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white">
                    <option value="mixed">Mixed</option><option value="easy">Easy</option>
                    <option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Custom Instruction Bar */}
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Custom AI Instructions (Optional)</div>
                <textarea
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="e.g. 'Use only the provided PDF content, do not use outside knowledge' or 'Explain it like I am a 5 year old'"
                  className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-purple-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white"
                  rows={2}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleGenerate} disabled={loading || selectedFiles.length === 0}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {loading ? 'Generating...' : 'Generate Study Pack'}
                </Button>
                {selectedFiles.length > 0 && <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">{selectedFiles.length} file(s) selected</div>}
              </div>

              {error && (
                <div className="rounded-[22px] border border-rose-200 bg-rose-50/85 px-4 py-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200">
                  <div className="flex items-center gap-2 font-medium"><AlertCircle size={16} /> Generation blocked</div>
                  <p className="mt-2">{error}</p>
                </div>
              )}

              {loading && (
                <div className="grid gap-3 md:grid-cols-3">
                  {[0,1,2].map(i => <div key={i} className="h-32 animate-pulse rounded-[24px] bg-slate-100 dark:bg-slate-900" />)}
                </div>
              )}

              {studyPack && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge color="cyan">{studyPack.difficulty}</Badge>
                    <Badge color={mode === 'quick-revision' ? 'blue' : mode === 'exam-mode' ? 'red' : mode === 'question-solver' ? 'green' : 'purple'}>
                      {mode === 'quick-revision' ? '⚡ Quick Revision' : mode === 'exam-mode' ? '🎯 Exam Mode' : mode === 'question-solver' ? '🧩 Question Solver' : '🧠 Deep Learning'}
                    </Badge>
                    {studyPack.keyTopics.map(t => <Badge key={t} color="gray">{t}</Badge>)}
                    <button onClick={handleExportPDF} disabled={pdfLoading}
                      className="ml-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-[11px] font-bold text-white shadow-md transition hover:shadow-lg disabled:opacity-50">
                      {pdfLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      {pdfLoading ? 'Generating PDF...' : '📥 Download PDF'}
                    </button>
                  </div>

                  <OutputTabs 
                    activeTab={activeOutputTab} 
                    onChange={setActiveOutputTab} 
                    showSolutions={mode === 'question-solver' || (studyPack.questionSolutions?.length ?? 0) > 0} 
                  />

                  {activeOutputTab === 'summary' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-h-[800px] space-y-4 overflow-y-auto pr-1"
                    >
                      {/* Headline + Summary — always shown */}
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                        <Card>
                          <div className="space-y-3">
                            <div className={`text-sm font-bold uppercase tracking-[0.24em] ${mode === 'quick-revision' ? 'text-sky-500' : mode === 'exam-mode' ? 'text-amber-600' : 'text-purple-600'}`}>
                              {mode === 'quick-revision' ? '⚡ Quick Summary' : mode === 'exam-mode' ? '🎯 Exam Brief' : '🧠 In-Depth Summary'}
                            </div>
                            <div className="text-2xl font-bold text-slate-950 dark:text-white">{studyPack.summary.headline}</div>
                            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{studyPack.summary.concise}</p>
                          </div>
                        </Card>
                      </motion.div>

                      {studyPack.heroImageUrl && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="overflow-hidden rounded-[28px] border border-slate-200 dark:border-slate-800">
                          <img src={studyPack.heroImageUrl} alt="Study Hero" className="h-48 w-full object-cover" />
                        </motion.div>
                      )}

                      {/* ===== QUICK REVISION MODE ===== */}
                      {mode === 'quick-revision' && (<>
                        {studyPack.quickTips?.length ? (
                          <div className="space-y-2">
                            <div className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">⚡ Speed Tips</div>
                            <div className="grid gap-2 md:grid-cols-2">
                              {studyPack.quickTips.map((tip, i) => (
                                <motion.div 
                                  key={i} 
                                  initial={{ opacity: 0, x: -10 }} 
                                  animate={{ opacity: 1, x: 0 }} 
                                  transition={{ delay: 0.2 + i * 0.05 }}
                                  className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-4 py-3 text-sm font-medium text-sky-900 dark:border-sky-900 dark:from-sky-950/40 dark:to-cyan-950/40 dark:text-sky-200"
                                >
                                  {tip}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {studyPack.mnemonics?.length ? (
                          <div className="space-y-2">
                            <div className="text-xs font-bold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300">🧠 Mnemonics & Tricks</div>
                            <div className="grid gap-2">
                              {studyPack.mnemonics.map((m, i) => (
                                <motion.div 
                                  key={i} 
                                  initial={{ opacity: 0, y: 10 }} 
                                  animate={{ opacity: 1, y: 0 }} 
                                  transition={{ delay: 0.3 + i * 0.05 }}
                                  className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-3 text-sm font-semibold text-teal-900 dark:border-teal-900 dark:from-teal-950/40 dark:to-emerald-950/40 dark:text-teal-200"
                                >
                                  {m}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>)}

                      {/* ===== EXAM MODE ===== */}
                      {mode === 'exam-mode' && (<>
                        {studyPack.examTraps?.length ? (
                          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                            <Card className="border-rose-200 dark:border-rose-900">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-400">
                                  ⚠️ Exam Traps & Common Mistakes
                                </div>
                                <div className="grid gap-2">
                                  {studyPack.examTraps.map((trap, i) => (
                                    <div key={i} className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900 dark:from-rose-950/30 dark:to-red-950/30 dark:text-rose-200">
                                      {trap}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ) : null}
                        {studyPack.formulaSheet?.length ? (
                          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
                            <Card className="border-amber-200 dark:border-amber-900">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
                                  📋 Formula Sheet & Key Definitions
                                </div>
                                <div className="grid gap-2 md:grid-cols-2">
                                  {studyPack.formulaSheet.map((f, i) => (
                                    <div key={i} className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 text-sm font-mono font-medium text-amber-900 dark:border-amber-900 dark:from-amber-950/30 dark:to-yellow-950/30 dark:text-amber-200">
                                      {f}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ) : null}
                      </>)}

                      {/* ===== DEEP LEARNING MODE ===== */}
                      {mode === 'deep-learning' && (<>
                        {studyPack.deepDiveExplanations?.length ? (
                          <div className="space-y-3">
                            <div className="text-xs font-bold uppercase tracking-[0.22em] text-purple-600 dark:text-purple-300">🔬 Deep Dive Explanations</div>
                            {studyPack.deepDiveExplanations.map((d, i) => (
                              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                                <Card className="border-purple-200 dark:border-purple-900">
                                  <div className="space-y-2">
                                    <div className="text-base font-bold text-purple-900 dark:text-purple-200">{d.emoji} {d.concept}</div>
                                    <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">{d.explanation}</p>
                                    <div className="rounded-xl bg-purple-50 px-4 py-2.5 text-sm text-purple-800 dark:bg-purple-950/30 dark:text-purple-300">
                                      🔗 <span className="font-semibold">Analogy:</span> {d.analogy}
                                    </div>
                                  </div>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        ) : null}
                        {studyPack.comparisonTable ? (
                          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                            <Card className="border-violet-200 dark:border-violet-900">
                              <div className="space-y-3">
                                <div className="text-sm font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">📊 {studyPack.comparisonTable.title}</div>
                                <div className="overflow-x-auto rounded-xl border border-violet-200 dark:border-violet-800">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                                        {studyPack.comparisonTable.headers.map((h, i) => (
                                          <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider">{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {studyPack.comparisonTable.rows.map((row, ri) => (
                                        <tr key={ri} className={ri % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-violet-50/50 dark:bg-violet-950/10'}>
                                          {row.map((cell, ci) => (
                                            <td key={ci} className="border-b border-violet-100 px-4 py-2.5 text-slate-700 dark:border-violet-900 dark:text-slate-300">{cell}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ) : null}
                      </>)}

                      {/* Key Points — all modes */}
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                        <Card>
                          <div className="space-y-3">
                            <div className={`text-sm uppercase tracking-[0.24em] ${mode === 'quick-revision' ? 'text-sky-600 dark:text-sky-300' : mode === 'exam-mode' ? 'text-amber-600 dark:text-amber-300' : 'text-purple-600 dark:text-purple-300'}`}>
                              🔑 Key Points
                            </div>
                            <div className="grid gap-2">{studyPack.summary.bullets.map(b => <div key={b} className="rounded-2xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">{b}</div>)}</div>
                          </div>
                        </Card>
                      </motion.div>

                      {/* Shared sections grid */}
                      <div className="grid gap-4 lg:grid-cols-2">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}>
                          <Card>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">💡 Memory Hooks</div>
                              <div className="grid gap-2">{(studyPack.summary.memoryHooks || []).map(h => <div key={h} className="rounded-2xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">{h}</div>)}</div>
                            </div>
                          </Card>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                          <Card>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300"><Target size={14}/>🎯 Exam Signals</div>
                              <div className="grid gap-2">{(studyPack.summary.examSignals || []).map(s => <div key={s} className="rounded-2xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">{s}</div>)}</div>
                            </div>
                          </Card>
                        </motion.div>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
                          <Card>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300"><Brain size={14}/>📅 Study Plan</div>
                              <div className="grid gap-2">{studyPack.studyPlan.map((s, i) => <div key={s} className="flex items-start gap-3 rounded-2xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-purple-500 text-[10px] font-bold text-white">{i + 1}</span>{s}</div>)}</div>
                            </div>
                          </Card>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                          <Card>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300"><CheckCircle2 size={14}/>✅ Concept Checks</div>
                              <div className="grid gap-2">{studyPack.conceptChecks.map(c => <div key={c} className="rounded-2xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">{c}</div>)}</div>
                            </div>
                          </Card>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {activeOutputTab === 'solutions' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-h-[800px] space-y-4 overflow-y-auto pr-1">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
                          <CheckSquare size={16} /> Question Solutions ({studyPack.questionSolutions?.length ?? 0})
                        </div>
                        {(!studyPack.questionSolutions || studyPack.questionSolutions.length === 0) ? (
                          <Card className="border-amber-200 dark:border-amber-900">
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <AlertCircle size={28} className="text-amber-400 mb-3" />
                              <div className="text-base font-bold text-slate-900 dark:text-white">No solutions were generated</div>
                              <p className="text-sm text-slate-500 mt-1 max-w-md">The AI could not extract questions from your document. Try uploading a clear question bank or past paper, and click Generate again.</p>
                            </div>
                          </Card>
                        ) : (
                          studyPack.questionSolutions.map((sol, i) => (
                            <Card key={i} className="border-emerald-200 dark:border-emerald-900">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="font-bold text-slate-900 dark:text-white">Q{i + 1}: {sol.question}</div>
                                  {sol.marks && <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0">{sol.marks} Marks</div>}
                                </div>
                                <div className="rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300 shadow-inner">
                                  <RichText text={sol.answer} />
                                </div>
                                {sol.explanation && (
                                  <div className="prose prose-sm max-w-none prose-slate dark:prose-invert text-[13px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                                    <span className="font-semibold text-slate-600 dark:text-slate-300">Explanation:</span> 
                                    <div className="inline-block ml-1">
                                      <RichText text={sol.explanation || ''} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeOutputTab === 'flashcards' && (
                    <div className="max-h-[720px] overflow-y-auto pr-1">
                      <FlashcardCard key={studyPack.flashcards[flashcardIndex]?.id} card={studyPack.flashcards[flashcardIndex]}
                        currentIndex={flashcardIndex} total={studyPack.flashcards.length}
                        onNext={() => setFlashcardIndex(i => (i + 1) % studyPack.flashcards.length)}
                        onPrev={flashcardIndex > 0 ? () => setFlashcardIndex(i => i - 1) : undefined}
                        onConfidence={handleConfidence}
                        confidenceMap={confidenceMap} />
                    </div>
                  )}

                  {activeOutputTab === 'quiz' && (
                    <div className="max-h-[720px] space-y-4 overflow-y-auto pr-1">
                      {/* Toggle timed mode */}
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                        <button onClick={() => setTimedQuiz(false)}
                          className={`rounded-xl px-4 py-2 text-[12px] font-bold transition ${!timedQuiz ? 'bg-slate-900 text-white dark:bg-sky-500' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                          Practice Mode
                        </button>
                        <button onClick={() => setTimedQuiz(true)}
                          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-bold transition ${timedQuiz ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                          <Clock size={12} /> Timed Mode
                        </button>
                      </div>

                      {timedQuiz ? (
                        <QuizTimer questions={studyPack.quiz} onAnswer={handleAnswer} onComplete={() => {}} />
                      ) : (
                        <>
                          <div className="grid gap-4 md:grid-cols-3">
                            <Card><div className="text-sm text-slate-500">Answered</div><div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{quizStats.answered}/{studyPack.quiz.length}</div></Card>
                            <Card><div className="text-sm text-slate-500">Correct</div><div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{quizStats.correct}</div></Card>
                            <Card><div className="text-sm text-slate-500">Needs review</div><div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{quizStats.incorrect}</div></Card>
                          </div>
                          <div className="grid gap-4 xl:grid-cols-2">
                            {studyPack.quiz.map(q => <QuizCard key={q.id} question={q} selectedAnswer={answerMap[q.id]} onAnswer={a => handleAnswer(q, a)} />)}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!studyPack && !loading && (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Select a file and generate to see summary, flashcards, and quiz.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ==================== MIND MAP TAB ==================== */}
      {labTab === 'mindmap' && (
        <Card>
          {studyPack ? (
            <TopicMindMap studyPack={studyPack} weakAreas={data.weakAreas} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Network size={32} className="text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Generate a study pack first</h3>
              <p className="text-sm text-slate-500 mt-1">The mind map visualizes topic relationships from your study pack.</p>
              <button onClick={() => setLabTab('generate')} className="mt-4 rounded-xl bg-purple-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-purple-600 transition">Go to Generate</button>
            </div>
          )}
        </Card>
      )}

      {/* ==================== HISTORY TAB ==================== */}
      {labTab === 'history' && <Card><StudyHistory onLoadSession={handleLoadSession} /></Card>}

      {/* ==================== AI TUTOR TAB ==================== */}
      {labTab === 'tutor' && (
        <Card className="overflow-hidden" style={{ height: '600px' }}>
          {docText ? (
            <AIChatTutor documentText={docText} fileName={docFileName} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center px-6">
              <MessageCircle size={32} className="text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Generate a study pack first</h3>
              <p className="text-sm text-slate-500 mt-1">The AI Tutor needs document content. Go to the Generate tab, upload a file, and generate a study pack.</p>
              <button onClick={() => setLabTab('generate')} className="mt-4 rounded-xl bg-purple-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-purple-600 transition">
                Go to Generate
              </button>
            </div>
          )}
        </Card>
      )}

      {/* ==================== WEAKNESS TAB ==================== */}
      {labTab === 'weakness' && (
        <div className="space-y-5">
          {/* Overall Health Summary */}
          {(() => {
            const totalMisses = weakAreas.reduce((s, a) => s + a.misses, 0);
            const totalCorrects = weakAreas.reduce((s, a) => s + a.corrects, 0);
            const overallAcc = totalMisses + totalCorrects > 0 ? totalCorrects / (totalMisses + totalCorrects) : 0;
            const healthScore = Math.round(overallAcc * 100);
            const atRisk = weakAreas.filter(a => a.corrects / Math.max(1, a.misses + a.corrects) < 0.45).length;
            const recovering = weakAreas.filter(a => a.corrects / Math.max(1, a.misses + a.corrects) >= 0.75).length;
            const scoreColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#f43f5e';
            const circumference = 2 * Math.PI * 42;

            return (
              <Card>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Donut Chart */}
                  <div className="relative shrink-0">
                    <svg width="120" height="120" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-slate-800" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${overallAcc * circumference} ${circumference}`}
                        strokeDashoffset={circumference * 0.25}
                        className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{healthScore}%</span>
                      <span className="text-[9px] font-bold uppercase text-slate-400">Health</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {healthScore >= 70 ? '🎉 Great progress!' : healthScore >= 40 ? '📊 Making progress' : '⚠️ Focus needed'}
                    </h3>
                    <p className="text-[13px] text-slate-500">
                      {healthScore >= 70
                        ? 'Most of your weak areas are recovering. Keep practicing to lock in the knowledge!'
                        : healthScore >= 40
                        ? 'Some topics need more attention. Review the areas marked "at risk" below.'
                        : 'Several topics need urgent review. Focus on the red areas first.'}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-900">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">{weakAreas.length}</div>
                        <div className="text-[9px] font-bold uppercase text-slate-400">Topics</div>
                      </div>
                      <div className="rounded-xl bg-rose-50 p-3 text-center dark:bg-rose-950/20">
                        <div className="text-lg font-bold text-rose-600">{atRisk}</div>
                        <div className="text-[9px] font-bold uppercase text-rose-400">At Risk</div>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-950/20">
                        <div className="text-lg font-bold text-emerald-600">{recovering}</div>
                        <div className="text-[9px] font-bold uppercase text-emerald-400">Recovering</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Topic Cards */}
          {weakAreas.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-3 text-4xl">🎯</div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No weak areas detected yet</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">Take a quiz in the Generate tab — your missed questions will appear here with targeted study advice.</p>
                <button onClick={() => setLabTab('generate')} className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-sky-600 transition">
                  Go take a quiz
                </button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {weakAreas.map(area => {
                const total = area.misses + area.corrects;
                const accuracy = total > 0 ? area.corrects / total : 0;
                const pct = Math.round(accuracy * 100);
                const label = accuracy >= 0.75 ? 'Recovering' : accuracy >= 0.45 ? 'Needs Review' : 'At Risk';
                const emoji = accuracy >= 0.75 ? '✅' : accuracy >= 0.45 ? '⚠️' : '🔴';
                const ringColor = accuracy >= 0.75 ? '#10b981' : accuracy >= 0.45 ? '#f59e0b' : '#f43f5e';
                const badgeCls = accuracy >= 0.75
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : accuracy >= 0.45
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
                const circ = 2 * Math.PI * 18;
                const tip = accuracy >= 0.75
                  ? '💡 Almost there! One more practice session should lock this in.'
                  : accuracy >= 0.45
                  ? '📝 Try explaining this topic to someone else — teaching is the best way to learn.'
                  : '🎯 Start with the basics: re-read the relevant section, then try the flashcards.';

                return (
                  <Card key={area.topic}>
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <svg width="50" height="50" viewBox="0 0 44 44">
                            <circle cx="22" cy="22" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" className="dark:stroke-slate-800" />
                            <circle cx="22" cy="22" r="18" fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round"
                              strokeDasharray={`${accuracy * circ} ${circ}`} strokeDashoffset={circ * 0.25}
                              className="transition-all duration-700" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">{pct}%</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{emoji} {area.topic}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ${badgeCls}`}>{label}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="text-rose-500 font-medium">{area.misses} missed</span>
                            <span className="text-emerald-500 font-medium">{area.corrects} correct</span>
                            <span>of {total} attempts</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => clearWeakArea(area.topic)}>Clear</Button>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: ringColor }} />
                      </div>

                      {/* Last missed question */}
                      {area.lastQuestion && (
                        <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900/80">
                          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Last missed question</div>
                          <p className="text-[12px] text-slate-700 dark:text-slate-300">{area.lastQuestion}</p>
                          {area.lastExplanation && (
                            <div className="mt-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-[11px] text-sky-700 dark:bg-sky-950/20 dark:text-sky-400">
                              💡 {area.lastExplanation}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Study tip */}
                      <div className="rounded-xl border border-purple-100 bg-purple-50/50 px-3 py-2 text-[11px] text-purple-700 dark:border-purple-900/30 dark:bg-purple-950/10 dark:text-purple-400">
                        {tip}
                      </div>

                      {/* Action */}
                      {docText && (
                        <button onClick={() => { setLabTab('tutor'); setTimeout(() => {}, 100); }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-[11px] font-bold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950">
                          <Brain size={12} /> Ask AI Tutor about this topic
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <input ref={hiddenRef} type="file" accept=".pdf,.docx,.txt" hidden multiple
        onChange={e => { handleUpload(e.target.files); e.target.value = ''; }} />
    </div>
  );
};

export default StudyLab;
