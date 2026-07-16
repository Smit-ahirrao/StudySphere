import { GoogleGenerativeAI, SchemaType, GenerationConfig } from '@google/generative-ai';
import { ComparisonTable, DeepDiveExplanation, Flashcard, LearningMode, QuizQuestion, StudyPack } from '../types';

const MAX_SOURCE_LENGTH = 30000;

const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

const STUDY_PACK_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    heroImageKeyword: { type: SchemaType.STRING },
    keyTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    difficulty: { type: SchemaType.STRING, enum: ['beginner', 'intermediate', 'advanced'] },
    summary: {
      type: SchemaType.OBJECT,
      properties: {
        headline: { type: SchemaType.STRING },
        concise: { type: SchemaType.STRING },
        bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        memoryHooks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        examSignals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ['headline', 'concise', 'bullets', 'memoryHooks', 'examSignals'],
    },
    flashcards: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING }, question: { type: SchemaType.STRING },
          answer: { type: SchemaType.STRING }, topic: { type: SchemaType.STRING },
        },
        required: ['id', 'question', 'answer', 'topic'],
      },
    },
    quiz: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING }, question: { type: SchemaType.STRING },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctAnswer: { type: SchemaType.STRING }, explanation: { type: SchemaType.STRING },
          topic: { type: SchemaType.STRING },
          difficulty: { type: SchemaType.STRING, enum: ['easy', 'medium', 'hard'] },
          suggestedSeconds: { type: SchemaType.NUMBER },
        },
        required: ['id', 'question', 'options', 'correctAnswer', 'explanation', 'topic', 'difficulty', 'suggestedSeconds'],
      },
    },
    studyPlan: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    conceptChecks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    // Mode-specific fields
    quickTips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    mnemonics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    examTraps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    formulaSheet: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    deepDiveExplanations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          concept: { type: SchemaType.STRING }, explanation: { type: SchemaType.STRING },
          analogy: { type: SchemaType.STRING }, emoji: { type: SchemaType.STRING },
        },
        required: ['concept', 'explanation', 'analogy', 'emoji'],
      },
    },
    comparisonTable: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        headers: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        rows: { type: SchemaType.ARRAY, items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } } },
      },
      required: ['title', 'headers', 'rows'],
    },
    questionSolutions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING },
          answer: { type: SchemaType.STRING },
          marks: { type: SchemaType.NUMBER },
          explanation: { type: SchemaType.STRING },
        },
        required: ['question', 'answer'],
      },
    },
  },
  required: ['heroImageKeyword', 'keyTopics', 'difficulty', 'summary', 'flashcards', 'quiz', 'studyPlan', 'conceptChecks'],
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
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
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
  flashcardCount = 6,
  quizCount = 5,
  quizDifficulty = 'mixed',
  customInstruction = '',
}: {
  text: string;
  fileName: string;
  mode: LearningMode;
  flashcardCount?: number;
  quizCount?: number;
  quizDifficulty?: 'mixed' | 'easy' | 'medium' | 'hard';
  customInstruction?: string;
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
    flashcardCount,
    quizCount,
    quizDifficulty,
    customInstruction,
  });

  // Try each model candidate until one works
  let lastError: Error | null = null;
  
  for (const modelName of MODEL_CANDIDATES) {
    // Try v1beta FIRST (newer models like 2.5 are only available there), then v1
    for (const apiVer of ['v1beta', 'v1'] as const) {
      try {
        console.log(`Attempting generation with model: ${modelName} (${apiVer})`);
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: apiVer });

        try {
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' } as GenerationConfig,
          });
          const rawContent = result.response.text();
          if (rawContent) return normalizeStudyPack(JSON.parse(rawContent), mode);
        } catch (structuredError) {
          console.warn(`Structured generation failed for ${modelName} (${apiVer}), trying plain text...`);
          const result = await model.generateContent(prompt + '\n\nIMPORTANT: Return ONLY raw JSON. No markdown blocks.');
          const text = result.response.text();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          const cleanJson = jsonMatch ? jsonMatch[0] : text;
          if (cleanJson) return normalizeStudyPack(JSON.parse(cleanJson), mode);
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`${modelName} (${apiVer}) failed:`, error?.message);
        // Try the next version or model for any failure (404, 429, etc.)
        continue;
      }
    }
  }

  throw new Error(`AI generation failed. Last attempt (${MODEL_CANDIDATES[MODEL_CANDIDATES.length-1]}): ${lastError?.message || 'Check your API key.'}`);
};

/** Ask a question grounded in the uploaded document with a specific persona */
export const askDocumentQuestion = async (
  documentText: string,
  question: string,
  chatHistory: Array<{ role: 'user' | 'ai'; text: string }> = [],
  persona: string = 'socratic'
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY.');
  if (!documentText.trim()) throw new Error('No document text loaded.');

  const historyContext = chatHistory.slice(-6).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join('\n');

  let personaInstructions = '';
  if (persona === 'genz') {
    personaInstructions = `Your personality:
- You are a hyper-modern Gen Z tutor ("Gen Z Explainer").
- You use extremely heavy internet slang (e.g., "No cap", "fr fr", "W", "L", "vibe check", "slays").
- You explain complex academic concepts using pop-culture analogies (TikTok, video games, influencers).
- You use a LOT of emojis (💀😭🔥💅✨).
- You are energetic, chaotic but actually very educational.
- Format with short punchy lines and bullet points.`;
  } else if (persona === 'examiner') {
    personaInstructions = `Your personality:
- You are a Strict Examiner and Grader.
- You do not use emojis or friendly chatter.
- You format answers EXACTLY like a grading rubric or mark scheme.
- Example: "[1 mark] for stating X. [1 mark] for explaining Y."
- Be extremely concise, formal, and precise.
- Highlight key terminology in **bold** that students must use to get points.`;
  } else if (persona === 'flashcard') {
    personaInstructions = `Your personality:
- You are a Flashcard Maker.
- You do NOT answer the question normally.
- Instead, based on the student's question, you extract the core concepts from the document and generate exactly 3 high-yield Q&A flashcards.
- Format them beautifully:
  📇 **Card 1**
  **Q:** [Question]
  **A:** [Answer]
- Keep the answers short and focused on active recall.`;
  } else {
    // Socratic (Default)
    personaInstructions = `Your personality:
- You're like a smart best friend who explains things simply (Socratic Tutor).
- You ask guiding questions to lead the student to the answer instead of just giving it away immediately.
- You use emojis naturally (not excessively) to make responses engaging.
- You NEVER write long paragraphs — break everything into bite-sized pieces.
- You're encouraging and celebrate when students ask good questions.
- Format: Use bullet points (•), bold key terms, and end with a "💡 Quick tip:" or "🎯 Next question for you:".`;
  }

  const prompt = `You are a specialized AI study tutor.
  
${personaInstructions}

Formatting rules (STRICT):
- Total response: 100-200 words max, never more.
- Answer using ONLY the document content below. If the answer isn't in the document, say: "🤔 Hmm, I can't find that in your document! Try asking about [suggest a topic from the doc]."

Document content:
${documentText.slice(0, 20000)}

${historyContext ? `Previous conversation:\n${historyContext}\n` : ''}
Student's question: ${question}

Respond as the friendly tutor:`;

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: Error | null = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      console.log(`Attempting tutor response with model: ${modelName} (v1beta)`);
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (error) {
      console.warn(`Tutor failed for model ${modelName}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  throw new Error(`Tutor response failed. ${lastError?.message || 'Please try again.'}`);
};

/** Simplify a concept explanation to ELI5 level */
export const simplifyExplanation = async (text: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY.');

  const prompt = `You're a super friendly tutor explaining something to a beginner. Rewrite this so anyone could understand it.

Rules:
- Use a fun analogy (like comparing to pizza, video games, or everyday life) 🍕
- Use emojis naturally
- Use bullet points (•) for key ideas
- Max 80 words, keep it SHORT
- End with a "🎯 In one line:" summary
- NO jargon, NO complex words

Original explanation:
${text.slice(0, 3000)}

Super simple version:`;

  const genAI = new GoogleGenerativeAI(apiKey);
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
      const result = await model.generateContent(prompt);
      const simplified = result.response.text().trim();
      if (simplified) return simplified;
    } catch {
      continue;
    }
  }
  throw new Error('Simplification failed. Please try again.');
};

export const summarizeNoteContent = async (content: string, title?: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing AI configuration. Add VITE_GEMINI_API_KEY to enable note summarization.');
  }

  const cleanContent = content.trim();
  if (!cleanContent) {
    throw new Error('This note is empty. Add some content before using AI Summarize.');
  }

  const prompt = `You are helping a student revise quickly.

Title: ${title || 'Untitled note'}

Generate a concise revision summary in plain text:
- First line: one-sentence overview.
- Then exactly 4 bullet points, each starting with "- ".
- Keep total output under 120 words.
- Focus on exam-relevant understanding and memory cues.
- No markdown headings, no JSON, no code blocks.

Note content:
${cleanContent.slice(0, 12000)}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: Error | null = null;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      if (text) return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  throw new Error(`AI summary failed. ${lastError?.message || 'Please try again.'}`);
};

const buildPrompt = ({
  fileName, mode, text, flashcardCount, quizCount, quizDifficulty, customInstruction,
}: {
  fileName: string; mode: LearningMode; text: string;
  flashcardCount: number; quizCount: number;
  quizDifficulty: 'mixed' | 'easy' | 'medium' | 'hard';
  customInstruction?: string;
}) => {
  const base = `You are building a PREMIUM AI study pack from "${fileName}".
Use emojis liberally in ALL text content (📌🔑💡🎯⚡🧠📊✅❌🔥⭐📝🎓) to make it visually engaging.
Every bullet, tip, hook, and explanation MUST start with a relevant emoji.

Core instructions (apply to ALL modes):
- Identify 4-8 key study topics.
- Estimate difficulty (beginner/intermediate/advanced).
- Provide a "heroImageKeyword" which is a SINGLE strong noun representing the overall topic for an image search (e.g. "astronomy", "biology", "law", "business").
- Create a punchy summary headline (include an emoji).
- Create ${flashcardCount} flashcards and ${quizCount} quiz questions (4 options each, difficulty: ${quizDifficulty}).
- Every quiz question needs: correctAnswer, explanation, topic, difficulty, suggestedSeconds.
- Create 4 study plan steps and 3 concept checks.
- Be specific, no filler, no vague phrases.

${customInstruction ? `\nUSER SPECIFIC INSTRUCTION:\n⚠️ YOU MUST FOLLOW THIS RULE: ${customInstruction}\n` : ''}
`;

  const modeInstructions = mode === 'quick-revision'
    ? `MODE: ⚡ QUICK REVISION — Speed & Recall Focus
- Summary: MAX 3 short sentences. Ultra-compressed. Every word must earn its place.
- Bullets: Exactly 4 rapid-fire key points, each 1 line max, starting with emoji.
- Create 5 "quickTips" — one-liner speed tips with emoji (e.g. "⚡ Remember: DNA = Deoxyribonucleic Acid").
- Create 4 "mnemonics" — memorable acronyms, rhymes, or tricks (e.g. "🧠 ROY G BIV for rainbow colors").
- Memory hooks: 3 ultra-short recall cues, not paragraphs.
- Flashcards: Short, punchy Q&A for rapid-fire recall. One concept per card.
- Quiz: Quick-fire, 20-30 seconds each. Test recognition, not deep analysis.
- Do NOT generate examTraps, formulaSheet, deepDiveExplanations, or comparisonTable.`
    : mode === 'exam-mode'
    ? `MODE: 🎯 EXAM MODE — Test Readiness & Trap Awareness
- Summary: Exam-focused, highlight what WILL be tested. Medium length.
- Bullets: 5-6 exam-critical points. Mark frequently tested items with 🔥.
- Create 4 "examTraps" — common mistakes/traps students fall for (e.g. "⚠️ Students often confuse osmosis with diffusion because...").
- Create 4 "formulaSheet" entries — key definitions, formulas, or rules to memorize verbatim (e.g. "📋 F = ma (Force equals mass times acceleration)").
- Exam signals: 3 specific predictions about what examiners test.
- Flashcards: Exam-style, testing precision and edge cases.
- Quiz: Harder distractors, tricky options, 40-60 seconds each. Include trap-style questions.
- Do NOT generate quickTips, mnemonics, deepDiveExplanations, or comparisonTable.`
    : mode === 'deep-learning'
    ? `MODE: 🧠 DEEP LEARNING — Understanding & Connections
- Summary: Rich, detailed (5-8 sentences). Explain the "why" behind concepts.
- Bullets: 6-8 detailed points with explanations, not just facts.
- Create 3-4 "deepDiveExplanations" — each with: concept name, detailed explanation (3-4 sentences), a real-world analogy, and a single emoji that represents the concept.
- Create a "comparisonTable" with: title, headers (3-4 columns), and 3-5 rows comparing related concepts.
- Memory hooks: 3 hooks that explain WHY something works, not just what it is.
- Flashcards: "Why/How" questions that test understanding. Answers should be explanatory.
- Quiz: Application-based questions, 50-90 seconds each. Test reasoning, not memorization.
- Do NOT generate quickTips, mnemonics, examTraps, or formulaSheet.`
    : `MODE: 🧩 QUESTION SOLVER — SOLUTIONS ONLY
YOU ARE A PROFESSIONAL EXAM SOLVER. YOUR ONLY JOB IS TO SOLVE QUESTIONS.

CRITICAL RULES:
1. READ the uploaded document carefully and IDENTIFY every question, problem, or exercise.
2. For EACH question found, create an entry in the "questionSolutions" array with:
   - "question": The exact question text
   - "answer": A detailed, step-by-step professional solution using **bold**, bullet points, and numbered lists
   - "marks": Estimated marks (use 5 if unknown)
   - "explanation": A brief tutor-style note on how to approach this type of question
3. You MUST populate "questionSolutions" with AT LEAST 3 entries. If you find more questions, solve ALL of them.
4. If the document has NO explicit questions, CREATE 5 challenging exam-style questions from the content and solve them.
5. DO NOT waste effort on summary, flashcards, or quiz. Set summary.headline to "Question Solutions Ready", summary.concise to "Solutions generated from your document.", summary.bullets to ["See solutions below"]. Set flashcards and quiz to empty arrays [].
6. NEVER return an empty "questionSolutions" array. This is the #1 rule.

FORMAT each answer beautifully with Markdown:
- Use **bold** for key terms
- Use numbered lists for steps
- Use bullet points for explanations
- Keep answers thorough but well-structured`;

  return `${base}\n${modeInstructions}\n\nStudy content:\n${text}`;
};

const normalizeExtractedText = (value: string) => value.replace(/\u0000/g, '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

const normalizeStudyPack = (value: any, mode: LearningMode = 'quick-revision'): StudyPack => {
  const sa = (k: string) => Array.isArray(value?.[k]) ? value[k].filter((i: unknown) => typeof i === 'string') : [];
  const keyTopics = sa('keyTopics').slice(0, 8);
  const concise = typeof value?.summary?.concise === 'string' ? value.summary.concise : '';
  const bullets = Array.isArray(value?.summary?.bullets) ? value.summary.bullets.filter((i: unknown) => typeof i === 'string').slice(0, 8) : [];
  const normalizedTopics = keyTopics.length ? keyTopics : extractCandidateTopics(concise, bullets);

  // Normalize deepDiveExplanations
  const deepDives: DeepDiveExplanation[] = Array.isArray(value?.deepDiveExplanations)
    ? value.deepDiveExplanations.filter((d: any) => d?.concept && d?.explanation).map((d: any) => ({
        concept: String(d.concept), explanation: String(d.explanation),
        analogy: String(d.analogy || ''), emoji: String(d.emoji || '🧠'),
      })).slice(0, 5)
    : [];

  // Normalize comparisonTable
  const ct = value?.comparisonTable;
  const comparisonTable: ComparisonTable | undefined =
    ct?.headers?.length && ct?.rows?.length
      ? { title: String(ct.title || 'Comparison'), headers: ct.headers.map(String), rows: ct.rows.map((r: any) => (Array.isArray(r) ? r.map(String) : [])) }
      : undefined;
  // Normalize questionSolutions
  let questionSolutions = Array.isArray(value?.questionSolutions)
    ? value.questionSolutions.map((q: any) => ({
        question: String(q.question || ''),
        answer: String(q.answer || ''),
        marks: typeof q.marks === 'number' ? q.marks : undefined,
        explanation: q.explanation ? String(q.explanation) : undefined,
      })).filter((q: any) => q.question && q.answer)
    : [];

  // Fallback: If we are in question-solver mode but no solutions were generated, 
  // try to use the quiz questions as a basis for solutions.
  if (mode === 'question-solver' && questionSolutions.length === 0 && Array.isArray(value?.quiz)) {
    questionSolutions = value.quiz.map((q: any) => ({
      question: String(q.question || 'Concept Check'),
      answer: String(q.explanation || q.correctAnswer || 'Please review the study summary for the answer to this topic.'),
      marks: 5,
      explanation: 'Derived from generated practice quiz.',
    }));
  }

  return {
    keyTopics: normalizedTopics,
    difficulty: value?.difficulty === 'advanced' || value?.difficulty === 'intermediate' ? value.difficulty : 'beginner',
    modeUsed: mode,
    summary: {
      headline: typeof value?.summary?.headline === 'string' ? value.summary.headline : 'Study pack ready',
      concise,
      bullets: bullets.length ? bullets : buildFallbackBullets(concise, normalizedTopics),
      memoryHooks: Array.isArray(value?.summary?.memoryHooks) && value.summary.memoryHooks.length
        ? value.summary.memoryHooks.filter((i: unknown) => typeof i === 'string').slice(0, 4)
        : buildFallbackMemoryHooks(normalizedTopics),
      examSignals: Array.isArray(value?.summary?.examSignals) && value.summary.examSignals.length
        ? value.summary.examSignals.filter((i: unknown) => typeof i === 'string').slice(0, 4)
        : buildFallbackExamSignals(normalizedTopics),
    },
    flashcards: Array.isArray(value?.flashcards) ? value.flashcards.map(normalizeFlashcard).slice(0, 12) : [],
    quiz: Array.isArray(value?.quiz) ? value.quiz.map(normalizeQuizQuestion).slice(0, 10) : [],
    studyPlan: sa('studyPlan').length ? sa('studyPlan').slice(0, 5) : buildFallbackStudyPlan(normalizedTopics),
    conceptChecks: sa('conceptChecks').length ? sa('conceptChecks').slice(0, 4) : buildFallbackConceptChecks(normalizedTopics),
    quickTips: sa('quickTips').slice(0, 6),
    mnemonics: sa('mnemonics').slice(0, 5),
    examTraps: sa('examTraps').slice(0, 5),
    formulaSheet: sa('formulaSheet').slice(0, 6),
    deepDiveExplanations: deepDives.length ? deepDives : undefined,
    comparisonTable,
    questionSolutions,
    heroImageUrl: value?.heroImageKeyword
      ? `https://loremflickr.com/1200/800/${encodeURIComponent(value.heroImageKeyword).replace(/%20/g, ',')},study,academic/all`
      : 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop'
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
