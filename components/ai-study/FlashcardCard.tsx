import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Flashcard } from '../../types';
import { Badge, Button, Card } from '../UI';

interface Props {
  card: Flashcard;
}

const FlashcardCard: React.FC<Props> = ({ card }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <Card className="h-full">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Badge color="blue">{card.topic}</Badge>
            <Button size="sm" variant="ghost" onClick={() => setRevealed((value) => !value)}>
              <RotateCcw size={13} />
              {revealed ? 'Question' : 'Answer'}
            </Button>
          </div>
          <div className="text-sm uppercase tracking-[0.24em] text-slate-400">{revealed ? 'Answer' : 'Question'}</div>
          <div className="text-base font-medium leading-7 text-slate-900 dark:text-white">{revealed ? card.answer : card.question}</div>
        </div>
      </div>
    </Card>
  );
};

export default FlashcardCard;
