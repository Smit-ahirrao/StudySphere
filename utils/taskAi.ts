import { GoogleGenerativeAI, SchemaType, GenerationConfig } from '@google/generative-ai';
import { Task, Priority } from '../types';

// AI VERSION: 2026-04-30-V3

const MODEL_CANDIDATES = [
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
];

const QUICK_PLAN_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    smartAnalysis: {
      type: SchemaType.OBJECT,
      properties: {
        specific: { type: SchemaType.BOOLEAN },
        measurable: { type: SchemaType.BOOLEAN },
        achievable: { type: SchemaType.BOOLEAN },
        relevant: { type: SchemaType.BOOLEAN },
        timeBound: { type: SchemaType.BOOLEAN },
      },
      required: ['specific', 'measurable', 'achievable', 'relevant', 'timeBound'],
    },
    tasks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          notes: { type: SchemaType.STRING },
          priority: { type: SchemaType.STRING, enum: ['low', 'medium', 'high'] },
          dueDate: { type: SchemaType.STRING },
          estimatedTime: { type: SchemaType.NUMBER },
          subtasks: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          }
        },
        required: ['title', 'priority']
      }
    }
  },
  required: ['tasks', 'smartAnalysis']
};

const SUBTASK_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    subtasks: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
  },
  required: ['subtasks']
};

const ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    analysis: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          taskId: { type: SchemaType.STRING },
          risk: { type: SchemaType.STRING, enum: ['on-track', 'at-risk', 'urgent', 'can-defer'] },
          reason: { type: SchemaType.STRING },
          suggestedPriority: { type: SchemaType.STRING, enum: ['low', 'medium', 'high'] },
          nextStep: { type: SchemaType.STRING }
        },
        required: ['taskId', 'risk', 'suggestedPriority', 'nextStep']
      }
    },
    summary: { type: SchemaType.STRING }
  },
  required: ['analysis', 'summary']
};

const UNSTUCK_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    blocker: { type: SchemaType.STRING },
    nextActions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    easyStart: { type: SchemaType.STRING }
  },
  required: ['blocker', 'nextActions', 'easyStart']
};

const WEEKLY_PLAN_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    days: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING },
          focusTopic: { type: SchemaType.STRING },
          taskIds: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          }
        },
        required: ['date', 'focusTopic', 'taskIds']
      }
    },
    recommendation: { type: SchemaType.STRING }
  },
  required: ['days', 'recommendation']
};

export const callTaskAi = async (prompt: string, schema?: any): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Add VITE_GEMINI_API_KEY to enable Task AI features.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: Error | null = null;

  for (const modelName of MODEL_CANDIDATES) {
    console.log(`[TaskAI-V3] Attempting with model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: schema ? {
          responseMimeType: 'application/json',
          responseSchema: schema,
        } as GenerationConfig : undefined,
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log(`[TaskAI-V3] Success with model: ${modelName}`);

      return schema ? JSON.parse(text) : text;
    } catch (error) {
      console.warn(`[TaskAI-V3] Failed with model ${modelName}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      const errorMsg = lastError.message.toLowerCase();
      if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('429') || errorMsg.includes('quota')) {
        continue;
      }
    }
  }

  throw new Error(`Task AI generation failed: ${lastError?.message || 'Unknown error'}`);
};

// Hierarchy-aware flatten: includes parent info and child progress
const flattenForAi = (tasks: Task[], parentId?: string, depth: number = 0): any[] => {
  return tasks.reduce((acc, t) => {
    const safeChildren = Array.isArray(t.children) ? t.children : [];
    const totalChildren = safeChildren.length;
    const completedChildren = safeChildren.filter(c => c.completed).length;

    return [
      ...acc,
      {
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        completed: t.completed,
        priority: t.priority,
        estimatedTime: t.estimatedTime,
        notes: t.notes ? t.notes.substring(0, 100) : undefined,
        parentId: parentId || null,
        depth,
        childProgress: totalChildren > 0 ? `${completedChildren}/${totalChildren} done` : null,
        hasChildren: totalChildren > 0
      },
      ...flattenForAi(safeChildren, t.id, depth + 1)
    ];
  }, [] as any[]);
};

/**
 * AI Quick Plan: Goal -> SMART-analyzed Full Plan
 */
export const generateAiQuickPlan = async (goal: string) => {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `You are a senior student productivity coach. Convert this goal into a realistic SMART task plan.

Goal: "${goal}"
Today's Date: ${today}

First, evaluate the goal against SMART criteria:
- Specific: Is the goal clear and well-defined?
- Measurable: Can progress be tracked with numbers or milestones?
- Achievable: Is it realistic for a student?
- Relevant: Is it academically/professionally meaningful?
- Time-bound: Does it have a deadline or timeframe?

Then create a task plan:
- Break into 3-7 main tasks with clear, actionable titles
- For complex tasks, add 3-5 specific subtasks
- Use realistic due dates starting from today
- Assign priority (low/medium/high) based on urgency and impact
- Estimate time in minutes for each task
- Add concise, helpful notes (not generic filler)
- Ensure tasks follow a logical progression (prerequisites first)`;

  return callTaskAi(prompt, QUICK_PLAN_SCHEMA);
};

/**
 * Break Into Subtasks
 */
export const breakTaskIntoSubtasks = async (taskTitle: string, taskNotes?: string) => {
  const prompt = `Break this task into smaller, actionable subtasks for a student.
Task: "${taskTitle}"
Context: ${taskNotes || 'None'}

Instructions:
- Return 4-6 specific, concrete subtasks
- Each subtask should be completable in under 30 minutes
- Order them logically (do prerequisites first)
- Be practical: avoid vague items like "research more" or "think about it"
- Each subtask title should start with an action verb`;

  return callTaskAi(prompt, SUBTASK_SCHEMA);
};

/**
 * Make Task Actionable
 */
export const makeTaskActionable = async (taskTitle: string) => {
  const prompt = `Rewrite this vague task title into a clear, specific, and executable action.
Vague Task: "${taskTitle}"

Instructions:
- Make the title specific (include what, where, how much)
- Provide a one-sentence "next step" — the very first thing to do
- Keep it concise and student-friendly`;

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      nextStep: { type: SchemaType.STRING }
    },
    required: ['title', 'nextStep']
  };

  return callTaskAi(prompt, schema);
};

/**
 * Smart Priority and Risk Suggestions — hierarchy-aware
 */
export const analyzeTaskBacklog = async (tasks: Task[]) => {
  const today = new Date().toISOString().split('T')[0];
  const flattened = flattenForAi(tasks);

  const prompt = `Analyze this student's task backlog and suggest risks and priorities.
Today's Date: ${today}
Tasks (with hierarchy): ${JSON.stringify(flattened)}

Instructions:
- Consider parent-child relationships: if a parent has 3/5 subtasks done, the parent is partially complete
- A task with children close to completion should be flagged as "almost done — push through"
- Identify tasks that are at risk (near deadline, high priority but incomplete)
- Consider estimated time vs. time remaining until deadline
- Suggest urgency badges: on-track, at-risk, urgent, can-defer
- For each flagged task, explain WHY it's at that risk level
- Provide a concise actionable next step for each
- Summarize overall workload health in 1-2 sentences
- Only analyze top-level tasks (depth=0), not subtasks`;

  return callTaskAi(prompt, ANALYSIS_SCHEMA);
};

/**
 * AI Today Plan
 */
export const generateTodayPlan = async (tasks: Task[]) => {
  const today = new Date().toISOString().split('T')[0];
  const flattened = flattenForAi(tasks).filter(t => !t.completed);

  const prompt = `Select the best tasks for a student to focus on today.
Today's Date: ${today}
Backlog: ${JSON.stringify(flattened)}

Instructions:
- Choose 3-5 tasks that are most important/urgent for today
- Prioritize: overdue > due today > due tomorrow > high priority
- Ensure realistic workload (max 4-6 hours total study time)
- Balance across different subjects if possible
- Return only TOP-LEVEL task IDs (not subtask IDs)
- Order them by recommended execution sequence
- Explain your reasoning in 2-3 sentences`;

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      taskIds: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      },
      reasoning: { type: SchemaType.STRING }
    },
    required: ['taskIds', 'reasoning']
  };

  return callTaskAi(prompt, schema);
};

/**
 * AI Weekly Plan — respects existing deadlines
 */
export const generateAiWeeklyPlan = async (tasks: Task[], goal?: string) => {
  const today = new Date().toISOString().split('T')[0];
  const flattened = flattenForAi(tasks).filter(t => !t.completed);

  const prompt = `Create a 7-day study schedule for a student based on their task backlog.
Today's Date: ${today}
${goal ? `Main Goal: "${goal}"` : ''}
Backlog: ${JSON.stringify(flattened)}

Instructions:
- Distribute tasks across the next 7 days (dates in YYYY-MM-DD format)
- RESPECT existing due dates: if a task is due on a specific day, schedule it on or before that day
- Suggest a central "Focus Topic" for each day (e.g., "Deep work on algorithms")
- Ensure no single day has more than 5-6 hours of estimated work
- Prioritize tasks with earlier deadlines or higher priority
- Only schedule TOP-LEVEL tasks (depth=0), not subtasks
- Give a 1-sentence recommendation for the week`;

  return callTaskAi(prompt, WEEKLY_PLAN_SCHEMA);
};

/**
 * Task Coach / Unstuck Mode
 */
export const getUnstuckMode = async (taskTitle: string, taskNotes?: string) => {
  const prompt = `A student is stuck on this task. Provide a quick coaching intervention.
Task: "${taskTitle}"
Context: ${taskNotes || 'None'}

Instructions:
- Identify the most likely blocker (procrastination, complexity, perfectionism, unclear requirements, lack of resources)
- Provide exactly 3 tiny, 5-minute actions to build momentum
- Each action should be so small it feels impossible to fail at
- Recommend the absolute easiest starting point (the "2-minute version")`;

  return callTaskAi(prompt, UNSTUCK_SCHEMA);
};

/**
 * Focus Session Suggestions
 */
export const suggestFocusStructure = async (taskTitle: string) => {
  const prompt = `Suggest a focus session structure for this task.
Task: "${taskTitle}"

Instructions:
- Design a Pomodoro-style structure (e.g., "2 × 45 min deep work + 15 min review")
- Include 3-5 specific goals for each time block
- Make goals concrete and measurable (e.g., "Solve problems 1-5" not "work on problems")
- Total session should be 1.5-3 hours`;

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      structure: { type: SchemaType.STRING },
      blocks: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      }
    },
    required: ['structure', 'blocks']
  };

  return callTaskAi(prompt, schema);
};
