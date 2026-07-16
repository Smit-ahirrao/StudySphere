import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No API key found');
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // There isn't a direct listModels in the SDK easily accessible this way without more setup usually,
    // but we can try to hit a known model and see if it works.
    console.log('Testing gemini-1.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('ping');
    console.log('Success with gemini-1.5-flash');
    console.log(result.response.text());
  } catch (e) {
    console.error('Error with gemini-1.5-flash:', e.message);
  }

  try {
    console.log('Testing gemini-1.5-flash-latest...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent('ping');
    console.log('Success with gemini-1.5-flash-latest');
  } catch (e) {
    console.error('Error with gemini-1.5-flash-latest:', e.message);
  }
}

listModels();
