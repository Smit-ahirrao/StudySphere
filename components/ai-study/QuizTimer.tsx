import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Clock, Trophy, X, RotateCcw } from 'lucide-react';
import { QuizQuestion } from '../../types';

interface Props {
  questions: QuizQuestion[];
  onAnswer: (question: QuizQuestion, answer: string) => void;
  onComplete: () => void;
}

type QuizState = 'ready' | 'active' | 'finished';

const QuizTimer: React.FC<Props> = ({ questions, onAnswer, onComplete }) => {
  const [state, setState] = useState<QuizState>('ready');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{ question: QuizQuestion; answer: string | null; timeTaken: number }>>([]);
  const [startTime, setStartTime] = useState(0);

  const current = questions[currentIndex];
  const totalTime = current?.suggestedSeconds || 45;

  useEffect(() => {
    if (state !== 'active' || selected !== null) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, state, selected]);

  const startQuiz = () => {
    setState('active');
    setCurrentIndex(0);
    setResults([]);
    setSelected(null);
    setTimeLeft(questions[0]?.suggestedSeconds || 45);
    setStartTime(Date.now());
  };

  const handleTimeout = useCallback(() => {
    const timeTaken = totalTime;
    setResults(prev => [...prev, { question: current, answer: null, timeTaken }]);
    moveNext();
  }, [current, totalTime]);

  const handleSelect = (answer: string) => {
    if (selected !== null) return;
    setSelected(answer);
    const timeTaken = totalTime - timeLeft;
    onAnswer(current, answer);
    setResults(prev => [...prev, { question: current, answer, timeTaken }]);
    setTimeout(() => moveNext(), 1200);
  };

  const moveNext = () => {
    const next = currentIndex + 1;
    if (next >= questions.length) {
      setState('finished');
      onComplete();
      return;
    }
    setCurrentIndex(next);
    setSelected(null);
    setTimeLeft(questions[next]?.suggestedSeconds || 45);
    setStartTime(Date.now());
  };

  const timerPercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const timerColor = timerPercent > 50 ? 'text-emerald-500' : timerPercent > 20 ? 'text-amber-500' : 'text-rose-500';
  const timerBg = timerPercent > 50 ? 'bg-emerald-500' : timerPercent > 20 ? 'bg-amber-500' : 'bg-rose-500';

  if (state === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-100 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30">
          <Clock size={36} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Timed Quiz Challenge</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          {questions.length} questions with individual timers. Answer before time runs out or it's marked as unanswered!
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{questions.filter(q => q.difficulty === 'easy').length} Easy</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">{questions.filter(q => q.difficulty === 'medium').length} Medium</span>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">{questions.filter(q => q.difficulty === 'hard').length} Hard</span>
        </div>
        <button onClick={startQuiz}
          className="mt-6 flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600"
        >
          <Clock size={16} /> Start Timed Quiz
        </button>
      </div>
    );
  }

  if (state === 'finished') {
    const correct = results.filter(r => r.answer === r.question.correctAnswer).length;
    const unanswered = results.filter(r => r.answer === null).length;
    const incorrect = results.length - correct - unanswered;
    const avgTime = results.reduce((s, r) => s + r.timeTaken, 0) / results.length;
    const score = Math.round((correct / results.length) * 100);

    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center py-8 text-center">
          <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full ${score >= 80 ? 'bg-emerald-100 dark:bg-emerald-950/30' : score >= 50 ? 'bg-amber-100 dark:bg-amber-950/30' : 'bg-rose-100 dark:bg-rose-950/30'}`}>
            <Trophy size={36} className={score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600'} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{score}% Score</h3>
          <p className="mt-1 text-sm text-slate-500">{score >= 80 ? 'Excellent work!' : score >= 50 ? 'Good effort, keep practicing!' : 'Review the material and try again.'}</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-900">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{results.length}</div>
            <div className="text-[10px] font-bold uppercase text-slate-400">Total</div>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-950/20">
            <div className="text-2xl font-bold text-emerald-600">{correct}</div>
            <div className="text-[10px] font-bold uppercase text-emerald-500">Correct</div>
          </div>
          <div className="rounded-2xl bg-rose-50 p-4 text-center dark:bg-rose-950/20">
            <div className="text-2xl font-bold text-rose-600">{incorrect}</div>
            <div className="text-[10px] font-bold uppercase text-rose-500">Wrong</div>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 text-center dark:bg-amber-950/20">
            <div className="text-2xl font-bold text-amber-600">{unanswered}</div>
            <div className="text-[10px] font-bold uppercase text-amber-500">Timed Out</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold uppercase text-slate-400 mb-3">Avg. Time per Question</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{avgTime.toFixed(1)}s</div>
        </div>

        {/* Review wrong answers */}
        {results.filter(r => r.answer !== r.question.correctAnswer).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Review</h4>
            {results.filter(r => r.answer !== r.question.correctAnswer).map((r, i) => (
              <div key={i} className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/10">
                <p className="text-[13px] font-medium text-slate-900 dark:text-white">{r.question.question}</p>
                <p className="mt-1 text-[12px] text-slate-500">{r.answer ? `Your answer: ${r.answer}` : 'Timed out'}</p>
                <p className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">Correct: {r.question.correctAnswer}</p>
                <p className="text-[11px] text-slate-500 mt-1">{r.question.explanation}</p>
              </div>
            ))}
          </div>
        )}

        <button onClick={startQuiz}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400"
        >
          <RotateCcw size={14} /> Retake Quiz
        </button>
      </div>
    );
  }

  // Active quiz state
  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-bold text-slate-500">{currentIndex + 1}/{questions.length}</span>
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-sky-500 transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + (selected ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
          current.difficulty === 'hard' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' :
          current.difficulty === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
        }`}>{current.difficulty}</span>
        <div className={`flex items-center gap-1.5 text-sm font-bold ${timerColor}`}>
          <Clock size={14} />
          {timeLeft}s
        </div>
      </div>
      <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full ${timerBg} transition-all duration-1000 rounded-full`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Question */}
      <h4 className="text-[15px] font-bold text-slate-900 dark:text-white leading-relaxed">{current.question}</h4>

      {/* Options */}
      <div className="grid gap-2.5">
        {current.options.map((option, i) => {
          const isSelected = selected === option;
          const isCorrect = option === current.correctAnswer;
          const showResult = selected !== null;

          return (
            <button key={i} onClick={() => handleSelect(option)} disabled={selected !== null}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-[13px] font-medium transition-all ${
                showResult && isCorrect
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                  : showResult && isSelected && !isCorrect
                  ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-400'
                  : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-800 dark:hover:bg-sky-950/20 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                showResult && isCorrect ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' :
                showResult && isSelected && !isCorrect ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-300' :
                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {showResult && isCorrect ? <Check size={12} /> : showResult && isSelected ? <X size={12} /> : String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {/* Explanation after answering */}
      {selected && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-[12px] text-slate-600 dark:border-sky-900/30 dark:bg-sky-950/10 dark:text-slate-400">
          <span className="font-bold text-sky-700 dark:text-sky-400">Explanation: </span>
          {current.explanation}
        </div>
      )}
    </div>
  );
};

export default QuizTimer;
