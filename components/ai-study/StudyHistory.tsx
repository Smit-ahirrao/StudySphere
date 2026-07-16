import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, Download, Trash2, ChevronRight, Brain, X } from 'lucide-react';
import { StudyPack } from '../../types';

export interface SavedSession {
  id: string;
  fileName: string;
  mode: string;
  pack: StudyPack;
  createdAt: number;
  quizScore?: { correct: number; total: number };
}

const STORAGE_KEY = 'studysphere_study_sessions';

export const loadStudySessions = (): SavedSession[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};

export const saveStudySession = (session: SavedSession) => {
  const sessions = loadStudySessions();
  sessions.unshift(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 30)));
};

export const deleteStudySession = (id: string) => {
  const sessions = loadStudySessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

interface Props {
  onLoadSession: (session: SavedSession) => void;
}

const StudyHistory: React.FC<Props> = ({ onLoadSession }) => {
  const [sessions, setSessions] = useState<SavedSession[]>(loadStudySessions);

  const handleDelete = (id: string) => {
    deleteStudySession(id);
    setSessions(loadStudySessions());
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900">
          <BookOpen size={28} className="text-slate-300 dark:text-slate-700" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">No study sessions yet</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">Generate a study pack from the Generate tab — it'll be saved here automatically for later review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{sessions.length} Sessions</h3>
        <span className="text-[10px] text-slate-400">Auto-saved after generation</span>
      </div>

      {sessions.map(session => {
        const score = session.quizScore;
        const topicCount = session.pack.keyTopics.length;
        const cardCount = session.pack.flashcards.length;
        const quizCount = session.pack.quiz.length;

        return (
          <div key={session.id}
            className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-sm">
                <Brain size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-bold text-slate-900 dark:text-white truncate">{session.fileName}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold capitalize dark:bg-slate-800">
                    {session.mode.replace('-', ' ')}
                  </span>
                  <span>{topicCount} topics</span>
                  <span>{cardCount} cards</span>
                  <span>{quizCount} questions</span>
                </div>

                {/* Topic chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {session.pack.keyTopics.slice(0, 4).map((topic, i) => (
                    <span key={i} className="rounded-lg bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950/30 dark:text-sky-400">{topic}</span>
                  ))}
                </div>

                {/* Quiz score if available */}
                {score && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${(score.correct / score.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {score.correct}/{score.total}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1 pt-0.5">
                <button onClick={() => onLoadSession(session)}
                  className="flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-[11px] font-bold text-sky-600 transition hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:hover:bg-sky-900/40"
                >
                  <ChevronRight size={11} /> Review
                </button>
                <button onClick={() => handleDelete(session.id)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StudyHistory;
