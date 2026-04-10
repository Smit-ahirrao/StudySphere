import { GoogleGenerativeAI, SchemaType, GenerationConfig } from '@google/generative-ai';
import { Flashcard, LearningMode, QuizQuestion, StudyPack } from '../types';

const MAX_SOURCE_LENGTH = 30000;

// We use an array of potential model names to handle regional availability and retirements automatically
const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-flash-latest',
  'gemini-1.5-flash-8b',
];

const STUDY_PACK_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    keyTopics: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    difficulty: {
      type: SchemaType.STRING,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    summary: {
      type: SchemaType.OBJECT,
      properties: {
        headline: { type: SchemaType.STRING },
        concise: { type: SchemaType.STRING },
        bullets: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
      required: ['headline', 'concise', 'bullets'],
    },
    flashcards: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          question: { type: SchemaType.STRING },
          answer: { type: SchemaType.STRING },
          topic: { type: SchemaType.STRING },
        },
        required: ['id', 'question', 'answer', 'topic'],
      },
    },
    quiz: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          question: { type: SchemaType.STRING },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          correctAnswer: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
          topic: { type: SchemaType.STRING },
          difficulty: {
            type: SchemaType.STRING,
            enum: ['easy', 'medium', 'hard'],
          },
          suggestedSeconds: { type: SchemaType.NUMBER },
        },
        required: ['id', 'question', 'options', 'correctAnswer', 'explanation', 'topic', 'difficulty', 'suggestedSeconds'],
      },
    },
  },
  required: ['keyTopics', 'difficulty', 'summary', 'flashcards', 'quiz'],
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing AI configuration. Add VITE_GEMINI_API_KEY to use the Smart Study Pipeline (Free Tier available at Google AI Studio).');
  }

  if (!text.trim()) {
    throw new Error('No readable study text was found in this file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt({
    fileName,
    mode,
    text: text.slice(0, MAX_SOURCE_LENGTH),
  });

  // Try each model candidate until one works
  let lastError: Error | null = null;
  
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: STUDY_PACK_SCHEMA,
        } as GenerationConfig,
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawContent = response.text();
      
      if (!rawContent) continue;

      return normalizeStudyPack(JSON.parse(rawContent));
    } catch (error) {
      console.warn(`Generation failed with model ${modelName}, trying next...`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's a quota issue (429), or a 404, we continue to the next model
      const errorMsg = lastError.message.toLowerCase();
      if (errorMsg.includes('429') || errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('quota')) {
        continue;
      }
      
      // If it's a different kind of error (like safety block), we might want to stop, 
      // but for robustness in this study tool, we'll keep trying candidates.
    }
  }

  throw new Error(`AI generation failed. ${lastError?.message || 'Please check your API key and connection.'}`);
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
