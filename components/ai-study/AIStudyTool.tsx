import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Loader2, Sparkles, TrendingUp } from 'lucide-react';
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
  const { data, recordWeakTopics, clearWeakArea } = useData();
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFileId, setSelectedFileId] = useState('');
  const [mode, setMode] = useState<LearningMode>('quick-revision');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studyPack, setStudyPack] = useState<StudyPack | null>(null);
  const [activeTab, setActiveTab] = useState<StudyOutputTab>('summary');
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({});

  const supportedFiles = useMemo(() => files.filter((file) => isStudySupportedFile(file.file)), [files]);
  const selectedFile = supportedFiles.find((file) => file.id === selectedFileId) || null;
  const weakAreas = useMemo(() => [...data.weakAreas].sort((a, b) => b.misses - a.misses).slice(0, 5), [data.weakAreas]);

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
    if (answer !== question.correctAnswer) {
      recordWeakTopics([question.topic]);
    }
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="space-y-5">
            <ModeSelector value={mode} onChange={setMode} />

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
                <p className="mt-2">{error.includes('VITE_GEMINI_API_KEY') ? 'Missing Gemini API Key. You can get one for free at Google AI Studio.' : error}</p>
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
                  <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <Card className="h-full">
                      <div className="space-y-3">
                        <div className="text-sm uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">Concise summary</div>
                        <div className="text-2xl font-semibold text-slate-950 dark:text-white">{studyPack.summary.headline}</div>
                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{studyPack.summary.concise}</p>
                      </div>
                    </Card>
                    <Card className="h-full">
                      <div className="space-y-3">
                        <div className="text-sm uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">Key points</div>
                        <div className="grid gap-2">
                          {studyPack.summary.bullets.map((bullet) => (
                            <div key={bullet} className="rounded-2xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                              {bullet}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                ) : null}

                {activeTab === 'flashcards' ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {studyPack.flashcards.map((card) => (
                      <FlashcardCard key={card.id} card={card} />
                    ))}
                  </div>
                ) : null}

                {activeTab === 'quiz' ? (
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
                ) : null}
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">
                <TrendingUp size={15} />
                Weakness detection
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Incorrect quiz answers feed this list so the app can surface where revision is slipping.
              </p>

              {weakAreas.length === 0 ? (
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
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{area.misses} miss{area.misses > 1 ? 'es' : ''} logged</div>
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

export default AIStudyTool;
