import { GoogleGenerativeAI, SchemaType, GenerationConfig } from '@google/generative-ai';
import { Task, Priority } from '../types';

const MODEL_NAME = 'gemini-1.5-flash';

const QUICK_PLAN_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    tasks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          notes: { type: SchemaType.STRING },
          priority: { type: SchemaType.STRING, enum: ['low', 'medium', 'high'] },
          dueDate: { type: SchemaType.STRING }, // YYYY-MM-DD
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
  required: ['tasks']
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

export const callTaskAi = async (prompt: string, schema?: any): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Add VITE_GEMINI_API_KEY to enable Task AI features.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: schema ? {
      responseMimeType: 'application/json',
      responseSchema: schema,
    } as GenerationConfig : undefined,
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  return schema ? JSON.parse(text) : text;
};

/**
 * AI Quick Plan: Goal -> Full Plan
 */
export const generateAiQuickPlan = async (goal: string) => {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `You are a student productivity expert. Convert this goal into a realistic task plan for a student.
  Goal: "${goal}"
  Today's Date: ${today}
  
  Instructions:
  - Break it into 3-7 main tasks.
  - For complex tasks, suggest 3-5 subtasks.
  - Suggest realistic due dates based on today's date.
  - Assign priority (low, medium, high).
  - Estimate time in minutes.
  - Add concise notes for each task.
  - Avoid filler or generic tasks.`;

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
  - Return 4-6 specific subtasks.
  - Each subtask should be startable in under 30 minutes.
  - Be practical and avoid vague subtasks like "research more".`;

  return callTaskAi(prompt, SUBTASK_SCHEMA);
};

/**
 * Make Task Actionable
 */
export const makeTaskActionable = async (taskTitle: string) => {
  const prompt = `Rewrite this vague task title into a clear, specific, and executable action.
  Vague Task: "${taskTitle}"
  
  Instructions:
  - Output only the new title and a one-sentence "next step" tip.
  - Format as JSON with "title" and "nextStep".`;

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
 * Smart Priority and Risk Suggestions
 */
export const analyzeTaskBacklog = async (tasks: Task[]) => {
  const today = new Date().toISOString().split('T')[0];
  const taskSummary = tasks.map(t => ({
    id: t.id,
    title: t.title,
    dueDate: t.dueDate,
    completed: t.completed,
    priority: t.priority,
    subtasks: t.children.length
  }));

  const prompt = `Analyze this student's task backlog and suggest risks and priorities.
  Today's Date: ${today}
  Tasks: ${JSON.stringify(taskSummary)}
  
  Instructions:
  - Identify tasks that are at risk (near deadline, high priority, incomplete).
  - Suggest urgency badges (on-track, at-risk, urgent, can-defer).
  - Suggest next steps for the most critical tasks.
  - Provide a short summary of the overall status.`;

  return callTaskAi(prompt, ANALYSIS_SCHEMA);
};

/**
 * AI Today Plan
 */
export const generateTodayPlan = async (tasks: Task[]) => {
  const today = new Date().toISOString().split('T')[0];
  const backlog = tasks.filter(t => !t.completed).map(t => ({
    id: t.id,
    title: t.title,
    dueDate: t.dueDate,
    priority: t.priority,
    estimatedTime: t.estimatedTime
  }));

  const prompt = `Select the best tasks for a student to focus on today.
  Today's Date: ${today}
  Backlog: ${JSON.stringify(backlog)}
  
  Instructions:
  - Choose 3-5 tasks that are most important/urgent.
  - Ensure a realistic workload (max 4-6 hours total).
  - Balance across different subjects if possible.
  - Return only the task IDs in order of execution.`;

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
 * Task Coach / Unstuck Mode
 */
export const getUnstuckMode = async (taskTitle: string, taskNotes?: string) => {
  const prompt = `A student is stuck on this task. Provide a quick coaching intervention.
  Task: "${taskTitle}"
  Context: ${taskNotes || 'None'}
  
  Instructions:
  - Identify the likely blocker (procrastination, complexity, lack of resources, etc.).
  - Provide 3 tiny, 5-minute next actions to get moving.
  - Recommend the absolute easiest starting point.`;

  return callTaskAi(prompt, UNSTUCK_SCHEMA);
};

/**
 * Focus Session Suggestions
 */
export const suggestFocusStructure = async (taskTitle: string) => {
  const prompt = `Suggest a focus session structure for this task.
  Task: "${taskTitle}"
  
  Instructions:
  - Suggest a Pomodoro-style structure (e.g. 2 x 45 min deep work).
  - Include specific goals for each block.
  - Format as JSON with "structure" (string) and "blocks" (array of strings).`;

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
