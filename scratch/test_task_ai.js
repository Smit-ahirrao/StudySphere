import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
const MODEL_CANDIDATES = [
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
];

async function testTaskAi() {
  const apiKey = 'AIzaSyCM-DGCD9A34JVKNFXbnWT0ANsPqB7V4rE';
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const prompt = "Select 3 tasks for today from this list: Task 1, Task 2, Task 3. Return as JSON with taskIds array.";
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

  for (const modelName of MODEL_CANDIDATES) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const result = await model.generateContent(prompt);
      console.log(`SUCCESS with ${modelName}:`, result.response.text());
      return;
    } catch (e) {
      console.error(`FAILED with ${modelName}:`, e.message);
    }
  }
}

testTaskAi();
