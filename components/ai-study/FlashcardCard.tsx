import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, RotateCcw, ThumbsDown, ThumbsUp, Keyboard } from 'lucide-react';
import { Flashcard } from '../../types';
import { Badge, Button } from '../UI';

interface Props {
  card: Flashcard;
  currentIndex: number;
  total: number;
  onNext: () => void;
  onPrev?: () => void;
  onConfidence?: (cardId: string, level: 'knew' | 'review') => void;
  confidenceMap?: Record<string, 'knew' | 'review'>;
}

const FlashcardCard: React.FC<Props> = ({ card, currentIndex, total, onNext, onPrev, onConfidence, confidenceMap = {} }) => {
  const [revealed, setRevealed] = useState(false);
  const progress = ((currentIndex + 1) / total) * 100;
  const confidence = confidenceMap[card.id];

  useEffect(() => { setRevealed(false); }, [card.id]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setRevealed(v => !v); }
    if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
    if (e.key === 'ArrowLeft' && onPrev) { e.preventDefault(); onPrev(); }
    if (e.key === '1' && revealed && onConfidence) { onConfidence(card.id, 'knew'); onNext(); }
    if (e.key === '2' && revealed && onConfidence) { onConfidence(card.id, 'review'); onNext(); }
  }, [revealed, card.id, onNext, onPrev, onConfidence]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const knewCount = Object.values(confidenceMap).filter(v => v === 'knew').length;
  const reviewCount = Object.values(confidenceMap).filter(v => v === 'review').length;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <style>{`
        @keyframes flashcardSlideIn {
          0% { opacity: 0; transform: translateX(28px) scale(0.985); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge color="blue">{card.topic}</Badge>
          <Badge color="gray">{currentIndex + 1} / {total}</Badge>
          {confidence && (
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
              confidence === 'knew' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
            }`}>
              {confidence === 'knew' ? <Check size={8} /> : <RotateCcw size={8} />}
              {confidence === 'knew' ? 'Got it' : 'Review'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[9px] text-slate-400 sm:flex dark:bg-slate-900">
            <Keyboard size={10} />
            Space=flip · ←→=nav · 1=knew · 2=review
          </div>
          <Button size="sm" variant="secondary" onClick={() => setRevealed(v => !v)}>
            <RotateCcw size={13} />
            {revealed ? 'Question' : 'Answer'}
          </Button>
        </div>
      </div>

      {/* Confidence stats bar */}
      {(knewCount > 0 || reviewCount > 0) && (
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] dark:bg-slate-900">
          <span className="text-slate-400 font-bold">Score:</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
            <ThumbsUp size={10} /> {knewCount} knew
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
            <ThumbsDown size={10} /> {reviewCount} review
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${total > 0 ? (knewCount / total) * 100 : 0}%` }} />
          </div>
          <span className="text-slate-500 font-bold">{Math.round((knewCount / total) * 100)}%</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
          <span>Deck progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-emerald-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="relative min-h-[400px] [perspective:1600px]" style={{ animation: 'flashcardSlideIn 420ms cubic-bezier(0.22, 1, 0.36, 1)' }}>
        <button type="button" onClick={() => setRevealed(v => !v)} className="absolute inset-0 w-full text-left"
          aria-label={revealed ? 'Show question' : 'Show answer'}>
          <div className={`relative h-full min-h-[400px] w-full rounded-[32px] transition-transform duration-700 [transform-style:preserve-3d] ${revealed ? '[transform:rotateY(180deg)]' : ''}`}>
            <CardFace eyebrow="Question" title={card.question} helper="Tap card or press Space to reveal the answer." variant="front" />
            <CardFace eyebrow="Answer" title={card.answer} helper="Rate your confidence below, then continue." variant="back" />
          </div>
        </button>
      </div>

      {/* Navigation + Confidence buttons */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-2">
          {onPrev && (
            <Button variant="secondary" onClick={onPrev}>
              <ArrowLeft size={16} /> Prev
            </Button>
          )}
        </div>

        {/* Confidence buttons - show after reveal */}
        {revealed && onConfidence && (
          <div className="flex items-center gap-2">
            <button onClick={() => { onConfidence(card.id, 'knew'); onNext(); }}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2.5 text-[12px] font-bold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50">
              <ThumbsUp size={13} /> I knew it
            </button>
            <button onClick={() => { onConfidence(card.id, 'review'); onNext(); }}
              className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2.5 text-[12px] font-bold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50">
              <ThumbsDown size={13} /> Needs review
            </button>
          </div>
        )}

        <Button onClick={onNext}>
          Next <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
};

const CardFace = ({ eyebrow, title, helper, variant }: { eyebrow: string; title: string; helper: string; variant: 'front' | 'back' }) => (
  <div className={`absolute inset-0 flex h-full flex-col justify-between overflow-hidden rounded-[32px] border p-8 shadow-[0_35px_100px_-55px_rgba(15,23,42,0.5)] [backface-visibility:hidden] ${
    variant === 'front'
      ? 'border-sky-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,249,255,0.98),rgba(236,254,255,0.95))] dark:border-sky-900/60 dark:bg-[linear-gradient(145deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98),rgba(12,74,110,0.22))]'
      : 'border-emerald-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,253,250,0.98),rgba(236,253,245,0.96))] [transform:rotateY(180deg)] dark:border-emerald-900/60 dark:bg-[linear-gradient(145deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98),rgba(6,95,70,0.24))]'
  }`}>
    <div className="space-y-4">
      <div className={`text-sm font-semibold uppercase tracking-[0.28em] ${variant === 'front' ? 'text-sky-600 dark:text-sky-300' : 'text-emerald-600 dark:text-emerald-300'}`}>{eyebrow}</div>
      <div className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white">{title}</div>
    </div>
    <div className="flex items-end justify-between gap-4">
      <p className="max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">{helper}</p>
      <div className={`h-14 w-14 rounded-2xl ${variant === 'front' ? 'bg-sky-100 dark:bg-sky-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40'}`} />
    </div>
  </div>
);

export default FlashcardCard;
