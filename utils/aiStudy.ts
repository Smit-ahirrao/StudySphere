import { Flashcard, LearningMode, QuizQuestion, StudyPack } from '../types';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4.1-mini';
const MAX_SOURCE_LENGTH = 18000;

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export const isStudySupportedFile = (file: File | { name: string; type: string }) => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return (
    ['pdf', 'docx', 'txt'].includes(extension) ||
    file.type === 'application/pdf' ||
    file.type === 'text/plain' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
};

export const extractTextFromStudyFile = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'txt' || file.type === 'text/plain') {
    return normalizeExtractedText(await file.text());
  }

  if (extension === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return normalizeExtractedText(result.value);
  }

  if (extension === 'pdf' || file.type === 'application/pdf') {
    const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
    const pdfWorker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    (pdfjsLib as typeof pdfjsLib & { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = pdfWorker;
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();

      if (text) {
        pages.push(text);
      }
    }

    return normalizeExtractedText(pages.join('\n\n'));
  }

  throw new Error('This file format is not supported yet. Upload a PDF, DOCX, or TXT file.');
};

export const generateStudyPack = async ({
  text,
  fileName,
  mode,
}: {
  text: string;
  fileName: string;
  mode: LearningMode;
}): Promise<StudyPack> => {
  const apiKey = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_OPENAI_API_KEY;
  const model = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_OPENAI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error('Missing AI configuration. Add VITE_OPENAI_API_KEY to use the Smart Study Pipeline.');
  }

  if (!text.trim()) {
    throw new Error('No readable study text was found in this file.');
  }

  const prompt = buildPrompt({
    fileName,
    mode,
    text: text.slice(0, MAX_SOURCE_LENGTH),
  });

  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'study_pack',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              keyTopics: {
                type: 'array',
                items: { type: 'string' },
              },
              difficulty: {
                type: 'string',
                enum: ['beginner', 'intermediate', 'advanced'],
              },
              summary: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  headline: { type: 'string' },
                  concise: { type: 'string' },
                  bullets: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['headline', 'concise', 'bullets'],
              },
              flashcards: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    id: { type: 'string' },
                    question: { type: 'string' },
                    answer: { type: 'string' },
                    topic: { type: 'string' },
                  },
                  required: ['id', 'question', 'answer', 'topic'],
                },
              },
              quiz: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    id: { type: 'string' },
                    question: { type: 'string' },
                    options: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    correctAnswer: { type: 'string' },
                    explanation: { type: 'string' },
                    topic: { type: 'string' },
                    difficulty: {
                      type: 'string',
                      enum: ['easy', 'medium', 'hard'],
                    },
                    suggestedSeconds: { type: 'number' },
                  },
                  required: ['id', 'question', 'options', 'correctAnswer', 'explanation', 'topic', 'difficulty', 'suggestedSeconds'],
                },
              },
            },
            required: ['keyTopics', 'difficulty', 'summary', 'flashcards', 'quiz'],
          },
        },
      },
      messages: [
        {
          role: 'system',
          content: 'You are a precise study assistant. Return only valid JSON that follows the requested schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  const payload = (await response.json()) as OpenAIResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || 'AI generation failed. Please try again.');
  }

  const rawContent = payload.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('AI generation returned an empty response.');
  }

  return normalizeStudyPack(JSON.parse(rawContent));
};

const buildPrompt = ({ fileName, mode, text }: { fileName: string; mode: LearningMode; text: string }) => {
  const modeGuide =
    mode === 'quick-revision'
      ? 'Quick Revision: keep the summary concise, bullets short, flashcards direct, and quiz practical for fast review.'
      : mode === 'exam-mode'
      ? 'Exam Mode: produce timer-ready MCQs, sharper distractors, explicit difficulty labels, and revision-friendly flashcards.'
      : 'Deep Learning: produce richer explanations, conceptual flashcards, and quiz questions that test understanding instead of memorization.';

  return `Analyze the study content from "${fileName}".

${modeGuide}

Instructions:
- Identify the most important study topics.
- Estimate the overall document difficulty.
- Create a concise summary headline and short summary paragraph.
- Create 5 to 8 bullet points.
- Create 6 flashcards.
- Create 5 quiz questions with 4 options each.
- Every quiz question must include the exact correct answer, a short explanation, a topic label, and a suggestedSeconds value.
- Keep wording clean and student friendly.

Study content:
${text}`;
};

const normalizeExtractedText = (value: string) => value.replace(/\u0000/g, '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

const normalizeStudyPack = (value: any): StudyPack => ({
  keyTopics: Array.isArray(value?.keyTopics) ? value.keyTopics.filter((item: unknown) => typeof item === 'string').slice(0, 8) : [],
  difficulty: value?.difficulty === 'advanced' || value?.difficulty === 'intermediate' ? value.difficulty : 'beginner',
  summary: {
    headline: typeof value?.summary?.headline === 'string' ? value.summary.headline : 'Study pack ready',
    concise: typeof value?.summary?.concise === 'string' ? value.summary.concise : '',
    bullets: Array.isArray(value?.summary?.bullets) ? value.summary.bullets.filter((item: unknown) => typeof item === 'string').slice(0, 8) : [],
  },
  flashcards: Array.isArray(value?.flashcards) ? value.flashcards.map(normalizeFlashcard).slice(0, 8) : [],
  quiz: Array.isArray(value?.quiz) ? value.quiz.map(normalizeQuizQuestion).slice(0, 8) : [],
});

const normalizeFlashcard = (card: any): Flashcard => ({
  id: typeof card?.id === 'string' && card.id ? card.id : crypto.randomUUID(),
  question: typeof card?.question === 'string' ? card.question : 'Review question',
  answer: typeof card?.answer === 'string' ? card.answer : '',
  topic: typeof card?.topic === 'string' ? card.topic : 'General',
});

const normalizeQuizQuestion = (question: any): QuizQuestion => ({
  id: typeof question?.id === 'string' && question.id ? question.id : crypto.randomUUID(),
  question: typeof question?.question === 'string' ? question.question : 'Practice question',
  options: Array.isArray(question?.options) ? question.options.filter((item: unknown) => typeof item === 'string').slice(0, 4) : [],
  correctAnswer: typeof question?.correctAnswer === 'string' ? question.correctAnswer : '',
  explanation: typeof question?.explanation === 'string' ? question.explanation : '',
  topic: typeof question?.topic === 'string' ? question.topic : 'General',
  difficulty: question?.difficulty === 'hard' || question?.difficulty === 'medium' ? question.difficulty : 'easy',
  suggestedSeconds: Number.isFinite(Number(question?.suggestedSeconds)) ? Number(question.suggestedSeconds) : 45,
});
