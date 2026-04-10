import React from 'react';
import { CheckCircle2, Timer } from 'lucide-react';
import { QuizQuestion } from '../../types';
import { Badge, Card } from '../UI';

interface Props {
  question: QuizQuestion;
  selectedAnswer?: string;
  onAnswer: (answer: string) => void;
}

const QuizCard: React.FC<Props> = ({ question, selectedAnswer, onAnswer }) => {
  const answered = Boolean(selectedAnswer);
  const correct = answered && selectedAnswer === question.correctAnswer;

  return (
    <Card className="h-full">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={question.difficulty === 'hard' ? 'red' : question.difficulty === 'medium' ? 'yellow' : 'green'}>
            {question.difficulty}
          </Badge>
          <Badge color="blue">{question.topic}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Timer size={12} />
            {question.suggestedSeconds || 45}s
          </span>
        </div>

        <div className="text-base font-semibold text-slate-900 dark:text-white">{question.question}</div>

        <div className="grid gap-2">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = answered && option === question.correctAnswer;
            const isWrongSelection = answered && isSelected && option !== question.correctAnswer;

            return (
              <button
                key={option}
                type="button"
                onClick={() => onAnswer(option)}
                disabled={answered}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  isCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                    : isWrongSelection
                    ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
                    : isSelected
                    ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/30'
                    : 'border-slate-200 bg-white/80 hover:border-cyan-200 hover:bg-cyan-50 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-cyan-800 dark:hover:bg-slate-900'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className={`rounded-[20px] border px-4 py-3 text-sm ${correct ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/20'}`}>
            <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
              <CheckCircle2 size={15} />
              Correct answer: {question.correctAnswer}
            </div>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{question.explanation}</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default QuizCard;
