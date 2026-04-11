import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Brain, CheckCircle2, Loader2, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { LearningMode, QuizQuestion, StudyPack } from '../../types';
import { extractTextFromStudyFile, generateStudyPack, isStudySupportedFile } from '../../utils/aiStudy';
import { Badge, Button, Card } from '../UI';
import FileUpload from './FileUpload';
import FlashcardCard from './FlashcardCard';
import ModeSelector from './ModeSelector';
import OutputTabs, { StudyOutputTab } from './OutputTabs';
import QuizCard from './QuizCard';

interface StudySourceFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

interface Props {
  files: StudySourceFile[];
  onImportFiles: (files: FileList | File[]) => Promise<void>;
}

const AIStudyTool: React.FC<Props> = ({ files, onImportFiles }) => {
  const { data, recordQuizOutcome, clearWeakArea } = useData();
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFileId, setSelectedFileId] = useState('');
  const [mode, setMode] = useState<LearningMode>('quick-revision');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studyPack, setStudyPack] = useState<StudyPack | null>(null);
  const [activeTab, setActiveTab] = useState<StudyOutputTab>('summary');
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({});
  const [flashcardCount, setFlashcardCount] = useState(6);
  const [quizCount, setQuizCount] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState<'mixed' | 'easy' | 'medium' | 'hard'>('mixed');
  const [showWeaknessReport, setShowWeaknessReport] = useState(false);

  const supportedFiles = useMemo(() => files.filter((file) => isStudySupportedFile(file.file)), [files]);
  const selectedFile = supportedFiles.find((file) => file.id === selectedFileId) || null;
  const weakAreas = useMemo(() => [...data.weakAreas].sort((a, b) => (b.misses - b.corrects) - (a.misses - a.corrects)).slice(0, 5), [data.weakAreas]);
  const weakestTopic = weakAreas[0] || null;
  const quizStats = useMemo(() => {
    if (!studyPack) return { answered: 0, correct: 0, incorrect: 0 };
    const answeredQuestions = studyPack.quiz.filter((question) => Boolean(answerMap[question.id]));
    const correct = answeredQuestions.filter((question) => answerMap[question.id] === question.correctAnswer).length;
    return {
      answered: answeredQuestions.length,
      correct,
      incorrect: answeredQuestions.length - correct,
    };
  }, [studyPack, answerMap]);

  useEffect(() => {
    if (supportedFiles.length === 0) {
      setSelectedFileId('');
      return;
    }

    if (!supportedFiles.some((file) => file.id === selectedFileId)) {
      setSelectedFileId(supportedFiles[0].id);
    }
  }, [supportedFiles, selectedFileId]);

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError('Choose a supported file first.');
      return;
    }

    setLoading(true);
    setError('');
    setAnswerMap({});

    try {
      const text = await extractTextFromStudyFile(selectedFile.file);
      const generated = await generateStudyPack({
        text,
        fileName: selectedFile.name,
        mode,
        flashcardCount,
        quizCount,
        quizDifficulty,
      });

      setStudyPack(generated);
      setActiveTab('summary');
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'The AI study pipeline could not complete this request.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (question: QuizQuestion, answer: string) => {
    setAnswerMap((current) => ({ ...current, [question.id]: answer }));
    recordQuizOutcome({
      topic: question.topic,
      correct: answer === question.correctAnswer,
      question: question.question,
      explanation: question.explanation,
    });
  };

  const handleUpload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const validFiles = Array.from(list).filter((file) => isStudySupportedFile(file));

    if (validFiles.length === 0) {
      setError('Upload a PDF, DOCX, or TXT file for the AI study tool.');
      return;
    }

    setError('');
    await onImportFiles(validFiles);
  };

  return (
    <div className="space-y-6">
      <FileUpload
        files={supportedFiles}
        selectedFileId={selectedFileId}
        onSelectFile={setSelectedFileId}
        onUploadClick={() => hiddenInputRef.current?.click()}
        busy={loading}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="space-y-5">
            <ModeSelector value={mode} onChange={setMode} />

            <div className="grid gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-3">
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Flashcards</div>
                <select value={flashcardCount} onChange={(event) => setFlashcardCount(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-950">
                  {[4, 6, 8, 10, 12].map((count) => (
                    <option key={count} value={count}>
                      {count} cards
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Quiz length</div>
                <select value={quizCount} onChange={(event) => setQuizCount(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-950">
                  {[3, 5, 8, 10].map((count) => (
                    <option key={count} value={count}>
                      {count} questions
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Quiz difficulty</div>
                <select value={quizDifficulty} onChange={(event) => setQuizDifficulty(event.target.value as 'mixed' | 'easy' | 'medium' | 'hard')} className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-950">
                  <option value="mixed">Mixed</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleGenerate} disabled={loading || !selectedFile}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? 'Generating study pack' : 'Generate study pack'}
              </Button>
              {selectedFile ? (
                <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                  {selectedFile.name}
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-[22px] border border-rose-200 bg-rose-50/85 px-4 py-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle size={16} />
                  AI study flow blocked
                </div>
                <p className="mt-2">{error.includes('VITE_GEMINI_API_KEY') ? 'Missing Gemini API key. Add it in your environment to enable live generation.' : error}</p>
              </div>
            ) : null}

            {!studyPack && !loading ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Step 3 will appear here after generation with structured outputs for summary, flashcards, and quiz.
              </div>
            ) : null}

            {loading ? (
              <div className="grid gap-3 md:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-32 animate-pulse rounded-[24px] bg-slate-100 dark:bg-slate-900" />
                ))}
              </div>
            ) : null}

            {studyPack ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color="cyan">{studyPack.difficulty}</Badge>
                  {studyPack.keyTopics.map((topic) => (
                    <Badge key={topic} color="gray">
                      {topic}
                    </Badge>
                  ))}
                </div>

                <OutputTabs activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === 'summary' ? (
                  <div className="grid max-h-[720px] gap-4 overflow-y-auto pr-1 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card className="h-full">
                      <div className="space-y-3">
                        <div className="text-sm uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">Concise summary</div>
                        <div className="text-2xl font-semibold text-slate-950 dark:text-white">{studyPack.summary.headline}</div>
                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{studyPack.summary.concise}</p>
                        {studyPack.summary.memoryHooks?.length ? (
                          <div className="space-y-2 pt-2">
                            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Memory hooks</div>
                            <div className="grid gap-2">
                              {studyPack.summary.memoryHooks.map((item) => (
                                <div key={item} className="rounded-2xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </Card>
                    <div className="grid gap-4">
                      <Card className="h-full">
                        <div className="space-y-3">
                          <div className="text-sm uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">Key points</div>
                          <div className="grid gap-2">
                            {studyPack.summary.bullets.map((bullet) => (
                              <div key={bullet} className="rounded-2xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                                {bullet}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">
                              <Target size={14} />
                              Exam signals
                            </div>
                            <div className="grid gap-2">
                              {studyPack.summary.examSignals?.map((item) => (
                                <div key={item} className="rounded-2xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                        <Card>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">
                              <Brain size={14} />
                              Study plan
                            </div>
                            <div className="grid gap-2">
                              {studyPack.studyPlan.map((item) => (
                                <div key={item} className="rounded-2xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      </div>
                      <Card>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">
                            <CheckCircle2 size={14} />
                            Concept checks
                          </div>
                          <div className="grid gap-2">
                            {studyPack.conceptChecks.map((item) => (
                              <div key={item} className="rounded-2xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'flashcards' ? (
                  <div className="grid max-h-[720px] gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
                    {studyPack.flashcards.map((card) => (
                      <FlashcardCard key={card.id} card={card} />
                    ))}
                  </div>
                ) : null}

                {activeTab === 'quiz' ? (
                  <div className="max-h-[720px] space-y-4 overflow-y-auto pr-1">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Answered</div>
                        <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{quizStats.answered}/{studyPack.quiz.length}</div>
                      </Card>
                      <Card>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Correct</div>
                        <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{quizStats.correct}</div>
                      </Card>
                      <Card>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Needs review</div>
                        <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{quizStats.incorrect}</div>
                      </Card>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      {studyPack.quiz.map((question) => (
                        <QuizCard
                          key={question.id}
                          question={question}
                          selectedAnswer={answerMap[question.id]}
                          onAnswer={(answer) => handleAnswer(question, answer)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6 xl:sticky xl:top-24">
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">
                <TrendingUp size={15} />
                Weakness detection
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Quiz answers now build a live revision radar, so weak concepts surface faster and recovery becomes visible over time.
              </p>

              {weakestTopic ? (
                <div className="rounded-[22px] border border-amber-200/70 bg-amber-50/80 px-4 py-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-200">Priority topic</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{weakestTopic.topic}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {weakestTopic.misses} misses, {weakestTopic.corrects} correct answers, status: {getConfidenceLabel(weakestTopic.misses, weakestTopic.corrects)}
                  </div>
                </div>
              ) : null}

              <Button size="sm" variant="secondary" onClick={() => setShowWeaknessReport((value) => !value)}>
                {showWeaknessReport ? 'Hide report' : 'Show report'}
              </Button>

              {!showWeaknessReport ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Open the report only when you want a focused review view.
                </div>
              ) : weakAreas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  No weak areas tracked yet. Start a quiz and miss a question to build this view.
                </div>
              ) : (
                <div className="space-y-3">
                  {weakAreas.map((area) => (
                    <div key={area.topic} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{area.topic}</div>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {area.misses} miss{area.misses > 1 ? 'es' : ''} | {area.corrects} correct | status: {getConfidenceLabel(area.misses, area.corrects)}
                          </div>
                          {area.lastQuestion ? <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">Last miss: {area.lastQuestion}</div> : null}
                          {area.lastExplanation ? <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{area.lastExplanation}</div> : null}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => clearWeakArea(area.topic)}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <input
        ref={hiddenInputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        onChange={(event) => {
          handleUpload(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
};

const getConfidenceLabel = (misses: number, corrects: number) => {
  const total = misses + corrects;
  if (total === 0) return 'unread';
  const accuracy = corrects / total;
  if (accuracy >= 0.75) return 'recovering';
  if (accuracy >= 0.45) return 'needs review';
  return 'at risk';
};

export default AIStudyTool;
