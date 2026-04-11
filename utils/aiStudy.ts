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
        memoryHooks: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        examSignals: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
      required: ['headline', 'concise', 'bullets', 'memoryHooks', 'examSignals'],
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
    studyPlan: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    conceptChecks: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ['keyTopics', 'difficulty', 'summary', 'flashcards', 'quiz', 'studyPlan', 'conceptChecks'],
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
      ? 'Quick Revision: create compressed revision material, practical recall prompts, compact summaries, and rapid-fire quiz checks.'
      : mode === 'exam-mode'
      ? 'Exam Mode: produce timer-ready MCQs, sharper distractors, likely trap areas, and pressure-tested revision prompts.'
      : 'Deep Learning: produce richer explanations, clearer conceptual links, and questions that test understanding over memorization.';

  return `You are building a premium study pack from "${fileName}".

${modeGuide}

Instructions:
- Identify the most important study topics.
- Estimate the overall document difficulty.
- Create a concise summary headline and short summary paragraph that captures the central idea, not just the opening lines.
- Create 5 to 8 bullet points focused only on what is genuinely worth remembering for revision.
- Create 3 memory hooks that help recall the material quickly. Use analogies, distinctions, or compact cues.
- Create 3 exam signals that tell the student what is likely to be tested, misunderstood, or confused.
- Create 6 flashcards with strong prompts. Questions should be specific enough that a student can truly self-test.
- Create 5 quiz questions with 4 plausible options each. Distractors should be believable, not obviously wrong.
- Every quiz question must include the exact correct answer, a short explanation, a topic label, a realistic difficulty, and a suggestedSeconds value.
- Create a short study plan with 4 actionable next steps ordered from foundation to reinforcement.
- Create 3 concept check prompts for self-testing that require explanation, comparison, or application.
- Keep wording precise, student friendly, and non-generic.
- Avoid filler. Avoid vague phrases like "important concept" or "understand this topic".
- If the source is fragmented, infer the most coherent revision structure possible from the material.

Study content:
${text}`;
};

const normalizeExtractedText = (value: string) => value.replace(/\u0000/g, '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

const normalizeStudyPack = (value: any): StudyPack => {
  const keyTopics = Array.isArray(value?.keyTopics) ? value.keyTopics.filter((item: unknown) => typeof item === 'string').slice(0, 8) : [];
  const concise = typeof value?.summary?.concise === 'string' ? value.summary.concise : '';
  const bullets = Array.isArray(value?.summary?.bullets) ? value.summary.bullets.filter((item: unknown) => typeof item === 'string').slice(0, 8) : [];
  const normalizedTopics = keyTopics.length ? keyTopics : extractCandidateTopics(concise, bullets);

  return {
    keyTopics: normalizedTopics,
    difficulty: value?.difficulty === 'advanced' || value?.difficulty === 'intermediate' ? value.difficulty : 'beginner',
    summary: {
      headline: typeof value?.summary?.headline === 'string' ? value.summary.headline : 'Study pack ready',
      concise,
      bullets: bullets.length ? bullets : buildFallbackBullets(concise, normalizedTopics),
      memoryHooks: Array.isArray(value?.summary?.memoryHooks) && value.summary.memoryHooks.length
        ? value.summary.memoryHooks.filter((item: unknown) => typeof item === 'string').slice(0, 4)
        : buildFallbackMemoryHooks(normalizedTopics),
      examSignals: Array.isArray(value?.summary?.examSignals) && value.summary.examSignals.length
        ? value.summary.examSignals.filter((item: unknown) => typeof item === 'string').slice(0, 4)
        : buildFallbackExamSignals(normalizedTopics),
    },
    flashcards: Array.isArray(value?.flashcards) ? value.flashcards.map(normalizeFlashcard).slice(0, 8) : [],
    quiz: Array.isArray(value?.quiz) ? value.quiz.map(normalizeQuizQuestion).slice(0, 8) : [],
    studyPlan: Array.isArray(value?.studyPlan) && value.studyPlan.length
      ? value.studyPlan.filter((item: unknown) => typeof item === 'string').slice(0, 5)
      : buildFallbackStudyPlan(normalizedTopics),
    conceptChecks: Array.isArray(value?.conceptChecks) && value.conceptChecks.length
      ? value.conceptChecks.filter((item: unknown) => typeof item === 'string').slice(0, 4)
      : buildFallbackConceptChecks(normalizedTopics),
  };
};

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

const extractCandidateTopics = (...chunks: Array<string | string[]>) => {
  const words = chunks
    .flatMap((chunk) => (Array.isArray(chunk) ? chunk : [chunk]))
    .join(' ')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 4);

  const seen = new Set<string>();
  const topics: string[] = [];

  for (let index = 0; index < words.length - 1; index += 1) {
    const first = words[index].toLowerCase();
    const second = words[index + 1].toLowerCase();
    if (COMMON_TOPIC_WORDS.has(first) || COMMON_TOPIC_WORDS.has(second)) continue;

    const phrase = `${capitalize(first)} ${second}`;
    if (!seen.has(phrase)) {
      seen.add(phrase);
      topics.push(phrase);
    }

    if (topics.length >= 5) break;
  }

  return topics.length ? topics : ['Core concepts', 'Definitions', 'Applications'];
};

const buildFallbackBullets = (concise: string, topics: string[]) => {
  const bullets = concise ? [concise] : [];
  return [...bullets, ...topics.slice(0, 4).map((topic) => `Focus on ${topic} and how it connects to the broader material.`)].slice(0, 5);
};

const buildFallbackMemoryHooks = (topics: string[]) =>
  topics.slice(0, 3).map((topic, index) => `Hook ${index + 1}: connect ${topic} to one real example and one contrast case.`);

const buildFallbackExamSignals = (topics: string[]) =>
  topics.slice(0, 3).map((topic) => `Expect definition, comparison, or application-based questions around ${topic}.`);

const buildFallbackStudyPlan = (topics: string[]) => [
  `Start with ${topics[0] || 'the main idea'} and define it in your own words.`,
  `Use active recall for ${topics[1] || 'key terms'} until answers come without prompting.`,
  `Practice one applied question on ${topics[2] || 'the central process'} without looking back at the notes.`,
  `Finish with a timed self-check and revisit the weakest explanations.`,
];

const buildFallbackConceptChecks = (topics: string[]) => [
  `Explain ${topics[0] || 'the main concept'} as if teaching a friend.`,
  `Compare ${topics[1] || 'two related ideas'} and identify the confusion point between them.`,
  `Apply ${topics[2] || 'the concept'} to a fresh example without copying the source wording.`,
];

const COMMON_TOPIC_WORDS = new Set(['these', 'those', 'their', 'there', 'which', 'about', 'other', 'study', 'topic', 'important', 'using', 'would', 'could']);

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
