import React, { useEffect, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Flashcard } from '../../types';
import { Badge, Button } from '../UI';

interface Props {
  card: Flashcard;
  currentIndex: number;
  total: number;
  onNext: () => void;
}

const FlashcardCard: React.FC<Props> = ({ card, currentIndex, total, onNext }) => {
  const [revealed, setRevealed] = useState(false);
  const progress = ((currentIndex + 1) / total) * 100;

  useEffect(() => {
    setRevealed(false);
  }, [card.id]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <style>{`
        @keyframes flashcardSlideIn {
          0% { opacity: 0; transform: translateX(28px) scale(0.985); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge color="blue">{card.topic}</Badge>
          <Badge color="gray">
            {currentIndex + 1} / {total}
          </Badge>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setRevealed((value) => !value)}>
          <RotateCcw size={13} />
          {revealed ? 'Show question' : 'Show answer'}
        </Button>
      </div>

      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
          <span>Deck progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="relative min-h-[440px] [perspective:1600px]" style={{ animation: 'flashcardSlideIn 420ms cubic-bezier(0.22, 1, 0.36, 1)' }}>
        <button
          type="button"
          onClick={() => setRevealed((value) => !value)}
          className="absolute inset-0 w-full text-left"
          aria-label={revealed ? 'Show question side of flashcard' : 'Show answer side of flashcard'}
        >
          <div
            className={`relative h-full min-h-[440px] w-full rounded-[32px] transition-transform duration-700 [transform-style:preserve-3d] ${
              revealed ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            <CardFace
              eyebrow="Question"
              title={card.question}
              helper="Tap anywhere on the card to reveal the answer."
              variant="front"
            />

            <CardFace
              eyebrow="Answer"
              title={card.answer}
              helper="Use the next arrow when you are ready for the next flashcard."
              variant="back"
            />
          </div>
        </button>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={onNext}>
          Next card
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
};

const CardFace = ({
  eyebrow,
  title,
  helper,
  variant,
}: {
  eyebrow: string;
  title: string;
  helper: string;
  variant: 'front' | 'back';
}) => (
  <div
    className={`absolute inset-0 flex h-full flex-col justify-between overflow-hidden rounded-[32px] border p-8 shadow-[0_35px_100px_-55px_rgba(15,23,42,0.5)] [backface-visibility:hidden] ${
      variant === 'front'
        ? 'border-sky-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,249,255,0.98),rgba(236,254,255,0.95))] dark:border-sky-900/60 dark:bg-[linear-gradient(145deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98),rgba(12,74,110,0.22))]'
        : 'border-emerald-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,253,250,0.98),rgba(236,253,245,0.96))] [transform:rotateY(180deg)] dark:border-emerald-900/60 dark:bg-[linear-gradient(145deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98),rgba(6,95,70,0.24))]'
    }`}
  >
    <div className="space-y-4">
      <div className={`text-sm font-semibold uppercase tracking-[0.28em] ${variant === 'front' ? 'text-sky-600 dark:text-sky-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
        {eyebrow}
      </div>
      <div className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white">
        {title}
      </div>
    </div>

    <div className="flex items-end justify-between gap-4">
      <p className="max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">{helper}</p>
      <div className={`h-14 w-14 rounded-2xl ${variant === 'front' ? 'bg-sky-100 dark:bg-sky-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40'}`} />
    </div>
  </div>
);

export default FlashcardCard;
